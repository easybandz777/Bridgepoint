import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
    try {
        const { id } = await ctx.params;
        await initDB();
        const rows = await sql`
            SELECT
                e.*,
                ph.name AS phase_name
            FROM expenses e
            LEFT JOIN project_phases ph ON ph.id = e.phase_id
            WHERE e.project_id = ${id}
            ORDER BY e.date DESC
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

        const expenseId = genId('exp');

        await sql`
            INSERT INTO expenses (
                id, project_id, phase_id, employee_id,
                category, vendor, description, amount, date,
                payment_method, receipt_url,
                reimbursable, reimbursed, tax_deductible, notes
            ) VALUES (
                ${expenseId},
                ${id},
                ${body.phaseId ?? null},
                ${body.employeeId ?? null},
                ${body.category ?? 'Materials'},
                ${body.vendor ?? ''},
                ${body.description ?? ''},
                ${body.amount ?? 0},
                ${body.date ?? new Date().toISOString().split('T')[0]},
                ${body.paymentMethod ?? null},
                ${body.receiptUrl ?? null},
                ${body.reimbursable ?? false},
                ${body.reimbursed ?? false},
                ${body.taxDeductible ?? true},
                ${body.notes ?? ''}
            )
        `;

        await logActivity('project', id, 'expense_added', `Expense $${body.amount ?? 0} (${body.category ?? 'Materials'}) added`, body.actor, { expenseId });

        return NextResponse.json({ id: expenseId }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
