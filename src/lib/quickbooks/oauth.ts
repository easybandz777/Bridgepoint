/**
 * QuickBooks Online OAuth 2.0 helpers.
 *
 * Three flows:
 *   - getAuthorizationUrl(state) → URL the admin clicks to grant access
 *   - exchangeCode(code, redirectUri) → swap auth code for tokens
 *   - refreshTokens(refreshToken) → use refresh token to mint a new access token
 *
 * Reference: https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0
 */

import { randomBytes } from 'node:crypto';
import type { QbEnvironment, QbTokenResponse } from './types';

const AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';
const USER_INFO_URL_SANDBOX = 'https://sandbox-accounts.platform.intuit.com/v1/openid_connect/userinfo';
const USER_INFO_URL_PROD = 'https://accounts.platform.intuit.com/v1/openid_connect/userinfo';

const DEFAULT_SCOPES = [
    'com.intuit.quickbooks.accounting',
    'com.intuit.quickbooks.payment',
    'openid',
    'profile',
    'email',
    'phone',
    'address',
].join(' ');

export function getQbCredentials() {
    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
    const environment = (process.env.QUICKBOOKS_ENVIRONMENT ?? 'sandbox') as QbEnvironment;
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;
    if (!clientId || !clientSecret) {
        throw new Error('QUICKBOOKS_CLIENT_ID / QUICKBOOKS_CLIENT_SECRET must be set');
    }
    if (!redirectUri) {
        throw new Error('QUICKBOOKS_REDIRECT_URI must be set');
    }
    return { clientId, clientSecret, environment, redirectUri };
}

export function generateState(): string {
    return randomBytes(24).toString('base64url');
}

export function getAuthorizationUrl(
    state: string,
    scopes: string = DEFAULT_SCOPES,
    realmHint?: string,
): string {
    const { clientId, redirectUri } = getQbCredentials();
    const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        scope: scopes,
        redirect_uri: redirectUri,
        state,
        // Force Intuit to re-prompt for consent. Combined with a realm_id
        // hint below, this makes the OAuth flow land on the correct company
        // even if the user has multiple QBO companies on the same Intuit ID.
        // (Earlier we tried `login consent` but Intuit hangs on that combo
        // when realm_id is also present.)
        prompt: 'consent',
    });
    // Optional realm hint — when the caller knows which QBO company they
    // want to authorize, passing realm_id lets Intuit pre-select that
    // company on the consent screen. Useful when the user has multiple
    // companies and we want to skip the picker.
    if (realmHint) params.set('realm_id', realmHint);
    return `${AUTH_URL}?${params.toString()}`;
}

function basicAuthHeader(): string {
    const { clientId, clientSecret } = getQbCredentials();
    return 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
}

export async function exchangeCode(code: string): Promise<QbTokenResponse> {
    const { redirectUri } = getQbCredentials();
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
    });

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            Authorization: basicAuthHeader(),
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
        },
        body: body.toString(),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Token exchange failed (${res.status}): ${text}`);
    }
    return res.json() as Promise<QbTokenResponse>;
}

export async function refreshTokens(refreshToken: string): Promise<QbTokenResponse> {
    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    });

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            Authorization: basicAuthHeader(),
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
        },
        body: body.toString(),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Token refresh failed (${res.status}): ${text}`);
    }
    return res.json() as Promise<QbTokenResponse>;
}

export async function revokeToken(token: string): Promise<void> {
    const res = await fetch(REVOKE_URL, {
        method: 'POST',
        headers: {
            Authorization: basicAuthHeader(),
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({ token }),
    });
    if (!res.ok && res.status !== 200) {
        // Per docs, 200 means success. Anything else we log but don't throw —
        // local cleanup should still proceed.
        const text = await res.text().catch(() => '');
        console.warn('[qb] revoke returned non-200:', res.status, text);
    }
}

export async function fetchUserInfo(accessToken: string, environment: QbEnvironment): Promise<{
    email?: string;
    given_name?: string;
    family_name?: string;
    sub?: string;
}> {
    const url = environment === 'production' ? USER_INFO_URL_PROD : USER_INFO_URL_SANDBOX;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });
    if (!res.ok) return {};
    return res.json();
}
