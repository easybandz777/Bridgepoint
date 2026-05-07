import { NextResponse } from 'next/server';
import { pullInvoiceStatus } from '@/lib/quickbooks/invoices';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        const result = await pullInvoiceStatus(id, 'admin');
        return NextResponse.json({ ok: true, ...result });
    } catch (e) {
        const msg = String(e);
        if (msg.includes('not connected')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        if (msg.includes('no qb_id')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
