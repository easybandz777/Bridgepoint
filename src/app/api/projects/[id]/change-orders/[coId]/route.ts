import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string; coId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id, coId } = await ctx.params;
        await initDB();
        const rows = await sql`
            SELECT * FROM project_change_orders
            WHERE project_id = ${id} AND id = ${coId}
        `;
        if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(rows[0]);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

/**
 * PATCH /api/projects/:id/change-orders/:coId
 * - generic field updates
 * - if body.action === 'approve', flip to 'Approved' and bump
 *   projects.estimated_revenue + projects.estimated_cost
 * - if body.action === 'reject', flip to 'Rejected'
 * - if body.action === 'submit', flip to 'Pending'
 */
export async function PATCH(req: Request, ctx: Ctx) {
    try {
        const { id, coId } = await ctx.params;
        await initDB();
        const body = await req.json();

        const action = (body.action ?? '').toLowerCase();

        if (action === 'approve') {
            // Get the CO to read amounts
            const cos = await sql`SELECT * FROM project_change_orders WHERE id = ${coId} AND project_id = ${id}`;
            if (cos.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            const co = cos[0];

            // Idempotency: only bump totals if not already approved.
            const wasApproved = co.status === 'Approved';

            await sql`
                UPDATE project_change_orders SET
                    status = 'Approved',
                    approved_date = ${body.approvedDate ?? new Date().toISOString().split('T')[0]},
                    approved_by = ${body.approvedBy ?? body.actor ?? 'admin'},
                    updated_at = NOW()
                WHERE id = ${coId} AND project_id = ${id}
            `;

            if (!wasApproved) {
                await sql`
                    UPDATE projects SET
                        estimated_revenue = estimated_revenue + ${co.amount},
                        estimated_cost    = estimated_cost    + ${co.cost_impact},
                        updated_at = NOW()
                    WHERE id = ${id}
                `;
            }

            await logActivity('project', id, 'co_approved', `Change order ${co.change_number} approved (+$${co.amount})`, body.actor ?? 'admin', { coId });
            return NextResponse.json({ ok: true, approved: true });
        }

        if (action === 'reject') {
            // If it was previously approved, reverse the financial impact.
            const cos = await sql`SELECT * FROM project_change_orders WHERE id = ${coId} AND project_id = ${id}`;
            if (cos.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            const co = cos[0];
            const wasApproved = co.status === 'Approved';

            await sql`
                UPDATE project_change_orders SET
                    status = 'Rejected',
                    updated_at = NOW()
                WHERE id = ${coId} AND project_id = ${id}
            `;

            if (wasApproved) {
                await sql`
                    UPDATE projects SET
                        estimated_revenue = estimated_revenue - ${co.amount},
                        estimated_cost    = estimated_cost    - ${co.cost_impact},
                        updated_at = NOW()
                    WHERE id = ${id}
                `;
            }

            await logActivity('project', id, 'co_rejected', `Change order ${co.change_number} rejected`, body.actor ?? 'admin', { coId });
            return NextResponse.json({ ok: true, rejected: true });
        }

        if (action === 'submit') {
            await sql`
                UPDATE project_change_orders SET status = 'Pending', updated_at = NOW()
                WHERE id = ${coId} AND project_id = ${id}
            `;
            await logActivity('project', id, 'co_submitted', `Change order ${coId} submitted for approval`, body.actor);
            return NextResponse.json({ ok: true, submitted: true });
        }

        // Generic field update.
        await sql`
            UPDATE project_change_orders SET
                title             = COALESCE(${body.title},             title),
                description       = COALESCE(${body.description},       description),
                status            = COALESCE(${body.status},            status),
                amount            = COALESCE(${body.amount},            amount),
                cost_impact       = COALESCE(${body.costImpact},        cost_impact),
                time_impact_days  = COALESCE(${body.timeImpactDays},    time_impact_days),
                requested_date    = COALESCE(${body.requestedDate},     requested_date),
                approved_date     = COALESCE(${body.approvedDate},      approved_date),
                requested_by      = COALESCE(${body.requestedBy},       requested_by),
                approved_by       = COALESCE(${body.approvedBy},        approved_by),
                line_items        = COALESCE(${body.lineItems != null ? JSON.stringify(body.lineItems) : null}::jsonb, line_items),
                updated_at        = NOW()
            WHERE id = ${coId} AND project_id = ${id}
        `;

        await logActivity('project', id, 'co_updated', `Change order ${coId} updated`, body.actor, { coId });

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id, coId } = await ctx.params;
        await initDB();

        // If the CO was approved, reverse the project totals before deletion.
        const cos = await sql`SELECT * FROM project_change_orders WHERE id = ${coId} AND project_id = ${id}`;
        if (cos.length > 0 && cos[0].status === 'Approved') {
            await sql`
                UPDATE projects SET
                    estimated_revenue = estimated_revenue - ${cos[0].amount},
                    estimated_cost    = estimated_cost    - ${cos[0].cost_impact},
                    updated_at = NOW()
                WHERE id = ${id}
            `;
        }

        await sql`DELETE FROM project_change_orders WHERE id = ${coId} AND project_id = ${id}`;
        await logActivity('project', id, 'co_deleted', `Change order ${coId} deleted`);

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
