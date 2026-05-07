/**
 * QuickBooks Online REST client.
 *
 * Thin wrapper around fetch that:
 *   - Pulls a valid access token (auto-refreshing if needed)
 *   - Hits the right base URL for sandbox vs production
 *   - Sends JSON, parses JSON
 *   - Throws on non-2xx with the QB error body attached
 *   - Logs every call to qb_sync_log
 *
 * Intuit's docs treat each entity as a CRUD endpoint (no PATCH — every
 * mutation requires the full object PLUS the latest SyncToken). We expose
 * helpers `qbGet`, `qbCreate`, `qbUpdate`, `qbQuery`, `qbDelete` that
 * mirror those semantics.
 */

import sql, { initDB, genId } from '@/lib/db';
import { getValidAccessToken } from './connection';
import type { QbActiveConnection, SyncDirection, SyncStatus } from './types';

const SANDBOX_BASE = 'https://sandbox-quickbooks.api.intuit.com/v3/company';
const PROD_BASE = 'https://quickbooks.api.intuit.com/v3/company';
const MINOR_VERSION = 75; // pin the API version so behavior is stable

export class QbApiError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, body: unknown, message: string) {
        super(message);
        this.status = status;
        this.body = body;
    }
}

function baseUrl(conn: QbActiveConnection): string {
    return conn.environment === 'production' ? PROD_BASE : SANDBOX_BASE;
}

function url(conn: QbActiveConnection, path: string, query?: Record<string, string>): string {
    const u = new URL(`${baseUrl(conn)}/${conn.realmId}${path}`);
    u.searchParams.set('minorversion', String(MINOR_VERSION));
    if (query) for (const [k, v] of Object.entries(query)) u.searchParams.set(k, v);
    return u.toString();
}

interface CallOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    query?: Record<string, string>;
    /** What to record in the sync log */
    logAs?: {
        entityType: string;
        entityId?: string | null;
        qbEntityId?: string | null;
        action: string;
        direction?: SyncDirection;
        actor?: string;
    };
}

interface CallResult<T> {
    data: T;
    status: number;
}

async function rawCall<T>(path: string, opts: CallOptions = {}): Promise<CallResult<T>> {
    const conn = await getValidAccessToken();
    const fullUrl = url(conn, path, opts.query);
    const method = opts.method ?? 'GET';
    const start = Date.now();

    const init: RequestInit = {
        method,
        headers: {
            Authorization: `Bearer ${conn.accessToken}`,
            Accept: 'application/json',
        },
    };

    if (opts.body !== undefined) {
        init.headers = { ...(init.headers as Record<string, string>), 'Content-Type': 'application/json' };
        init.body = JSON.stringify(opts.body);
    }

    let res: Response;
    try {
        res = await fetch(fullUrl, init);
    } catch (e) {
        await writeSyncLog({
            connectionId: conn.id,
            entityType: opts.logAs?.entityType ?? 'unknown',
            entityId: opts.logAs?.entityId ?? null,
            qbEntityId: opts.logAs?.qbEntityId ?? null,
            direction: opts.logAs?.direction ?? 'push',
            action: opts.logAs?.action ?? `${method} ${path}`,
            status: 'error',
            error: String(e),
            request: opts.body ?? null,
            response: null,
            durationMs: Date.now() - start,
            actor: opts.logAs?.actor ?? 'admin',
        });
        throw e;
    }

    const text = await res.text();
    let parsed: unknown = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }

    const ok = res.ok;
    await writeSyncLog({
        connectionId: conn.id,
        entityType: opts.logAs?.entityType ?? 'unknown',
        entityId: opts.logAs?.entityId ?? null,
        qbEntityId: opts.logAs?.qbEntityId ?? null,
        direction: opts.logAs?.direction ?? (method === 'GET' ? 'pull' : 'push'),
        action: opts.logAs?.action ?? `${method} ${path}`,
        status: ok ? 'success' : 'error',
        error: ok ? null : extractError(parsed) ?? `HTTP ${res.status}`,
        request: opts.body ?? null,
        response: parsed,
        durationMs: Date.now() - start,
        actor: opts.logAs?.actor ?? 'admin',
    });

    if (!ok) {
        throw new QbApiError(res.status, parsed, `QB ${method} ${path} failed (${res.status}): ${extractError(parsed) ?? text.slice(0, 200)}`);
    }

    return { data: parsed as T, status: res.status };
}

function extractError(body: unknown): string | null {
    if (!body || typeof body !== 'object') return null;
    const b = body as Record<string, unknown>;
    const fault = b.Fault as { Error?: { Message?: string; Detail?: string }[] } | undefined;
    const e = fault?.Error?.[0];
    if (e?.Message) return [e.Message, e.Detail].filter(Boolean).join(' — ');
    return null;
}

// ─── Public helpers ────────────────────────────────────────────────────────

export async function qbGet<T>(path: string, opts: Omit<CallOptions, 'method' | 'body'> = {}): Promise<T> {
    const r = await rawCall<T>(path, { ...opts, method: 'GET' });
    return r.data;
}

export async function qbCreate<T>(entity: string, body: unknown, logAs?: CallOptions['logAs']): Promise<T> {
    const r = await rawCall<T>(`/${entity.toLowerCase()}`, {
        method: 'POST',
        body,
        logAs: logAs ? { ...logAs, direction: logAs.direction ?? 'push' } : undefined,
    });
    return r.data;
}

export async function qbUpdate<T>(entity: string, body: unknown, logAs?: CallOptions['logAs']): Promise<T> {
    // QB Update = full object PUT (or POST with sparse=true).
    // We use POST with operation=update which is the official endpoint.
    const r = await rawCall<T>(`/${entity.toLowerCase()}`, {
        method: 'POST',
        body,
        logAs: logAs ? { ...logAs, direction: logAs.direction ?? 'push' } : undefined,
    });
    return r.data;
}

/** Sparse update — only the fields you pass replace existing values. */
export async function qbSparseUpdate<T>(entity: string, body: Record<string, unknown>, logAs?: CallOptions['logAs']): Promise<T> {
    const r = await rawCall<T>(`/${entity.toLowerCase()}`, {
        method: 'POST',
        body: { ...body, sparse: true },
        logAs: logAs ? { ...logAs, direction: logAs.direction ?? 'push' } : undefined,
    });
    return r.data;
}

export async function qbDelete<T>(entity: string, body: unknown, logAs?: CallOptions['logAs']): Promise<T> {
    const r = await rawCall<T>(`/${entity.toLowerCase()}`, {
        method: 'POST',
        query: { operation: 'delete' },
        body,
        logAs: logAs ? { ...logAs, direction: logAs.direction ?? 'push' } : undefined,
    });
    return r.data;
}

export async function qbQuery<T>(query: string, logAs?: CallOptions['logAs']): Promise<T> {
    const r = await rawCall<T>(`/query`, {
        method: 'GET',
        query: { query },
        logAs: logAs ? { ...logAs, direction: 'pull' } : undefined,
    });
    return r.data;
}

// ─── Sync log writer (used by all helpers and by individual sync modules) ──

interface WriteSyncLogInput {
    connectionId: string | null;
    entityType: string;
    entityId: string | null;
    qbEntityId: string | null;
    direction: SyncDirection;
    action: string;
    status: SyncStatus;
    error: string | null;
    request: unknown;
    response: unknown;
    durationMs: number;
    actor: string;
}

export async function writeSyncLog(i: WriteSyncLogInput): Promise<void> {
    try {
        await initDB();
        await sql`
            INSERT INTO qb_sync_log (
                id, connection_id, entity_type, entity_id, qb_entity_id,
                direction, action, status, error, request, response, duration_ms, actor
            ) VALUES (
                ${genId('qbsync')},
                ${i.connectionId},
                ${i.entityType},
                ${i.entityId},
                ${i.qbEntityId},
                ${i.direction},
                ${i.action},
                ${i.status},
                ${i.error},
                ${i.request != null ? JSON.stringify(i.request) : null}::jsonb,
                ${i.response != null ? JSON.stringify(i.response) : null}::jsonb,
                ${i.durationMs},
                ${i.actor}
            )
        `;
    } catch (e) {
        console.warn('[qb] sync log write failed:', e);
    }
}

// ─── Convenience: wrap a sync function with timing + log ───────────────────

export interface SyncResult<T> {
    ok: true;
    data: T;
}

export async function withSyncLog<T>(
    meta: { entityType: string; entityId?: string; action: string; actor?: string; qbEntityId?: string | null },
    fn: () => Promise<T>,
): Promise<T> {
    const start = Date.now();
    try {
        const data = await fn();
        await writeSyncLog({
            connectionId: null,
            entityType: meta.entityType,
            entityId: meta.entityId ?? null,
            qbEntityId: meta.qbEntityId ?? null,
            direction: 'push',
            action: meta.action,
            status: 'success',
            error: null,
            request: null,
            response: null,
            durationMs: Date.now() - start,
            actor: meta.actor ?? 'admin',
        });
        return data;
    } catch (e) {
        await writeSyncLog({
            connectionId: null,
            entityType: meta.entityType,
            entityId: meta.entityId ?? null,
            qbEntityId: meta.qbEntityId ?? null,
            direction: 'push',
            action: meta.action,
            status: 'error',
            error: String(e),
            request: null,
            response: null,
            durationMs: Date.now() - start,
            actor: meta.actor ?? 'admin',
        });
        throw e;
    }
}
