/**
 * QuickBooks Online Payment polling.
 *
 * Pulls invoice payment state back from QB by re-reading each invoice's
 * Balance and TotalAmt. The CRM derives status from balance vs. total:
 *   Balance == 0 && Total > 0  → Paid
 *   AmountPaid > 0             → Partial
 *   else                       → Outstanding
 *
 * Used by:
 *   - per-invoice refresh route (manual "I just got paid" check)
 *   - sweep-all route (cron-style safety net for the webhook path)
 *   - recent-payments listing (passthrough for the QB Payment ledger)
 */

import sql, { initDB, logActivity } from '@/lib/db';
import { qbGet, qbQuery } from './client';
import type { QbInvoice, QbPayment } from './types';
import { moneyRound, ymd } from './mappers';

export interface PaymentRefresh {
    invoiceId: string;
    qbId: string;
    statusBefore: string;
    statusAfter: string;
    amountPaid: number;
    amountDue: number;
    paidDate: string | null;
    changed: boolean;
}

interface InvoiceRow {
    id: string;
    qb_id: string | null;
    status: string;
    amount_paid: number | string | null;
    amount_due: number | string | null;
    paid_date: string | null;
    invoice_number: string | null;
    qb_sync_token: string | null;
}

export async function refreshInvoicePaymentStatus(
    invoiceId: string,
    actor: string = 'admin',
): Promise<PaymentRefresh> {
    await initDB();

    const rows = (await sql`
        SELECT id, qb_id, status, amount_paid, amount_due, paid_date, invoice_number, qb_sync_token
        FROM invoices
        WHERE id = ${invoiceId}
        LIMIT 1
    `) as unknown as InvoiceRow[];

    if (rows.length === 0) throw new Error(`Invoice ${invoiceId} not found`);
    const row = rows[0];

    if (!row.qb_id) throw new Error('Invoice not yet synced to QB');

    const r = await qbGet<{ Invoice: QbInvoice }>(`/invoice/${row.qb_id}`, {
        logAs: {
            entityType: 'invoice',
            entityId: invoiceId,
            qbEntityId: row.qb_id,
            action: 'refresh_payment',
            direction: 'pull',
            actor,
        },
    });

    const inv = r.Invoice;
    const total = moneyRound(inv.TotalAmt ?? 0);
    const balance = moneyRound(inv.Balance ?? 0);
    const amountPaid = moneyRound(total - balance);

    const newStatus =
        balance === 0 && total > 0 ? 'Paid'
        : amountPaid > 0 ? 'Partial'
        : 'Outstanding';

    const today = ymd(new Date()) ?? new Date().toISOString().slice(0, 10);
    const newPaidDate = newStatus === 'Paid' ? (row.paid_date ?? today) : null;

    const syncToken = inv.SyncToken ?? row.qb_sync_token;

    const statusBefore = row.status;
    const prevPaid = moneyRound(row.amount_paid ?? 0);
    const prevDue = moneyRound(row.amount_due ?? 0);
    const prevPaidDate = row.paid_date ?? null;

    const changed =
        statusBefore !== newStatus ||
        prevPaid !== amountPaid ||
        prevDue !== balance ||
        prevPaidDate !== newPaidDate;

    await sql`
        UPDATE invoices
        SET status = ${newStatus},
            amount_paid = ${amountPaid},
            amount_due = ${balance},
            paid_date = ${newPaidDate},
            qb_sync_token = ${syncToken},
            qb_synced_at = NOW(),
            updated_at = NOW()
        WHERE id = ${invoiceId}
    `;

    if (changed) {
        await logActivity(
            'quickbooks_invoice',
            invoiceId,
            'payment_refreshed',
            `Invoice ${row.invoice_number ?? invoiceId} payment refreshed: ${statusBefore} → ${newStatus}`,
            actor,
            {
                qbId: row.qb_id,
                statusBefore,
                statusAfter: newStatus,
                amountPaid,
                amountDue: balance,
                paidDate: newPaidDate,
            },
        );
    }

    return {
        invoiceId,
        qbId: row.qb_id,
        statusBefore,
        statusAfter: newStatus,
        amountPaid,
        amountDue: balance,
        paidDate: newPaidDate,
        changed,
    };
}

export async function refreshAllInvoicePayments(
    actor: string = 'admin',
): Promise<{ checked: number; changed: number; details: PaymentRefresh[] }> {
    await initDB();

    const rows = (await sql`
        SELECT id FROM invoices
        WHERE qb_id IS NOT NULL
          AND status NOT IN ('Paid', 'Cancelled', 'Voided')
    `) as unknown as { id: string }[];

    const details: PaymentRefresh[] = [];
    let changed = 0;

    for (const r of rows) {
        try {
            const result = await refreshInvoicePaymentStatus(r.id, actor);
            details.push(result);
            if (result.changed) changed++;
        } catch (e) {
            await logActivity(
                'quickbooks_invoice',
                r.id,
                'payment_refresh_failed',
                `Sweep refresh failed: ${String(e)}`,
                actor,
                { error: String(e) },
            );
        }
    }

    return { checked: rows.length, changed, details };
}

export async function listRecentPayments(
    limit?: number,
    customerId?: string,
): Promise<QbPayment[]> {
    const where = customerId ? ` where CustomerRef = '${customerId.replace(/'/g, "''")}'` : '';
    const max = Math.min(limit ?? 20, 100);
    const r = await qbQuery<{ QueryResponse: { Payment?: QbPayment[] } }>(
        `select * from Payment${where} orderby TxnDate desc maxresults ${max}`,
        { entityType: 'qb_payment', action: 'list', direction: 'pull' },
    );
    return r.QueryResponse?.Payment ?? [];
}
