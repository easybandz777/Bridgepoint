import { NextResponse } from 'next/server';
import { getActiveConnectionRow, refreshConnection } from '@/lib/quickbooks/connection';
import { isQbDisabled } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';

/**
 * POST /api/quickbooks/refresh
 *
 * Forces a refresh-token exchange. Useful for the admin UI's "Test
 * connection" button and as an internal endpoint Vercel Cron can hit on a
 * schedule to keep the access token warm.
 */
export async function POST() {
    if (isQbDisabled()) {
        return NextResponse.json(
            { error: 'QuickBooks integration is disabled. The CRM is now the system of record.' },
            { status: 410 },
        );
    }
    try {
        const conn = await getActiveConnectionRow();
        if (!conn) {
            return NextResponse.json({ error: 'No active connection' }, { status: 404 });
        }
        const refreshed = await refreshConnection(conn.id);
        return NextResponse.json({
            ok: true,
            accessExpiresAt: refreshed.accessExpiresAt.toISOString(),
            refreshExpiresAt: refreshed.refreshExpiresAt.toISOString(),
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
