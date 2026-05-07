/**
 * Item entity — chart of services/products used as line items on invoices,
 * estimates, and bills.
 */

export type ItemType = 'Service' | 'Inventory' | 'NonInventory';
export type ItemSource = 'crm' | 'qb_import' | 'qb_webhook';

export interface Item {
    id: string;
    name: string;
    description: string;
    type: ItemType;
    sku: string | null;
    unitPrice: number | null;
    purchaseCost: number | null;
    incomeAccountId: string | null;
    expenseAccountId: string | null;
    active: boolean;
    taxable: boolean;
    qtyOnHand: number | null;
    source: ItemSource;
    qbId: string | null;
    qbSyncToken: string | null;
    qbSyncedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ItemRow {
    id: string;
    name: string;
    description: string;
    type: string;
    sku: string | null;
    unit_price: string | number | null;
    purchase_cost: string | number | null;
    income_account_id: string | null;
    expense_account_id: string | null;
    active: boolean;
    taxable: boolean;
    qty_on_hand: string | number | null;
    source: string;
    qb_id: string | null;
    qb_sync_token: string | null;
    qb_synced_at: string | null;
    created_at: string;
    updated_at: string;
}

function num(v: string | number | null | undefined): number | null {
    if (v === null || v === undefined) return null;
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return Number.isFinite(n) ? n : null;
}

export function rowToItem(r: ItemRow): Item {
    return {
        id: r.id,
        name: r.name,
        description: r.description ?? '',
        type: (r.type as ItemType) ?? 'Service',
        sku: r.sku,
        unitPrice: num(r.unit_price),
        purchaseCost: num(r.purchase_cost),
        incomeAccountId: r.income_account_id,
        expenseAccountId: r.expense_account_id,
        active: Boolean(r.active),
        taxable: Boolean(r.taxable),
        qtyOnHand: num(r.qty_on_hand),
        source: (r.source as ItemSource) ?? 'qb_import',
        qbId: r.qb_id,
        qbSyncToken: r.qb_sync_token,
        qbSyncedAt: r.qb_synced_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}
