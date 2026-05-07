import { NextResponse } from 'next/server';
import { pushBill } from '@/lib/quickbooks/bills';
import { safeQbErrorMessage } from '@/lib/quickbooks/client';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/quickbooks/bills/:id/sync
 * `:id` is the CRM project_bill id. Pushes the bill to QB as a Bill.
 */
export async function POST(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        const body = await req.json().catch(() => ({})) as { actor?: string };
        const result = await pushBill(id, body.actor ?? 'admin');
        return NextResponse.json({ ok: true, ...result });
    } catch (e) {
        const msg = String(e);
        if (msg.includes('Vendor not synced')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        if (msg.includes('not connected')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        console.warn('[qb] bill sync failed:', e);
        return NextResponse.json({ error: safeQbErrorMessage(e) }, { status: 500 });
    }
}
