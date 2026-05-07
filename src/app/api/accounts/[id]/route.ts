import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { rowToAccount, type AccountRow } from '@/lib/accounts';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        await initDB();
        const { id } = await ctx.params;
        const rows = (await sql`SELECT * FROM accounts WHERE id = ${id}`) as unknown as AccountRow[];
        if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(rowToAccount(rows[0]));
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
