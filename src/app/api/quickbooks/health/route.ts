/**
 * GET /api/quickbooks/health
 *
 * Single-call snapshot of QuickBooks integration health. Designed for use by
 * admin dashboards and external monitoring (uptime checks, alerting). Never
 * returns tokens or any other secret material — just config booleans and
 * aggregate counts.
 *
 * Response shape:
 *   {
 *     envConfigured: boolean,
 *     redirectUriConfigured: boolean,
 *     webhookVerifierConfigured: boolean,
 *     connectionStatus: 'connected' | 'disconnected' | 'expired' | 'error' | null,
 *     lastError: { time: string, message: string } | null,
 *     errorRate24h: number,
 *     unprocessedWebhookCount: number,
 *     oldestUnprocessedWebhookSeconds: number,
 *   }
 */
import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { getActiveConnectionRow } from '@/lib/quickbooks/connection';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

interface LastErrorRow {
    created_at: string;
    error: string | null;
}

interface RateRow {
    successes: number | string;
    errors: number | string;
}

interface UnprocessedRow {
    count: number | string;
    oldest_seconds: number | string | null;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'error' | null;

function toNum(v: number | string | null | undefined): number {
    if (v === null || v === undefined) return 0;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
}

export async function GET() {
    try {
        await initDB();

        const envConfigured = Boolean(
            process.env.QUICKBOOKS_CLIENT_ID && process.env.QUICKBOOKS_CLIENT_SECRET,
        );
        const redirectUriConfigured = Boolean(process.env.QUICKBOOKS_REDIRECT_URI);
        const webhookVerifierConfigured = Boolean(process.env.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN);

        let connectionStatus: ConnectionStatus = null;
        try {
            const conn = await getActiveConnectionRow();
            if (!conn) {
                connectionStatus = 'disconnected';
            } else {
                const refreshExpiresMs = new Date(conn.refresh_expires_at).getTime();
                if (refreshExpiresMs < Date.now()) {
                    connectionStatus = 'expired';
                } else if (conn.status === 'active') {
                    connectionStatus = 'connected';
                } else {
                    connectionStatus = (conn.status as ConnectionStatus) ?? 'error';
                }
            }
        } catch {
            connectionStatus = 'error';
        }

        // Most recent error in qb_sync_log.
        const lastErrorRows = (await sql`
            SELECT created_at, error
            FROM qb_sync_log
            WHERE status = 'error'
            ORDER BY created_at DESC
            LIMIT 1
        `) as unknown as LastErrorRow[];
        const lastError = lastErrorRows.length === 0
            ? null
            : {
                time: lastErrorRows[0].created_at,
                message: (lastErrorRows[0].error ?? '').slice(0, 500),
            };

        // 24h success/error counts.
        const rateRows = (await sql`
            SELECT
                COUNT(*) FILTER (WHERE status = 'success')::int AS successes,
                COUNT(*) FILTER (WHERE status = 'error')::int   AS errors
            FROM qb_sync_log
            WHERE created_at >= NOW() - INTERVAL '24 hours'
        `) as unknown as RateRow[];
        const successes = toNum(rateRows[0]?.successes);
        const errors = toNum(rateRows[0]?.errors);
        const total24 = successes + errors;
        const errorRate24h = total24 === 0 ? 0 : Math.round((errors / total24) * 1000) / 1000;

        // Unprocessed webhook backlog.
        const unprocessedRows = (await sql`
            SELECT
                COUNT(*)::int AS count,
                COALESCE(EXTRACT(EPOCH FROM (NOW() - MIN(received_at))), 0)::int AS oldest_seconds
            FROM qb_webhook_events
            WHERE processed_at IS NULL
        `) as unknown as UnprocessedRow[];
        const unprocessedWebhookCount = toNum(unprocessedRows[0]?.count);
        const oldestUnprocessedWebhookSeconds = toNum(unprocessedRows[0]?.oldest_seconds);

        return NextResponse.json({
            envConfigured,
            redirectUriConfigured,
            webhookVerifierConfigured,
            connectionStatus,
            lastError,
            errorRate24h,
            unprocessedWebhookCount,
            oldestUnprocessedWebhookSeconds,
        }, { headers: NO_STORE });
    } catch (e) {
        return NextResponse.json(
            { error: String(e) },
            { status: 500, headers: NO_STORE },
        );
    }
}
