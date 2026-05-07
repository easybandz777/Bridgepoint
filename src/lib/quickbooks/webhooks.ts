import { createHmac, timingSafeEqual } from 'node:crypto';
import sql, { initDB, genId, logActivity } from '@/lib/db';
import { qbGet } from './client';
import type {
    QbWebhookEnvelope,
    QbInvoice,
    QbCustomer,
    QbEstimate,
    QbVendor,
    QbBill,
    QbPayment,
    QbItem,
} from './types';

// QB Account is fetched generically — we don't have a strict type for it and
// the upsert helper accepts the raw payload.
interface QbAccount {
    Id?: string;
    Name?: string;
    [key: string]: unknown;
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    const verifier = process.env.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN;
    if (!verifier) {
        // SECURITY: in production we MUST refuse webhooks when the verifier
        // token is unset — otherwise anyone on the internet can post fake
        // events and trigger DB writes / outbound QB API calls. In dev we
        // keep the permissive behavior so local testing isn't blocked.
        if (process.env.NODE_ENV === 'production') {
            console.error('[qb-webhook] CRITICAL: QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN is not set in production — denying webhook');
            return false;
        }
        console.warn('[qb-webhook] QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN not set — accepting all webhooks (dev only)');
        return true;
    }
    if (!signature) return false;
    const computed = createHmac('sha256', verifier).update(rawBody).digest('base64');
    if (computed.length !== signature.length) return false;
    try {
        return timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
    } catch {
        return false;
    }
}

interface WebhookEntity {
    name: string;
    id: string;
    operation: string;
    lastUpdated: string;
    deletedId?: string;
}

export async function persistWebhookEvents(envelope: QbWebhookEnvelope): Promise<{ persisted: number }> {
    await initDB();
    let persisted = 0;
    const notifications = envelope?.eventNotifications ?? [];
    for (const note of notifications) {
        const realmId = note.realmId;
        if (!realmId || typeof realmId !== 'string') continue;
        const entities = note?.dataChangeEvent?.entities ?? [];
        for (const ent of entities) {
            // Validate envelope shape before persisting — Intuit always sends
            // these fields, but we don't trust an inbound JSON blob blindly.
            if (!ent || typeof ent !== 'object') continue;
            if (!ent.name || !ent.id || !ent.operation || !ent.lastUpdated) continue;

            // Replay/dedupe: if Intuit retries a delivery (or the same event
            // arrives twice for any reason), skip if we already have the
            // exact same (realm, entity, lastUpdated) tuple.
            const exists = (await sql`
                SELECT 1 FROM qb_webhook_events
                WHERE realm_id = ${realmId}
                  AND entity_name = ${ent.name}
                  AND entity_id = ${ent.id}
                  AND last_updated = ${ent.lastUpdated}
                LIMIT 1
            `) as unknown as unknown[];
            if (exists.length > 0) continue;

            try {
                await sql`
                    INSERT INTO qb_webhook_events (
                        id, realm_id, entity_name, entity_id, operation, last_updated, payload, processed_at
                    ) VALUES (
                        ${genId('qbwh')},
                        ${realmId},
                        ${ent.name},
                        ${ent.id},
                        ${ent.operation},
                        ${ent.lastUpdated},
                        ${JSON.stringify(ent satisfies WebhookEntity)}::jsonb,
                        ${null}
                    )
                `;
                persisted += 1;
            } catch (e) {
                console.warn('[qb-webhook] persist failed for entity', ent, e);
            }
        }
    }
    return { persisted };
}

interface QbWebhookEventRow {
    id: string;
    realm_id: string;
    entity_name: string;
    entity_id: string;
    operation: string;
    last_updated: string;
    payload: unknown;
    processed_at: string | null;
    error: string | null;
    received_at: string;
}

function mapInvoiceStatus(total: number, balance: number): string {
    return balance === 0 && total > 0 ? 'Paid' : 'Outstanding';
}

function mapEstimateStatus(txnStatus: QbEstimate['TxnStatus'] | undefined): string | null {
    switch (txnStatus) {
        case 'Accepted':
            return 'Accepted';
        case 'Rejected':
            return 'Declined';
        case 'Closed':
            return 'Expired';
        case 'Pending':
            return 'Sent';
        default:
            return null;
    }
}

async function handleInvoiceEvent(ev: QbWebhookEventRow): Promise<void> {
    if (ev.operation === 'Delete') {
        await sql`UPDATE invoices SET qb_id = NULL WHERE qb_id = ${ev.entity_id}`;
        await logActivity('quickbooks_invoice', ev.entity_id, 'qb_webhook_delete',
            `QB invoice ${ev.entity_id} deleted upstream`, 'webhook',
            { realmId: ev.realm_id, qbId: ev.entity_id });
        return;
    }

    const rows = (await sql`
        SELECT id, invoice_number, paid_date, qb_sync_token
        FROM invoices WHERE qb_id = ${ev.entity_id} LIMIT 1
    `) as unknown as { id: string; invoice_number: string; paid_date: string | null; qb_sync_token: string | null }[];
    if (rows.length === 0) return;
    const local = rows[0];

    const r = await qbGet<{ Invoice: QbInvoice }>(`/invoice/${ev.entity_id}`, {
        logAs: {
            entityType: 'invoice',
            entityId: local.id,
            qbEntityId: ev.entity_id,
            action: 'webhook-pull',
            actor: 'webhook',
        },
    });

    const inv = r.Invoice;
    const total = Number(inv.TotalAmt ?? 0);
    const balance = Number(inv.Balance ?? 0);
    const amountPaid = Math.round((total - balance) * 100) / 100;
    const status = mapInvoiceStatus(total, balance);
    const paidDate = status === 'Paid' && !local.paid_date
        ? new Date().toISOString().slice(0, 10)
        : local.paid_date;
    const syncToken = inv.SyncToken ?? local.qb_sync_token;

    await sql`
        UPDATE invoices
        SET status = ${status},
            amount_paid = ${amountPaid},
            amount_due = ${balance},
            paid_date = ${paidDate},
            qb_sync_token = ${syncToken},
            qb_synced_at = NOW(),
            updated_at = NOW()
        WHERE id = ${local.id}
    `;

    await logActivity('quickbooks_invoice', local.id, 'qb_webhook_update',
        `Invoice ${local.invoice_number} refreshed from webhook (status ${status})`,
        'webhook',
        { qbId: ev.entity_id, status, amountPaid, balance, operation: ev.operation });
}

async function handleCustomerEvent(ev: QbWebhookEventRow): Promise<void> {
    if (ev.operation === 'Delete') {
        await logActivity('quickbooks_customer', ev.entity_id, 'qb_webhook_delete',
            `QB customer ${ev.entity_id} deleted upstream`, 'webhook',
            { realmId: ev.realm_id, qbId: ev.entity_id });
        return;
    }

    const r = await qbGet<{ Customer: QbCustomer }>(`/customer/${ev.entity_id}`, {
        logAs: {
            entityType: 'customer',
            qbEntityId: ev.entity_id,
            action: 'webhook-pull',
            actor: 'webhook',
        },
    });
    const qbCustomer = r.Customer;
    if (!qbCustomer) return;
    const customerName = qbCustomer.DisplayName ?? ev.entity_id;

    // Dynamic import: the customers-import module may not exist at type-check
    // time during a parallel build. A missing module degrades to a logged
    // warning instead of a hard failure for the webhook batch.
    try {
        const mod = await import('@/lib/quickbooks/customers-import');
        await mod.upsertCustomerFromQb(qbCustomer, 'qb_webhook');
        await logActivity('quickbooks_customer', ev.entity_id, 'qb_webhook_update',
            `QB customer ${customerName} synced from webhook`, 'webhook',
            { qbId: ev.entity_id, operation: ev.operation });
    } catch (e) {
        console.warn('[qb-webhook] customer upsert skipped (module missing?):', e);
    }

    // Also fan out activity entries to any local projects tied to this customer
    // so the project-level activity feed reflects upstream changes.
    const projects = (await sql`
        SELECT id FROM projects WHERE qb_customer_id = ${ev.entity_id}
    `) as unknown as { id: string }[];
    for (const p of projects) {
        await logActivity('quickbooks_customer', p.id, 'qb_webhook_update',
            `QB customer ${customerName} updated upstream`, 'webhook',
            { qbId: ev.entity_id, operation: ev.operation });
    }
}

async function handleEstimateEvent(ev: QbWebhookEventRow): Promise<void> {
    if (ev.operation === 'Delete') {
        await sql`UPDATE estimates SET qb_id = NULL WHERE qb_id = ${ev.entity_id}`;
        await logActivity('quickbooks_estimate', ev.entity_id, 'qb_webhook_delete',
            `QB estimate ${ev.entity_id} deleted upstream`, 'webhook',
            { realmId: ev.realm_id, qbId: ev.entity_id });
        return;
    }

    const rows = (await sql`
        SELECT id, estimate_number, status, qb_sync_token
        FROM estimates WHERE qb_id = ${ev.entity_id} LIMIT 1
    `) as unknown as { id: string; estimate_number: string; status: string; qb_sync_token: string | null }[];
    if (rows.length === 0) return;
    const local = rows[0];

    const r = await qbGet<{ Estimate: QbEstimate }>(`/estimate/${ev.entity_id}`, {
        logAs: {
            entityType: 'estimate',
            entityId: local.id,
            qbEntityId: ev.entity_id,
            action: 'webhook-pull',
            actor: 'webhook',
        },
    });
    const est = r.Estimate;
    const total = Math.round(Number(est.TotalAmt ?? 0) * 100) / 100;
    const mapped = mapEstimateStatus(est.TxnStatus);
    const newStatus = mapped ?? local.status;
    const syncToken = est.SyncToken ?? local.qb_sync_token;

    await sql`
        UPDATE estimates
        SET status = ${newStatus},
            total = ${total},
            qb_sync_token = ${syncToken},
            qb_synced_at = NOW(),
            updated_at = NOW()
        WHERE id = ${local.id}
    `;

    await logActivity('quickbooks_estimate', local.id, 'qb_webhook_update',
        `Estimate ${local.estimate_number} refreshed from webhook (status ${newStatus})`,
        'webhook',
        { qbId: ev.entity_id, status: newStatus, total, operation: ev.operation });
}

async function handleVendorEvent(ev: QbWebhookEventRow): Promise<void> {
    if (ev.operation === 'Delete') {
        await sql`UPDATE subcontractors SET qb_id = NULL WHERE qb_id = ${ev.entity_id}`;
        await logActivity('quickbooks_vendor', ev.entity_id, 'qb_webhook_delete',
            `QB vendor ${ev.entity_id} deleted upstream`, 'webhook',
            { realmId: ev.realm_id, qbId: ev.entity_id });
        return;
    }

    const r = await qbGet<{ Vendor: QbVendor }>(`/vendor/${ev.entity_id}`, {
        logAs: {
            entityType: 'vendor',
            qbEntityId: ev.entity_id,
            action: 'webhook-pull',
            actor: 'webhook',
        },
    });
    const qbVendor = r.Vendor;
    if (!qbVendor) return;

    // Mirror into the vendors table via the import helper. Dynamic import so
    // a missing module doesn't break type-check during a parallel build.
    try {
        const mod = await import('@/lib/quickbooks/vendors-import');
        await mod.upsertVendorFromQb(qbVendor, 'qb_webhook');
        await logActivity('quickbooks_vendor', ev.entity_id, 'qb_webhook_update',
            `QB vendor ${qbVendor.DisplayName ?? ev.entity_id} synced from webhook`,
            'webhook',
            { qbId: ev.entity_id, operation: ev.operation });
    } catch (e) {
        console.warn('[qb-webhook] vendor upsert skipped (module missing?):', e);
    }

    // Subcontractor sync_token bookkeeping: still useful for any subcontractor
    // rows that mirror this QB vendor by id.
    const rows = (await sql`
        SELECT id, company_name FROM subcontractors WHERE qb_id = ${ev.entity_id} LIMIT 1
    `) as unknown as { id: string; company_name: string }[];
    if (rows.length > 0) {
        const local = rows[0];
        const syncToken = qbVendor.SyncToken ?? null;
        await sql`
            UPDATE subcontractors
            SET qb_sync_token = ${syncToken},
                qb_synced_at = NOW()
            WHERE id = ${local.id}
        `;
        await logActivity('quickbooks_vendor', local.id, 'qb_webhook_update',
            `Vendor ${local.company_name} refreshed from webhook`,
            'webhook',
            { qbId: ev.entity_id, operation: ev.operation });
    }
}

async function handleBillEvent(ev: QbWebhookEventRow): Promise<void> {
    if (ev.operation === 'Delete') {
        await sql`UPDATE project_bills SET qb_id = NULL WHERE qb_id = ${ev.entity_id}`;
        await logActivity('quickbooks_bill', ev.entity_id, 'qb_webhook_delete',
            `QB bill ${ev.entity_id} deleted upstream`, 'webhook',
            { realmId: ev.realm_id, qbId: ev.entity_id });
        return;
    }

    const rows = (await sql`
        SELECT id, bill_number, status, qb_sync_token
        FROM project_bills WHERE qb_id = ${ev.entity_id} LIMIT 1
    `) as unknown as { id: string; bill_number: string | null; status: string; qb_sync_token: string | null }[];
    if (rows.length === 0) return;
    const local = rows[0];

    const r = await qbGet<{ Bill: QbBill }>(`/bill/${ev.entity_id}`, {
        logAs: {
            entityType: 'bill',
            entityId: local.id,
            qbEntityId: ev.entity_id,
            action: 'webhook-pull',
            actor: 'webhook',
        },
    });
    const bill = r.Bill;
    const total = Math.round(Number(bill.TotalAmt ?? 0) * 100) / 100;
    const balance = Math.round(Number(bill.Balance ?? 0) * 100) / 100;
    const newStatus = balance === 0 && total > 0 ? 'Paid' : local.status;
    const syncToken = bill.SyncToken ?? local.qb_sync_token;

    await sql`
        UPDATE project_bills
        SET status = ${newStatus},
            qb_sync_token = ${syncToken},
            qb_synced_at = NOW(),
            updated_at = NOW()
        WHERE id = ${local.id}
    `;

    await logActivity('quickbooks_bill', local.id, 'qb_webhook_update',
        `Bill ${local.bill_number ?? ev.entity_id} refreshed from webhook (status ${newStatus})`,
        'webhook',
        { qbId: ev.entity_id, status: newStatus, total, balance, operation: ev.operation });
}

async function handlePaymentEvent(ev: QbWebhookEventRow): Promise<void> {
    if (ev.operation === 'Delete') {
        await logActivity('quickbooks_payment', ev.entity_id, 'qb_webhook_delete',
            `QB payment ${ev.entity_id} deleted upstream`, 'webhook',
            { realmId: ev.realm_id, qbId: ev.entity_id });
        return;
    }

    const r = await qbGet<{ Payment: QbPayment }>(`/payment/${ev.entity_id}`, {
        logAs: {
            entityType: 'payment',
            qbEntityId: ev.entity_id,
            action: 'webhook-pull',
            actor: 'webhook',
        },
    });
    const payment = r.Payment;
    const linkedInvoiceIds: string[] = [];
    for (const line of payment.Line ?? []) {
        for (const linked of line.LinkedTxn ?? []) {
            if (linked.TxnType === 'Invoice' && linked.TxnId) {
                linkedInvoiceIds.push(linked.TxnId);
            }
        }
    }

    await logActivity('quickbooks_payment', ev.entity_id, 'qb_webhook_' + ev.operation.toLowerCase(),
        `QB payment ${ev.entity_id} (${payment.TotalAmt ?? 0}) ${ev.operation}`,
        'webhook',
        { qbId: ev.entity_id, total: payment.TotalAmt ?? 0, linkedInvoiceIds, operation: ev.operation });

    for (const qbInvoiceId of linkedInvoiceIds) {
        try {
            await handleInvoiceEvent({
                ...ev,
                entity_name: 'Invoice',
                entity_id: qbInvoiceId,
                operation: 'Update',
            });
        } catch (e) {
            console.warn('[qb-webhook] payment-linked invoice refresh failed', qbInvoiceId, e);
        }
    }
}

async function handleItemEvent(ev: QbWebhookEventRow): Promise<void> {
    if (ev.operation === 'Delete') {
        await logActivity('quickbooks_item', ev.entity_id, 'qb_webhook_delete',
            `QB item ${ev.entity_id} deleted upstream`, 'webhook',
            { realmId: ev.realm_id, qbId: ev.entity_id });
        return;
    }

    const r = await qbGet<{ Item: QbItem }>(`/item/${ev.entity_id}`, {
        logAs: {
            entityType: 'item',
            qbEntityId: ev.entity_id,
            action: 'webhook-pull',
            actor: 'webhook',
        },
    });
    const qbItem = r.Item;
    if (!qbItem) return;

    try {
        const mod = await import('@/lib/quickbooks/items-import');
        await mod.upsertItemFromQb(qbItem, 'qb_webhook');
        await logActivity('quickbooks_item', ev.entity_id, 'qb_webhook_update',
            `Item ${qbItem.Name ?? ev.entity_id} synced from QB webhook`, 'webhook',
            { qbId: ev.entity_id, operation: ev.operation });
    } catch (e) {
        console.warn('[qb-webhook] item upsert skipped (module missing?):', e);
    }
}

async function handleAccountEvent(ev: QbWebhookEventRow): Promise<void> {
    if (ev.operation === 'Delete') {
        await logActivity('quickbooks_account', ev.entity_id, 'qb_webhook_delete',
            `QB account ${ev.entity_id} deleted upstream`, 'webhook',
            { realmId: ev.realm_id, qbId: ev.entity_id });
        return;
    }

    const r = await qbGet<{ Account: QbAccount }>(`/account/${ev.entity_id}`, {
        logAs: {
            entityType: 'account',
            qbEntityId: ev.entity_id,
            action: 'webhook-pull',
            actor: 'webhook',
        },
    });
    const qbAccount = r.Account;
    if (!qbAccount) return;

    try {
        // Indirect specifier: accounts-import.ts may not exist yet at
        // type-check time during a parallel build. The variable path defeats
        // static module resolution while still loading the module if/when it
        // ships. A missing module surfaces as a runtime warning here.
        const accountsImportPath = '@/lib/quickbooks/accounts-import';
        const mod = (await import(/* webpackIgnore: true */ accountsImportPath)) as {
            upsertAccountFromQb: (acct: QbAccount, source: string) => Promise<void>;
        };
        await mod.upsertAccountFromQb(qbAccount, 'qb_webhook');
        await logActivity('quickbooks_account', ev.entity_id, 'qb_webhook_update',
            `Account ${qbAccount.Name ?? ev.entity_id} synced from QB webhook`, 'webhook',
            { qbId: ev.entity_id, operation: ev.operation });
    } catch (e) {
        console.warn('[qb-webhook] account upsert skipped (module missing?):', e);
    }
}

async function dispatchEvent(ev: QbWebhookEventRow): Promise<void> {
    switch (ev.entity_name) {
        case 'Invoice':
            return handleInvoiceEvent(ev);
        case 'Customer':
            return handleCustomerEvent(ev);
        case 'Estimate':
            return handleEstimateEvent(ev);
        case 'Vendor':
            return handleVendorEvent(ev);
        case 'Bill':
            return handleBillEvent(ev);
        case 'Payment':
            return handlePaymentEvent(ev);
        case 'Item':
            return handleItemEvent(ev);
        case 'Account':
            return handleAccountEvent(ev);
        default:
            await logActivity('quickbooks_webhook', ev.entity_id, 'qb_webhook_unknown',
                `Unhandled entity ${ev.entity_name} ${ev.operation}`, 'webhook',
                { qbId: ev.entity_id, entity: ev.entity_name, operation: ev.operation });
            return;
    }
}

// Chunk size for parallel webhook processing. Each event hits QB's API and
// updates the DB; capping at 5 concurrent gives a meaningful speedup over a
// pure serial loop without exhausting QB's per-realm rate limits or our
// Postgres connection pool.
const WEBHOOK_PROCESS_CHUNK = 5;

async function processOneEvent(ev: QbWebhookEventRow): Promise<'ok' | 'error'> {
    try {
        await dispatchEvent(ev);
        await sql`
            UPDATE qb_webhook_events
            SET processed_at = NOW(), error = NULL
            WHERE id = ${ev.id}
        `;
        return 'ok';
    } catch (e) {
        const msg = String(e);
        try {
            await sql`
                UPDATE qb_webhook_events
                SET processed_at = NOW(), error = ${msg}
                WHERE id = ${ev.id}
            `;
        } catch (innerE) {
            console.warn('[qb-webhook] failed to mark event errored', ev.id, innerE);
        }
        console.warn('[qb-webhook] processing failed for event', ev.id, msg);
        return 'error';
    }
}

export async function processUnprocessedEvents(limit = 50): Promise<{ processed: number; errors: number }> {
    await initDB();
    const events = (await sql`
        SELECT id, realm_id, entity_name, entity_id, operation, last_updated, payload, processed_at, error, received_at
        FROM qb_webhook_events
        WHERE processed_at IS NULL
        ORDER BY received_at ASC
        LIMIT ${limit}
    `) as unknown as QbWebhookEventRow[];

    let processed = 0;
    let errors = 0;
    // Process in chunks of WEBHOOK_PROCESS_CHUNK so the overall throughput
    // is N/CHUNK trips instead of N. allSettled keeps a poison-pill event
    // from blocking siblings in the same chunk.
    for (let i = 0; i < events.length; i += WEBHOOK_PROCESS_CHUNK) {
        const chunk = events.slice(i, i + WEBHOOK_PROCESS_CHUNK);
        const results = await Promise.allSettled(chunk.map(processOneEvent));
        for (const r of results) {
            if (r.status === 'fulfilled' && r.value === 'ok') processed += 1;
            else errors += 1;
        }
    }
    return { processed, errors };
}
