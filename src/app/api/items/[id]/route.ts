import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';
import { rowToItem, type ItemRow } from '@/lib/items';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        await initDB();
        const { id } = await ctx.params;
        const rows = (await sql`SELECT * FROM items WHERE id = ${id}`) as unknown as ItemRow[];
        if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(rowToItem(rows[0]));
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function PATCH(req: Request, ctx: Ctx) {
    try {
        await initDB();
        const { id } = await ctx.params;
        const b = await req.json();
        await sql`
            UPDATE items SET
                name                = COALESCE(${b.name ?? null}, name),
                description         = COALESCE(${b.description ?? null}, description),
                type                = COALESCE(${b.type ?? null}, type),
                sku                 = COALESCE(${b.sku ?? null}, sku),
                unit_price          = COALESCE(${b.unitPrice != null ? Number(b.unitPrice) : null}, unit_price),
                purchase_cost       = COALESCE(${b.purchaseCost != null ? Number(b.purchaseCost) : null}, purchase_cost),
                income_account_id   = COALESCE(${b.incomeAccountId ?? null}, income_account_id),
                expense_account_id  = COALESCE(${b.expenseAccountId ?? null}, expense_account_id),
                active              = COALESCE(${b.active ?? null}::boolean, active),
                taxable             = COALESCE(${b.taxable ?? null}::boolean, taxable),
                qty_on_hand         = COALESCE(${b.qtyOnHand != null ? Number(b.qtyOnHand) : null}, qty_on_hand),
                updated_at          = NOW()
            WHERE id = ${id}
        `;
        await logActivity('item', id, 'updated', 'Updated item');
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
