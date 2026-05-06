import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';

/**
 * GET /api/time-entries?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns rows joined with employee name + role for the org-wide grid.
 */
export async function GET(req: Request) {
    try {
        await initDB();
        const url = new URL(req.url);
        const start = url.searchParams.get('start');
        const end = url.searchParams.get('end');

        const rows = start && end
            ? await sql`
                SELECT
                    te.*,
                    e.first_name AS employee_first_name,
                    e.last_name  AS employee_last_name,
                    e.role       AS employee_role,
                    e.hourly_rate AS employee_hourly_rate,
                    e.overtime_rate AS employee_overtime_rate
                FROM employee_time_entries te
                JOIN employees e ON e.id = te.employee_id
                WHERE te.date >= ${start} AND te.date <= ${end}
                ORDER BY te.date ASC, e.last_name ASC, e.first_name ASC
            `
            : await sql`
                SELECT
                    te.*,
                    e.first_name AS employee_first_name,
                    e.last_name  AS employee_last_name,
                    e.role       AS employee_role,
                    e.hourly_rate AS employee_hourly_rate,
                    e.overtime_rate AS employee_overtime_rate
                FROM employee_time_entries te
                JOIN employees e ON e.id = te.employee_id
                ORDER BY te.date DESC, e.last_name ASC
                LIMIT 500
            `;

        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

/**
 * POST /api/time-entries
 * Quick-add path used by /admin/clock and the org-wide page. Requires
 * employeeId in the body.
 */
export async function POST(req: Request) {
    try {
        await initDB();
        const body = await req.json();
        if (!body.employeeId) {
            return NextResponse.json({ error: 'employeeId required' }, { status: 400 });
        }

        const empRows = await sql`SELECT hourly_rate, overtime_rate FROM employees WHERE id = ${body.employeeId}`;
        if (empRows.length === 0) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }
        const hourly = Number(empRows[0].hourly_rate ?? 0);
        const ot = empRows[0].overtime_rate != null ? Number(empRows[0].overtime_rate) : hourly * 1.5;

        const id = genId('te');
        const hoursReg = Number(body.hoursRegular ?? 0);
        const hoursOt = Number(body.hoursOvertime ?? 0);
        const cost = body.costAmount != null
            ? Number(body.costAmount)
            : Math.round((hoursReg * hourly + hoursOt * ot) * 100) / 100;

        await sql`
            INSERT INTO employee_time_entries (
                id, employee_id, project_id, phase_id, date,
                clock_in, clock_out, hours_regular, hours_overtime,
                cost_amount, status, notes
            ) VALUES (
                ${id},
                ${body.employeeId},
                ${body.projectId ?? null},
                ${body.phaseId ?? null},
                ${body.date ?? new Date().toISOString().slice(0, 10)},
                ${body.clockIn ?? null},
                ${body.clockOut ?? null},
                ${hoursReg},
                ${hoursOt},
                ${cost},
                ${body.status ?? 'Pending'},
                ${body.notes ?? ''}
            )
        `;

        await logActivity(
            'time_entry',
            id,
            'created',
            `Quick-add ${hoursReg + hoursOt}h for employee ${body.employeeId}`,
            'admin',
            { employeeId: body.employeeId, projectId: body.projectId ?? null },
        );

        return NextResponse.json({ id });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
