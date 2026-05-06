import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const rows = await sql`
            SELECT * FROM project_change_orders
            WHERE project_id = ${id}
            ORDER BY created_at DESC
        `;
        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const body = await req.json();

        if (!body.title) {
            return NextResponse.json({ error: 'title is required' }, { status: 400 });
        }

        const coId = genId('co');

        // Auto-number CO-NN per project if not provided
        let changeNumber = body.changeNumber ?? body.number;
        if (!changeNumber) {
            const r = await sql`SELECT COUNT(*)::int AS n FROM project_change_orders WHERE project_id = ${id}`;
            const next = (Number(r[0]?.n ?? 0) + 1).toString().padStart(2, '0');
            changeNumber = `CO-${next}`;
        }

        await sql`
            INSERT INTO project_change_orders (
                id, project_id, change_number, title, description,
                status, amount, cost_impact, time_impact_days,
                requested_date, approved_date,
                requested_by, approved_by,
                line_items
            ) VALUES (
                ${coId},
                ${id},
                ${changeNumber},
                ${body.title},
                ${body.description ?? ''},
                ${body.status ?? 'Draft'},
                ${body.amount ?? 0},
                ${body.costImpact ?? 0},
                ${body.timeImpactDays ?? 0},
                ${body.requestedDate ?? new Date().toISOString().split('T')[0]},
                ${body.approvedDate ?? null},
                ${body.requestedBy ?? body.actor ?? null},
                ${body.approvedBy ?? null},
                ${JSON.stringify(body.lineItems ?? [])}::jsonb
            )
        `;

        await logActivity('project', id, 'co_created', `Change order ${changeNumber} (${body.title}) created`, body.actor, { coId });

        return NextResponse.json({ id: coId, changeNumber }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
