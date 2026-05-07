import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import { autoSyncInvoiceIfEnabled } from '@/lib/quickbooks/auto-sync';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const rows = await sql`SELECT * FROM invoices WHERE id = ${id}`;
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
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

        const clientJson = body.client != null ? JSON.stringify(body.client) : null;
        const projectJson = body.project != null ? JSON.stringify(body.project) : null;
        const lineItemsJson = body.lineItems != null ? JSON.stringify(body.lineItems) : null;
        const paymentInstructionsJson = body.paymentInstructions != null ? JSON.stringify(body.paymentInstructions) : null;

        await sql`
            UPDATE invoices SET
                status               = COALESCE(${body.status ?? null}, status),
                issued_date          = COALESCE(${body.issuedDate ?? null}, issued_date),
                due_date             = COALESCE(${body.dueDate ?? null}, due_date),
                paid_date            = COALESCE(${body.paidDate ?? null}, paid_date),
                line_items           = COALESCE(${lineItemsJson}::jsonb, line_items),
                subtotal             = COALESCE(${body.subtotal != null ? Number(body.subtotal) : null}, subtotal),
                tax_rate             = COALESCE(${body.taxRate != null ? Number(body.taxRate) : null}, tax_rate),
                tax_amount           = COALESCE(${body.taxAmount != null ? Number(body.taxAmount) : null}, tax_amount),
                total                = COALESCE(${body.total != null ? Number(body.total) : null}, total),
                amount_paid          = COALESCE(${body.amountPaid != null ? Number(body.amountPaid) : null}, amount_paid),
                amount_due           = COALESCE(${body.amountDue != null ? Number(body.amountDue) : null}, amount_due),
                notes                = COALESCE(${body.notes ?? null}, notes),
                payment_instructions = COALESCE(${paymentInstructionsJson}::jsonb, payment_instructions),
                client               = COALESCE(${clientJson}::jsonb, client),
                project              = COALESCE(${projectJson}::jsonb, project),
                updated_at           = NOW()
            WHERE id = ${id}
        `;

        await logActivity('invoice', id, 'updated', 'Updated invoice record');

        if (body.status === 'Sent' || body.status === 'Paid') {
            void autoSyncInvoiceIfEnabled(id, { reason: 'status=' + body.status });
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        await logActivity('invoice', id, 'deleted', 'Deleted invoice record');
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
