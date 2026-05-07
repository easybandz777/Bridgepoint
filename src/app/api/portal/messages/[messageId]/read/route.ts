import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { getPortalUserFromCookie } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ messageId: string }> },
) {
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { messageId } = await params;
    if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 });

    try {
        await initDB();

        const rows = (await sql`
            SELECT id FROM crew_messages
            WHERE id = ${messageId}
              AND (audience = 'all'
                OR (recipient_type = ${user.userType} AND recipient_id = ${user.userId}))
            LIMIT 1
        `) as unknown as { id: string }[];

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        await sql`
            INSERT INTO crew_message_reads (message_id, user_type, user_id)
            VALUES (${messageId}, ${user.userType}, ${user.userId})
            ON CONFLICT DO NOTHING
        `;

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
