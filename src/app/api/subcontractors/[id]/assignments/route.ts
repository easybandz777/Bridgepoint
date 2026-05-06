import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { dbRowToAssignment, type RowAssignment } from '@/lib/subcontractors';

type Ctx = { params: Promise<{ id: string }> };

interface JoinedAssignmentRow extends RowAssignment {
    project_name: string | null;
    project_status: string | null;
    project_number: string | null;
    project_client: string | null;
}

/**
 * GET /api/subcontractors/[id]/assignments
 *
 * Returns all assignments for a sub, joined with project data.
 */
export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();

        const rows = (await sql`
            SELECT
                sa.*,
                p.name AS project_name,
                p.status AS project_status,
                p.project_number AS project_number,
                p.client_name AS project_client
            FROM subcontractor_assignments sa
            LEFT JOIN projects p ON p.id = sa.project_id
            WHERE sa.subcontractor_id = ${id}
            ORDER BY sa.start_date DESC NULLS LAST, sa.created_at DESC
        `) as unknown as JoinedAssignmentRow[];

        const result = rows.map((r) => ({
            ...dbRowToAssignment(r),
            projectName: r.project_name ?? null,
            projectNumber: r.project_number ?? null,
            projectStatus: r.project_status ?? null,
            projectClient: r.project_client ?? null,
        }));

        return NextResponse.json(result);
    } catch (e) {
        console.error('[GET /api/subcontractors/:id/assignments]', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
