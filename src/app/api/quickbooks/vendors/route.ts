import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';
import { qbQuery } from '@/lib/quickbooks/client';
import { getActiveConnection } from '@/lib/quickbooks/connection';

/**
 * GET /api/quickbooks/vendors
 *
 * Paginated list of QB Vendors. Optional `?q=` substring filter is matched
 * against DisplayName via QB's `like` operator.
 */
export async function GET(req: Request) {
    try {
        await initDB();
        const conn = await getActiveConnection();
        if (!conn) {
            return NextResponse.json({ error: 'QuickBooks is not connected' }, { status: 412 });
        }

        const url = new URL(req.url);
        const q = (url.searchParams.get('q') ?? '').trim();
        const maxResults = Math.min(Math.max(Number(url.searchParams.get('maxResults') ?? 100), 1), 1000);
        const startPosition = Math.max(Number(url.searchParams.get('startPosition') ?? 1), 1);

        const where = q
            ? `where DisplayName like '%${q.replace(/'/g, "''")}%' `
            : '';
        const query = `select * from Vendor ${where}startposition ${startPosition} maxresults ${maxResults}`;

        const data = await qbQuery(query, {
            entityType: 'qb_vendor',
            action: 'list',
        });

        return NextResponse.json({ ok: true, query, data });
    } catch (e) {
        const msg = String(e);
        if (msg.includes('not connected')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
