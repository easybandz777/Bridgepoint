import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';
import { getActiveConnection } from '@/lib/quickbooks/connection';

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

interface RunOpts {
    actor?: string;
}

/**
 * Dynamically loads each per-entity import lib and runs it. We use dynamic
 * `await import()` so that this route still type-checks and runs even when
 * the underlying lib module hasn't been shipped by the sibling agent yet —
 * the missing module surfaces as an `error` field in the response rather
 * than crashing the whole orchestration.
 */
async function runEntityImport(
    moduleSpec: string,
    fnName: string,
    opts: RunOpts,
): Promise<EntityResult> {
    try {
        const mod = (await import(moduleSpec)) as Record<string, unknown>;
        const fn = mod[fnName];
        if (typeof fn !== 'function') {
            return { error: `Import function ${fnName} is not available yet (module loaded but export missing)` };
        }
        const result = (await (fn as (o: RunOpts) => Promise<ImportResult>)(opts)) ?? null;
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
 * vendors -> items). Sequential execution is required because all four hit
 * the same rate-limited QB Online API. Accounts run first because items
 * reference accounts via income/expense IDs.
 *
 * Returns 412 if QB is not connected. Otherwise returns 200 with per-entity
 * results — each entity is either { imported, updated, failed } on success
 * or { error } on failure. `ok` is true only if all four succeeded.
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

        // Run sequentially. Order matters: accounts first (items reference them),
        // then the others can run in any order.
        const accounts = await runEntityImport(
            '@/lib/quickbooks/accounts-import',
            'importAllAccountsFromQb',
            { actor },
        );
        const customers = await runEntityImport(
            '@/lib/quickbooks/customers-import',
            'importAllCustomersFromQb',
            { actor },
        );
        const vendors = await runEntityImport(
            '@/lib/quickbooks/vendors-import',
            'importAllVendorsFromQb',
            { actor },
        );
        const items = await runEntityImport(
            '@/lib/quickbooks/items-import',
            'importAllItemsFromQb',
            { actor },
        );

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
