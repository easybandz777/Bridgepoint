import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string; billId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id, billId } = await ctx.params;
        await initDB();
        const rows = await sql`
            SELECT * FROM project_bills WHERE project_id = ${id} AND id = ${billId}
        `;
        if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(rows[0]);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function PATCH(req: Request, ctx: Ctx) {
    try {
        const { id, billId } = await ctx.params;
        await initDB();
        const body = await req.json();

        const action = (body.action ?? '').toLowerCase();

        if (action === 'mark-paid' || action === 'pay') {
            const paidDate = body.paidDate ?? new Date().toISOString().split('T')[0];
            await sql`
                UPDATE project_bills SET
                    status = 'Paid',
                    paid_date = ${paidDate},
                    updated_at = NOW()
                WHERE id = ${billId} AND project_id = ${id}
            `;
            await logActivity('project', id, 'bill_paid', `Bill ${billId} marked paid`, body.actor, { billId, paidDate });
            return NextResponse.json({ ok: true, paid: true });
        }

        await sql`
            UPDATE project_bills SET
                phase_id          = COALESCE(${body.phaseId},          phase_id),
                subcontractor_id  = COALESCE(${body.subcontractorId},  subcontractor_id),
                assignment_id     = COALESCE(${body.assignmentId},     assignment_id),
                bill_number       = COALESCE(${body.billNumber},       bill_number),
                amount            = COALESCE(${body.amount},           amount),
                status            = COALESCE(${body.status},           status),
                received_date     = COALESCE(${body.receivedDate},     received_date),
                due_date          = COALESCE(${body.dueDate},          due_date),
                paid_date         = COALESCE(${body.paidDate},         paid_date),
                description       = COALESCE(${body.description},      description),
                file_url          = COALESCE(${body.fileUrl},          file_url),
                updated_at        = NOW()
            WHERE id = ${billId} AND project_id = ${id}
        `;

        await logActivity('project', id, 'bill_updated', `Bill ${billId} updated`, body.actor, { billId });

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id, billId } = await ctx.params;
        await initDB();
        await sql`DELETE FROM project_bills WHERE id = ${billId} AND project_id = ${id}`;
        await logActivity('project', id, 'bill_deleted', `Bill ${billId} deleted`);
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
