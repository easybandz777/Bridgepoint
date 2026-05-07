/**
 * POST /api/quickbooks/auto-sync/run
 *
 * Batch auto-sync: walk every CRM entity that *should* be in QB but isn't
 * (or is stale) and push it. Vercel Cron points here once a day.
 *
 *   - Invoices: status='Sent' AND qb_id IS NULL  → pushInvoice
 *   - Estimates: status IN ('Sent','Accepted') AND qb_id IS NULL → pushEstimate
 *   - Vendors: subcontractors referenced by any bill where the sub itself
 *              has qb_id IS NULL → pushVendor
 *   - Bills: project_bills with qb_id IS NULL where the linked subcontractor
 *            already has qb_id → pushBill
 *   - Payments: refresh paid status across all synced invoices.
 *
 * Promise.allSettled keeps the sweep going on individual failures; failures
 * land in `errors[]`.
 */
import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { getActiveConnection } from '@/lib/quickbooks/connection';
import { pushInvoice } from '@/lib/quickbooks/invoices';
import { pushEstimate } from '@/lib/quickbooks/estimates';
import { pushVendor } from '@/lib/quickbooks/vendors';
import { pushBill } from '@/lib/quickbooks/bills';
import { refreshAllInvoicePayments } from '@/lib/quickbooks/payments';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

interface RunError {
    entity: string;
    id: string;
    error: string;
}

interface PendingRow {
    id: string;
}

export async function POST(req: Request) {
    // Optional shared-secret protection. If ADMIN_CRON_SECRET is set in the
    // environment, the request must include a matching X-Admin-Key header.
    // This lets Vercel Cron (configured with the header) hit the route while
    // blocking arbitrary internet callers from racking up QB API quota. If
    // the env var is unset (e.g., in development), we fall back to the
    // previous behavior — the CRM admin UI's button still works.
    const secret = process.env.ADMIN_CRON_SECRET;
    if (secret) {
        const provided = req.headers.get('x-admin-key');
        if (provided !== secret) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: NO_STORE });
        }
    }

    const conn = await getActiveConnection().catch(() => null);
    if (!conn) {
        // Cron-friendly: return 200 with skipped flag rather than 5xx so the
        // scheduled job doesn't show as failing when QB simply isn't connected.
        return NextResponse.json(
            { ok: true, skipped: true, reason: 'QuickBooks is not connected' },
            { status: 200, headers: NO_STORE },
        );
    }

    await initDB();

    const errors: RunError[] = [];
    let invoicesPushed = 0;
    let estimatesPushed = 0;
    let vendorsPushed = 0;
    let billsPushed = 0;
    let paymentsRefreshed = 0;

    // ─── Invoices ───────────────────────────────────────────────────────────
    const invoiceRows = (await sql`
        SELECT id FROM invoices
        WHERE status = 'Sent' AND qb_id IS NULL
    `) as unknown as PendingRow[];

    const invoiceResults = await Promise.allSettled(
        invoiceRows.map((r) => pushInvoice(r.id, 'auto-cron')),
    );
    invoiceResults.forEach((res, i) => {
        if (res.status === 'fulfilled') invoicesPushed++;
        else errors.push({ entity: 'invoice', id: invoiceRows[i].id, error: String(res.reason).slice(0, 200) });
    });

    // ─── Estimates ──────────────────────────────────────────────────────────
    const estimateRows = (await sql`
        SELECT id FROM estimates
        WHERE status IN ('Sent','Accepted') AND qb_id IS NULL
    `) as unknown as PendingRow[];

    const estimateResults = await Promise.allSettled(
        estimateRows.map((r) => pushEstimate(r.id, 'auto-cron')),
    );
    estimateResults.forEach((res, i) => {
        if (res.status === 'fulfilled') estimatesPushed++;
        else errors.push({ entity: 'estimate', id: estimateRows[i].id, error: String(res.reason).slice(0, 200) });
    });

    // ─── Vendors (subs referenced by bills, sub.qb_id IS NULL) ─────────────
    const vendorRows = (await sql`
        SELECT DISTINCT s.id FROM subcontractors s
        JOIN project_bills b ON b.subcontractor_id = s.id
        WHERE s.qb_id IS NULL
    `) as unknown as PendingRow[];

    const vendorResults = await Promise.allSettled(
        vendorRows.map((r) => pushVendor(r.id, 'auto-cron')),
    );
    vendorResults.forEach((res, i) => {
        if (res.status === 'fulfilled') vendorsPushed++;
        else errors.push({ entity: 'vendor', id: vendorRows[i].id, error: String(res.reason).slice(0, 200) });
    });

    // ─── Bills (sub already has qb_id, bill does not) ──────────────────────
    const billRows = (await sql`
        SELECT b.id FROM project_bills b
        JOIN subcontractors s ON s.id = b.subcontractor_id
        WHERE b.qb_id IS NULL AND s.qb_id IS NOT NULL
    `) as unknown as PendingRow[];

    const billResults = await Promise.allSettled(
        billRows.map((r) => pushBill(r.id, 'auto-cron')),
    );
    billResults.forEach((res, i) => {
        if (res.status === 'fulfilled') billsPushed++;
        else errors.push({ entity: 'bill', id: billRows[i].id, error: String(res.reason).slice(0, 200) });
    });

    // ─── Refresh paid status ───────────────────────────────────────────────
    try {
        const r = await refreshAllInvoicePayments('auto-cron');
        paymentsRefreshed = r.checked;
    } catch (e) {
        errors.push({ entity: 'payments', id: 'sweep', error: String(e).slice(0, 200) });
    }

    return NextResponse.json({
        ok: true,
        invoicesPushed,
        estimatesPushed,
        vendorsPushed,
        billsPushed,
        paymentsRefreshed,
        errors,
    }, { headers: NO_STORE });
}
