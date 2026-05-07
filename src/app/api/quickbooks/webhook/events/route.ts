import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await initDB();
        const events = await sql`
            SELECT id, realm_id, entity_name, entity_id, operation, last_updated,
                   processed_at, error, received_at
            FROM qb_webhook_events
            ORDER BY received_at DESC
            LIMIT 100
        `;
        return NextResponse.json({ ok: true, events });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
