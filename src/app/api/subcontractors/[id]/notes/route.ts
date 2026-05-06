import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';
import { dbRowToNote, type RowNote } from '@/lib/subcontractors';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/subcontractors/[id]/notes
 *
 * Returns all notes for a sub, newest first.
 */
export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();

        const rows = (await sql`
            SELECT * FROM subcontractor_notes
            WHERE subcontractor_id = ${id}
            ORDER BY created_at DESC
        `) as unknown as RowNote[];

        return NextResponse.json(rows.map(dbRowToNote));
    } catch (e) {
        console.error('[GET /api/subcontractors/:id/notes]', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

/**
 * POST /api/subcontractors/[id]/notes
 *
 * Body: { note: string, author?: string, tag?: string, projectId?: string }
 */
export async function POST(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const body = await req.json();

        if (!body.note || typeof body.note !== 'string' || body.note.trim().length === 0) {
            return NextResponse.json({ error: 'note is required' }, { status: 400 });
        }

        const noteId = genId('subnote');
        const author = body.author ?? 'admin';
        const tag = body.tag ?? null;
        const projectId = body.projectId ?? null;

        await sql`
            INSERT INTO subcontractor_notes (id, subcontractor_id, author, note, tag, project_id)
            VALUES (${noteId}, ${id}, ${author}, ${body.note.trim()}, ${tag}, ${projectId})
        `;

        await logActivity('subcontractor', id, 'note_added', body.note.trim().slice(0, 80), author, { noteId });

        return NextResponse.json({ id: noteId }, { status: 201 });
    } catch (e) {
        console.error('[POST /api/subcontractors/:id/notes]', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
