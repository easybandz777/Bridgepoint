import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string; noteId: string }> };

/**
 * DELETE /api/subcontractors/[id]/notes/[noteId]
 */
export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id, noteId } = await ctx.params;
        await initDB();

        const result = await sql`
            DELETE FROM subcontractor_notes
            WHERE id = ${noteId} AND subcontractor_id = ${id}
        `;

        await logActivity('subcontractor', id, 'note_deleted', `Deleted note ${noteId}`, 'admin', {
            noteId,
            rowCount: (result as { count?: number }).count ?? null,
        });

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error('[DELETE /api/subcontractors/:id/notes/:noteId]', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
