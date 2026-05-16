import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { isQbDisabled } from '@/lib/feature-flags';

export const dynamic = 'force-dynamic';

interface SyncLogRow {
    id: string;
    connection_id: string | null;
    entity_type: string;
    entity_id: string | null;
    qb_entity_id: string | null;
    direction: string;
    action: string;
    status: string;
    error: string | null;
    request: unknown;
    response: unknown;
    duration_ms: number | null;
    actor: string;
    created_at: string;
}

interface CountRow {
    total: string | number;
}

function shape(row: SyncLogRow) {
    return {
        id: row.id,
        connectionId: row.connection_id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        qbEntityId: row.qb_entity_id,
        direction: row.direction,
        action: row.action,
        status: row.status,
        error: row.error,
        request: row.request,
        response: row.response,
        durationMs: row.duration_ms,
        actor: row.actor,
        createdAt: row.created_at,
    };
}

function clampInt(v: string | null, def: number, min: number, max: number): number {
    if (!v) return def;
    const parsed = parseInt(v, 10);
    if (!Number.isFinite(parsed)) return def;
    return Math.max(min, Math.min(max, parsed));
}

export async function GET(req: Request) {
    if (isQbDisabled()) {
        return NextResponse.json(
            { error: 'QuickBooks integration is disabled. The CRM is now the system of record.' },
            { status: 410 },
        );
    }
    try {
        await initDB();

        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        const entityType = url.searchParams.get('entityType');
        const direction = url.searchParams.get('direction');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');
        const limit = clampInt(url.searchParams.get('limit'), 50, 1, 200);
        const offset = clampInt(url.searchParams.get('offset'), 0, 0, 100000);

        const statusF = status ?? null;
        const entityTypeF = entityType ?? null;
        const directionF = direction ?? null;
        const fromF = from ?? null;
        const toF = to ?? null;

        const rows = (await sql`
            SELECT
                id, connection_id, entity_type, entity_id, qb_entity_id,
                direction, action, status, error, request, response,
                duration_ms, actor, created_at
            FROM qb_sync_log
            WHERE
                (${statusF}::text IS NULL OR status = ${statusF})
                AND (${entityTypeF}::text IS NULL OR entity_type = ${entityTypeF})
                AND (${directionF}::text IS NULL OR direction = ${directionF})
                AND (${fromF}::timestamptz IS NULL OR created_at >= ${fromF}::timestamptz)
                AND (${toF}::timestamptz IS NULL OR created_at <= ${toF}::timestamptz)
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `) as unknown as SyncLogRow[];

        const totalRows = (await sql`
            SELECT COUNT(*)::text AS total
            FROM qb_sync_log
            WHERE
                (${statusF}::text IS NULL OR status = ${statusF})
                AND (${entityTypeF}::text IS NULL OR entity_type = ${entityTypeF})
                AND (${directionF}::text IS NULL OR direction = ${directionF})
                AND (${fromF}::timestamptz IS NULL OR created_at >= ${fromF}::timestamptz)
                AND (${toF}::timestamptz IS NULL OR created_at <= ${toF}::timestamptz)
        `) as unknown as CountRow[];

        const total = totalRows.length > 0 ? parseInt(String(totalRows[0].total), 10) || 0 : 0;

        return NextResponse.json({
            rows: rows.map(shape),
            total,
            limit,
            offset,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
