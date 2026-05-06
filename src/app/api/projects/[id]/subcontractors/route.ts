import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/projects/:id/subcontractors
 *
 * Read-only join: subcontractor_assignments × subcontractors × project_phases
 * for the assignments tied to this project.
 *
 * The subs API owns the underlying tables — we just read.
 */
export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const rows = await sql`
            SELECT
                a.id                  AS assignment_id,
                a.subcontractor_id,
                a.phase_id,
                a.scope_of_work,
                a.assignment_status,
                a.agreed_amount,
                a.billed_amount,
                a.approved_amount,
                a.paid_amount,
                a.start_date,
                a.end_date,
                a.completion_pct,
                a.rating,
                a.notes,
                s.company_name,
                s.contact_person,
                s.phone,
                s.email,
                s.rating              AS sub_rating,
                s.insurance_expiry,
                ph.name               AS phase_name
            FROM subcontractor_assignments a
            LEFT JOIN subcontractors s   ON s.id  = a.subcontractor_id
            LEFT JOIN project_phases  ph ON ph.id = a.phase_id
            WHERE a.project_id = ${id}
            ORDER BY a.created_at DESC
        `;
        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
