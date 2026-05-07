import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { rowToAccount, type AccountRow } from '@/lib/accounts';

export const dynamic = 'force-dynamic';

/**
 * GET /api/accounts?type=&classification=&active=
 *
 * Read-only listing of the chart of accounts. Mutations come through
 * the QB import + webhook flows for now.
 */
export async function GET(req: Request) {
    try {
        await initDB();
        const url = new URL(req.url);
        const type = url.searchParams.get('type');
        const classification = url.searchParams.get('classification');
        const active = url.searchParams.get('active');
        const limit = Math.min(Number(url.searchParams.get('limit') ?? 500), 1000);

        const rows = (await sql`
            SELECT * FROM accounts
            WHERE
                (${!type}::boolean OR account_type = ${type})
                AND (${!classification}::boolean OR classification = ${classification})
                AND (${active === null}::boolean OR active = ${active === 'true'})
            ORDER BY classification ASC NULLS LAST, account_type ASC, name ASC
            LIMIT ${limit}
        `) as unknown as AccountRow[];

        return NextResponse.json({ rows: rows.map(rowToAccount), total: rows.length });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
