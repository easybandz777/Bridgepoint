import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string; entryId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
    try {
        const { id, entryId } = await ctx.params;
        await initDB();
        const body = await req.json();

        // Recalculate cost when hours change.
        let costToSet: number | null = null;
        if (body.hoursRegular != null || body.hoursOvertime != null) {
            const cur = await sql`SELECT hours_regular, hours_overtime FROM employee_time_entries WHERE id = ${entryId}`;
            const empRows = await sql`SELECT hourly_rate, overtime_rate FROM employees WHERE id = ${id}`;
            const hourly = empRows.length > 0 ? Number(empRows[0].hourly_rate ?? 0) : 0;
            const otRate = empRows.length > 0 && empRows[0].overtime_rate != null
                ? Number(empRows[0].overtime_rate)
                : hourly * 1.5;
            const reg = body.hoursRegular != null
                ? Number(body.hoursRegular)
                : Number(cur[0]?.hours_regular ?? 0);
            const ot = body.hoursOvertime != null
                ? Number(body.hoursOvertime)
                : Number(cur[0]?.hours_overtime ?? 0);
            costToSet = Math.round((reg * hourly + ot * otRate) * 100) / 100;
        }

        const isApproval = body.status === 'Approved';
        const isRejection = body.status === 'Rejected';
        const approvedAt = isApproval ? new Date().toISOString() : null;

        await sql`
            UPDATE employee_time_entries SET
                project_id     = COALESCE(${body.projectId ?? null}, project_id),
                phase_id       = COALESCE(${body.phaseId ?? null}, phase_id),
                date           = COALESCE(${body.date ?? null}, date),
                clock_in       = COALESCE(${body.clockIn ?? null}, clock_in),
                clock_out      = COALESCE(${body.clockOut ?? null}, clock_out),
                hours_regular  = COALESCE(${body.hoursRegular != null ? Number(body.hoursRegular) : null}, hours_regular),
                hours_overtime = COALESCE(${body.hoursOvertime != null ? Number(body.hoursOvertime) : null}, hours_overtime),
                cost_amount    = COALESCE(${costToSet}, cost_amount),
                status         = COALESCE(${body.status ?? null}, status),
                notes          = COALESCE(${body.notes ?? null}, notes),
                approved_by    = CASE WHEN ${isApproval} THEN COALESCE(${body.approvedBy ?? 'admin'}, 'admin') ELSE approved_by END,
                approved_at    = COALESCE(${approvedAt}, approved_at)
            WHERE id = ${entryId} AND employee_id = ${id}
        `;

        if (isApproval) {
            await logActivity('time_entry', entryId, 'approved', 'Time entry approved', 'admin', { employeeId: id });
        } else if (isRejection) {
            await logActivity('time_entry', entryId, 'rejected', 'Time entry rejected', 'admin', { employeeId: id });
        } else {
            await logActivity('time_entry', entryId, 'updated', 'Time entry edited', 'admin', { employeeId: id });
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id, entryId } = await ctx.params;
        await initDB();
        await sql`DELETE FROM employee_time_entries WHERE id = ${entryId} AND employee_id = ${id}`;
        await logActivity('time_entry', entryId, 'deleted', 'Time entry deleted', 'admin', { employeeId: id });
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
