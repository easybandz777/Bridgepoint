import { NextResponse } from 'next/server';
import { pushInvoice } from '@/lib/quickbooks/invoices';
import { safeQbErrorMessage } from '@/lib/quickbooks/client';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        const result = await pushInvoice(id, 'admin');
        return NextResponse.json({ ok: true, ...result });
    } catch (e) {
        const msg = String(e);
        if (msg.includes('Customer not yet synced')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        if (msg.includes('not connected')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        console.warn('[qb] invoice sync failed:', e);
        return NextResponse.json({ error: safeQbErrorMessage(e) }, { status: 500 });
    }
}
