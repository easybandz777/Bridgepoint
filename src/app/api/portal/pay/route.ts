import { NextResponse } from 'next/server';
import sql, { initDB } from '@/lib/db';
import { getPortalUserFromCookie } from '@/lib/portal-auth';
import { computeWeekTotal, mondayOf, addDays } from '@/lib/employees';

export const dynamic = 'force-dynamic';

interface EmployeeRow {
    hourly_rate: string | number;
    overtime_rate: string | number | null;
    salary: string | number | null;
}

interface TimeEntryRow {
    date: string;
    hours_regular: string | number;
    hours_overtime: string | number;
    status: string;
}

interface AssignmentRow {
    id: string;
    project_id: string | null;
    scope_of_work: string;
    agreed_amount: string | number;
    billed_amount: string | number;
    approved_amount: string | number;
    paid_amount: string | number;
    completion_pct: string | number;
    assignment_status: string;
    start_date: string | null;
    end_date: string | null;
}

function num(v: string | number | null | undefined): number {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
}

export async function GET() {
    const user = await getPortalUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await initDB();

        if (user.userType === 'employee') {
            const empRows = (await sql`
                SELECT hourly_rate, overtime_rate, salary
                FROM employees WHERE id = ${user.userId}
            `) as unknown as EmployeeRow[];
            if (empRows.length === 0) {
                return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
            }
            const emp = empRows[0];
            const hourlyRate = num(emp.hourly_rate);
            const overtimeRate = emp.overtime_rate != null ? num(emp.overtime_rate) : null;
            const salary = emp.salary != null ? num(emp.salary) : null;

            const todayMonday = mondayOf(new Date());
            const earliestMonday = addDays(todayMonday, -7 * 5);

            const entries = (await sql`
                SELECT date, hours_regular, hours_overtime, status
                FROM employee_time_entries
                WHERE employee_id = ${user.userId}
                  AND date >= ${earliestMonday}
                ORDER BY date ASC
            `) as unknown as TimeEntryRow[];

            const yearStart = `${new Date().getFullYear()}-01-01`;
            const ytdRows = (await sql`
                SELECT
                    COALESCE(SUM(hours_regular), 0)::numeric  AS regular,
                    COALESCE(SUM(hours_overtime), 0)::numeric AS overtime
                FROM employee_time_entries
                WHERE employee_id = ${user.userId}
                  AND date >= ${yearStart}
            `) as unknown as { regular: string | number; overtime: string | number }[];
            const ytdRegular = num(ytdRows[0]?.regular);
            const ytdOvertime = num(ytdRows[0]?.overtime);
            const ytdTotals = computeWeekTotal(
                [{ hoursRegular: ytdRegular, hoursOvertime: ytdOvertime }],
                hourlyRate,
                overtimeRate,
            );

            const weeks: {
                weekStart: string;
                weekEnd: string;
                regular: number;
                overtime: number;
                total: number;
                gross: number;
                status: 'Pending' | 'Approved' | 'Mixed' | 'Empty';
            }[] = [];

            for (let i = 0; i < 6; i++) {
                const weekStart = addDays(todayMonday, -7 * i);
                const weekEnd = addDays(weekStart, 6);
                const weekEntries = entries.filter(e => e.date >= weekStart && e.date <= weekEnd);
                const wkTotal = computeWeekTotal(
                    weekEntries.map(e => ({
                        hoursRegular: num(e.hours_regular),
                        hoursOvertime: num(e.hours_overtime),
                    })),
                    hourlyRate,
                    overtimeRate,
                );

                let status: 'Pending' | 'Approved' | 'Mixed' | 'Empty' = 'Empty';
                if (weekEntries.length > 0) {
                    const statuses = new Set(weekEntries.map(e => e.status));
                    if (statuses.size === 1) {
                        const only = [...statuses][0];
                        status = only === 'Approved' ? 'Approved' : 'Pending';
                    } else {
                        status = 'Mixed';
                    }
                }

                weeks.push({
                    weekStart,
                    weekEnd,
                    regular: wkTotal.regular,
                    overtime: wkTotal.overtime,
                    total: wkTotal.total,
                    gross: wkTotal.gross,
                    status,
                });
            }

            return NextResponse.json({
                userType: 'employee',
                employee: {
                    hourlyRate,
                    overtimeRate,
                    salary,
                },
                weeks,
                ytd: {
                    regular: ytdTotals.regular,
                    overtime: ytdTotals.overtime,
                    total: ytdTotals.total,
                    gross: ytdTotals.gross,
                },
            });
        }

        if (user.userType === 'subcontractor') {
            const rows = (await sql`
                SELECT id, project_id, scope_of_work, agreed_amount, billed_amount,
                       approved_amount, paid_amount, completion_pct, assignment_status,
                       start_date, end_date
                FROM subcontractor_assignments
                WHERE subcontractor_id = ${user.userId}
                ORDER BY created_at DESC
            `) as unknown as AssignmentRow[];

            const projectIds = Array.from(
                new Set(rows.map(r => r.project_id).filter((x): x is string => !!x)),
            );
            const projectsById = new Map<string, string>();
            if (projectIds.length > 0) {
                const projRows = (await sql`
                    SELECT id, name FROM projects WHERE id = ANY(${projectIds}::text[])
                `) as unknown as { id: string; name: string }[];
                for (const p of projRows) projectsById.set(p.id, p.name);
            }

            let agreedTotal = 0;
            let billedTotal = 0;
            let approvedTotal = 0;
            let paidTotal = 0;
            const assignments = rows.map(r => {
                const agreed = num(r.agreed_amount);
                const billed = num(r.billed_amount);
                const approved = num(r.approved_amount);
                const paid = num(r.paid_amount);
                agreedTotal += agreed;
                billedTotal += billed;
                approvedTotal += approved;
                paidTotal += paid;
                return {
                    id: r.id,
                    projectId: r.project_id ?? '',
                    projectName: r.project_id ? (projectsById.get(r.project_id) ?? '') : '',
                    scopeOfWork: r.scope_of_work ?? '',
                    agreedAmount: agreed,
                    billedAmount: billed,
                    paidAmount: paid,
                    completionPct: Math.round(num(r.completion_pct)),
                    status: r.assignment_status ?? 'Assigned',
                    startDate: r.start_date,
                    endDate: r.end_date,
                };
            });

            return NextResponse.json({
                userType: 'subcontractor',
                totals: {
                    agreedAmount: agreedTotal,
                    billedAmount: billedTotal,
                    approvedAmount: approvedTotal,
                    paidAmount: paidTotal,
                },
                assignments,
            });
        }

        return NextResponse.json({ error: 'Unknown user type' }, { status: 500 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
