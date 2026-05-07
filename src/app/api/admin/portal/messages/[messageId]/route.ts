import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ messageId: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        await initDB();
        const { messageId } = await ctx.params;
        await sql`DELETE FROM crew_message_reads WHERE message_id = ${messageId}`;
        await sql`DELETE FROM crew_messages WHERE id = ${messageId}`;
        await logActivity('crew_message', messageId, 'deleted',
            `Admin deleted announcement ${messageId}`, 'admin');
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
