import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import { autoSyncEstimateIfEnabled } from '@/lib/quickbooks/auto-sync';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
    const { id } = await params;
    const rows = await sql`SELECT * FROM estimates WHERE id = ${id}`;
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
}

export async function PATCH(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const body = await req.json();

        const clientJson = body.client != null ? JSON.stringify(body.client) : null;
        const projectJson = body.project != null ? JSON.stringify(body.project) : null;
        const lineItemsJson = body.lineItems != null ? JSON.stringify(body.lineItems) : null;
        const paymentScheduleJson = body.paymentSchedule != null ? JSON.stringify(body.paymentSchedule) : null;
        const termsJson = body.terms != null ? JSON.stringify(body.terms) : null;

        await sql`
            UPDATE estimates SET
                status           = COALESCE(${body.status ?? null}, status),
                sent_date        = COALESCE(${body.sentDate ?? null}, sent_date),
                valid_until      = COALESCE(${body.validUntil ?? null}, valid_until),
                line_items       = COALESCE(${lineItemsJson}::jsonb, line_items),
                subtotal         = COALESCE(${body.subtotal != null ? Number(body.subtotal) : null}, subtotal),
                tax_rate         = COALESCE(${body.taxRate != null ? Number(body.taxRate) : null}, tax_rate),
                tax_amount       = COALESCE(${body.taxAmount != null ? Number(body.taxAmount) : null}, tax_amount),
                total            = COALESCE(${body.total != null ? Number(body.total) : null}, total),
                notes            = COALESCE(${body.notes ?? null}, notes),
                client           = COALESCE(${clientJson}::jsonb, client),
                project          = COALESCE(${projectJson}::jsonb, project),
                payment_schedule = COALESCE(${paymentScheduleJson}::jsonb, payment_schedule),
                terms            = COALESCE(${termsJson}::jsonb, terms),
                updated_at       = NOW()
            WHERE id = ${id}
        `;

        await logActivity('estimate', id, 'updated', 'Updated estimate record');

        if (body.status === 'Sent' || body.status === 'Accepted') {
            void autoSyncEstimateIfEnabled(id, { reason: 'status=' + body.status });
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: Ctx) {
    const { id } = await params;
    await sql`DELETE FROM estimates WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
}
