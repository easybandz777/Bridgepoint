import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';
import { getActiveConnection } from '@/lib/quickbooks/connection';
import { pushCustomerToQb } from '@/lib/quickbooks/customers-push';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/customers/[id]/sync-to-qb
 * Body: { actor?: string }
 *
 * Pushes the CRM customer to QuickBooks. Creates a new QB Customer the first
 * time and updates it on subsequent calls. Returns 412 if QB is not connected.
 */
export async function POST(req: Request, ctx: Ctx) {
    try {
        await initDB();

        const conn = await getActiveConnection();
        if (!conn) {
            return NextResponse.json({ error: 'QuickBooks is not connected' }, { status: 412 });
        }

        const { id } = await ctx.params;
        const body = (await req.json().catch(() => ({}))) as { actor?: string };

        const result = await pushCustomerToQb(id, body.actor ?? 'admin');
        return NextResponse.json({ ok: true, qbId: result.qbId });
    } catch (e) {
        const msg = String(e);
        if (msg.includes('QuickBooks is not connected')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        if (msg.includes('not found')) {
            return NextResponse.json({ error: msg }, { status: 404 });
        }
        if (msg.includes('DisplayName')) {
            return NextResponse.json({ error: msg }, { status: 409 });
        }
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
