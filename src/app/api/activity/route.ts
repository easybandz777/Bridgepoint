import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ActivityRow {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    actor: string | null;
    description: string | null;
    metadata: unknown;
    created_at: string;
}

export async function GET(req: Request) {
    try {
        await initDB();
        const { searchParams } = new URL(req.url);
        const entityType = searchParams.get('entity_type');
        const entityId = searchParams.get('entity_id');
        const sinceParam = searchParams.get('since');
        const limitParam = searchParams.get('limit');

        const limit = Math.min(Math.max(parseInt(limitParam ?? '100', 10) || 100, 1), 500);

        let rows: ActivityRow[];

        if (entityType && entityId && sinceParam) {
            rows = (await sql`
                SELECT * FROM activity_log
                WHERE entity_type = ${entityType}
                  AND entity_id = ${entityId}
                  AND created_at >= ${sinceParam}
                ORDER BY created_at DESC
                LIMIT ${limit}
            `) as unknown as ActivityRow[];
        } else if (entityType && entityId) {
            rows = (await sql`
                SELECT * FROM activity_log
                WHERE entity_type = ${entityType}
                  AND entity_id = ${entityId}
                ORDER BY created_at DESC
                LIMIT ${limit}
            `) as unknown as ActivityRow[];
        } else if (entityType && sinceParam) {
            rows = (await sql`
                SELECT * FROM activity_log
                WHERE entity_type = ${entityType}
                  AND created_at >= ${sinceParam}
                ORDER BY created_at DESC
                LIMIT ${limit}
            `) as unknown as ActivityRow[];
        } else if (entityType) {
            rows = (await sql`
                SELECT * FROM activity_log
                WHERE entity_type = ${entityType}
                ORDER BY created_at DESC
                LIMIT ${limit}
            `) as unknown as ActivityRow[];
        } else if (sinceParam) {
            rows = (await sql`
                SELECT * FROM activity_log
                WHERE created_at >= ${sinceParam}
                ORDER BY created_at DESC
                LIMIT ${limit}
            `) as unknown as ActivityRow[];
        } else {
            rows = (await sql`
                SELECT * FROM activity_log
                ORDER BY created_at DESC
                LIMIT ${limit}
            `) as unknown as ActivityRow[];
        }

        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
