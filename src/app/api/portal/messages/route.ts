import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { getPortalUserFromCookie } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

interface MessageRow {
    id: string;
    audience: string;
    recipient_type: string | null;
    recipient_id: string | null;
    subject: string;
    body: string;
    level: string;
    sender: string;
    created_at: string;
    is_read: boolean;
}

export interface PortalMessage {
    id: string;
    audience: string;
    subject: string;
    body: string;
    level: string;
    sender: string;
    createdAt: string;
    isRead: boolean;
}

export async function GET() {
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await initDB();
        const audienceMatch = user.userType === 'employee' ? 'employees' : 'subcontractors';
        const rows = (await sql`
            SELECT
                cm.id, cm.audience, cm.recipient_type, cm.recipient_id,
                cm.subject, cm.body, cm.level, cm.sender, cm.created_at,
                EXISTS (
                    SELECT 1 FROM crew_message_reads cmr
                    WHERE cmr.message_id = cm.id
                      AND cmr.user_type = ${user.userType}
                      AND cmr.user_id = ${user.userId}
                ) AS is_read
            FROM crew_messages cm
            WHERE cm.audience = 'all'
               OR cm.audience = ${audienceMatch}
               OR (cm.audience = 'individual' AND cm.recipient_type = ${user.userType} AND cm.recipient_id = ${user.userId})
            ORDER BY cm.created_at DESC
            LIMIT 200
        `) as unknown as MessageRow[];

        const messages: PortalMessage[] = rows.map(r => ({
            id: r.id,
            audience: r.audience,
            subject: r.subject ?? '',
            body: r.body ?? '',
            level: r.level ?? 'info',
            sender: r.sender ?? 'admin',
            createdAt: String(r.created_at),
            isRead: Boolean(r.is_read),
        }));

        const unreadCount = messages.filter(m => !m.isRead).length;
        return NextResponse.json({ messages, unreadCount });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: { action?: string; messageIds?: string[] } = {};
    try { body = await req.json(); } catch {}

    const action = String(body.action ?? '');
    if (action !== 'mark-all-read') {
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    try {
        await initDB();
        const audienceMatch = user.userType === 'employee' ? 'employees' : 'subcontractors';
        const rows = (await sql`
            SELECT cm.id FROM crew_messages cm
            WHERE (cm.audience = 'all'
               OR cm.audience = ${audienceMatch}
               OR (cm.audience = 'individual' AND cm.recipient_type = ${user.userType} AND cm.recipient_id = ${user.userId}))
              AND NOT EXISTS (
                  SELECT 1 FROM crew_message_reads cmr
                  WHERE cmr.message_id = cm.id
                    AND cmr.user_type = ${user.userType}
                    AND cmr.user_id = ${user.userId}
              )
        `) as unknown as { id: string }[];

        for (const r of rows) {
            await sql`
                INSERT INTO crew_message_reads (message_id, user_type, user_id)
                VALUES (${r.id}, ${user.userType}, ${user.userId})
                ON CONFLICT DO NOTHING
            `;
        }

        return NextResponse.json({ ok: true, marked: rows.length });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
