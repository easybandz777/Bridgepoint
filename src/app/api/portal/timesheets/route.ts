import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';
import { getPortalUserFromCookie } from '@/lib/portal-auth';
import { mondayOf, addDays } from '@/lib/employees';

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

export async function GET(req: Request) {
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.userType !== 'employee') {
        return NextResponse.json({ error: 'Employees only' }, { status: 403 });
    }

    try {
        await initDB();
        const url = new URL(req.url);
        let start = url.searchParams.get('start');
        let end = url.searchParams.get('end');

        if (!start || !end) {
            const monday = mondayOf(new Date());
            start = monday;
            end = addDays(monday, 6);
        }

        const rows = (await sql`
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
            WHERE t.employee_id = ${user.userId}
              AND t.date >= ${start}
              AND t.date <= ${end}
            ORDER BY t.date ASC, t.created_at ASC
        `) as unknown as EntryRow[];

        return NextResponse.json({
            start,
            end,
            entries: rows.map(shape),
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.userType !== 'employee') {
        return NextResponse.json({ error: 'Employees only' }, { status: 403 });
    }

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* empty body ok */ }

    const date = (body.date as string) || '';
    if (!date) {
        return NextResponse.json({ error: 'date required' }, { status: 400 });
    }
    const projectId = (body.projectId as string) || null;
    const phaseId = (body.phaseId as string) || null;
    const notes = (body.notes as string) || '';
    const hoursRegular = round2(Number(body.hoursRegular ?? 0));
    const hoursOvertime = round2(Number(body.hoursOvertime ?? 0));

    if (hoursRegular < 0 || hoursOvertime < 0) {
        return NextResponse.json({ error: 'Hours must be non-negative' }, { status: 400 });
    }
    if (hoursRegular === 0 && hoursOvertime === 0) {
        return NextResponse.json({ error: 'At least some hours required' }, { status: 400 });
    }

    try {
        await initDB();

        const empRows = (await sql`
            SELECT hourly_rate, overtime_rate FROM employees WHERE id = ${user.userId}
        `) as unknown as RateRow[];
        const hourly = Number(empRows[0]?.hourly_rate ?? 0);
        const otRate = empRows[0]?.overtime_rate != null ? Number(empRows[0].overtime_rate) : hourly * 1.5;
        const cost = round2(hoursRegular * hourly + hoursOvertime * otRate);

        const id = genId('te');
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
                ${null},
                ${null},
                ${hoursRegular},
                ${hoursOvertime},
                ${cost},
                'Pending',
                ${notes}
            )
        `;

        await logActivity(
            'time_entry',
            id,
            'created',
            `${user.displayName} added manual entry (${hoursRegular + hoursOvertime}h on ${date})`,
            `employee:${user.userId}`,
            { projectId, phaseId, hoursRegular, hoursOvertime },
        );

        const created = (await sql`
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
            WHERE t.id = ${id}
            LIMIT 1
        `) as unknown as EntryRow[];

        return NextResponse.json({ ok: true, entry: shape(created[0]) }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
