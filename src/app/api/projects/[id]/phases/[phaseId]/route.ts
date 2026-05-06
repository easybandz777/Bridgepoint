import { NextResponse } from 'next/server';
import sql, { initDB, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string; phaseId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id, phaseId } = await ctx.params;
        await initDB();
        const rows = await sql`
            SELECT * FROM project_phases
            WHERE project_id = ${id} AND id = ${phaseId}
        `;
        if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(rows[0]);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function PATCH(req: Request, ctx: Ctx) {
    try {
        const { id, phaseId } = await ctx.params;
        await initDB();
        const body = await req.json();

        await sql`
            UPDATE project_phases SET
                name              = COALESCE(${body.name},               name),
                status            = COALESCE(${body.status},             status),
                phase_order       = COALESCE(${body.order ?? body.phaseOrder}, phase_order),
                estimated_budget  = COALESCE(${body.estimatedBudget ?? body.estimatedCost}, estimated_budget),
                actual_cost       = COALESCE(${body.actualCost},         actual_cost),
                completion_pct    = COALESCE(${body.completionPct},      completion_pct),
                start_date        = COALESCE(${body.startDate},          start_date),
                end_date          = COALESCE(${body.endDate},            end_date),
                actual_start_date = COALESCE(${body.actualStartDate},    actual_start_date),
                actual_end_date   = COALESCE(${body.actualEndDate},      actual_end_date),
                assigned_sub_ids  = COALESCE(${body.assignedSubIds != null ? JSON.stringify(body.assignedSubIds) : null}::jsonb, assigned_sub_ids),
                notes             = COALESCE(${body.notes},              notes),
                dependencies      = COALESCE(${body.dependencies != null ? JSON.stringify(body.dependencies) : null}::jsonb, dependencies),
                issues            = COALESCE(${body.issues != null ? JSON.stringify(body.issues) : null}::jsonb, issues),
                updated_at        = NOW()
            WHERE project_id = ${id} AND id = ${phaseId}
        `;

        await logActivity('project', id, 'phase_updated', `Phase ${phaseId} updated`, body.actor, { phaseId });

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(_req: Request, ctx: Ctx) {
    try {
        const { id, phaseId } = await ctx.params;
        await initDB();
        await sql`DELETE FROM project_phases WHERE project_id = ${id} AND id = ${phaseId}`;
        await logActivity('project', id, 'phase_deleted', `Phase ${phaseId} deleted`);
        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
