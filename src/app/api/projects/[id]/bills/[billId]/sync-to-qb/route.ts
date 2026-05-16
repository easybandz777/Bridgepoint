import { NextResponse } from 'next/server';
import { pushBill } from '@/lib/quickbooks/bills';
import { isQbDisabled } from '@/lib/feature-flags';

type Ctx = { params: Promise<{ id: string; billId: string }> };

/**
 * POST /api/projects/:id/bills/:billId/sync-to-qb
 *
 * Convenience endpoint the project bills UI calls. Pushes the project_bill
 * to QB as a Bill (vendor must already be synced).
 */
export async function POST(req: Request, ctx: Ctx) {
    if (isQbDisabled()) {
        return NextResponse.json(
            { error: 'QuickBooks integration is disabled. The CRM is now the system of record.' },
            { status: 410 },
        );
    }
    try {
        const { billId } = await ctx.params;
        const body = await req.json().catch(() => ({})) as { actor?: string };
        const result = await pushBill(billId, body.actor ?? 'admin');
        return NextResponse.json({ ok: true, ...result });
    } catch (e) {
        const msg = String(e);
        if (msg.includes('Vendor not synced')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        if (msg.includes('not connected')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
