import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';

/**
 * GET /api/projects
 * Returns all projects with computed live aggregates (phases, bills, expenses)
 * but NOT the full nested arrays — those are pulled per-project.
 */
export async function GET() {
    try {
        await initDB();

        // Pull projects + summary aggregates in one trip.
        const rows = await sql`
            SELECT
                p.*,
                COALESCE(phase_agg.phase_count, 0)::int        AS phase_count,
                COALESCE(phase_agg.avg_completion, 0)::numeric AS avg_completion,
                COALESCE(bill_agg.total_billed, 0)::numeric    AS total_billed,
                COALESCE(bill_agg.total_unpaid, 0)::numeric    AS total_unpaid,
                COALESCE(exp_agg.total_expenses, 0)::numeric   AS total_expenses,
                COALESCE(co_agg.approved_co_revenue, 0)::numeric AS approved_co_revenue,
                COALESCE(co_agg.approved_co_cost,    0)::numeric AS approved_co_cost,
                COALESCE(co_agg.pending_co_revenue,  0)::numeric AS pending_co_revenue,
                COALESCE(co_agg.pending_co_cost,     0)::numeric AS pending_co_cost,
                COALESCE(time_agg.labor_cost, 0)::numeric      AS labor_cost
            FROM projects p
            LEFT JOIN (
                SELECT project_id,
                       COUNT(*)         AS phase_count,
                       AVG(completion_pct) AS avg_completion
                FROM project_phases GROUP BY project_id
            ) phase_agg ON phase_agg.project_id = p.id
            LEFT JOIN (
                SELECT project_id,
                       SUM(amount) AS total_billed,
                       SUM(CASE WHEN status <> 'Paid' THEN amount ELSE 0 END) AS total_unpaid
                FROM project_bills GROUP BY project_id
            ) bill_agg ON bill_agg.project_id = p.id
            LEFT JOIN (
                SELECT project_id, SUM(amount) AS total_expenses
                FROM expenses WHERE project_id IS NOT NULL GROUP BY project_id
            ) exp_agg ON exp_agg.project_id = p.id
            LEFT JOIN (
                SELECT project_id,
                       SUM(CASE WHEN status = 'Approved' THEN amount ELSE 0 END)        AS approved_co_revenue,
                       SUM(CASE WHEN status = 'Approved' THEN cost_impact ELSE 0 END)   AS approved_co_cost,
                       SUM(CASE WHEN status = 'Pending'  THEN amount ELSE 0 END)        AS pending_co_revenue,
                       SUM(CASE WHEN status = 'Pending'  THEN cost_impact ELSE 0 END)   AS pending_co_cost
                FROM project_change_orders GROUP BY project_id
            ) co_agg ON co_agg.project_id = p.id
            LEFT JOIN (
                SELECT project_id, SUM(cost_amount) AS labor_cost
                FROM employee_time_entries WHERE project_id IS NOT NULL GROUP BY project_id
            ) time_agg ON time_agg.project_id = p.id
            ORDER BY p.created_at DESC
        `;
        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

/**
 * POST /api/projects
 * Create a new project. Required: name. Everything else has defaults.
 */
export async function POST(req: Request) {
    try {
        await initDB();
        const body = await req.json();

        if (!body.name) {
            return NextResponse.json({ error: 'name is required' }, { status: 400 });
        }

        const id = genId('proj');
        const projectNumber =
            body.projectNumber ??
            `BP-PRJ-${new Date().getFullYear()}-${id.slice(-4).toUpperCase()}`;

        await sql`
            INSERT INTO projects (
                id, project_number, name, status,
                client_name, client_email, client_phone,
                address, city, state, zip,
                description, start_date, end_date,
                estimate_id, estimate_number,
                estimated_revenue, estimated_cost,
                actual_cost, actual_revenue,
                invoiced_amount, collected_amount,
                project_manager, tags, metadata
            ) VALUES (
                ${id},
                ${projectNumber},
                ${body.name},
                ${body.status ?? 'Planning'},
                ${body.clientName ?? ''},
                ${body.clientEmail ?? ''},
                ${body.clientPhone ?? ''},
                ${body.address ?? ''},
                ${body.city ?? ''},
                ${body.state ?? ''},
                ${body.zip ?? ''},
                ${body.description ?? ''},
                ${body.startDate ?? null},
                ${body.endDate ?? null},
                ${body.estimateId ?? null},
                ${body.estimateNumber ?? null},
                ${body.estimatedRevenue ?? 0},
                ${body.estimatedCost ?? 0},
                ${body.actualCost ?? 0},
                ${body.actualRevenue ?? 0},
                ${body.invoicedAmount ?? 0},
                ${body.collectedAmount ?? 0},
                ${body.projectManager ?? ''},
                ${JSON.stringify(body.tags ?? [])}::jsonb,
                ${JSON.stringify(body.metadata ?? {})}::jsonb
            )
        `;

        await logActivity('project', id, 'created', `Project "${body.name}" created`, body.actor);

        return NextResponse.json({ id, projectNumber }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
