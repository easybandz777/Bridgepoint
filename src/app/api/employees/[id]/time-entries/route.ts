import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const url = new URL(req.url);
        const start = url.searchParams.get('start'); // YYYY-MM-DD
        const end = url.searchParams.get('end'); // YYYY-MM-DD inclusive

        const rows = start && end
            ? await sql`
                SELECT * FROM employee_time_entries
                WHERE employee_id = ${id}
                  AND date >= ${start}
                  AND date <= ${end}
                ORDER BY date DESC, created_at DESC
            `
            : await sql`
                SELECT * FROM employee_time_entries
                WHERE employee_id = ${id}
                ORDER BY date DESC, created_at DESC
                LIMIT 200
            `;

        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const body = await req.json();
        const entryId = genId('te');

        // Compute cost if not provided.
        const empRows = await sql`SELECT hourly_rate, overtime_rate FROM employees WHERE id = ${id}`;
        const hourly = empRows.length > 0 ? Number(empRows[0].hourly_rate ?? 0) : 0;
        const ot = empRows.length > 0 && empRows[0].overtime_rate != null
            ? Number(empRows[0].overtime_rate)
            : hourly * 1.5;

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
                ${entryId},
                ${id},
                ${body.projectId ?? null},
                ${body.phaseId ?? null},
                ${body.date},
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
            entryId,
            'created',
            `Logged ${hoursReg + hoursOt}h for employee ${id} on ${body.date}`,
            'admin',
            { employeeId: id, projectId: body.projectId ?? null },
        );

        return NextResponse.json({ id: entryId });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
