import { NextResponse } from 'next/server';
import { pullInvoiceStatus } from '@/lib/quickbooks/invoices';
import { isQbDisabled } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
    if (isQbDisabled()) {
        return NextResponse.json(
            { error: 'QuickBooks integration is disabled. The CRM is now the system of record.' },
            { status: 410 },
        );
    }
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
