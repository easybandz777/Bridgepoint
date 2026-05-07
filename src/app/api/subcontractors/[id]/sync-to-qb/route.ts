import { NextResponse } from 'next/server';
import { pushVendor } from '@/lib/quickbooks/vendors';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/subcontractors/:id/sync-to-qb
 *
 * Convenience endpoint the subcontractor detail page calls. Pushes the sub
 * to QB as a Vendor and stamps qb_id + qb_synced_at.
 */
export async function POST(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        const body = await req.json().catch(() => ({})) as { actor?: string };
        const result = await pushVendor(id, body.actor ?? 'admin');
        return NextResponse.json({ ok: true, qbId: result.qbId });
    } catch (e) {
        const msg = String(e);
        if (msg.includes('not connected')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
