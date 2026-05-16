import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';
import { getActiveConnection } from '@/lib/quickbooks/connection';
import { importAllCustomersFromQb } from '@/lib/quickbooks/customers-import';
import { isQbDisabled } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';

/**
 * POST /api/quickbooks/customers/import
 * Body: { actor?: string }
 *
 * Pulls every QB Customer (paginated) and upserts into the CRM `customers`
 * table. Per-customer errors are counted in `failed` and do not abort the run.
 * Returns 412 if QB is not connected.
 */
export async function POST(req: Request) {
    if (isQbDisabled()) {
        return NextResponse.json(
            { error: 'QuickBooks integration is disabled. The CRM is now the system of record.' },
            { status: 410 },
        );
    }
    try {
        await initDB();

        const conn = await getActiveConnection();
        if (!conn) {
            return NextResponse.json({ error: 'QuickBooks is not connected' }, { status: 412 });
        }

        const body = (await req.json().catch(() => ({}))) as { actor?: string };
        const start = Date.now();
        const result = await importAllCustomersFromQb({ actor: body.actor ?? 'admin' });

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
