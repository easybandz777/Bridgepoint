import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';
import { getPortalUserFromCookie } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

interface OpenShiftRow {
    id: string;
    employee_id: string;
    project_id: string | null;
    phase_id: string | null;
    date: string;
    clock_in: string | null;
    clock_out: string | null;
    notes: string;
    status: string;
    project_name: string | null;
    phase_name: string | null;
}

export async function POST(req: Request) {
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.userType !== 'employee') {
        return NextResponse.json({ error: 'Employees only' }, { status: 403 });
    }

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* empty body ok */ }

    const projectId = (body.projectId as string) || null;
    const phaseId = (body.phaseId as string) || null;
    const notes = (body.notes as string) || '';

    try {
        await initDB();

        const existing = (await sql`
            SELECT
                t.id, t.employee_id, t.project_id, t.phase_id, t.date,
                t.clock_in, t.clock_out, t.notes, t.status,
                p.name AS project_name,
                ph.name AS phase_name
            FROM employee_time_entries t
            LEFT JOIN projects p ON p.id = t.project_id
            LEFT JOIN project_phases ph ON ph.id = t.phase_id
            WHERE t.employee_id = ${user.userId}
              AND t.clock_out IS NULL
            ORDER BY t.created_at DESC
            LIMIT 1
        `) as unknown as OpenShiftRow[];

        if (existing.length > 0) {
            const r = existing[0];
            return NextResponse.json({
                ok: true,
                already: true,
                entry: {
                    id: r.id,
                    employeeId: r.employee_id,
                    projectId: r.project_id,
                    phaseId: r.phase_id,
                    date: r.date,
                    clockIn: r.clock_in,
                    clockOut: r.clock_out,
                    notes: r.notes ?? '',
                    status: r.status,
                    projectName: r.project_name,
                    phaseName: r.phase_name,
                },
            });
        }

        const id = genId('te');
        const now = new Date();
        const iso = now.toISOString();
        const date = iso.slice(0, 10);

        await sql`
            INSERT INTO employee_time_entries (
                id, employee_id, project_id, phase_id, date,
                clock_in, clock_out, hours_regular, hours_overtime,
                cost_amount, status, notes
            ) VALUES (
                ${id},
                ${user.userId},
                ${projectId},
                ${phaseId},
                ${date},
                ${iso},
                ${null},
                0,
                0,
                0,
                'Pending',
                ${notes}
            )
        `;

        await logActivity(
            'time_entry',
            id,
            'clock_in',
            `${user.displayName} clocked in`,
            `employee:${user.userId}`,
            { projectId, phaseId },
        );

        const created = (await sql`
            SELECT
                t.id, t.employee_id, t.project_id, t.phase_id, t.date,
                t.clock_in, t.clock_out, t.notes, t.status,
                p.name AS project_name,
                ph.name AS phase_name
            FROM employee_time_entries t
            LEFT JOIN projects p ON p.id = t.project_id
            LEFT JOIN project_phases ph ON ph.id = t.phase_id
            WHERE t.id = ${id}
            LIMIT 1
        `) as unknown as OpenShiftRow[];

        const r = created[0];
        return NextResponse.json({
            ok: true,
            already: false,
            entry: {
                id: r.id,
                employeeId: r.employee_id,
                projectId: r.project_id,
                phaseId: r.phase_id,
                date: r.date,
                clockIn: r.clock_in,
                clockOut: r.clock_out,
                notes: r.notes ?? '',
                status: r.status,
                projectName: r.project_name,
                phaseName: r.phase_name,
            },
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
