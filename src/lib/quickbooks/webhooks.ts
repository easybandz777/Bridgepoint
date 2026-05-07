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
} from './types';

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    const verifier = process.env.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN;
    if (!verifier) {
        console.warn('[qb-webhook] QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN not set — accepting all webhooks');
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
        const entities = note?.dataChangeEvent?.entities ?? [];
        for (const ent of entities) {
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

    const projects = (await sql`
        SELECT id FROM projects WHERE qb_customer_id = ${ev.entity_id}
    `) as unknown as { id: string }[];
    if (projects.length === 0) return;

    const r = await qbGet<{ Customer: QbCustomer }>(`/customer/${ev.entity_id}`, {
        logAs: {
            entityType: 'customer',
            qbEntityId: ev.entity_id,
            action: 'webhook-pull',
            actor: 'webhook',
        },
    });
    const customerName = r.Customer?.DisplayName ?? ev.entity_id;

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

    const rows = (await sql`
        SELECT id, company_name FROM subcontractors WHERE qb_id = ${ev.entity_id} LIMIT 1
    `) as unknown as { id: string; company_name: string }[];
    if (rows.length === 0) return;
    const local = rows[0];

    const r = await qbGet<{ Vendor: QbVendor }>(`/vendor/${ev.entity_id}`, {
        logAs: {
            entityType: 'vendor',
            entityId: local.id,
            qbEntityId: ev.entity_id,
            action: 'webhook-pull',
            actor: 'webhook',
        },
    });
    const syncToken = r.Vendor?.SyncToken ?? null;

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
        default:
            await logActivity('quickbooks_webhook', ev.entity_id, 'qb_webhook_unknown',
                `Unhandled entity ${ev.entity_name} ${ev.operation}`, 'webhook',
                { qbId: ev.entity_id, entity: ev.entity_name, operation: ev.operation });
            return;
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
    for (const ev of events) {
        try {
            await dispatchEvent(ev);
            await sql`
                UPDATE qb_webhook_events
                SET processed_at = NOW(), error = NULL
                WHERE id = ${ev.id}
            `;
            processed += 1;
        } catch (e) {
            errors += 1;
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
        }
    }
    return { processed, errors };
}
