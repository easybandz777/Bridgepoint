import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';

export async function GET() {
    try {
        await initDB();
        const rows = await sql`SELECT * FROM invoices ORDER BY created_at DESC`;
        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await initDB();
        const body = await req.json();
        const id = `inv-${Date.now()}`;
        const now = new Date().toISOString().split('T')[0];
        const count = await sql`SELECT COUNT(*) FROM invoices`;
        const num = String(Number(count[0].count) + 1).padStart(4, '0');
        const invoiceNumber = `BPINV-${new Date().getFullYear()}-${num}`;

        const subtotal = body.subtotal ?? 0;
        const amountPaid = body.amountPaid ?? 0;
        const amountDue = subtotal - amountPaid;

        await sql`
            INSERT INTO invoices (
                id, invoice_number, estimate_ref, status, issued_date, due_date,
                client, project, line_items, subtotal, tax_rate, tax_amount, total,
                amount_paid, amount_due, payment_instructions, notes
            ) VALUES (
                ${id}, ${invoiceNumber}, ${body.estimateRef ?? null},
                ${body.status ?? 'Outstanding'}, ${now},
                ${body.dueDate ?? new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]},
                ${JSON.stringify(body.client)}, ${JSON.stringify(body.project ?? {})},
                ${JSON.stringify(body.lineItems ?? [])},
                ${subtotal}, ${body.taxRate ?? 0}, ${body.taxAmount ?? 0}, ${body.total ?? subtotal},
                ${amountPaid}, ${amountDue},
                ${JSON.stringify(body.paymentInstructions ?? {})},
                ${body.notes ?? ''}
            )
        `;
        return NextResponse.json({ id, invoiceNumber });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
