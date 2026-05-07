/**
 * Account entity — chart of accounts mirror.
 *
 * QB AccountType enum values include: Asset, Liability, Equity, Income,
 * Expense, Cost of Goods Sold, Other Income, Other Expense, Bank,
 * Credit Card, Accounts Receivable, Accounts Payable, Long Term Liability,
 * Other Asset, Other Current Asset, Fixed Asset, Other Current Liability.
 */

export type AccountClassification = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' | 'Other';
export type AccountSource = 'crm' | 'qb_import' | 'qb_webhook';

export interface Account {
    id: string;
    name: string;
    fullName: string | null;
    accountType: string;
    accountSubtype: string | null;
    classification: AccountClassification | null;
    description: string;
    parentAccountId: string | null;
    active: boolean;
    currentBalance: number;
    currency: string;
    source: AccountSource;
    qbId: string | null;
    qbSyncToken: string | null;
    qbSyncedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AccountRow {
    id: string;
    name: string;
    full_name: string | null;
    account_type: string;
    account_subtype: string | null;
    classification: string | null;
    description: string;
    parent_account_id: string | null;
    active: boolean;
    current_balance: string | number;
    currency: string;
    source: string;
    qb_id: string | null;
    qb_sync_token: string | null;
    qb_synced_at: string | null;
    created_at: string;
    updated_at: string;
}

export function rowToAccount(r: AccountRow): Account {
    return {
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        accountType: r.account_type,
        accountSubtype: r.account_subtype,
        classification: (r.classification as AccountClassification) ?? null,
        description: r.description ?? '',
        parentAccountId: r.parent_account_id,
        active: Boolean(r.active),
        currentBalance: Number(r.current_balance ?? 0),
        currency: r.currency ?? 'USD',
        source: (r.source as AccountSource) ?? 'qb_import',
        qbId: r.qb_id,
        qbSyncToken: r.qb_sync_token,
        qbSyncedAt: r.qb_synced_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

/**
 * Map a QB AccountType → high-level Classification used for UI grouping.
 */
export function classifyAccountType(type: string): AccountClassification {
    const t = type.toLowerCase();
    if (t.includes('asset') || t === 'bank' || t === 'accounts receivable') return 'Asset';
    if (t.includes('liability') || t === 'accounts payable' || t === 'credit card') return 'Liability';
    if (t === 'equity') return 'Equity';
    if (t === 'income' || t === 'other income') return 'Revenue';
    if (t === 'expense' || t === 'cost of goods sold' || t === 'other expense') return 'Expense';
    return 'Other';
}
