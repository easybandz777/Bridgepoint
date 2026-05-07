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

        const dest = stateRow.redirect_after ?? '/admin/integrations/quickbooks';
        const sep = dest.includes('?') ? '&' : '?';
        return redirectWithFlash(`${dest}${sep}qb_connected=1`);
    } catch (e) {
        return redirectWithFlash(`/admin/integrations/quickbooks?qb_error=${encodeURIComponent(String(e))}`);
    }
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
