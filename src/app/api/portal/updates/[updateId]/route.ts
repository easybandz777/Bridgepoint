import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import { getPortalUserFromCookie, isLeadOrManager } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

interface UpdateRow {
    id: string;
    project_id: string;
    author_type: string;
    author_id: string;
    body: string;
    created_at: string;
}

const EDIT_WINDOW_MS = 30 * 60 * 1000;

export async function DELETE(_req: Request, ctx: { params: Promise<{ updateId: string }> }) {
    const { updateId } = await ctx.params;
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await initDB();
        const rows = (await sql`
            SELECT id, project_id, author_type, author_id, body, created_at
            FROM project_updates WHERE id = ${updateId} LIMIT 1
        `) as unknown as UpdateRow[];

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        const row = rows[0];

        const isAuthor = row.author_type === user.userType && row.author_id === user.userId;
        const lead = await isLeadOrManager(user);
        if (!isAuthor && !lead) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await sql`DELETE FROM project_updates WHERE id = ${updateId}`;

        await logActivity(
            'project',
            row.project_id,
            'update_deleted',
            `${user.displayName} deleted an update`,
            `${user.userType}:${user.userId}`,
            { updateId },
        );

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ updateId: string }> }) {
    const { updateId } = await ctx.params;
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await initDB();

        let payload: Record<string, unknown>;
        try {
            payload = await req.json();
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const body = String(payload.body ?? '').trim();
        if (!body) {
            return NextResponse.json({ error: 'Body required' }, { status: 400 });
        }

        const rows = (await sql`
            SELECT id, project_id, author_type, author_id, body, created_at
            FROM project_updates WHERE id = ${updateId} LIMIT 1
        `) as unknown as UpdateRow[];

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        const row = rows[0];

        const isAuthor = row.author_type === user.userType && row.author_id === user.userId;
        if (!isAuthor) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const created = new Date(row.created_at).getTime();
        if (!Number.isFinite(created) || Date.now() - created > EDIT_WINDOW_MS) {
            return NextResponse.json(
                { error: 'Edit window expired' },
                { status: 403 },
            );
        }

        await sql`
            UPDATE project_updates SET body = ${body} WHERE id = ${updateId}
        `;

        return NextResponse.json({ ok: true, body });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
