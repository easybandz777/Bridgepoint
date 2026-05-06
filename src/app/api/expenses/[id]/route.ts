import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const rows = await sql`
            SELECT e.*, p.name AS project_name, ph.name AS phase_name
            FROM expenses e
            LEFT JOIN projects        p  ON p.id  = e.project_id
            LEFT JOIN project_phases  ph ON ph.id = e.phase_id
            WHERE e.id = ${id}
        `;
        if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(rows[0]);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function PATCH(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const body = await req.json();

        await sql`
            UPDATE expenses SET
                project_id     = COALESCE(${body.projectId},     project_id),
                phase_id       = COALESCE(${body.phaseId},       phase_id),
                employee_id    = COALESCE(${body.employeeId},    employee_id),
                category       = COALESCE(${body.category},      category),
                vendor         = COALESCE(${body.vendor},        vendor),
                description    = COALESCE(${body.description},   description),
                amount         = COALESCE(${body.amount},        amount),
                date           = COALESCE(${body.date},          date),
                payment_method = COALESCE(${body.paymentMethod}, payment_method),
                receipt_url    = COALESCE(${body.receiptUrl},    receipt_url),
                reimbursable   = COALESCE(${body.reimbursable},  reimbursable),
                reimbursed     = COALESCE(${body.reimbursed},    reimbursed),
                tax_deductible = COALESCE(${body.taxDeductible}, tax_deductible),
                notes          = COALESCE(${body.notes},         notes)
            WHERE id = ${id}
        `;

        await logActivity('expense', id, 'updated', `Expense ${id} updated`, body.actor);

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        await sql`DELETE FROM expenses WHERE id = ${id}`;
        await logActivity('expense', id, 'deleted', `Expense ${id} deleted`);
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
