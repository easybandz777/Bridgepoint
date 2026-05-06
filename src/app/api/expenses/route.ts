import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';

/**
 * GET /api/expenses
 * Org-wide expense list. Optional ?projectId=...&category=...&from=YYYY-MM-DD&to=YYYY-MM-DD filter.
 */
export async function GET(req: Request) {
    try {
        await initDB();
        const url = new URL(req.url);
        const projectId = url.searchParams.get('projectId');
        const category = url.searchParams.get('category');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');

        // Use a single dynamic-friendly query via fragments. neon driver only supports
        // tagged-template params, so we fan out to a few branches:
        let rows;
        if (projectId && category) {
            rows = await sql`SELECT e.*, p.name AS project_name FROM expenses e LEFT JOIN projects p ON p.id = e.project_id WHERE e.project_id = ${projectId} AND e.category = ${category} ORDER BY e.date DESC`;
        } else if (projectId) {
            rows = await sql`SELECT e.*, p.name AS project_name FROM expenses e LEFT JOIN projects p ON p.id = e.project_id WHERE e.project_id = ${projectId} ORDER BY e.date DESC`;
        } else if (category) {
            rows = await sql`SELECT e.*, p.name AS project_name FROM expenses e LEFT JOIN projects p ON p.id = e.project_id WHERE e.category = ${category} ORDER BY e.date DESC`;
        } else if (from && to) {
            rows = await sql`SELECT e.*, p.name AS project_name FROM expenses e LEFT JOIN projects p ON p.id = e.project_id WHERE e.date BETWEEN ${from} AND ${to} ORDER BY e.date DESC`;
        } else {
            rows = await sql`SELECT e.*, p.name AS project_name FROM expenses e LEFT JOIN projects p ON p.id = e.project_id ORDER BY e.date DESC LIMIT 500`;
        }

        return NextResponse.json(rows);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
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
                ${body.projectId ?? null},
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

        if (body.projectId) {
            await logActivity('project', body.projectId, 'expense_added', `Expense $${body.amount ?? 0} (${body.category ?? 'Materials'}) added`, body.actor, { expenseId });
        } else {
            await logActivity('expense', expenseId, 'created', `Overhead expense $${body.amount ?? 0} (${body.category ?? 'Materials'})`, body.actor);
        }

        return NextResponse.json({ id: expenseId }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
