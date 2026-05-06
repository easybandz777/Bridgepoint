import { NextResponse } from 'next/server';
import sql, { initDB, genId, logActivity } from '@/lib/db';
import { SAMPLE_PROJECTS } from '@/lib/projects';
import { SAMPLE_CHANGE_ORDERS, SAMPLE_PAYOUTS, SAMPLE_EXPENSES } from '@/lib/job-costing';

/**
 * POST /api/projects/seed
 *
 * Idempotent — uses INSERT ... ON CONFLICT DO NOTHING via primary keys, so re-running
 * never duplicates. Seeds:
 *   - SAMPLE_PROJECTS into projects + project_phases
 *   - SAMPLE_CHANGE_ORDERS into project_change_orders
 *   - SAMPLE_PAYOUTS      into project_bills
 *   - SAMPLE_EXPENSES     into expenses
 *
 * Returns a summary of what was inserted.
 */
export async function POST() {
    try {
        await initDB();

        let projectsInserted = 0;
        let phasesInserted = 0;
        let cosInserted = 0;
        let billsInserted = 0;
        let expensesInserted = 0;

        // ── Projects + phases ──────────────────────────────────────────
        for (const p of SAMPLE_PROJECTS) {
            const existing = await sql`SELECT id FROM projects WHERE id = ${p.id}`;
            if (existing.length === 0) {
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
                        ${p.id},
                        ${p.projectNumber},
                        ${p.name},
                        ${p.status},
                        ${p.clientName},
                        ${p.clientEmail},
                        ${p.clientPhone},
                        ${p.address},
                        ${p.city},
                        ${p.state},
                        ${p.zip},
                        ${p.description},
                        ${p.startDate},
                        ${p.endDate},
                        ${p.estimateId ?? null},
                        ${p.estimateNumber ?? null},
                        ${p.estimatedRevenue},
                        ${p.estimatedCost},
                        ${p.actualCost},
                        ${p.actualRevenue},
                        ${p.invoicedAmount},
                        ${p.collectedAmount},
                        ${p.projectManager},
                        ${JSON.stringify([])}::jsonb,
                        ${JSON.stringify({ alertThresholdPct: p.alertThresholdPct, openCommitments: p.openCommitments })}::jsonb
                    )
                `;
                projectsInserted += 1;
                await logActivity('project', p.id, 'seeded', `Seeded project "${p.name}"`);
            }

            for (const ph of p.phases) {
                const existingPh = await sql`SELECT id FROM project_phases WHERE id = ${ph.id}`;
                if (existingPh.length === 0) {
                    await sql`
                        INSERT INTO project_phases (
                            id, project_id, name, status, phase_order,
                            estimated_budget, actual_cost, completion_pct,
                            start_date, end_date, actual_start_date, actual_end_date,
                            assigned_sub_ids, notes, dependencies, issues
                        ) VALUES (
                            ${ph.id},
                            ${p.id},
                            ${ph.name},
                            ${ph.status},
                            ${ph.order},
                            ${ph.estimatedBudget},
                            ${ph.actualCost},
                            ${ph.completionPct},
                            ${ph.startDate ?? null},
                            ${ph.endDate ?? null},
                            ${ph.actualStartDate ?? null},
                            ${ph.actualEndDate ?? null},
                            ${JSON.stringify(ph.assignedSubIds ?? [])}::jsonb,
                            ${ph.notes ?? ''},
                            ${JSON.stringify(ph.dependencies ?? [])}::jsonb,
                            ${JSON.stringify(ph.issues ?? [])}::jsonb
                        )
                    `;
                    phasesInserted += 1;
                }
            }
        }

        // ── Change orders ───────────────────────────────────────────────
        for (const co of SAMPLE_CHANGE_ORDERS) {
            const existing = await sql`SELECT id FROM project_change_orders WHERE id = ${co.id}`;
            if (existing.length === 0) {
                // Map legacy ChangeOrderStatus → new schema's status field.
                const statusMap: Record<string, string> = {
                    'Pending': 'Pending',
                    'Customer Approved': 'Approved',
                    'Internal Approved': 'Approved',
                    'Rejected': 'Rejected',
                };
                const status = statusMap[co.status] ?? 'Draft';

                await sql`
                    INSERT INTO project_change_orders (
                        id, project_id, change_number, title, description,
                        status, amount, cost_impact, time_impact_days,
                        requested_date, approved_date, requested_by, approved_by,
                        line_items
                    ) VALUES (
                        ${co.id},
                        ${co.projectId},
                        ${co.number},
                        ${co.title},
                        ${co.description},
                        ${status},
                        ${co.customerPriceTarget},
                        ${co.internalCostImpact},
                        ${0},
                        ${co.createdDate},
                        ${co.approvedDate ?? null},
                        ${'Mark'},
                        ${co.customerApproved ? 'Customer' : null},
                        ${JSON.stringify([])}::jsonb
                    )
                `;
                cosInserted += 1;
            }
        }

        // ── Bills (from SAMPLE_PAYOUTS) ─────────────────────────────────
        for (const pay of SAMPLE_PAYOUTS) {
            const billId = `bill-${pay.id}`;
            const existing = await sql`SELECT id FROM project_bills WHERE id = ${billId}`;
            if (existing.length === 0) {
                const statusMap: Record<string, string> = {
                    'Submitted': 'Pending',
                    'Under Review': 'Pending',
                    'Approved': 'Approved',
                    'Partially Approved': 'Approved',
                    'Rejected': 'Rejected',
                    'Paid': 'Paid',
                    'Disputed': 'Disputed',
                    'Pending': 'Pending',
                };
                const status = statusMap[pay.status] ?? 'Pending';

                await sql`
                    INSERT INTO project_bills (
                        id, project_id, phase_id, subcontractor_id, assignment_id,
                        bill_number, amount, status,
                        received_date, due_date, paid_date,
                        description, file_url
                    ) VALUES (
                        ${billId},
                        ${pay.projectId},
                        ${null},
                        ${pay.subcontractorId},
                        ${pay.assignmentId},
                        ${pay.invoiceNumber},
                        ${pay.requestedAmount},
                        ${status},
                        ${pay.submittedDate},
                        ${null},
                        ${pay.paymentDate ?? null},
                        ${pay.notes ?? ''},
                        ${null}
                    )
                `;
                billsInserted += 1;
            }
        }

        // ── Expenses ────────────────────────────────────────────────────
        for (const ex of SAMPLE_EXPENSES) {
            const existing = await sql`SELECT id FROM expenses WHERE id = ${ex.id}`;
            if (existing.length === 0) {
                // Map legacy categories that aren't in the new constrained set.
                const categoryMap: Record<string, string> = {
                    Materials: 'Materials',
                    Equipment: 'Equipment',
                    Permits: 'Permits',
                    Disposal: 'Disposal',
                    Travel: 'Travel',
                    Misc: 'Miscellaneous',
                };
                const category = categoryMap[ex.category] ?? 'Materials';

                await sql`
                    INSERT INTO expenses (
                        id, project_id, phase_id, employee_id,
                        category, vendor, description, amount, date,
                        payment_method, receipt_url,
                        reimbursable, reimbursed, tax_deductible, notes
                    ) VALUES (
                        ${ex.id},
                        ${ex.projectId},
                        ${ex.phaseId ?? null},
                        ${null},
                        ${category},
                        ${ex.vendor},
                        ${ex.description},
                        ${ex.amount},
                        ${ex.dateIncurred ?? ex.date},
                        ${ex.paymentMethod ?? null},
                        ${ex.receiptUrl ?? null},
                        ${ex.isReimbursable ?? ex.reimbursable ?? false},
                        ${ex.status === 'Paid'},
                        ${true},
                        ${ex.notes ?? ''}
                    )
                `;
                expensesInserted += 1;
            }
        }

        return NextResponse.json({
            ok: true,
            projectsInserted,
            phasesInserted,
            cosInserted,
            billsInserted,
            expensesInserted,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

// Allow the seed endpoint to be hit via GET too for convenience.
export const GET = POST;

// Avoid the unused-import warning if sample arrays change shape.
void genId;
