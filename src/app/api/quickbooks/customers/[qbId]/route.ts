import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';
import { qbGet, QbApiError } from '@/lib/quickbooks/client';
import { getActiveConnection } from '@/lib/quickbooks/connection';
import type { QbCustomer } from '@/lib/quickbooks/types';
import { isQbDisabled } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ qbId: string }> };

/**
 * GET /api/quickbooks/customers/:qbId
 * Fetches a single QB Customer by its QuickBooks resource Id. Used by the
 * admin UI for debugging and verification.
 */
export async function GET(_req: Request, ctx: Ctx) {
    if (isQbDisabled()) {
        return NextResponse.json(
            { error: 'QuickBooks integration is disabled. The CRM is now the system of record.' },
            { status: 410 },
        );
    }
    try {
        const { qbId } = await ctx.params;
        await initDB();

        const conn = await getActiveConnection();
        if (!conn) {
            return NextResponse.json({ error: 'QuickBooks is not connected' }, { status: 412 });
        }

        const data = await qbGet<{ Customer: QbCustomer }>(`/customer/${encodeURIComponent(qbId)}`, {
            logAs: { entityType: 'qb_customer', qbEntityId: qbId, action: 'read', direction: 'pull' },
        });

        return NextResponse.json({ ok: true, customer: data.Customer });
    } catch (e) {
        if (e instanceof QbApiError && e.status === 404) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
