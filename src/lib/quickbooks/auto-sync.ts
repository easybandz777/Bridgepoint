/**
 * QuickBooks auto-sync dispatcher.
 *
 * Fire-and-forget helpers for triggering QB pushes from CRM mutation routes
 * without blocking the calling request. Each helper:
 *   1. Returns early (no-op) if QB is not connected.
 *   2. Calls the matching push function inside a try/catch.
 *   3. Records success or failure on `activity_log` so the office sees auto
 *      syncs and failures in the activity feed.
 *
 * Callers should use `void` so the route returns its 200 immediately and
 * the QB push happens in the background.
 *
 * This is the ONLY module that imports from multiple sync libs — it is the
 * single fan-out point for auto-sync triggers.
 */
import { logActivity } from '@/lib/db';
import { getActiveConnection } from './connection';
import { pushInvoice } from './invoices';
import { pushEstimate } from './estimates';
import { pushVendor } from './vendors';
import { pushBill } from './bills';
import { resolveOrCreateCustomerForProject } from './customers';
import { isQbDisabled } from '@/lib/feature-flags';

const QB_LOG_ENTITY = 'quickbooks_auto';

interface AutoSyncOpts {
    reason?: string;
    actor?: string;
}

async function isConnected(): Promise<boolean> {
    const conn = await getActiveConnection().catch(() => null);
    return conn != null;
}

/**
 * Combined gate: returns true if QB sync should be skipped (either because
 * the feature flag is off, or because there is no active connection).
 * Centralizing this means every `autoSync*IfEnabled` entry point becomes a
 * no-op the instant `QB_DISABLED=true` is flipped — no DB roundtrip required.
 */
async function shouldSkipAutoSync(): Promise<boolean> {
    if (isQbDisabled()) return true;
    if (!(await isConnected())) return true;
    return false;
}

export async function autoSyncInvoiceIfEnabled(
    invoiceId: string,
    opts: AutoSyncOpts = {},
): Promise<void> {
    if (await shouldSkipAutoSync()) return;
    const actor = opts.actor ?? 'auto';
    const reason = opts.reason ?? 'state change';
    try {
        const r = await pushInvoice(invoiceId, actor);
        await logActivity(
            QB_LOG_ENTITY,
            invoiceId,
            'invoice_pushed',
            `Auto-synced invoice to QuickBooks (${reason})`,
            actor,
            { qbId: r.qbId, total: r.total, reason },
        );
    } catch (e) {
        await logActivity(
            QB_LOG_ENTITY,
            invoiceId,
            'invoice_push_failed',
            `Auto-sync failed: ${String(e).slice(0, 200)}`,
            actor,
            { reason },
        );
    }
}

export async function autoSyncEstimateIfEnabled(
    estimateId: string,
    opts: AutoSyncOpts = {},
): Promise<void> {
    if (await shouldSkipAutoSync()) return;
    const actor = opts.actor ?? 'auto';
    const reason = opts.reason ?? 'state change';
    try {
        const r = await pushEstimate(estimateId, actor);
        await logActivity(
            QB_LOG_ENTITY,
            estimateId,
            'estimate_pushed',
            `Auto-synced estimate to QuickBooks (${reason})`,
            actor,
            { qbId: r.qbId, total: r.total, reason },
        );
    } catch (e) {
        await logActivity(
            QB_LOG_ENTITY,
            estimateId,
            'estimate_push_failed',
            `Auto-sync failed: ${String(e).slice(0, 200)}`,
            actor,
            { reason },
        );
    }
}

export async function autoSyncCustomerForProjectIfEnabled(
    projectId: string,
    opts: AutoSyncOpts = {},
): Promise<void> {
    if (await shouldSkipAutoSync()) return;
    const actor = opts.actor ?? 'auto';
    const reason = opts.reason ?? 'state change';
    try {
        const r = await resolveOrCreateCustomerForProject(projectId, actor);
        await logActivity(
            QB_LOG_ENTITY,
            projectId,
            'customer_pushed',
            `Auto-synced customer to QuickBooks (${reason})`,
            actor,
            { qbCustomerId: r.qbCustomerId, reason },
        );
    } catch (e) {
        await logActivity(
            QB_LOG_ENTITY,
            projectId,
            'customer_push_failed',
            `Auto-sync failed: ${String(e).slice(0, 200)}`,
            actor,
            { reason },
        );
    }
}

export async function autoSyncSubcontractorIfEnabled(
    subId: string,
    opts: AutoSyncOpts = {},
): Promise<void> {
    if (await shouldSkipAutoSync()) return;
    const actor = opts.actor ?? 'auto';
    const reason = opts.reason ?? 'state change';
    try {
        const r = await pushVendor(subId, actor);
        await logActivity(
            QB_LOG_ENTITY,
            subId,
            'vendor_pushed',
            `Auto-synced vendor to QuickBooks (${reason})`,
            actor,
            { qbId: r.qbId, reason },
        );
    } catch (e) {
        await logActivity(
            QB_LOG_ENTITY,
            subId,
            'vendor_push_failed',
            `Auto-sync failed: ${String(e).slice(0, 200)}`,
            actor,
            { reason },
        );
    }
}

export async function autoSyncBillIfEnabled(
    billId: string,
    opts: AutoSyncOpts = {},
): Promise<void> {
    if (await shouldSkipAutoSync()) return;
    const actor = opts.actor ?? 'auto';
    const reason = opts.reason ?? 'state change';
    try {
        const r = await pushBill(billId, actor);
        await logActivity(
            QB_LOG_ENTITY,
            billId,
            'bill_pushed',
            `Auto-synced bill to QuickBooks (${reason})`,
            actor,
            { qbId: r.qbId, total: r.total, reason },
        );
    } catch (e) {
        await logActivity(
            QB_LOG_ENTITY,
            billId,
            'bill_push_failed',
            `Auto-sync failed: ${String(e).slice(0, 200)}`,
            actor,
            { reason },
        );
    }
}
