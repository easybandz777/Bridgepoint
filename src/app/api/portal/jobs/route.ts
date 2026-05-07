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

function num(v: string | number | null | undefined): number {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
}

export async function GET() {
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await initDB();
        const userId = user.userId;
        const userType = user.userType;
        const lead = await isLeadOrManager(user);

        // ─── Resolve which project IDs the user can see ─────────────────────
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

        if (projectIds.length === 0) {
            return NextResponse.json([]);
        }

        // ─── Pull project rows w/ phase aggregates ──────────────────────────
        const projects = (await sql`
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

        // ─── Pull phases the user is assigned to ────────────────────────────
        const myPhases = (await sql`
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

        // ─── For subs: pull primary assignment per project ─────────────────
        const assignmentsByProject = new Map<string, AssignmentRow>();
        if (userType === 'subcontractor') {
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

        const out = projects.map(p => {
            const myProjPhases = phasesByProject.get(p.id) ?? [];
            const assignment = assignmentsByProject.get(p.id);
            return {
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
                myPhases: myProjPhases.map(ph => ({
                    id: ph.id,
                    name: ph.name,
                    status: ph.status,
                    completionPct: Math.round(num(ph.completion_pct)),
                })),
                myAssignment: assignment ? {
                    scopeOfWork: assignment.scope_of_work ?? '',
                    agreedAmount: num(assignment.agreed_amount),
                    billedAmount: num(assignment.billed_amount),
                    paidAmount: num(assignment.paid_amount),
                    startDate: assignment.start_date,
                    endDate: assignment.end_date,
                    completionPct: Math.round(num(assignment.completion_pct)),
                    status: assignment.assignment_status ?? 'Assigned',
                } : null,
            };
        });

        return NextResponse.json(out);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
