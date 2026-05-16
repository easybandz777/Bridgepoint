import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { qbGet, QbApiError, safeQbErrorMessage } from '@/lib/quickbooks/client';
import { getActiveConnection } from '@/lib/quickbooks/connection';
import { upsertVendorFromQb } from '@/lib/quickbooks/vendors-import';
import type { QbVendor } from '@/lib/quickbooks/types';
import { isQbDisabled } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

interface VendorIdRow {
    qb_id: string | null;
}

/**
 * POST /api/quickbooks/vendors/:id/sync-from-qb
 * `:id` is the CRM vendor id. Pulls the matching QB Vendor by stored qb_id
 * and upserts the latest data back into the CRM row. Useful for a manual
 * "refresh from QuickBooks" button on the vendor detail page.
 */
export async function POST(_req: Request, ctx: Ctx) {
    if (isQbDisabled()) {
        return NextResponse.json(
            { error: 'QuickBooks integration is disabled. The CRM is now the system of record.' },
            { status: 410 },
        );
    }
    try {
        const { id } = await ctx.params;
        await initDB();

        const conn = await getActiveConnection();
        if (!conn) {
            return NextResponse.json({ error: 'QuickBooks is not connected' }, { status: 412 });
        }

        const rows = (await sql`
            SELECT qb_id FROM vendors WHERE id = ${id} LIMIT 1
        `) as unknown as VendorIdRow[];
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }
        const qbId = rows[0].qb_id;
        if (!qbId) {
            return NextResponse.json({ error: 'Vendor not yet synced with QuickBooks' }, { status: 412 });
        }

        const data = await qbGet<{ Vendor: QbVendor }>(`/vendor/${encodeURIComponent(qbId)}`, {
            logAs: { entityType: 'qb_vendor', entityId: id, qbEntityId: qbId, action: 'read', direction: 'pull' },
        });
        if (!data.Vendor) {
            return NextResponse.json({ error: 'QuickBooks returned no Vendor' }, { status: 502 });
        }

        const result = await upsertVendorFromQb(data.Vendor, 'qb_import');
        return NextResponse.json({ ok: true, id: result.id, created: result.created });
    } catch (e) {
        if (e instanceof QbApiError && e.status === 404) {
            return NextResponse.json({ error: 'Vendor not found in QuickBooks' }, { status: 404 });
        }
        const msg = String(e);
        if (msg.includes('not connected')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        return NextResponse.json({ error: safeQbErrorMessage(e) }, { status: 500 });
    }
}
