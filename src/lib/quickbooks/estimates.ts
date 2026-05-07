/**
 * QuickBooks Online Estimate sync.
 *
 * Pushes CRM estimates into QB. Customers must already exist in QB before
 * pushing — when not found we throw a specific error so the route can
 * return HTTP 412 and tell the user to sync the project first.
 *
 * ItemRef limitation: QB requires a non-null Item id on every
 * SalesItemLineDetail. Sandbox companies ship with a default "Services"
 * item at Id=1 — we use that for all line items. If a workspace has
 * deleted that item, the push will fail with a clear QB error and the
 * admin can wire up a real Items mapping later.
 */

import sql, { initDB, logActivity } from '@/lib/db';
import { qbCreate, qbQuery, qbUpdate } from './client';
import type { QbEstimate, QbInvoiceLine } from './types';
import { clean, moneyRound, ymd } from './mappers';
import { getDefaultItemId } from './refs';

const DEFAULT_ITEM_NAME = 'Services';

interface DbEstimateLineItem {
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

export interface DbEstimateRow {
    id: string;
    estimate_number: string;
    status: string;
    created_date: string;
    sent_date: string | null;
    valid_until: string;
    client: DbClient | null;
    project: Record<string, unknown> | null;
    line_items: DbEstimateLineItem[] | null;
    subtotal: number | string;
    tax_rate: number | string;
    tax_amount: number | string;
    total: number | string;
    payment_schedule: unknown[] | null;
    terms: unknown[] | null;
    notes: string | null;
    prepared_by: string | null;
    project_id: string | null;
    qb_id: string | null;
    qb_sync_token: string | null;
    qb_synced_at: string | null;
    qb_customer_id: string | null;
}

async function loadEstimate(estimateId: string): Promise<DbEstimateRow> {
    await initDB();
    const rows = (await sql`
        SELECT * FROM estimates WHERE id = ${estimateId} LIMIT 1
    `) as unknown as DbEstimateRow[];
    if (rows.length === 0) throw new Error(`Estimate ${estimateId} not found`);
    return rows[0];
}

function escapeQbString(s: string): string {
    return s.replace(/'/g, "\\'");
}

interface QbCustomerLookup {
    Id: string;
    DisplayName?: string;
}

async function resolveCustomerRef(estimate: DbEstimateRow): Promise<string> {
    if (estimate.qb_customer_id) return estimate.qb_customer_id;

    const client = estimate.client ?? {};
    const email = clean(client.email);
    const name = clean(client.name) || clean(client.company);

    let customer: QbCustomerLookup | undefined;

    if (email) {
        const q = `select Id, DisplayName from Customer where PrimaryEmailAddr = '${escapeQbString(email)}'`;
        const r = await qbQuery<{ QueryResponse: { Customer?: QbCustomerLookup[] } }>(q, {
            entityType: 'qb_estimate',
            entityId: estimate.id,
            action: 'lookup-customer-by-email',
        });
        customer = r?.QueryResponse?.Customer?.[0];
    }

    if (!customer && name) {
        const q = `select Id, DisplayName from Customer where DisplayName = '${escapeQbString(name)}'`;
        const r = await qbQuery<{ QueryResponse: { Customer?: QbCustomerLookup[] } }>(q, {
            entityType: 'qb_estimate',
            entityId: estimate.id,
            action: 'lookup-customer-by-name',
        });
        customer = r?.QueryResponse?.Customer?.[0];
    }

    if (!customer?.Id) {
        throw new Error('Customer not yet synced — sync project to QB first');
    }

    await sql`UPDATE estimates SET qb_customer_id = ${customer.Id} WHERE id = ${estimate.id}`;
    return customer.Id;
}

async function buildLines(estimate: DbEstimateRow): Promise<QbInvoiceLine[]> {
    const items = estimate.line_items ?? [];
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

function mapStatus(status: string): QbEstimate['TxnStatus'] | undefined {
    switch (status) {
        case 'Accepted':
            return 'Accepted';
        case 'Declined':
            return 'Rejected';
        case 'Expired':
            return 'Closed';
        default:
            return undefined;
    }
}

export async function mapEstimateToQb(row: DbEstimateRow, customerRef: string): Promise<QbEstimate> {
    const notes = clean(row.notes ?? '');
    const body: QbEstimate = {
        Id: row.qb_id ?? undefined,
        SyncToken: row.qb_sync_token ?? undefined,
        DocNumber: row.estimate_number,
        TxnDate: ymd(row.created_date),
        ExpirationDate: ymd(row.valid_until),
        CustomerRef: { value: customerRef },
        Line: await buildLines(row),
        PrivateNote: notes || undefined,
        CustomerMemo: notes ? { value: notes } : undefined,
        TxnStatus: mapStatus(row.status),
    };
    if (Number(row.tax_amount ?? 0) > 0) {
        body.TxnTaxDetail = { TotalTax: moneyRound(Number(row.tax_amount)) };
    }
    return body;
}

export async function pushEstimate(estimateId: string, actor: string = 'admin'): Promise<{ qbId: string; total: number }> {
    const estimate = await loadEstimate(estimateId);
    const customerRef = await resolveCustomerRef(estimate);
    const body = await mapEstimateToQb(estimate, customerRef);

    const isUpdate = Boolean(estimate.qb_id);
    const action = isUpdate ? 'update' : 'create';

    const envelope = isUpdate
        ? await qbUpdate<{ Estimate: QbEstimate }>('estimate', body, {
            entityType: 'qb_estimate',
            entityId: estimate.id,
            qbEntityId: estimate.qb_id,
            action: 'push',
            actor,
        })
        : await qbCreate<{ Estimate: QbEstimate }>('estimate', body, {
            entityType: 'qb_estimate',
            entityId: estimate.id,
            action: 'push',
            actor,
        });

    const est = envelope.Estimate;
    const qbId = est.Id;
    if (!qbId) throw new Error('QB did not return an Estimate Id');
    const syncToken = est.SyncToken ?? null;
    const total = moneyRound(est.TotalAmt ?? 0);

    await sql`
        UPDATE estimates
        SET qb_id = ${qbId},
            qb_sync_token = ${syncToken},
            qb_synced_at = NOW(),
            updated_at = NOW()
        WHERE id = ${estimate.id}
    `;

    await logActivity(
        'quickbooks_estimate',
        estimate.id,
        action === 'create' ? 'qb_created' : 'qb_updated',
        `Estimate ${estimate.estimate_number} pushed to QuickBooks (Id ${qbId})`,
        actor,
        { qbId, total },
    );

    return { qbId, total };
}
