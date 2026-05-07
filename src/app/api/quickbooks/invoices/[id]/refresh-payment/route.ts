import { NextResponse } from 'next/server';
import { refreshInvoicePaymentStatus } from '@/lib/quickbooks/payments';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        const result = await refreshInvoicePaymentStatus(id, 'admin');
        return NextResponse.json({ ok: true, ...result });
    } catch (e) {
        const msg = String(e);
        if (msg.includes('not yet synced') || msg.includes('not connected')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
