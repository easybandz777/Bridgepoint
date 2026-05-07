import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { getPortalUserFromCookie, isLeadOrManager } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

interface ProjectRow {
    id: string;
    project_number: string;
    name: string;
    status: string;
    address: string;
    city: string;
    state: string;
    client_name: string;
    description: string;
    start_date: string | null;
    end_date: string | null;
    phase_count: string | number;
    avg_completion: string | number;
}

interface PhaseRow {
    id: string;
    project_id: string;
    name: string;
    status: string;
    completion_pct: string | number;
}

interface AssignmentRow {
    project_id: string;
    scope_of_work: string;
    agreed_amount: string | number;
    billed_amount: string | number;
    paid_amount: string | number;
    start_date: string | null;
    end_date: string | null;
    completion_pct: string | number;
    assignment_status: string;
}

interface ActivityRow {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    description: string;
    created_at: string;
}

interface OnShiftRow {
    id: string;
    clock_in: string | null;
    project_id: string | null;
    project_name: string | null;
}

function num(v: string | number | null | undefined): number {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function mondayISO(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
}

interface PortalJob {
    id: string;
    projectNumber: string;
    name: string;
    status: string;
    address: string;
    city: string;
    state: string;
    clientName: string;
    startDate: string | null;
    endDate: string | null;
    description: string;
    avgCompletion: number;
    phaseCount: number;
    myPhases: { id: string; name: string; status: string; completionPct: number }[];
    myAssignment: {
        scopeOfWork: string;
        agreedAmount: number;
        billedAmount: number;
        paidAmount: number;
        startDate: string | null;
        endDate: string | null;
        completionPct: number;
        status: string;
    } | null;
}

export async function GET() {
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await initDB();
        const userId = user.userId;
        const userType = user.userType;
        const lead = await isLeadOrManager(user);

        // ─── Resolve project IDs ────────────────────────────────────────────
        let projectIds: string[] = [];
        if (lead) {
            const r = (await sql`SELECT id FROM projects ORDER BY created_at DESC`) as unknown as { id: string }[];
            projectIds = r.map(x => x.id);
        } else if (userType === 'subcontractor') {
            const fromAssigns = (await sql`
                SELECT DISTINCT project_id AS id
                FROM subcontractor_assignments
                WHERE subcontractor_id = ${userId} AND project_id IS NOT NULL
            `) as unknown as { id: string }[];
            const fromPhases = (await sql`
                SELECT DISTINCT project_id AS id
                FROM project_phases
                WHERE assigned_sub_ids @> ${JSON.stringify([userId])}::jsonb
            `) as unknown as { id: string }[];
            const set = new Set<string>();
            for (const r of fromAssigns) if (r.id) set.add(r.id);
            for (const r of fromPhases) if (r.id) set.add(r.id);
            projectIds = Array.from(set);
        } else {
            const fromTime = (await sql`
                SELECT DISTINCT project_id AS id
                FROM employee_time_entries
                WHERE employee_id = ${userId} AND project_id IS NOT NULL
            `) as unknown as { id: string }[];
            const fromPhases = (await sql`
                SELECT DISTINCT project_id AS id
                FROM project_phases
                WHERE assigned_sub_ids @> ${JSON.stringify([userId])}::jsonb
            `) as unknown as { id: string }[];
            const set = new Set<string>();
            for (const r of fromTime) if (r.id) set.add(r.id);
            for (const r of fromPhases) if (r.id) set.add(r.id);
            projectIds = Array.from(set);
        }

        // ─── Pull project rows + phase agg ──────────────────────────────────
        let projects: ProjectRow[] = [];
        if (projectIds.length > 0) {
            projects = (await sql`
                SELECT
                    p.id, p.project_number, p.name, p.status,
                    p.address, p.city, p.state, p.client_name,
                    p.description, p.start_date, p.end_date,
                    COALESCE(phase_agg.phase_count, 0)::int        AS phase_count,
                    COALESCE(phase_agg.avg_completion, 0)::numeric AS avg_completion
                FROM projects p
                LEFT JOIN (
                    SELECT project_id, COUNT(*) AS phase_count, AVG(completion_pct) AS avg_completion
                    FROM project_phases GROUP BY project_id
                ) phase_agg ON phase_agg.project_id = p.id
                WHERE p.id = ANY(${projectIds}::text[])
                ORDER BY
                    CASE p.status WHEN 'Active' THEN 0 WHEN 'Planning' THEN 1 WHEN 'On Hold' THEN 2 ELSE 3 END,
                    p.created_at DESC
            `) as unknown as ProjectRow[];
        }

        // ─── Pull my phases ─────────────────────────────────────────────────
        const myPhases: PhaseRow[] = projectIds.length === 0 ? [] : (await sql`
            SELECT id, project_id, name, status, completion_pct
            FROM project_phases
            WHERE project_id = ANY(${projectIds}::text[])
              AND assigned_sub_ids @> ${JSON.stringify([userId])}::jsonb
            ORDER BY phase_order
        `) as unknown as PhaseRow[];

        const phasesByProject = new Map<string, PhaseRow[]>();
        for (const ph of myPhases) {
            const arr = phasesByProject.get(ph.project_id) ?? [];
            arr.push(ph);
            phasesByProject.set(ph.project_id, arr);
        }

        // ─── Sub assignments per project ────────────────────────────────────
        const assignmentsByProject = new Map<string, AssignmentRow>();
        if (userType === 'subcontractor' && projectIds.length > 0) {
            const rows = (await sql`
                SELECT project_id, scope_of_work, agreed_amount, billed_amount,
                       paid_amount, start_date, end_date, completion_pct, assignment_status
                FROM subcontractor_assignments
                WHERE subcontractor_id = ${userId}
                  AND project_id = ANY(${projectIds}::text[])
                ORDER BY created_at DESC
            `) as unknown as AssignmentRow[];
            for (const a of rows) {
                if (a.project_id && !assignmentsByProject.has(a.project_id)) {
                    assignmentsByProject.set(a.project_id, a);
                }
            }
        }

        const allJobs: PortalJob[] = projects.map(p => ({
            id: p.id,
            projectNumber: p.project_number,
            name: p.name,
            status: p.status,
            address: p.address ?? '',
            city: p.city ?? '',
            state: p.state ?? '',
            clientName: p.client_name ?? '',
            startDate: p.start_date,
            endDate: p.end_date,
            description: p.description ?? '',
            avgCompletion: Math.round(num(p.avg_completion)),
            phaseCount: typeof p.phase_count === 'number' ? p.phase_count : parseInt(String(p.phase_count), 10) || 0,
            myPhases: (phasesByProject.get(p.id) ?? []).map(ph => ({
                id: ph.id,
                name: ph.name,
                status: ph.status,
                completionPct: Math.round(num(ph.completion_pct)),
            })),
            myAssignment: assignmentsByProject.get(p.id) ? (() => {
                const a = assignmentsByProject.get(p.id)!;
                return {
                    scopeOfWork: a.scope_of_work ?? '',
                    agreedAmount: num(a.agreed_amount),
                    billedAmount: num(a.billed_amount),
                    paidAmount: num(a.paid_amount),
                    startDate: a.start_date,
                    endDate: a.end_date,
                    completionPct: Math.round(num(a.completion_pct)),
                    status: a.assignment_status ?? 'Assigned',
                };
            })() : null,
        }));

        // ─── Active jobs / today's jobs ─────────────────────────────────────
        const today = todayISO();
        const activeJobs = allJobs.filter(j => j.status === 'Active' || j.status === 'Planning');
        const todayJobs = allJobs.filter(j => {
            if (!j.startDate || !j.endDate) return false;
            return j.startDate <= today && j.endDate >= today;
        });

        // ─── Open tasks (phases assigned to me not done) ────────────────────
        const openTasks = myPhases.filter(p => p.status !== 'Completed' && p.status !== 'Skipped').length;

        // ─── Unread messages ────────────────────────────────────────────────
        const audienceMatch = userType === 'employee' ? 'employees' : 'subcontractors';
        const unreadRows = (await sql`
            SELECT COUNT(*)::int AS n FROM crew_messages cm
            WHERE (
                cm.audience = 'all'
                OR cm.audience = ${audienceMatch}
                OR (cm.audience = 'individual' AND cm.recipient_type = ${userType} AND cm.recipient_id = ${userId})
            )
            AND NOT EXISTS (
                SELECT 1 FROM crew_message_reads cmr
                WHERE cmr.message_id = cm.id
                  AND cmr.user_type = ${userType}
                  AND cmr.user_id = ${userId}
            )
        `) as unknown as { n: number }[];
        const unreadMessages = unreadRows[0]?.n ?? 0;

        // ─── Stats payload ──────────────────────────────────────────────────
        const stats: {
            activeJobs: number;
            hoursThisWeek?: number;
            hoursToday?: number;
            unreadMessages: number;
            openTasks: number;
        } = {
            activeJobs: activeJobs.length,
            unreadMessages,
            openTasks,
        };

        let onShift: {
            entryId: string;
            clockIn: string;
            projectId: string | null;
            projectName: string | null;
        } | null = null;

        if (userType === 'employee') {
            const monday = mondayISO();
            const hrs = (await sql`
                SELECT
                    COALESCE(SUM(hours_regular), 0)::numeric  AS regular,
                    COALESCE(SUM(hours_overtime), 0)::numeric AS overtime
                FROM employee_time_entries
                WHERE employee_id = ${userId}
                  AND date >= ${monday}
                  AND date <= ${today}
            `) as unknown as { regular: string | number; overtime: string | number }[];
            stats.hoursThisWeek = num(hrs[0]?.regular) + num(hrs[0]?.overtime);

            const hrsToday = (await sql`
                SELECT
                    COALESCE(SUM(hours_regular), 0)::numeric  AS regular,
                    COALESCE(SUM(hours_overtime), 0)::numeric AS overtime
                FROM employee_time_entries
                WHERE employee_id = ${userId} AND date = ${today}
            `) as unknown as { regular: string | number; overtime: string | number }[];
            stats.hoursToday = num(hrsToday[0]?.regular) + num(hrsToday[0]?.overtime);

            const shiftRows = (await sql`
                SELECT t.id, t.clock_in, t.project_id, p.name AS project_name
                FROM employee_time_entries t
                LEFT JOIN projects p ON p.id = t.project_id
                WHERE t.employee_id = ${userId} AND t.clock_out IS NULL
                ORDER BY t.created_at DESC
                LIMIT 1
            `) as unknown as OnShiftRow[];
            if (shiftRows[0]) {
                onShift = {
                    entryId: shiftRows[0].id,
                    clockIn: shiftRows[0].clock_in ?? '',
                    projectId: shiftRows[0].project_id,
                    projectName: shiftRows[0].project_name,
                };
            }
        }

        // ─── Recent activity ────────────────────────────────────────────────
        const relevantTypes = ['project', 'time_entry', 'photo', 'update', 'crew_message'];
        let activity: ActivityRow[] = [];
        if (lead) {
            activity = (await sql`
                SELECT id, entity_type, entity_id, action, description, created_at
                FROM activity_log
                WHERE entity_type = ANY(${relevantTypes}::text[])
                ORDER BY created_at DESC
                LIMIT 10
            `) as unknown as ActivityRow[];
        } else {
            const myProjectIds = projectIds;
            if (myProjectIds.length > 0) {
                activity = (await sql`
                    SELECT id, entity_type, entity_id, action, description, created_at
                    FROM activity_log
                    WHERE entity_type = ANY(${relevantTypes}::text[])
                      AND (
                        (entity_type = 'project' AND entity_id = ANY(${myProjectIds}::text[]))
                        OR (entity_type = 'time_entry' AND entity_id IN (
                            SELECT id FROM employee_time_entries WHERE employee_id = ${userId}
                        ))
                        OR (entity_type IN ('photo','update') AND entity_id IN (
                            SELECT id FROM project_photos WHERE project_id = ANY(${myProjectIds}::text[])
                            UNION ALL
                            SELECT id FROM project_updates WHERE project_id = ANY(${myProjectIds}::text[])
                        ))
                        OR (entity_type = 'crew_message')
                      )
                    ORDER BY created_at DESC
                    LIMIT 10
                `) as unknown as ActivityRow[];
            } else {
                activity = (await sql`
                    SELECT id, entity_type, entity_id, action, description, created_at
                    FROM activity_log
                    WHERE entity_type = 'crew_message'
                    ORDER BY created_at DESC
                    LIMIT 10
                `) as unknown as ActivityRow[];
            }
        }

        return NextResponse.json({
            user: {
                displayName: user.displayName,
                role: user.role,
                userType: user.userType,
            },
            stats,
            onShift,
            todayJobs,
            activeJobs: activeJobs.slice(0, 6),
            recentActivity: activity.map(a => ({
                id: a.id,
                entity_type: a.entity_type,
                action: a.action,
                description: a.description,
                created_at: a.created_at,
            })),
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
