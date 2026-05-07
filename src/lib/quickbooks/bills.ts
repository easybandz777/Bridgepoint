/**
 * QuickBooks Online Bill sync.
 *
 * project_bills (subcontractor invoices to a project) push as QB Bills. The
 * bill MUST have a VendorRef — the subcontractor needs to be synced first.
 * If subcontractor.qb_id is null we throw a specific error so the caller
 * returns HTTP 412 and prompts the user to sync the vendor.
 *
 * AccountRef is hardcoded to '7' for v1 (typical sandbox Cost of Goods Sold
 * / Job Materials account). In production this should be configurable per
 * customer (and potentially per phase / trade).
 */

import sql, { initDB, logActivity } from '@/lib/db';
import { qbCreate, qbUpdate } from './client';
import { getActiveConnection } from './connection';
import { clean, moneyRound, ymd } from './mappers';
import { getDefaultExpenseAccountId } from './refs';
import type { QbBill, QbBillLine } from './types';

const QB_LOG_ENTITY = 'quickbooks_bill';

export interface DbBillRow {
    id: string;
    project_id: string;
    phase_id: string | null;
    subcontractor_id: string | null;
    assignment_id: string | null;
    bill_number: string | null;
    amount: number | string;
    status: string;
    received_date: string | null;
    due_date: string | null;
    paid_date: string | null;
    description: string | null;
    file_url: string | null;
    qb_id: string | null;
    qb_sync_token: string | null;
    qb_synced_at: string | null;
}

interface BillEnvelope {
    Bill: QbBill;
}

async function loadBill(billId: string): Promise<DbBillRow | null> {
    const rows = (await sql`
        SELECT id, project_id, phase_id, subcontractor_id, assignment_id,
               bill_number, amount, status, received_date, due_date, paid_date,
               description, file_url, qb_id, qb_sync_token, qb_synced_at
        FROM project_bills WHERE id = ${billId}
    `) as unknown as DbBillRow[];
    return rows[0] ?? null;
}

async function loadVendorQbId(subcontractorId: string): Promise<string | null> {
    const rows = (await sql`
        SELECT qb_id FROM subcontractors WHERE id = ${subcontractorId}
    `) as unknown as { qb_id: string | null }[];
    return rows[0]?.qb_id ?? null;
}

export async function mapBillToQb(bill: DbBillRow, vendorRef: string): Promise<QbBill> {
    const amount = moneyRound(bill.amount);
    const description = clean(bill.description ?? '') || 'Subcontractor work';
    const accountId = await getDefaultExpenseAccountId();

    const line: QbBillLine = {
        DetailType: 'AccountBasedExpenseLineDetail',
        Amount: amount,
        Description: description,
        AccountBasedExpenseLineDetail: {
            AccountRef: { value: accountId },
            BillableStatus: 'Billable',
        },
    };

    const out: QbBill = {
        Id: bill.qb_id ?? undefined,
        SyncToken: bill.qb_sync_token ?? undefined,
        DocNumber: bill.bill_number || undefined,
        TxnDate: ymd(bill.received_date),
        DueDate: ymd(bill.due_date),
        VendorRef: { value: vendorRef },
        PrivateNote: clean(bill.description ?? '') || undefined,
        Line: [line],
    };
    return out;
}

async function ensureConnected(): Promise<void> {
    const conn = await getActiveConnection();
    if (!conn) throw new Error('QuickBooks is not connected');
}

async function stampBillQbId(billId: string, qbBill: QbBill): Promise<void> {
    if (!qbBill.Id) return;
    await sql`
        UPDATE project_bills
        SET qb_id = ${qbBill.Id},
            qb_sync_token = ${qbBill.SyncToken ?? null},
            qb_synced_at = NOW(),
            updated_at = NOW()
        WHERE id = ${billId}
    `;
}

export async function pushBill(
    billId: string,
    actor: string = 'admin',
): Promise<{ qbId: string; total: number }> {
    await initDB();
    await ensureConnected();

    const bill = await loadBill(billId);
    if (!bill) throw new Error(`Bill ${billId} not found`);
    if (!bill.subcontractor_id) {
        throw new Error('Vendor not synced — sync subcontractor to QB first');
    }

    const vendorQbId = await loadVendorQbId(bill.subcontractor_id);
    if (!vendorQbId) {
        throw new Error('Vendor not synced — sync subcontractor to QB first');
    }

    const body = await mapBillToQb(bill, vendorQbId);
    const isUpdate = Boolean(bill.qb_id);
    const action = isUpdate ? 'update' : 'create';

    const envelope = isUpdate
        ? await qbUpdate<BillEnvelope>('bill', body, {
            entityType: QB_LOG_ENTITY,
            entityId: bill.id,
            qbEntityId: bill.qb_id,
            action,
            actor,
        })
        : await qbCreate<BillEnvelope>('bill', body, {
            entityType: QB_LOG_ENTITY,
            entityId: bill.id,
            action,
            actor,
        });

    const qbBill = envelope.Bill;
    if (!qbBill?.Id) throw new Error('QB did not return a Bill Id');
    const total = moneyRound(qbBill.TotalAmt ?? body.Line[0].Amount);

    await stampBillQbId(bill.id, qbBill);

    await logActivity(
        'quickbooks_bill',
        bill.id,
        action === 'create' ? 'qb_created' : 'qb_updated',
        `Bill ${bill.bill_number ?? bill.id} pushed to QuickBooks (Id ${qbBill.Id})`,
        actor,
        { qbId: qbBill.Id, total, vendorQbId },
    );

    return { qbId: qbBill.Id, total };
}
