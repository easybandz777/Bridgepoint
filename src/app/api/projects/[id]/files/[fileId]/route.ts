import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string; fileId: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id, fileId } = await ctx.params;
        await initDB();
        await sql`DELETE FROM project_files WHERE id = ${fileId} AND project_id = ${id}`;
        await logActivity('project', id, 'file_deleted', `File ${fileId} deleted`);
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
