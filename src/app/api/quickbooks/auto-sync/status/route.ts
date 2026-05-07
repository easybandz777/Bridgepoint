/**
 * GET /api/quickbooks/auto-sync/status
 *
 * Counts of records that *would* be pushed if `/auto-sync/run` ran right now.
 * The admin UI uses this to surface "12 invoices need pushing" without
 * actually pushing anything.
 */
import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { getActiveConnection } from '@/lib/quickbooks/connection';

interface CountRow {
    count: number | string;
}

function toNum(rows: unknown): number {
    const r = (rows as CountRow[])[0];
    return r ? Number(r.count) : 0;
}

export async function GET() {
    await initDB();

    const conn = await getActiveConnection().catch(() => null);
    const connected = conn != null;

    const invoiceRows = await sql`
        SELECT COUNT(*)::int AS count FROM invoices
        WHERE status = 'Sent' AND qb_id IS NULL
    `;
    const estimateRows = await sql`
        SELECT COUNT(*)::int AS count FROM estimates
        WHERE status IN ('Sent','Accepted') AND qb_id IS NULL
    `;
    const vendorRows = await sql`
        SELECT COUNT(DISTINCT s.id)::int AS count
        FROM subcontractors s
        JOIN project_bills b ON b.subcontractor_id = s.id
        WHERE s.qb_id IS NULL
    `;
    const billRows = await sql`
        SELECT COUNT(*)::int AS count FROM project_bills b
        JOIN subcontractors s ON s.id = b.subcontractor_id
        WHERE b.qb_id IS NULL AND s.qb_id IS NOT NULL
    `;
    const paymentSweepRows = await sql`
        SELECT COUNT(*)::int AS count FROM invoices
        WHERE qb_id IS NOT NULL
          AND status NOT IN ('Paid','Cancelled','Voided')
    `;

    return NextResponse.json({
        ok: true,
        connected,
        pending: {
            invoices: toNum(invoiceRows),
            estimates: toNum(estimateRows),
            vendors: toNum(vendorRows),
            bills: toNum(billRows),
            paymentRefreshCandidates: toNum(paymentSweepRows),
        },
    });
}
