import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ updateId: string }> };

interface UpdateRow {
    id: string;
    project_id: string;
    author_name: string;
    body: string;
}

export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { updateId } = await ctx.params;
        await initDB();

        const rows = (await sql`
            SELECT id, project_id, author_name, body
            FROM project_updates WHERE id = ${updateId} LIMIT 1
        `) as unknown as UpdateRow[];

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        const row = rows[0];

        await sql`DELETE FROM project_updates WHERE id = ${updateId}`;

        await logActivity(
            'update',
            updateId,
            'deleted',
            `Update by ${row.author_name} deleted by admin`,
            'admin',
            { updateId, projectId: row.project_id },
        );

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
