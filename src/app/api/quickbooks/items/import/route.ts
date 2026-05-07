import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';
import { getActiveConnection } from '@/lib/quickbooks/connection';
import { importAllItemsFromQb } from '@/lib/quickbooks/items-import';

export const dynamic = 'force-dynamic';

/**
 * POST /api/quickbooks/items/import
 * Body: { actor?: string }
 *
 * Pulls every QB Item (paginated) and upserts into the CRM `items` table.
 * Per-item errors are counted in `failed` and do not abort the run.
 * Returns 412 if QB is not connected.
 */
export async function POST(req: Request) {
    try {
        await initDB();

        const conn = await getActiveConnection();
        if (!conn) {
            return NextResponse.json({ error: 'QuickBooks is not connected' }, { status: 412 });
        }

        const body = (await req.json().catch(() => ({}))) as { actor?: string };
        const start = Date.now();
        const result = await importAllItemsFromQb({ actor: body.actor ?? 'admin' });

        return NextResponse.json({
            imported: result.imported,
            updated: result.updated,
            failed: result.failed,
            durationMs: Date.now() - start,
        });
    } catch (e) {
        const msg = String(e);
        if (msg.includes('QuickBooks is not connected')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
