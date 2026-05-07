import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
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
}

interface RateRow {
    hourly_rate: string | number | null;
    overtime_rate: string | number | null;
}

const REGULAR_THRESHOLD = 8;

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

export async function POST(req: Request) {
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.userType !== 'employee') {
        return NextResponse.json({ error: 'Employees only' }, { status: 403 });
    }

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* empty body ok */ }

    const finalNotes = body.notes != null ? String(body.notes) : null;

    try {
        await initDB();

        const open = (await sql`
            SELECT id, employee_id, project_id, phase_id, date,
                   clock_in, clock_out, notes, status
            FROM employee_time_entries
            WHERE employee_id = ${user.userId} AND clock_out IS NULL
            ORDER BY created_at DESC
            LIMIT 1
        `) as unknown as OpenShiftRow[];

        if (open.length === 0) {
            return NextResponse.json({ error: 'Not currently clocked in' }, { status: 400 });
        }
        const entry = open[0];

        if (!entry.clock_in) {
            return NextResponse.json({ error: 'Open entry has no clock_in timestamp' }, { status: 500 });
        }

        const start = new Date(entry.clock_in);
        if (Number.isNaN(start.getTime())) {
            return NextResponse.json({ error: 'Invalid clock_in timestamp' }, { status: 500 });
        }
        const end = new Date();
        const totalMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
        const totalHours = totalMinutes / 60;

        const hoursRegular = round2(Math.min(totalHours, REGULAR_THRESHOLD));
        const hoursOvertime = round2(Math.max(0, totalHours - REGULAR_THRESHOLD));

        const empRows = (await sql`
            SELECT hourly_rate, overtime_rate FROM employees WHERE id = ${user.userId}
        `) as unknown as RateRow[];
        const hourly = Number(empRows[0]?.hourly_rate ?? 0);
        const otRate = empRows[0]?.overtime_rate != null ? Number(empRows[0].overtime_rate) : hourly * 1.5;
        const cost = round2(hoursRegular * hourly + hoursOvertime * otRate);

        const iso = end.toISOString();

        await sql`
            UPDATE employee_time_entries SET
                clock_out      = ${iso},
                hours_regular  = ${hoursRegular},
                hours_overtime = ${hoursOvertime},
                cost_amount    = ${cost},
                notes          = COALESCE(${finalNotes}, notes)
            WHERE id = ${entry.id}
        `;

        await logActivity(
            'time_entry',
            entry.id,
            'clock_out',
            `${user.displayName} clocked out (${hoursRegular + hoursOvertime}h)`,
            `employee:${user.userId}`,
            { hoursRegular, hoursOvertime, cost },
        );

        const updated = (await sql`
            SELECT
                t.id, t.employee_id, t.project_id, t.phase_id, t.date,
                t.clock_in, t.clock_out, t.hours_regular, t.hours_overtime,
                t.cost_amount, t.status, t.notes,
                p.name AS project_name,
                ph.name AS phase_name
            FROM employee_time_entries t
            LEFT JOIN projects p ON p.id = t.project_id
            LEFT JOIN project_phases ph ON ph.id = t.phase_id
            WHERE t.id = ${entry.id}
            LIMIT 1
        `) as unknown as Record<string, unknown>[];

        const r = updated[0];
        return NextResponse.json({
            ok: true,
            entry: {
                id: r.id,
                employeeId: r.employee_id,
                projectId: r.project_id,
                phaseId: r.phase_id,
                date: r.date,
                clockIn: r.clock_in,
                clockOut: r.clock_out,
                hoursRegular: Number(r.hours_regular ?? 0),
                hoursOvertime: Number(r.hours_overtime ?? 0),
                costAmount: Number(r.cost_amount ?? 0),
                status: r.status,
                notes: (r.notes as string) ?? '',
                projectName: r.project_name,
                phaseName: r.phase_name,
            },
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
