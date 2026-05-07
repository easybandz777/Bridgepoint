import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';
import { rowToItem, type ItemRow } from '@/lib/items';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        await initDB();
        const url = new URL(req.url);
        const q = (url.searchParams.get('q') ?? '').trim();
        const type = url.searchParams.get('type');
        const active = url.searchParams.get('active');
        const limit = Math.min(Number(url.searchParams.get('limit') ?? 200), 500);
        const offset = Number(url.searchParams.get('offset') ?? 0);
        const like = `%${q.toLowerCase().replace(/[%_]/g, m => '\\' + m)}%`;

        const rows = (await sql`
            SELECT * FROM items
            WHERE
                (${q === ''}::boolean OR LOWER(name) LIKE ${like} OR LOWER(description) LIKE ${like})
                AND (${!type}::boolean OR type = ${type})
                AND (${active === null}::boolean OR active = ${active === 'true'})
            ORDER BY name ASC
            LIMIT ${limit} OFFSET ${offset}
        `) as unknown as ItemRow[];

        const totalRows = (await sql`SELECT COUNT(*)::int AS n FROM items`) as unknown as { n: number }[];
        return NextResponse.json({ rows: rows.map(rowToItem), total: totalRows[0]?.n ?? 0, limit, offset });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await initDB();
        const b = await req.json();
        if (!b.name) return NextResponse.json({ error: 'name required' }, { status: 400 });
        const id = genId('item');
        await sql`
            INSERT INTO items (
                id, name, description, type, sku, unit_price, purchase_cost,
                income_account_id, expense_account_id, active, taxable, qty_on_hand,
                source
            ) VALUES (
                ${id},
                ${b.name},
                ${b.description ?? ''},
                ${b.type ?? 'Service'},
                ${b.sku ?? null},
                ${b.unitPrice != null ? Number(b.unitPrice) : null},
                ${b.purchaseCost != null ? Number(b.purchaseCost) : null},
                ${b.incomeAccountId ?? null},
                ${b.expenseAccountId ?? null},
                ${b.active ?? true},
                ${Boolean(b.taxable ?? false)},
                ${b.qtyOnHand != null ? Number(b.qtyOnHand) : null},
                ${b.source ?? 'crm'}
            )
        `;
        await logActivity('item', id, 'created', `Created item ${b.name}`);
        return NextResponse.json({ id }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
