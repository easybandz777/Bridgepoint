/**
 * Bulk-import QuickBooks Items into the CRM `items` table.
 *
 * Pulls every Item from QB (paginated, 1000/page) and upserts by `qb_id`.
 * Existing rows are updated in place — name, description, type, sku, prices,
 * account refs, taxable, qty-on-hand, and sync metadata are refreshed. Missing
 * rows are inserted with `source = 'qb_import'`. IncomeAccountRef and
 * ExpenseAccountRef are translated from QB account ids to our local CRM
 * account ids by looking up the `accounts` table; if no match is found we
 * leave the column null and let the next sync round resolve it.
 */

import sql, { initDB, genId, logActivity } from '@/lib/db';
import { qbQuery } from './client';
import { getActiveConnection } from './connection';
import { clean } from './mappers';
import type { ItemSource, ItemType } from '@/lib/items';
import type { QbItem, QbRef } from './types';

const QB_LOG_ENTITY = 'quickbooks_item';
const PAGE_SIZE = 1000;

interface ItemQueryResponse {
    QueryResponse: { Item?: QbItemExtended[] };
}

/**
 * Read-side extension of QbItem. The shared type covers only what we write
 * back to QB; on reads QB returns more (Sku, PurchaseCost, Taxable,
 * QtyOnHand) which we mirror into the CRM.
 */
interface QbItemExtended extends QbItem {
    Sku?: string;
    PurchaseCost?: number | string;
    Taxable?: boolean;
    QtyOnHand?: number | string;
    MetaData?: { CreateTime?: string; LastUpdatedTime?: string };
}

interface ExistingItemRow {
    id: string;
    qb_sync_token: string | null;
}

interface AccountIdRow {
    id: string;
}

function num(v: number | string | null | undefined): number | null {
    if (v == null) return null;
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return Number.isFinite(n) ? n : null;
}

function isItemType(t: string | undefined): t is ItemType {
    return t === 'Service' || t === 'Inventory' || t === 'NonInventory';
}

async function resolveLocalAccountId(ref: QbRef | undefined): Promise<string | null> {
    const qbId = clean(ref?.value);
    if (!qbId) return null;
    const rows = (await sql`
        SELECT id FROM accounts WHERE qb_id = ${qbId} LIMIT 1
    `) as unknown as AccountIdRow[];
    return rows[0]?.id ?? null;
}

export async function upsertItemFromQb(
    qbItem: QbItem,
    source: 'qb_import' | 'qb_webhook',
): Promise<{ id: string; created: boolean }> {
    await initDB();
    const i = qbItem as QbItemExtended;
    if (!i.Id) throw new Error('QB Item missing Id');

    const name = clean(i.Name) || `Item ${i.Id}`;
    const description = clean(i.Description);
    const type: ItemType = isItemType(i.Type) ? i.Type : 'Service';
    const sku = clean(i.Sku) || null;
    const unitPrice = num(i.UnitPrice);
    const purchaseCost = num(i.PurchaseCost);
    const incomeAccountId = await resolveLocalAccountId(i.IncomeAccountRef);
    const expenseAccountId = await resolveLocalAccountId(i.ExpenseAccountRef);
    const active = i.Active !== false;
    const taxable = Boolean(i.Taxable);
    const qtyOnHand = type === 'Inventory' ? num(i.QtyOnHand) : null;
    const syncToken = i.SyncToken ?? null;

    const existing = (await sql`
        SELECT id, qb_sync_token FROM items WHERE qb_id = ${i.Id} LIMIT 1
    `) as unknown as ExistingItemRow[];

    if (existing.length > 0) {
        const id = existing[0].id;
        await sql`
            UPDATE items SET
                name                = ${name},
                description         = ${description},
                type                = ${type},
                sku                 = ${sku},
                unit_price          = ${unitPrice},
                purchase_cost       = ${purchaseCost},
                income_account_id   = ${incomeAccountId},
                expense_account_id  = ${expenseAccountId},
                active              = ${active},
                taxable             = ${taxable},
                qty_on_hand         = ${qtyOnHand},
                qb_sync_token       = ${syncToken},
                qb_synced_at        = NOW(),
                updated_at          = NOW()
            WHERE id = ${id}
        `;
        return { id, created: false };
    }

    const id = genId('item');
    const sourceValue: ItemSource = source;
    await sql`
        INSERT INTO items (
            id, name, description, type, sku, unit_price, purchase_cost,
            income_account_id, expense_account_id, active, taxable, qty_on_hand,
            source, qb_id, qb_sync_token, qb_synced_at
        ) VALUES (
            ${id},
            ${name},
            ${description},
            ${type},
            ${sku},
            ${unitPrice},
            ${purchaseCost},
            ${incomeAccountId},
            ${expenseAccountId},
            ${active},
            ${taxable},
            ${qtyOnHand},
            ${sourceValue},
            ${i.Id},
            ${syncToken},
            NOW()
        )
    `;
    return { id, created: true };
}

export async function importAllItemsFromQb(
    opts?: { actor?: string },
): Promise<{ imported: number; updated: number; failed: number }> {
    await initDB();
    const conn = await getActiveConnection();
    if (!conn) throw new Error('QuickBooks is not connected');

    const actor = opts?.actor ?? 'admin';
    let imported = 0;
    let updated = 0;
    let failed = 0;
    let startPosition = 1;

    while (true) {
        const query = `select * from Item startposition ${startPosition} maxresults ${PAGE_SIZE}`;
        const r = await qbQuery<ItemQueryResponse>(query, {
            entityType: QB_LOG_ENTITY,
            action: 'bulk_import_page',
            direction: 'pull',
            actor,
        });
        const list = r.QueryResponse?.Item ?? [];
        if (list.length === 0) break;

        for (const it of list) {
            try {
                const res = await upsertItemFromQb(it, 'qb_import');
                if (res.created) imported++;
                else updated++;
            } catch (e) {
                failed++;
                await logActivity(
                    QB_LOG_ENTITY,
                    it.Id ?? 'unknown',
                    'import_failed',
                    `Failed to upsert QB Item ${it.Name ?? ''}: ${String(e)}`,
                    actor,
                    { qbId: it.Id ?? null },
                );
            }
        }

        if (list.length < PAGE_SIZE) break;
        startPosition += list.length;
    }

    await logActivity(
        QB_LOG_ENTITY,
        'bulk',
        'import_completed',
        `Bulk-imported QB Items: ${imported} new, ${updated} updated, ${failed} failed`,
        actor,
        { imported, updated, failed },
    );

    return { imported, updated, failed };
}
