import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';

export async function GET() {
    try {
        await initDB();
        const rows = await sql`
            SELECT * FROM estimates ORDER BY created_at DESC
        `;
        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await initDB();
        const body = await req.json();
        const id = `est-${Date.now()}`;
        const now = new Date().toISOString().split('T')[0];
        const count = await sql`SELECT COUNT(*) FROM estimates`;
        const num = String(Number(count[0].count) + 1).padStart(4, '0');
        const estimateNumber = `BP-${new Date().getFullYear()}-${num}`;

        await sql`
            INSERT INTO estimates (
                id, estimate_number, status, created_date, sent_date, valid_until,
                client, project, line_items, subtotal, tax_rate, tax_amount, total,
                payment_schedule, terms, notes, prepared_by
            ) VALUES (
                ${id}, ${estimateNumber}, ${body.status ?? 'Draft'}, ${now},
                ${body.sentDate ?? null},
                ${body.validUntil ?? new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]},
                ${JSON.stringify(body.client)}, ${JSON.stringify(body.project)},
                ${JSON.stringify(body.lineItems ?? [])},
                ${body.subtotal ?? 0}, ${body.taxRate ?? 0}, ${body.taxAmount ?? 0}, ${body.total ?? 0},
                ${JSON.stringify(body.paymentSchedule ?? [])},
                ${JSON.stringify(body.terms ?? [])},
                ${body.notes ?? ''}, ${body.preparedBy ?? 'Bridgepointe'}
            )
        `;
        return NextResponse.json({ id, estimateNumber });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
