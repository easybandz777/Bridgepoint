import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { getActiveConnectionRow } from '@/lib/quickbooks/connection';

export const dynamic = 'force-dynamic';

/**
 * GET /api/quickbooks/status
 *
 * Returns the current connection state + a few lifetime metrics for the
 * admin dashboard. Never returns the access/refresh tokens.
 */
export async function GET() {
    try {
        await initDB();
        const conn = await getActiveConnectionRow();

        if (!conn) {
            return NextResponse.json({
                connected: false,
                environment: process.env.QUICKBOOKS_ENVIRONMENT ?? 'sandbox',
                hasCredentialsConfigured: Boolean(process.env.QUICKBOOKS_CLIENT_ID && process.env.QUICKBOOKS_CLIENT_SECRET),
            });
        }

        // Aggregate sync stats for this connection.
        const stats = (await sql`
            SELECT
                COUNT(*) FILTER (WHERE status = 'success')::int AS successes,
                COUNT(*) FILTER (WHERE status = 'error')::int   AS errors,
                MAX(created_at)                                 AS last_activity_at
            FROM qb_sync_log
            WHERE connection_id = ${conn.id}
        `) as unknown as { successes: number; errors: number; last_activity_at: string | null }[];

        // Last 5 sync entries for the inline log.
        const recent = await sql`
            SELECT id, entity_type, entity_id, qb_entity_id, direction, action, status, error, duration_ms, created_at
            FROM qb_sync_log
            WHERE connection_id = ${conn.id}
            ORDER BY created_at DESC LIMIT 10
        `;

        return NextResponse.json({
            connected: true,
            connectionId: conn.id,
            realmId: conn.realm_id,
            companyName: conn.company_name,
            environment: conn.environment,
            connectedAt: conn.connected_at,
            connectedBy: conn.connected_by,
            lastRefreshedAt: conn.last_refreshed_at,
            accessExpiresAt: conn.access_expires_at,
            refreshExpiresAt: conn.refresh_expires_at,
            scopes: conn.scopes,
            status: conn.status,
            stats: stats[0] ?? { successes: 0, errors: 0, last_activity_at: null },
            recent,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
