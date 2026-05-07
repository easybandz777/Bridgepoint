import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { getPortalUserFromCookie, userHasProjectAccess, isLeadOrManager } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

interface ProjectRow {
    id: string;
    project_number: string;
    name: string;
    status: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    description: string;
    start_date: string | null;
    end_date: string | null;
    project_manager: string;
}

interface PhaseRow {
    id: string;
    name: string;
    status: string;
    phase_order: number | string;
    completion_pct: number | string;
    start_date: string | null;
    end_date: string | null;
    actual_start_date: string | null;
    actual_end_date: string | null;
    notes: string;
    assigned_sub_ids: string[] | string | null;
}

interface AssignmentRow {
    id: string;
    scope_of_work: string;
    assignment_status: string;
    agreed_amount: number | string;
    billed_amount: number | string;
    approved_amount: number | string;
    paid_amount: number | string;
    start_date: string | null;
    end_date: string | null;
    completion_pct: number | string;
    notes: string;
}

interface ActivityRow {
    id: string;
    action: string;
    description: string;
    created_at: string;
    actor: string | null;
}

interface TimeEntryPhaseRow {
    phase_id: string | null;
}

function num(v: number | string | null | undefined): number {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
}

function parseStringArray(v: unknown): string[] {
    if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
    if (typeof v === 'string') {
        try {
            const parsed = JSON.parse(v);
            return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
        } catch {
            return [];
        }
    }
    return [];
}

export async function GET(_req: Request, ctx: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await ctx.params;
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!(await userHasProjectAccess(user, projectId))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        await initDB();

        const projectRows = (await sql`
            SELECT
                id, project_number, name, status,
                client_name, client_email, client_phone,
                address, city, state, zip, description,
                start_date, end_date, project_manager
            FROM projects WHERE id = ${projectId}
            LIMIT 1
        `) as unknown as ProjectRow[];

        if (projectRows.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        const p = projectRows[0];

        const lead = await isLeadOrManager(user);

        const phaseRows = (await sql`
            SELECT
                id, name, status, phase_order, completion_pct,
                start_date, end_date, actual_start_date, actual_end_date,
                notes, assigned_sub_ids
            FROM project_phases
            WHERE project_id = ${projectId}
            ORDER BY phase_order ASC
        `) as unknown as PhaseRow[];

        // For employees who aren't leads, figure out which phases they have time entries on.
        const employeePhaseIds = new Set<string>();
        if (user.userType === 'employee' && !lead) {
            const r = (await sql`
                SELECT DISTINCT phase_id
                FROM employee_time_entries
                WHERE employee_id = ${user.userId} AND project_id = ${projectId}
                  AND phase_id IS NOT NULL
            `) as unknown as TimeEntryPhaseRow[];
            for (const row of r) {
                if (row.phase_id) employeePhaseIds.add(row.phase_id);
            }
        }

        const phases = phaseRows.map((row) => {
            const assignedSubIds = parseStringArray(row.assigned_sub_ids);
            const assignedToMe = assignedSubIds.includes(user.userId);
            const hasTime = employeePhaseIds.has(row.id);
            const canEdit = lead || assignedToMe || hasTime;
            return {
                id: row.id,
                name: row.name,
                status: row.status,
                phaseOrder: typeof row.phase_order === 'number' ? row.phase_order : parseInt(String(row.phase_order), 10) || 0,
                completionPct: Math.round(num(row.completion_pct)),
                startDate: row.start_date,
                endDate: row.end_date,
                actualStartDate: row.actual_start_date,
                actualEndDate: row.actual_end_date,
                notes: row.notes ?? '',
                assignedSubIds,
                canEdit,
            };
        });

        // ─── Sub assignment (for subcontractors) ───────────────────────────────
        let mySubAssignment: {
            id: string;
            scopeOfWork: string;
            assignmentStatus: string;
            agreedAmount: number;
            billedAmount: number;
            approvedAmount: number;
            paidAmount: number;
            startDate: string | null;
            endDate: string | null;
            completionPct: number;
            notes: string;
        } | null = null;

        if (user.userType === 'subcontractor') {
            const aRows = (await sql`
                SELECT id, scope_of_work, assignment_status,
                       agreed_amount, billed_amount, approved_amount, paid_amount,
                       start_date, end_date, completion_pct, notes
                FROM subcontractor_assignments
                WHERE subcontractor_id = ${user.userId} AND project_id = ${projectId}
                ORDER BY created_at DESC
                LIMIT 1
            `) as unknown as AssignmentRow[];
            if (aRows.length > 0) {
                const a = aRows[0];
                mySubAssignment = {
                    id: a.id,
                    scopeOfWork: a.scope_of_work ?? '',
                    assignmentStatus: a.assignment_status ?? 'Assigned',
                    agreedAmount: num(a.agreed_amount),
                    billedAmount: num(a.billed_amount),
                    approvedAmount: num(a.approved_amount),
                    paidAmount: num(a.paid_amount),
                    startDate: a.start_date,
                    endDate: a.end_date,
                    completionPct: Math.round(num(a.completion_pct)),
                    notes: a.notes ?? '',
                };
            }
        }

        const activityRows = (await sql`
            SELECT id, action, description, created_at, actor
            FROM activity_log
            WHERE entity_type = 'project' AND entity_id = ${projectId}
            ORDER BY created_at DESC
            LIMIT 25
        `) as unknown as ActivityRow[];

        const recentActivity = activityRows.map((a) => ({
            id: a.id,
            action: a.action,
            description: a.description ?? '',
            created_at: a.created_at,
            actor: a.actor ?? '',
        }));

        // Suppress client phone/email for non-lead employees and subs.
        const clientPhone = lead ? (p.client_phone ?? '') : '';
        const clientEmailVisible = lead;

        const out = {
            project: {
                id: p.id,
                projectNumber: p.project_number,
                name: p.name,
                status: p.status,
                clientName: p.client_name ?? '',
                clientPhone,
                clientEmail: clientEmailVisible ? (p.client_email ?? '') : '',
                address: p.address ?? '',
                city: p.city ?? '',
                state: p.state ?? '',
                zip: p.zip ?? '',
                description: p.description ?? '',
                startDate: p.start_date,
                endDate: p.end_date,
                projectManager: p.project_manager ?? '',
            },
            phases,
            mySubAssignment,
            recentActivity,
            isLead: lead,
        };

        return NextResponse.json(out);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
