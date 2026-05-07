/**
 * QuickBooks connection lifecycle.
 *
 * The CRM keeps ONE active QB connection at a time. When the admin
 * connects, we wipe any prior `active` row and insert a fresh one.
 * Refreshes update in-place. Disconnect flips `status` to `'disconnected'`
 * and revokes the token at Intuit.
 */

import sql, { initDB, genId, logActivity } from '@/lib/db';
import { exchangeCode, refreshTokens, revokeToken, fetchUserInfo } from './oauth';
import type {
    QbActiveConnection,
    QbConnectionRow,
    QbEnvironment,
    QbTokenResponse,
} from './types';

const REFRESH_LEEWAY_MS = 5 * 60 * 1000; // refresh 5 min before access expiry

function rowToActive(r: QbConnectionRow): QbActiveConnection {
    return {
        id: r.id,
        realmId: r.realm_id,
        companyName: r.company_name,
        environment: r.environment,
        accessToken: r.access_token,
        refreshToken: r.refresh_token,
        accessExpiresAt: new Date(r.access_expires_at),
        refreshExpiresAt: new Date(r.refresh_expires_at),
    };
}

export async function getActiveConnection(): Promise<QbActiveConnection | null> {
    await initDB();
    const rows = (await sql`
        SELECT * FROM qb_connections WHERE status = 'active'
        ORDER BY connected_at DESC LIMIT 1
    `) as unknown as QbConnectionRow[];
    if (rows.length === 0) return null;
    return rowToActive(rows[0]);
}

export async function getActiveConnectionRow(): Promise<QbConnectionRow | null> {
    await initDB();
    const rows = (await sql`
        SELECT * FROM qb_connections WHERE status = 'active'
        ORDER BY connected_at DESC LIMIT 1
    `) as unknown as QbConnectionRow[];
    return rows[0] ?? null;
}

export interface SaveConnectionInput {
    realmId: string;
    environment: QbEnvironment;
    tokens: QbTokenResponse;
    actor: string;
    companyName?: string | null;
}

export async function saveConnection(input: SaveConnectionInput): Promise<QbConnectionRow> {
    await initDB();
    const now = Date.now();
    const accessExpiresAt = new Date(now + input.tokens.expires_in * 1000);
    const refreshExpiresAt = new Date(now + input.tokens.x_refresh_token_expires_in * 1000);

    // Mark any prior active connection disconnected before inserting new.
    await sql`
        UPDATE qb_connections
        SET status = 'disconnected', disconnected_at = NOW()
        WHERE status = 'active'
    `;

    const id = genId('qbc');
    await sql`
        INSERT INTO qb_connections (
            id, realm_id, company_name, access_token, refresh_token, token_type,
            access_expires_at, refresh_expires_at, environment, scopes,
            status, connected_by, last_refreshed_at, metadata
        ) VALUES (
            ${id},
            ${input.realmId},
            ${input.companyName ?? null},
            ${input.tokens.access_token},
            ${input.tokens.refresh_token},
            ${input.tokens.token_type ?? 'Bearer'},
            ${accessExpiresAt.toISOString()},
            ${refreshExpiresAt.toISOString()},
            ${input.environment},
            ${input.tokens.scope ?? ''},
            ${'active'},
            ${input.actor},
            ${new Date().toISOString()},
            ${JSON.stringify({})}::jsonb
        )
    `;

    await logActivity('quickbooks', id, 'connected',
        `QuickBooks ${input.environment} connected (realm ${input.realmId})`,
        input.actor, { realmId: input.realmId, environment: input.environment });

    const rows = (await sql`SELECT * FROM qb_connections WHERE id = ${id}`) as unknown as QbConnectionRow[];
    return rows[0];
}

/**
 * Returns a valid access token, refreshing if expired or near-expired.
 * Throws if there is no active connection or refresh fails.
 */
export async function getValidAccessToken(): Promise<QbActiveConnection> {
    const conn = await getActiveConnection();
    if (!conn) throw new Error('QuickBooks is not connected');
    const now = Date.now();
    if (conn.accessExpiresAt.getTime() - now > REFRESH_LEEWAY_MS) {
        return conn;
    }
    if (conn.refreshExpiresAt.getTime() < now) {
        await markStatus(conn.id, 'expired');
        throw new Error('QuickBooks refresh token expired — admin must reconnect');
    }
    return refreshConnection(conn.id);
}

export async function refreshConnection(connectionId: string): Promise<QbActiveConnection> {
    await initDB();
    const rows = (await sql`SELECT * FROM qb_connections WHERE id = ${connectionId}`) as unknown as QbConnectionRow[];
    if (rows.length === 0) throw new Error(`Connection ${connectionId} not found`);
    const row = rows[0];

    const tokens = await refreshTokens(row.refresh_token);
    const now = Date.now();
    const accessExpiresAt = new Date(now + tokens.expires_in * 1000);
    const refreshExpiresAt = new Date(now + tokens.x_refresh_token_expires_in * 1000);

    await sql`
        UPDATE qb_connections SET
            access_token       = ${tokens.access_token},
            refresh_token      = ${tokens.refresh_token},
            access_expires_at  = ${accessExpiresAt.toISOString()},
            refresh_expires_at = ${refreshExpiresAt.toISOString()},
            scopes             = ${tokens.scope ?? row.scopes},
            last_refreshed_at  = NOW()
        WHERE id = ${connectionId}
    `;

    const updated = (await sql`SELECT * FROM qb_connections WHERE id = ${connectionId}`) as unknown as QbConnectionRow[];
    return rowToActive(updated[0]);
}

export async function disconnect(actor: string = 'admin'): Promise<void> {
    await initDB();
    const conn = await getActiveConnectionRow();
    if (!conn) return;

    try {
        await revokeToken(conn.refresh_token);
    } catch (e) {
        console.warn('[qb] revoke failed (continuing local disconnect):', e);
    }

    await sql`
        UPDATE qb_connections SET
            status          = 'disconnected',
            disconnected_at = NOW()
        WHERE id = ${conn.id}
    `;

    await logActivity('quickbooks', conn.id, 'disconnected',
        `QuickBooks ${conn.environment} disconnected`,
        actor, { realmId: conn.realm_id });
}

async function markStatus(connectionId: string, status: 'active' | 'disconnected' | 'expired' | 'error') {
    await sql`UPDATE qb_connections SET status = ${status} WHERE id = ${connectionId}`;
}

export async function maybeUpdateCompanyName(connectionId: string, name: string) {
    if (!name) return;
    await sql`UPDATE qb_connections SET company_name = ${name} WHERE id = ${connectionId}`;
}

// ─── OAuth state CSRF helpers ─────────────────────────────────────────────

const STATE_TTL_MS = 10 * 60 * 1000;

export async function saveOauthState(state: string, actor: string, redirectAfter: string | null) {
    await initDB();
    const expiresAt = new Date(Date.now() + STATE_TTL_MS);
    await sql`
        INSERT INTO qb_oauth_states (state, actor, redirect_after, expires_at)
        VALUES (${state}, ${actor}, ${redirectAfter}, ${expiresAt.toISOString()})
    `;
}

export async function consumeOauthState(state: string): Promise<{ actor: string; redirect_after: string | null } | null> {
    await initDB();
    const rows = (await sql`
        SELECT actor, redirect_after, expires_at FROM qb_oauth_states WHERE state = ${state}
    `) as unknown as { actor: string; redirect_after: string | null; expires_at: string }[];
    if (rows.length === 0) return null;
    const r = rows[0];
    if (new Date(r.expires_at).getTime() < Date.now()) {
        await sql`DELETE FROM qb_oauth_states WHERE state = ${state}`;
        return null;
    }
    await sql`DELETE FROM qb_oauth_states WHERE state = ${state}`;
    return { actor: r.actor, redirect_after: r.redirect_after };
}

export { exchangeCode, fetchUserInfo };
