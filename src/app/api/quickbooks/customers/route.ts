import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';
import { qbQuery } from '@/lib/quickbooks/client';
import { getActiveConnection } from '@/lib/quickbooks/connection';
import { isQbDisabled } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';

/**
 * GET /api/quickbooks/customers
 *
 * Paginated list of QB Customers. Optional `?q=` substring filter is matched
 * against DisplayName via QB's `like` operator.
 *
 * Query params:
 *   q            optional case-insensitive substring of DisplayName
 *   maxResults   default 100, max 1000 (QB's hard ceiling)
 *   startPosition  1-indexed pagination offset (QB convention)
 */
export async function GET(req: Request) {
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

        const url = new URL(req.url);
        const q = (url.searchParams.get('q') ?? '').trim();
        const maxResults = Math.min(Math.max(Number(url.searchParams.get('maxResults') ?? 100), 1), 1000);
        const startPosition = Math.max(Number(url.searchParams.get('startPosition') ?? 1), 1);

        const where = q
            ? `where DisplayName like '%${q.replace(/'/g, "''")}%' `
            : '';
        const query = `select * from Customer ${where}startposition ${startPosition} maxresults ${maxResults}`;

        const data = await qbQuery(query, {
            entityType: 'qb_customer',
            action: 'list',
        });

        return NextResponse.json({ ok: true, query, data });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
