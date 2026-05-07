import { NextResponse } from 'next/server';
import { pushVendor } from '@/lib/quickbooks/vendors';
import { safeQbErrorMessage } from '@/lib/quickbooks/client';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/quickbooks/vendors/:id/sync
 * `:id` is the CRM subcontractor id. Pushes the sub to QB as a Vendor.
 */
export async function POST(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        const body = await req.json().catch(() => ({})) as { actor?: string };
        const result = await pushVendor(id, body.actor ?? 'admin');
        return NextResponse.json({ ok: true, ...result });
    } catch (e) {
        const msg = String(e);
        if (msg.includes('not connected')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        console.warn('[qb] vendor sync failed:', e);
        return NextResponse.json({ error: safeQbErrorMessage(e) }, { status: 500 });
    }
}
