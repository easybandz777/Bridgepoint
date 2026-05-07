import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Audience = 'all' | 'employees' | 'subcontractors' | 'individual';
type Level = 'info' | 'important' | 'urgent';

interface MessageRow {
    id: string;
    audience: Audience;
    recipient_type: 'employee' | 'subcontractor' | null;
    recipient_id: string | null;
    subject: string;
    body: string;
    level: Level;
    sender: string;
    created_at: string;
    read_count: number;
    recipient_name: string | null;
}

export async function GET() {
    try {
        await initDB();
        const rows = (await sql`
            SELECT
                m.id,
                m.audience,
                m.recipient_type,
                m.recipient_id,
                m.subject,
                m.body,
                m.level,
                m.sender,
                m.created_at,
                COALESCE((
                    SELECT COUNT(*) FROM crew_message_reads r WHERE r.message_id = m.id
                ), 0)::int AS read_count,
                CASE
                    WHEN m.recipient_type = 'employee' THEN (
                        SELECT first_name || ' ' || last_name FROM employees WHERE id = m.recipient_id
                    )
                    WHEN m.recipient_type = 'subcontractor' THEN (
                        SELECT company_name FROM subcontractors WHERE id = m.recipient_id
                    )
                    ELSE NULL
                END AS recipient_name
            FROM crew_messages m
            ORDER BY m.created_at DESC
        `) as unknown as MessageRow[];

        return NextResponse.json(
            rows.map((r) => ({
                id: r.id,
                audience: r.audience,
                recipientType: r.recipient_type,
                recipientId: r.recipient_id,
                recipientName: r.recipient_name,
                subject: r.subject,
                body: r.body,
                level: r.level,
                sender: r.sender,
                createdAt: r.created_at,
                readCount: r.read_count,
            })),
        );
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await initDB();
        const body = (await req.json()) as {
            audience?: Audience;
            recipientType?: 'employee' | 'subcontractor';
            recipientId?: string;
            subject?: string;
            body?: string;
            level?: Level;
            sender?: string;
        };

        const audience: Audience = body.audience ?? 'all';
        const level: Level = body.level ?? 'info';
        const subject = (body.subject ?? '').trim();
        const text = (body.body ?? '').trim();

        if (!text) {
            return NextResponse.json({ error: 'Body is required' }, { status: 400 });
        }
        if (!['all', 'employees', 'subcontractors', 'individual'].includes(audience)) {
            return NextResponse.json({ error: 'invalid audience' }, { status: 400 });
        }
        if (!['info', 'important', 'urgent'].includes(level)) {
            return NextResponse.json({ error: 'invalid level' }, { status: 400 });
        }

        let recipientType: 'employee' | 'subcontractor' | null = null;
        let recipientId: string | null = null;
        if (audience === 'individual') {
            if (!body.recipientType || !body.recipientId) {
                return NextResponse.json({ error: 'recipientType and recipientId required for individual messages' }, { status: 400 });
            }
            if (body.recipientType !== 'employee' && body.recipientType !== 'subcontractor') {
                return NextResponse.json({ error: 'invalid recipientType' }, { status: 400 });
            }
            recipientType = body.recipientType;
            recipientId = body.recipientId;
        }

        const id = genId('msg');
        await sql`
            INSERT INTO crew_messages (
                id, audience, recipient_type, recipient_id,
                subject, body, level, sender
            ) VALUES (
                ${id},
                ${audience},
                ${recipientType},
                ${recipientId},
                ${subject},
                ${text},
                ${level},
                ${body.sender ?? 'admin'}
            )
        `;

        await logActivity('crew_message', id, 'sent',
            `Admin sent ${level} announcement to ${audience}${recipientId ? `:${recipientId}` : ''}: ${subject || text.slice(0, 60)}`,
            'admin',
            { audience, recipientType, recipientId, level });

        return NextResponse.json({ ok: true, id });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
