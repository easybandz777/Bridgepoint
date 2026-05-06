import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;

function toNum(v: unknown): number {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
}

export async function GET() {
    try {
        await initDB();

        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
        const today = now.toISOString().slice(0, 10);
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);

        // Compute this week start (Monday)
        const day = now.getDay(); // 0 sun
        const offsetToMonday = (day + 6) % 7;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - offsetToMonday);
        weekStart.setHours(0, 0, 0, 0);
        const weekStartStr = weekStart.toISOString().slice(0, 10);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const weekEndStr = weekEnd.toISOString().slice(0, 10);

        // ── KPIs ────────────────────────────────────────────────────────────
        const [revRow] = (await sql`
            SELECT COALESCE(SUM(amount_paid), 0) AS ytd_collected
            FROM invoices
            WHERE issued_date >= ${yearStart}
        `) as Row[];

        const [pipelineRow] = (await sql`
            SELECT COALESCE(SUM(total), 0) AS pipeline
            FROM estimates
            WHERE status IN ('Draft','Sent')
        `) as Row[];

        const [arRow] = (await sql`
            SELECT COALESCE(SUM(amount_due), 0) AS outstanding
            FROM invoices
            WHERE amount_due > 0
        `) as Row[];

        const [activeProjectsRow] = (await sql`
            SELECT COUNT(*)::int AS count
            FROM projects
            WHERE status = 'Active'
        `) as Row[];

        // ── Recent activity (last 8) ────────────────────────────────────────
        const recentActivity = (await sql`
            SELECT id, entity_type, entity_id, action, actor, description, metadata, created_at
            FROM activity_log
            ORDER BY created_at DESC
            LIMIT 8
        `) as Row[];

        // ── Active projects with completion % from phases ────────────────────
        const activeProjects = (await sql`
            SELECT
                p.id, p.project_number, p.name, p.status,
                p.estimated_revenue, p.estimated_cost, p.actual_cost,
                p.start_date, p.end_date,
                COALESCE(
                    (SELECT AVG(completion_pct) FROM project_phases ph WHERE ph.project_id = p.id),
                    0
                ) AS completion_pct
            FROM projects p
            WHERE p.status = 'Active'
            ORDER BY p.created_at DESC
            LIMIT 8
        `) as Row[];

        // ── Attention: over-budget projects ──────────────────────────────────
        const overBudgetProjects = (await sql`
            SELECT id, name, project_number, estimated_cost, actual_cost,
                   (actual_cost - estimated_cost) AS overrun
            FROM projects
            WHERE actual_cost > estimated_cost
              AND status NOT IN ('Completed','Cancelled','Archived')
            ORDER BY (actual_cost - estimated_cost) DESC
            LIMIT 5
        `) as Row[];

        // ── Attention: subs with COI expiring within 30 days ─────────────────
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);
        const expiringCOIs = (await sql`
            SELECT id, company_name, contact_person, insurance_expiry
            FROM subcontractors
            WHERE insurance_expiry IS NOT NULL
              AND insurance_expiry <= ${thirtyDaysFromNow}
              AND status = 'Active'
            ORDER BY insurance_expiry ASC
            LIMIT 8
        `) as Row[];

        // ── Attention: overdue bills ──────────────────────────────────────────
        const overdueBills = (await sql`
            SELECT id, project_id, subcontractor_id, bill_number, amount, due_date
            FROM project_bills
            WHERE due_date IS NOT NULL
              AND due_date < ${today}
              AND status NOT IN ('Paid','Cancelled','Void')
            ORDER BY due_date ASC
            LIMIT 8
        `) as Row[];

        // ── Attention: unapproved time entries ───────────────────────────────
        const [unapprovedTimeRow] = (await sql`
            SELECT COUNT(*)::int AS count,
                   COALESCE(SUM(hours_regular + hours_overtime), 0) AS hours
            FROM employee_time_entries
            WHERE status = 'Pending'
        `) as Row[];

        // ── This Week widget ──────────────────────────────────────────────────
        const [hoursThisWeekRow] = (await sql`
            SELECT COALESCE(SUM(hours_regular + hours_overtime), 0) AS hours
            FROM employee_time_entries
            WHERE date >= ${weekStartStr} AND date <= ${weekEndStr}
        `) as Row[];

        const [billsThisWeekRow] = (await sql`
            SELECT COUNT(*)::int AS count,
                   COALESCE(SUM(amount), 0) AS total
            FROM project_bills
            WHERE due_date IS NOT NULL
              AND due_date >= ${weekStartStr}
              AND due_date <= ${weekEndStr}
              AND status NOT IN ('Paid','Cancelled','Void')
        `) as Row[];

        const [estimatesExpiringRow] = (await sql`
            SELECT COUNT(*)::int AS count
            FROM estimates
            WHERE valid_until IS NOT NULL
              AND valid_until >= ${today}
              AND valid_until <= ${sevenDaysFromNow}
              AND status IN ('Draft','Sent')
        `) as Row[];

        // ── Invoice summary counts ───────────────────────────────────────────
        const invoiceCounts = (await sql`
            SELECT status, COUNT(*)::int AS count
            FROM invoices
            GROUP BY status
        `) as Row[];

        // ── Estimate counts ─────────────────────────────────────────────────
        const estimateCounts = (await sql`
            SELECT status, COUNT(*)::int AS count
            FROM estimates
            GROUP BY status
        `) as Row[];

        return NextResponse.json({
            kpis: {
                ytdCollected: toNum(revRow?.ytd_collected),
                pipelineValue: toNum(pipelineRow?.pipeline),
                outstandingAR: toNum(arRow?.outstanding),
                activeProjects: toNum(activeProjectsRow?.count),
            },
            recentActivity,
            activeProjects: activeProjects.map((p) => ({
                id: p.id,
                projectNumber: p.project_number,
                name: p.name,
                status: p.status,
                estimatedRevenue: toNum(p.estimated_revenue),
                estimatedCost: toNum(p.estimated_cost),
                actualCost: toNum(p.actual_cost),
                startDate: p.start_date,
                endDate: p.end_date,
                completionPct: Math.round(toNum(p.completion_pct)),
            })),
            attention: {
                overBudget: overBudgetProjects.map((p) => ({
                    id: p.id,
                    name: p.name,
                    projectNumber: p.project_number,
                    estimatedCost: toNum(p.estimated_cost),
                    actualCost: toNum(p.actual_cost),
                    overrun: toNum(p.overrun),
                })),
                expiringCOIs,
                overdueBills: overdueBills.map((b) => ({
                    id: b.id,
                    projectId: b.project_id,
                    subcontractorId: b.subcontractor_id,
                    billNumber: b.bill_number,
                    amount: toNum(b.amount),
                    dueDate: b.due_date,
                })),
                unapprovedTime: {
                    count: toNum(unapprovedTimeRow?.count),
                    hours: toNum(unapprovedTimeRow?.hours),
                },
            },
            thisWeek: {
                hoursLogged: toNum(hoursThisWeekRow?.hours),
                billsDue: {
                    count: toNum(billsThisWeekRow?.count),
                    total: toNum(billsThisWeekRow?.total),
                },
                estimatesExpiring: toNum(estimatesExpiringRow?.count),
                weekStart: weekStartStr,
                weekEnd: weekEndStr,
            },
            invoiceCounts: invoiceCounts.reduce<Record<string, number>>((acc, r) => {
                acc[String(r.status)] = toNum(r.count);
                return acc;
            }, {}),
            estimateCounts: estimateCounts.reduce<Record<string, number>>((acc, r) => {
                acc[String(r.status)] = toNum(r.count);
                return acc;
            }, {}),
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
