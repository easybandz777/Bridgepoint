/**
 * Bulk-import QuickBooks Accounts (chart of accounts) into the CRM `accounts`
 * table.
 *
 * Pulls every Account from QB (paginated, 1000/page) and upserts by `qb_id`.
 * Existing rows are updated in place — name, type, balance, parent linkage and
 * sync metadata are refreshed. Missing rows are inserted with
 * `source = 'qb_import'`.
 *
 * Strategy is single-pass with a fix-up SQL at the end that resolves
 * parent_account_id by joining each account's stored qb_parent_id to
 * accounts.qb_id. This avoids ordering issues when QB returns parents
 * after children inside a page.
 */

import sql, { initDB, genId, logActivity } from '@/lib/db';
import { qbQuery } from './client';
import { getActiveConnection } from './connection';
import { clean } from './mappers';
import { classifyAccountType, type AccountSource } from '@/lib/accounts';

const QB_LOG_ENTITY = 'quickbooks_account';
const PAGE_SIZE = 1000;

interface QbRefValue {
    value: string;
    name?: string;
}

interface QbAccount {
    Id?: string;
    SyncToken?: string;
    Name?: string;
    FullyQualifiedName?: string;
    AccountType?: string;
    AccountSubType?: string;
    Description?: string;
    ParentRef?: QbRefValue;
    Active?: boolean;
    CurrentBalance?: number | string;
    CurrencyRef?: QbRefValue;
}

interface AccountQueryResponse {
    QueryResponse: { Account?: QbAccount[] };
}

interface ExistingAccountRow {
    id: string;
    qb_sync_token: string | null;
}

function balanceOf(a: QbAccount): number {
    const v = a.CurrentBalance;
    if (v == null) return 0;
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return Number.isFinite(n) ? n : 0;
}

function isQbAccount(v: unknown): v is QbAccount {
    return typeof v === 'object' && v !== null;
}

export async function upsertAccountFromQb(
    qbAccount: unknown,
    source: 'qb_import' | 'qb_webhook',
): Promise<{ id: string; created: boolean }> {
    await initDB();
    if (!isQbAccount(qbAccount)) throw new Error('Invalid QB Account payload');
    const a = qbAccount;
    if (!a.Id) throw new Error('QB Account missing Id');

    const name = clean(a.Name) || `Account ${a.Id}`;
    const fullName = clean(a.FullyQualifiedName) || null;
    const accountType = clean(a.AccountType) || 'Other';
    const accountSubtype = clean(a.AccountSubType) || null;
    const classification = classifyAccountType(accountType);
    const description = clean(a.Description) || '';
    const active = a.Active !== false;
    const balance = balanceOf(a);
    const currency = clean(a.CurrencyRef?.value) || 'USD';
    const syncToken = a.SyncToken ?? null;
    const qbParentId = clean(a.ParentRef?.value) || null;

    // Resolve parent linkage immediately if the parent is already in our table.
    // Otherwise leave null and the post-pass fixup will resolve it.
    let parentAccountId: string | null = null;
    if (qbParentId) {
        const parentRows = (await sql`
            SELECT id FROM accounts WHERE qb_id = ${qbParentId} LIMIT 1
        `) as unknown as { id: string }[];
        parentAccountId = parentRows[0]?.id ?? null;
    }

    const existing = (await sql`
        SELECT id, qb_sync_token FROM accounts WHERE qb_id = ${a.Id} LIMIT 1
    `) as unknown as ExistingAccountRow[];

    if (existing.length > 0) {
        const id = existing[0].id;
        await sql`
            UPDATE accounts SET
                name              = ${name},
                full_name         = ${fullName},
                account_type      = ${accountType},
                account_subtype   = ${accountSubtype},
                classification    = ${classification},
                description       = ${description},
                parent_account_id = ${parentAccountId},
                active            = ${active},
                current_balance   = ${balance},
                currency          = ${currency},
                qb_sync_token     = ${syncToken},
                qb_synced_at      = NOW(),
                updated_at        = NOW()
            WHERE id = ${id}
        `;
        return { id, created: false };
    }

    const id = genId('acct');
    const sourceValue: AccountSource = source;
    await sql`
        INSERT INTO accounts (
            id, name, full_name, account_type, account_subtype, classification,
            description, parent_account_id, active, current_balance, currency,
            source, qb_id, qb_sync_token, qb_synced_at
        ) VALUES (
            ${id},
            ${name},
            ${fullName},
            ${accountType},
            ${accountSubtype},
            ${classification},
            ${description},
            ${parentAccountId},
            ${active},
            ${balance},
            ${currency},
            ${sourceValue},
            ${a.Id},
            ${syncToken},
            NOW()
        )
    `;
    return { id, created: true };
}

export async function importAllAccountsFromQb(
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

    // Track parent qb_ids for accounts whose parents weren't yet in our table
    // when first inserted. We'll resolve them in a fix-up pass at the end.
    const pendingParentLinks: Array<{ childQbId: string; parentQbId: string }> = [];

    while (true) {
        const query = `select * from Account startposition ${startPosition} maxresults ${PAGE_SIZE}`;
        const r = await qbQuery<AccountQueryResponse>(query, {
            entityType: QB_LOG_ENTITY,
            action: 'bulk_import_page',
            direction: 'pull',
            actor,
        });
        const list = r.QueryResponse?.Account ?? [];
        if (list.length === 0) break;

        for (const a of list) {
            try {
                const parentQbId = clean(a.ParentRef?.value);
                const res = await upsertAccountFromQb(a, 'qb_import');
                if (res.created) imported++;
                else updated++;

                if (parentQbId && a.Id) {
                    pendingParentLinks.push({ childQbId: a.Id, parentQbId });
                }
            } catch (e) {
                failed++;
                await logActivity(
                    QB_LOG_ENTITY,
                    a.Id ?? 'unknown',
                    'import_failed',
                    `Failed to upsert QB Account ${a.Name ?? ''}: ${String(e)}`,
                    actor,
                    { qbId: a.Id ?? null },
                );
            }
        }

        if (list.length < PAGE_SIZE) break;
        startPosition += list.length;
    }

    // Fix-up pass: resolve parent_account_id for rows that were inserted
    // before their parent. We look up each pending child by qb_id and set
    // parent_account_id from the parent's qb_id → id mapping.
    for (const link of pendingParentLinks) {
        try {
            await sql`
                UPDATE accounts
                SET parent_account_id = (
                        SELECT id FROM accounts WHERE qb_id = ${link.parentQbId} LIMIT 1
                    ),
                    updated_at = NOW()
                WHERE qb_id = ${link.childQbId}
                  AND parent_account_id IS NULL
            `;
        } catch {
            // ignore — leaving null is acceptable
        }
    }

    await logActivity(
        QB_LOG_ENTITY,
        'bulk',
        'import_completed',
        `Bulk-imported QB Accounts: ${imported} new, ${updated} updated, ${failed} failed`,
        actor,
        { imported, updated, failed },
    );

    return { imported, updated, failed };
}
