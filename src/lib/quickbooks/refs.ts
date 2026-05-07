/**
 * QuickBooks default-ref resolver.
 *
 * Sandbox companies happen to ship with an Item at Id=1 ("Services") and an
 * Account at Id=7 ("Cost of Goods Sold"), but production realms have arbitrary
 * IDs. This module discovers a sane default Item and default Expense / Income
 * Accounts at runtime and caches them on the active connection's metadata blob
 * under `qbDefaults`. Disconnect + reconnect clears the metadata so the next
 * connection forces a re-resolve.
 */

import { logActivity } from '@/lib/db';
import { qbQuery } from './client';
import { getActiveConnectionRow, readConnectionMetadata, writeConnectionMetadata } from './connection';

export interface QbDefaults {
    itemId: string;
    expenseAccountId: string;
    incomeAccountId: string;
    resolvedAt: string;
}

interface QbItemLookup {
    Id: string;
    Name?: string;
    Type?: string;
    Active?: boolean;
}

interface QbAccountLookup {
    Id: string;
    Name?: string;
    AccountType?: string;
    AccountSubType?: string;
    Active?: boolean;
}

async function readCachedDefaults(): Promise<Partial<QbDefaults>> {
    const md = await readConnectionMetadata();
    const raw = md.qbDefaults;
    if (!raw || typeof raw !== 'object') return {};
    return raw as Partial<QbDefaults>;
}

async function resolveItemId(): Promise<string> {
    const services = await qbQuery<{ QueryResponse: { Item?: QbItemLookup[] } }>(
        `select * from Item where Type = 'Service' and Active = true maxresults 5`,
        { entityType: 'qb_refs', action: 'resolve-item-service' },
    );
    const svc = services?.QueryResponse?.Item?.[0];
    if (svc?.Id) return svc.Id;

    const any = await qbQuery<{ QueryResponse: { Item?: QbItemLookup[] } }>(
        `select * from Item where Active = true maxresults 5`,
        { entityType: 'qb_refs', action: 'resolve-item-any' },
    );
    const fallback = any?.QueryResponse?.Item?.[0];
    if (fallback?.Id) return fallback.Id;

    throw new Error('No QuickBooks Items found — create a Service item in QuickBooks first.');
}

async function resolveExpenseAccountId(): Promise<string> {
    const cogs = await qbQuery<{ QueryResponse: { Account?: QbAccountLookup[] } }>(
        `select * from Account where AccountType = 'Cost of Goods Sold' and Active = true maxresults 5`,
        { entityType: 'qb_refs', action: 'resolve-expense-cogs' },
    );
    const cogsHit = cogs?.QueryResponse?.Account?.[0];
    if (cogsHit?.Id) return cogsHit.Id;

    const expense = await qbQuery<{ QueryResponse: { Account?: QbAccountLookup[] } }>(
        `select * from Account where AccountType = 'Expense' and Active = true maxresults 5`,
        { entityType: 'qb_refs', action: 'resolve-expense-expense' },
    );
    const expenseHit = expense?.QueryResponse?.Account?.[0];
    if (expenseHit?.Id) return expenseHit.Id;

    const jobMaterials = await qbQuery<{ QueryResponse: { Account?: QbAccountLookup[] } }>(
        `select * from Account where AccountSubType = 'JobMaterials' and Active = true maxresults 5`,
        { entityType: 'qb_refs', action: 'resolve-expense-jobmaterials' },
    );
    const jmHit = jobMaterials?.QueryResponse?.Account?.[0];
    if (jmHit?.Id) return jmHit.Id;

    throw new Error('No QuickBooks Expense accounts found — create a Cost of Goods Sold or Expense account in QuickBooks first.');
}

async function resolveIncomeAccountId(): Promise<string> {
    const income = await qbQuery<{ QueryResponse: { Account?: QbAccountLookup[] } }>(
        `select * from Account where AccountType = 'Income' and Active = true maxresults 5`,
        { entityType: 'qb_refs', action: 'resolve-income' },
    );
    const hit = income?.QueryResponse?.Account?.[0];
    if (hit?.Id) return hit.Id;

    throw new Error('No QuickBooks Income accounts found — create an Income account in QuickBooks first.');
}

export async function refreshDefaults(actor: string = 'admin'): Promise<QbDefaults> {
    const itemId = await resolveItemId();
    const expenseAccountId = await resolveExpenseAccountId();
    const incomeAccountId = await resolveIncomeAccountId();
    const resolvedAt = new Date().toISOString();

    const next: QbDefaults = { itemId, expenseAccountId, incomeAccountId, resolvedAt };
    await writeConnectionMetadata({ qbDefaults: next });

    const conn = await getActiveConnectionRow();
    if (conn) {
        await logActivity(
            'quickbooks',
            conn.id,
            'refs_resolved',
            `QuickBooks default refs resolved (item=${itemId}, expense=${expenseAccountId}, income=${incomeAccountId})`,
            actor,
            next as unknown as Record<string, unknown>,
        );
    }

    return next;
}

export async function getDefaultItemId(): Promise<string> {
    const cached = await readCachedDefaults();
    if (cached.itemId) return cached.itemId;
    const resolved = await refreshDefaults();
    return resolved.itemId;
}

export async function getDefaultExpenseAccountId(): Promise<string> {
    const cached = await readCachedDefaults();
    if (cached.expenseAccountId) return cached.expenseAccountId;
    const resolved = await refreshDefaults();
    return resolved.expenseAccountId;
}

export async function getDefaultIncomeAccountId(): Promise<string> {
    const cached = await readCachedDefaults();
    if (cached.incomeAccountId) return cached.incomeAccountId;
    const resolved = await refreshDefaults();
    return resolved.incomeAccountId;
}

export async function getCachedDefaults(): Promise<QbDefaults | null> {
    const cached = await readCachedDefaults();
    if (cached.itemId && cached.expenseAccountId && cached.incomeAccountId && cached.resolvedAt) {
        return cached as QbDefaults;
    }
    return null;
}
