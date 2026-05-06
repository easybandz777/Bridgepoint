import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/projects/:id
 * Returns the project plus nested arrays:
 *   - phases
 *   - changeOrders
 *   - bills
 *   - files
 *   - expenses
 *   - activity (last 50)
 *   - laborCost (employee_time_entries SUM)
 */
export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();

        const projects = await sql`SELECT * FROM projects WHERE id = ${id}`;
        if (projects.length === 0) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        const project = projects[0];

        const [phases, changeOrders, bills, files, expenses, activity, timeRows] = await Promise.all([
            sql`SELECT * FROM project_phases WHERE project_id = ${id} ORDER BY phase_order ASC`,
            sql`SELECT * FROM project_change_orders WHERE project_id = ${id} ORDER BY created_at DESC`,
            sql`SELECT * FROM project_bills WHERE project_id = ${id} ORDER BY received_date DESC NULLS LAST, created_at DESC`,
            sql`SELECT * FROM project_files WHERE project_id = ${id} ORDER BY created_at DESC`,
            sql`SELECT * FROM expenses WHERE project_id = ${id} ORDER BY date DESC`,
            sql`SELECT * FROM activity_log WHERE entity_type = 'project' AND entity_id = ${id} ORDER BY created_at DESC LIMIT 50`,
            sql`SELECT COALESCE(SUM(cost_amount), 0)::numeric AS labor_cost FROM employee_time_entries WHERE project_id = ${id}`,
        ]);

        return NextResponse.json({
            ...project,
            phases,
            change_orders: changeOrders,
            bills,
            files,
            expenses,
            activity,
            labor_cost: Number(timeRows[0]?.labor_cost ?? 0),
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

/**
 * PATCH /api/projects/:id
 * Partial update — uses COALESCE so missing fields keep their values.
 */
export async function PATCH(req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const body = await req.json();

        await sql`
            UPDATE projects SET
                name              = COALESCE(${body.name},              name),
                status            = COALESCE(${body.status},            status),
                client_name       = COALESCE(${body.clientName},        client_name),
                client_email      = COALESCE(${body.clientEmail},       client_email),
                client_phone      = COALESCE(${body.clientPhone},       client_phone),
                address           = COALESCE(${body.address},           address),
                city              = COALESCE(${body.city},              city),
                state             = COALESCE(${body.state},             state),
                zip               = COALESCE(${body.zip},               zip),
                description       = COALESCE(${body.description},       description),
                start_date        = COALESCE(${body.startDate},         start_date),
                end_date          = COALESCE(${body.endDate},           end_date),
                estimate_id       = COALESCE(${body.estimateId},        estimate_id),
                estimate_number   = COALESCE(${body.estimateNumber},    estimate_number),
                estimated_revenue = COALESCE(${body.estimatedRevenue},  estimated_revenue),
                estimated_cost    = COALESCE(${body.estimatedCost},     estimated_cost),
                actual_cost       = COALESCE(${body.actualCost},        actual_cost),
                actual_revenue    = COALESCE(${body.actualRevenue},     actual_revenue),
                invoiced_amount   = COALESCE(${body.invoicedAmount},    invoiced_amount),
                collected_amount  = COALESCE(${body.collectedAmount},   collected_amount),
                project_manager   = COALESCE(${body.projectManager},    project_manager),
                tags              = COALESCE(${body.tags != null ? JSON.stringify(body.tags) : null}::jsonb,     tags),
                metadata          = COALESCE(${body.metadata != null ? JSON.stringify(body.metadata) : null}::jsonb, metadata),
                updated_at        = NOW()
            WHERE id = ${id}
        `;

        await logActivity('project', id, 'updated', body.changeNote ?? 'Project updated', body.actor, { fields: Object.keys(body) });

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

/**
 * DELETE /api/projects/:id
 * Hard-delete a project plus all owned children (phases, COs, bills, files, expenses).
 * Activity log is retained for audit.
 */
export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();

        await sql`DELETE FROM project_phases        WHERE project_id = ${id}`;
        await sql`DELETE FROM project_change_orders WHERE project_id = ${id}`;
        await sql`DELETE FROM project_bills         WHERE project_id = ${id}`;
        await sql`DELETE FROM project_files         WHERE project_id = ${id}`;
        await sql`DELETE FROM expenses              WHERE project_id = ${id}`;
        await sql`DELETE FROM projects              WHERE id         = ${id}`;

        await logActivity('project', id, 'deleted', 'Project and all children deleted');

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
