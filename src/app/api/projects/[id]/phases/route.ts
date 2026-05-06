import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const rows = await sql`
            SELECT * FROM project_phases
            WHERE project_id = ${id}
            ORDER BY phase_order ASC
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

        if (!body.name) {
            return NextResponse.json({ error: 'name is required' }, { status: 400 });
        }

        const phaseId = genId('phase');

        // Auto-pick phase_order = max + 1 if not provided.
        let order = body.order ?? body.phaseOrder;
        if (order == null) {
            const r = await sql`SELECT COALESCE(MAX(phase_order), 0) + 1 AS n FROM project_phases WHERE project_id = ${id}`;
            order = Number(r[0]?.n ?? 1);
        }

        await sql`
            INSERT INTO project_phases (
                id, project_id, name, status, phase_order,
                estimated_budget, actual_cost, completion_pct,
                start_date, end_date, actual_start_date, actual_end_date,
                assigned_sub_ids, notes, dependencies, issues
            ) VALUES (
                ${phaseId},
                ${id},
                ${body.name},
                ${body.status ?? 'Not Started'},
                ${order},
                ${body.estimatedBudget ?? body.estimatedCost ?? 0},
                ${body.actualCost ?? 0},
                ${body.completionPct ?? 0},
                ${body.startDate ?? null},
                ${body.endDate ?? null},
                ${body.actualStartDate ?? null},
                ${body.actualEndDate ?? null},
                ${JSON.stringify(body.assignedSubIds ?? [])}::jsonb,
                ${body.notes ?? ''},
                ${JSON.stringify(body.dependencies ?? [])}::jsonb,
                ${JSON.stringify(body.issues ?? [])}::jsonb
            )
        `;

        await logActivity('project', id, 'phase_added', `Phase "${body.name}" added`, body.actor, { phaseId });

        return NextResponse.json({ id: phaseId }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
