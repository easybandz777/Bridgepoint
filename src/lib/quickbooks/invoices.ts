/**
 * QuickBooks Online Invoice sync.
 *
 * Push CRM invoices into QB and pull payment status back. We don't create
 * Customers from this module — the Customer must already exist in QB
 * (via a project / customer sync). On a missing customer we throw a
 * specific error so the caller can return HTTP 412 and tell the user to
 * sync the project first.
 *
 * ItemRef limitation: QB requires a non-null Item id on every
 * SalesItemLineDetail. Sandbox companies ship with a default "Services"
 * item at Id=1 — we use that for all v1 line items. If a workspace has
 * deleted that item, the push will fail with a clear QB error and the
 * admin can wire up a real Items mapping later.
 */

import sql, { initDB, logActivity } from '@/lib/db';
import { qbCreate, qbGet, qbQuery, qbUpdate } from './client';
import type { QbInvoice, QbInvoiceLine } from './types';
import { clean, emailField, moneyRound, ymd } from './mappers';
import { getDefaultItemId } from './refs';

const DEFAULT_ITEM_NAME = 'Services';

interface DbInvoiceLineItem {
    description?: string | null;
    quantity?: number | null;
    unit?: string | null;
    unitPrice?: number | null;
    unit_price?: number | null;
    total?: number | null;
    amount?: number | null;
}

interface DbClient {
    name?: string | null;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
}

export interface DbInvoiceRow {
    id: string;
    invoice_number: string;
    status: string;
    issued_date: string;
    due_date: string;
    paid_date: string | null;
    client: DbClient | null;
    project: Record<string, unknown> | null;
    line_items: DbInvoiceLineItem[] | null;
    subtotal: number | string;
    tax_rate: number | string;
    tax_amount: number | string;
    total: number | string;
    amount_paid: number | string;
    amount_due: number | string;
    payment_instructions: Record<string, unknown> | null;
    notes: string | null;
    project_id: string | null;
    qb_id: string | null;
    qb_sync_token: string | null;
    qb_synced_at: string | null;
    qb_customer_id: string | null;
}

async function loadInvoice(invoiceId: string): Promise<DbInvoiceRow> {
    await initDB();
    const rows = (await sql`
        SELECT * FROM invoices WHERE id = ${invoiceId} LIMIT 1
    `) as unknown as DbInvoiceRow[];
    if (rows.length === 0) throw new Error(`Invoice ${invoiceId} not found`);
    return rows[0];
}

function escapeQbString(s: string): string {
    return s.replace(/'/g, "\\'");
}

interface QbCustomerLookup {
    Id: string;
    DisplayName?: string;
}

async function resolveCustomerRef(invoice: DbInvoiceRow): Promise<string> {
    if (invoice.qb_customer_id) return invoice.qb_customer_id;

    const client = invoice.client ?? {};
    const email = clean(client.email);
    const name = clean(client.name) || clean(client.company);

    let customer: QbCustomerLookup | undefined;

    if (email) {
        const q = `select Id, DisplayName from Customer where PrimaryEmailAddr = '${escapeQbString(email)}'`;
        const r = await qbQuery<{ QueryResponse: { Customer?: QbCustomerLookup[] } }>(q, {
            entityType: 'invoice',
            entityId: invoice.id,
            action: 'lookup-customer-by-email',
        });
        customer = r?.QueryResponse?.Customer?.[0];
    }

    if (!customer && name) {
        const q = `select Id, DisplayName from Customer where DisplayName = '${escapeQbString(name)}'`;
        const r = await qbQuery<{ QueryResponse: { Customer?: QbCustomerLookup[] } }>(q, {
            entityType: 'invoice',
            entityId: invoice.id,
            action: 'lookup-customer-by-name',
        });
        customer = r?.QueryResponse?.Customer?.[0];
    }

    if (!customer?.Id) {
        throw new Error('Customer not yet synced — sync project to QB first');
    }

    await sql`UPDATE invoices SET qb_customer_id = ${customer.Id} WHERE id = ${invoice.id}`;
    return customer.Id;
}

async function buildLines(invoice: DbInvoiceRow): Promise<QbInvoiceLine[]> {
    const items = invoice.line_items ?? [];
    const itemId = await getDefaultItemId();
    return items.map((li) => {
        const qty = li.quantity ?? 1;
        const unitPrice = moneyRound(li.unit_price ?? li.unitPrice ?? li.amount ?? li.total ?? 0);
        const amount = moneyRound(li.amount ?? li.total ?? qty * unitPrice);
        const line: QbInvoiceLine = {
            DetailType: 'SalesItemLineDetail',
            Amount: amount,
            Description: clean(li.description ?? ''),
            SalesItemLineDetail: {
                ItemRef: { value: itemId, name: DEFAULT_ITEM_NAME },
                Qty: qty,
                UnitPrice: unitPrice,
            },
        };
        return line;
    });
}

export async function mapInvoiceToQb(invoiceRow: DbInvoiceRow, customerRef: string): Promise<QbInvoice> {
    const client = invoiceRow.client ?? {};
    const notes = clean(invoiceRow.notes ?? '');
    const body: QbInvoice = {
        Id: invoiceRow.qb_id ?? undefined,
        SyncToken: invoiceRow.qb_sync_token ?? undefined,
        DocNumber: invoiceRow.invoice_number,
        TxnDate: ymd(invoiceRow.issued_date),
        DueDate: ymd(invoiceRow.due_date),
        CustomerRef: { value: customerRef },
        BillEmail: emailField(client.email),
        PrivateNote: notes || undefined,
        CustomerMemo: notes ? { value: notes } : undefined,
        Line: await buildLines(invoiceRow),
    };
    if (Number(invoiceRow.tax_amount ?? 0) > 0) {
        body.TxnTaxDetail = { TotalTax: moneyRound(Number(invoiceRow.tax_amount)) };
    }
    return body;
}

export async function pushInvoice(invoiceId: string, actor: string = 'admin'): Promise<{ qbId: string; total: number }> {
    const invoice = await loadInvoice(invoiceId);
    const customerRef = await resolveCustomerRef(invoice);
    const body = await mapInvoiceToQb(invoice, customerRef);

    const isUpdate = Boolean(invoice.qb_id);
    const action = isUpdate ? 'update' : 'create';

    const envelope = isUpdate
        ? await qbUpdate<{ Invoice: QbInvoice }>('invoice', body, {
            entityType: 'invoice',
            entityId: invoice.id,
            qbEntityId: invoice.qb_id,
            action,
            actor,
        })
        : await qbCreate<{ Invoice: QbInvoice }>('invoice', body, {
            entityType: 'invoice',
            entityId: invoice.id,
            action,
            actor,
        });

    const inv = envelope.Invoice;
    const qbId = inv.Id;
    if (!qbId) throw new Error('QB did not return an Invoice Id');
    const syncToken = inv.SyncToken ?? null;
    const total = moneyRound(inv.TotalAmt ?? 0);

    await sql`
        UPDATE invoices
        SET qb_id = ${qbId},
            qb_sync_token = ${syncToken},
            qb_synced_at = NOW(),
            updated_at = NOW()
        WHERE id = ${invoice.id}
    `;

    await logActivity(
        'quickbooks_invoice',
        invoice.id,
        action === 'create' ? 'qb_created' : 'qb_updated',
        `Invoice ${invoice.invoice_number} pushed to QuickBooks (Id ${qbId})`,
        actor,
        { qbId, total },
    );

    return { qbId, total };
}

export async function pullInvoiceStatus(
    invoiceId: string,
    actor: string = 'admin',
): Promise<{ status: string; amountPaid: number; balance: number }> {
    const invoice = await loadInvoice(invoiceId);
    if (!invoice.qb_id) throw new Error('Invoice has no qb_id — push it first');

    const r = await qbGet<{ Invoice: QbInvoice }>(`/invoice/${invoice.qb_id}`, {
        logAs: {
            entityType: 'invoice',
            entityId: invoice.id,
            qbEntityId: invoice.qb_id,
            action: 'pull',
            actor,
        },
    });

    const inv = r.Invoice;
    const total = moneyRound(inv.TotalAmt ?? 0);
    const balance = moneyRound(inv.Balance ?? 0);
    const amountPaid = moneyRound(total - balance);
    const status = balance === 0 && total > 0 ? 'Paid' : 'Outstanding';
    const paidDate = status === 'Paid' && !invoice.paid_date
        ? new Date().toISOString().slice(0, 10)
        : invoice.paid_date;
    const syncToken = inv.SyncToken ?? invoice.qb_sync_token;

    await sql`
        UPDATE invoices
        SET status = ${status},
            amount_paid = ${amountPaid},
            amount_due = ${balance},
            paid_date = ${paidDate},
            qb_sync_token = ${syncToken},
            qb_synced_at = NOW(),
            updated_at = NOW()
        WHERE id = ${invoice.id}
    `;

    await logActivity(
        'quickbooks_invoice',
        invoice.id,
        'qb_pulled',
        `Invoice ${invoice.invoice_number} refreshed from QuickBooks (status ${status})`,
        actor,
        { qbId: invoice.qb_id, status, amountPaid, balance },
    );

    return { status, amountPaid, balance };
}
