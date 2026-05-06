import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const rows = await sql`
            SELECT
                b.*,
                s.company_name AS subcontractor_name,
                ph.name        AS phase_name
            FROM project_bills b
            LEFT JOIN subcontractors s ON s.id = b.subcontractor_id
            LEFT JOIN project_phases  ph ON ph.id = b.phase_id
            WHERE b.project_id = ${id}
            ORDER BY b.received_date DESC NULLS LAST, b.created_at DESC
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

        const billId = genId('bill');

        await sql`
            INSERT INTO project_bills (
                id, project_id, phase_id, subcontractor_id, assignment_id,
                bill_number, amount, status,
                received_date, due_date, paid_date,
                description, file_url
            ) VALUES (
                ${billId},
                ${id},
                ${body.phaseId ?? null},
                ${body.subcontractorId ?? null},
                ${body.assignmentId ?? null},
                ${body.billNumber ?? body.invoiceNumber ?? null},
                ${body.amount ?? 0},
                ${body.status ?? 'Pending'},
                ${body.receivedDate ?? new Date().toISOString().split('T')[0]},
                ${body.dueDate ?? null},
                ${body.paidDate ?? null},
                ${body.description ?? ''},
                ${body.fileUrl ?? null}
            )
        `;

        await logActivity('project', id, 'bill_added', `Bill ${body.billNumber ?? billId} added ($${body.amount ?? 0})`, body.actor, { billId });

        return NextResponse.json({ id: billId }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
