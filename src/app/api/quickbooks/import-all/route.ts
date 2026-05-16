import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';
import { getActiveConnection } from '@/lib/quickbooks/connection';
import { importAllAccountsFromQb } from '@/lib/quickbooks/accounts-import';
import { importAllCustomersFromQb } from '@/lib/quickbooks/customers-import';
import { importAllVendorsFromQb } from '@/lib/quickbooks/vendors-import';
import { importAllItemsFromQb } from '@/lib/quickbooks/items-import';

export const dynamic = 'force-dynamic';

interface ImportResult {
    imported: number;
    updated: number;
    failed: number;
}

interface ErrorResult {
    error: string;
}

type EntityResult = ImportResult | ErrorResult;

interface ImportAllResponse {
    ok: boolean;
    durationMs: number;
    accounts: EntityResult;
    customers: EntityResult;
    vendors: EntityResult;
    items: EntityResult;
}

async function safeRun(
    fn: (opts: { actor?: string }) => Promise<ImportResult>,
    actor: string,
): Promise<EntityResult> {
    try {
        const result = await fn({ actor });
        if (!result || typeof result !== 'object') {
            return { error: 'Import returned no result' };
        }
        return {
            imported: Number(result.imported ?? 0),
            updated: Number(result.updated ?? 0),
            failed: Number(result.failed ?? 0),
        };
    } catch (e) {
        return { error: e instanceof Error ? e.message : String(e) };
    }
}

/**
 * POST /api/quickbooks/import-all
 *
 * Orchestrates the four bulk imports in sequence (accounts -> customers ->
 * vendors -> items). Accounts run first because items reference accounts.
 *
 * NOTE: This route is intentionally NOT gated by `isQbDisabled()`. Even after
 * the CRM has been promoted to system-of-record and `QB_DISABLED=true` is
 * flipped, an admin still needs the ability to run one final import to pull
 * any stragglers from QuickBooks (e.g., transactions Intuit created on their
 * own between the cutover snapshot and the actual flip). Every other QB route
 * returns 410 when disabled; this one stays live by design.
 */
export async function POST(req: Request) {
    try {
        await initDB();

        const conn = await getActiveConnection();
        if (!conn) {
            return NextResponse.json({ error: 'QuickBooks is not connected' }, { status: 412 });
        }

        const body = (await req.json().catch(() => ({}))) as { actor?: string };
        const actor = body.actor ?? 'admin';
        const start = Date.now();

        const accounts = await safeRun(importAllAccountsFromQb, actor);
        const customers = await safeRun(importAllCustomersFromQb, actor);
        const vendors = await safeRun(importAllVendorsFromQb, actor);
        const items = await safeRun(importAllItemsFromQb, actor);

        const allOk =
            !('error' in accounts) &&
            !('error' in customers) &&
            !('error' in vendors) &&
            !('error' in items);

        const response: ImportAllResponse = {
            ok: allOk,
            durationMs: Date.now() - start,
            accounts,
            customers,
            vendors,
            items,
        };

        return NextResponse.json(response);
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('QuickBooks is not connected')) {
            return NextResponse.json({ error: msg }, { status: 412 });
        }
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
