import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import { getPortalUserFromCookie } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

interface EntryRow {
    id: string;
    employee_id: string;
    project_id: string | null;
    phase_id: string | null;
    date: string;
    clock_in: string | null;
    clock_out: string | null;
    hours_regular: string | number;
    hours_overtime: string | number;
    cost_amount: string | number;
    status: string;
    notes: string;
    approved_by: string | null;
    approved_at: string | null;
    created_at: string;
    project_name: string | null;
    phase_name: string | null;
}

interface RateRow {
    hourly_rate: string | number | null;
    overtime_rate: string | number | null;
}

function num(v: string | number | null | undefined): number {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

function shape(r: EntryRow) {
    return {
        id: r.id,
        employeeId: r.employee_id,
        projectId: r.project_id,
        phaseId: r.phase_id,
        date: r.date,
        clockIn: r.clock_in,
        clockOut: r.clock_out,
        hoursRegular: num(r.hours_regular),
        hoursOvertime: num(r.hours_overtime),
        costAmount: num(r.cost_amount),
        status: r.status,
        notes: r.notes ?? '',
        approvedBy: r.approved_by,
        approvedAt: r.approved_at,
        createdAt: r.created_at,
        projectName: r.project_name,
        phaseName: r.phase_name,
    };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ entryId: string }> }) {
    const { entryId } = await ctx.params;
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.userType !== 'employee') {
        return NextResponse.json({ error: 'Employees only' }, { status: 403 });
    }

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* empty body ok */ }

    try {
        await initDB();
        const rows = (await sql`
            SELECT * FROM employee_time_entries WHERE id = ${entryId} LIMIT 1
        `) as unknown as EntryRow[];
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        const existing = rows[0];
        if (existing.employee_id !== user.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (existing.status !== 'Pending') {
            return NextResponse.json({ error: 'Only pending entries can be edited' }, { status: 400 });
        }

        const date = body.date != null ? String(body.date) : existing.date;
        const projectId = body.projectId !== undefined
            ? ((body.projectId as string) || null)
            : existing.project_id;
        const phaseId = body.phaseId !== undefined
            ? ((body.phaseId as string) || null)
            : existing.phase_id;
        const notes = body.notes != null ? String(body.notes) : existing.notes ?? '';
        const hoursRegular = body.hoursRegular != null
            ? round2(Number(body.hoursRegular))
            : num(existing.hours_regular);
        const hoursOvertime = body.hoursOvertime != null
            ? round2(Number(body.hoursOvertime))
            : num(existing.hours_overtime);

        if (hoursRegular < 0 || hoursOvertime < 0) {
            return NextResponse.json({ error: 'Hours must be non-negative' }, { status: 400 });
        }

        const empRows = (await sql`
            SELECT hourly_rate, overtime_rate FROM employees WHERE id = ${user.userId}
        `) as unknown as RateRow[];
        const hourly = Number(empRows[0]?.hourly_rate ?? 0);
        const otRate = empRows[0]?.overtime_rate != null ? Number(empRows[0].overtime_rate) : hourly * 1.5;
        const cost = round2(hoursRegular * hourly + hoursOvertime * otRate);

        await sql`
            UPDATE employee_time_entries SET
                date           = ${date},
                project_id     = ${projectId},
                phase_id       = ${phaseId},
                hours_regular  = ${hoursRegular},
                hours_overtime = ${hoursOvertime},
                cost_amount    = ${cost},
                notes          = ${notes}
            WHERE id = ${entryId}
        `;

        await logActivity(
            'time_entry',
            entryId,
            'updated',
            `${user.displayName} updated time entry`,
            `employee:${user.userId}`,
            { hoursRegular, hoursOvertime },
        );

        const updated = (await sql`
            SELECT
                t.id, t.employee_id, t.project_id, t.phase_id, t.date,
                t.clock_in, t.clock_out, t.hours_regular, t.hours_overtime,
                t.cost_amount, t.status, t.notes, t.approved_by, t.approved_at,
                t.created_at,
                p.name AS project_name,
                ph.name AS phase_name
            FROM employee_time_entries t
            LEFT JOIN projects p ON p.id = t.project_id
            LEFT JOIN project_phases ph ON ph.id = t.phase_id
            WHERE t.id = ${entryId}
            LIMIT 1
        `) as unknown as EntryRow[];

        return NextResponse.json({ ok: true, entry: shape(updated[0]) });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ entryId: string }> }) {
    const { entryId } = await ctx.params;
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.userType !== 'employee') {
        return NextResponse.json({ error: 'Employees only' }, { status: 403 });
    }

    try {
        await initDB();
        const rows = (await sql`
            SELECT id, employee_id, status FROM employee_time_entries
            WHERE id = ${entryId} LIMIT 1
        `) as unknown as { id: string; employee_id: string; status: string }[];
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        const existing = rows[0];
        if (existing.employee_id !== user.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (existing.status !== 'Pending') {
            return NextResponse.json({ error: 'Only pending entries can be deleted' }, { status: 400 });
        }

        await sql`DELETE FROM employee_time_entries WHERE id = ${entryId}`;

        await logActivity(
            'time_entry',
            entryId,
            'deleted',
            `${user.displayName} deleted pending entry`,
            `employee:${user.userId}`,
        );

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
