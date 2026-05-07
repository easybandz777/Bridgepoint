import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface CountRow {
    n: number;
}

/**
 * GET /api/admin/backfill/status
 *
 * Returns counts of records still missing a customer_id linkage so the UI
 * can show the operator how much work the next backfill run will do.
 */
export async function GET() {
    try {
        await initDB();

        const projectsPending = (await sql`
            SELECT COUNT(*)::int AS n
            FROM projects
            WHERE customer_id IS NULL
              AND COALESCE(client_name, '') <> ''
        `) as unknown as CountRow[];

        const invoicesPending = (await sql`
            SELECT COUNT(*)::int AS n
            FROM invoices
            WHERE customer_id IS NULL
        `) as unknown as CountRow[];

        const estimatesPending = (await sql`
            SELECT COUNT(*)::int AS n
            FROM estimates
            WHERE customer_id IS NULL
        `) as unknown as CountRow[];

        const totalCustomers = (await sql`
            SELECT COUNT(*)::int AS n FROM customers
        `) as unknown as CountRow[];

        return NextResponse.json({
            projectsPending: projectsPending[0]?.n ?? 0,
            invoicesPending: invoicesPending[0]?.n ?? 0,
            estimatesPending: estimatesPending[0]?.n ?? 0,
            totalCustomers: totalCustomers[0]?.n ?? 0,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
