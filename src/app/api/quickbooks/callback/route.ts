import { NextResponse } from 'next/server';
import {
    consumeOauthState,
    exchangeCode,
    fetchUserInfo,
    maybeUpdateCompanyName,
    saveConnection,
} from '@/lib/quickbooks/connection';
import { getQbCredentials } from '@/lib/quickbooks/oauth';
import { qbGet } from '@/lib/quickbooks/client';
import type { QbCompanyInfo } from '@/lib/quickbooks/types';
import { importAllAccountsFromQb } from '@/lib/quickbooks/accounts-import';
import { importAllCustomersFromQb } from '@/lib/quickbooks/customers-import';
import { importAllVendorsFromQb } from '@/lib/quickbooks/vendors-import';
import { importAllItemsFromQb } from '@/lib/quickbooks/items-import';
import { logActivity } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/quickbooks/callback
 *
 * Intuit redirects here with `code`, `state`, and `realmId` after consent.
 * We:
 *   1. validate state (CSRF)
 *   2. exchange the code for tokens
 *   3. save the connection (wipes any prior active row)
 *   4. fetch CompanyInfo for the company name
 *   5. redirect to the integrations admin page with a success flag
 */
export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const realmId = url.searchParams.get('realmId');
    const error = url.searchParams.get('error');

    if (error) {
        return redirectWithFlash(`/admin/integrations/quickbooks?qb_error=${encodeURIComponent(error)}`);
    }

    if (!code || !state || !realmId) {
        return redirectWithFlash('/admin/integrations/quickbooks?qb_error=missing_params');
    }

    const stateRow = await consumeOauthState(state);
    if (!stateRow) {
        return redirectWithFlash('/admin/integrations/quickbooks?qb_error=invalid_state');
    }

    try {
        const tokens = await exchangeCode(code);
        const { environment } = getQbCredentials();

        const conn = await saveConnection({
            realmId,
            environment,
            tokens,
            actor: stateRow.actor,
        });

        // Fetch CompanyInfo for the friendly name.
        try {
            const info = await qbGet<{ CompanyInfo: QbCompanyInfo }>(`/companyinfo/${realmId}`, {
                logAs: {
                    entityType: 'qb_company',
                    qbEntityId: realmId,
                    action: 'fetch_company_info',
                    direction: 'pull',
                },
            });
            const name = info?.CompanyInfo?.CompanyName ?? info?.CompanyInfo?.LegalName ?? null;
            if (name) await maybeUpdateCompanyName(conn.id, name);
        } catch (e) {
            console.warn('[qb] could not fetch CompanyInfo:', e);
        }

        // Best-effort user info (for connected_by display).
        try { await fetchUserInfo(tokens.access_token, environment); } catch {}

        // Auto-pull customers / vendors / items / accounts on connect.
        // Fire-and-forget so the user lands on the integrations page fast;
        // imports run in the background. Errors are logged to activity_log
        // but don't block the redirect.
        runInitialImport(stateRow.actor).catch(e => {
            console.warn('[qb] initial import failed:', e);
        });

        // SECURITY: only allow same-origin relative paths. An attacker who
        // could prefill the connect-state row with an absolute URL would
        // otherwise turn the OAuth callback into an open redirect.
        const rawDest = stateRow.redirect_after ?? '/admin/integrations/quickbooks';
        const dest = rawDest.startsWith('/') && !rawDest.startsWith('//')
            ? rawDest
            : '/admin/integrations/quickbooks';
        const sep = dest.includes('?') ? '&' : '?';
        return redirectWithFlash(`${dest}${sep}qb_connected=1`);
    } catch (e) {
        // Don't leak the raw exception (which could include the QB error
        // body) into the URL. Show a stable code; the admin can look up
        // details in the sync log.
        console.warn('[qb] callback error:', e);
        return redirectWithFlash('/admin/integrations/quickbooks?qb_error=connect_failed');
    }
}

async function runInitialImport(actor: string): Promise<void> {
    const start = Date.now();
    const summary: Record<string, unknown> = {};
    for (const [key, fn] of [
        ['accounts', importAllAccountsFromQb],
        ['customers', importAllCustomersFromQb],
        ['vendors', importAllVendorsFromQb],
        ['items', importAllItemsFromQb],
    ] as const) {
        try {
            const r = await fn({ actor });
            summary[key] = { imported: r.imported, updated: r.updated, failed: r.failed };
        } catch (e) {
            summary[key] = { error: e instanceof Error ? e.message : String(e) };
        }
    }
    await logActivity('quickbooks', 'auto_import', 'initial_import_complete',
        `Auto-pull on connect finished in ${Date.now() - start}ms`,
        actor, summary);
}

function redirectWithFlash(path: string) {
    return NextResponse.redirect(new URL(path, getBaseUrl()));
}

function getBaseUrl(): string {
    const explicit = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
    if (explicit) return explicit;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return 'http://localhost:3000';
}
