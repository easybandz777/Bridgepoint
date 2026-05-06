'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Download, DollarSign } from 'lucide-react';
import { EmployeeTabNav } from '@/components/admin/employee-tab-nav';
import {
    Employee,
    TimeEntry,
    rowToEmployee,
    rowToTimeEntry,
    fmtMoneyCents,
    fmtHours,
    computeWeekTotal,
    mondayOf,
    addDays,
    ymd,
    shortDate,
} from '@/lib/employees';

export default function EmployeePayPage() {
    const params = useParams();
    const id = params?.id as string;
    const [emp, setEmp] = useState<Employee | null>(null);
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const yearStart = `${new Date().getFullYear()}-01-01`;
            const today = ymd(new Date());
            const [empRes, teRes] = await Promise.all([
                fetch(`/api/employees/${id}`),
                fetch(`/api/employees/${id}/time-entries?start=${yearStart}&end=${today}`),
            ]);
            const empData = await empRes.json();
            if (empData && !empData.error) setEmp(rowToEmployee(empData));
            const teData = await teRes.json();
            setEntries(Array.isArray(teData) ? teData.map(rowToTimeEntry) : []);
        } catch {
            setEntries([]);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => { load(); }, [load]);

    if (!emp || loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
            </div>
        );
    }

    const isSalaried = emp.salary != null && emp.hourlyRate === 0;
    const annualSalary = emp.salary ?? 0;

    // Weekly buckets — group entries by Monday-of-week
    const byWeek = new Map<string, TimeEntry[]>();
    for (const e of entries) {
        const wk = mondayOf(new Date(e.date + 'T00:00:00'));
        if (!byWeek.has(wk)) byWeek.set(wk, []);
        byWeek.get(wk)!.push(e);
    }
    const weeks = Array.from(byWeek.entries())
        .map(([wkStart, wkEntries]) => ({
            weekStart: wkStart,
            entries: wkEntries,
            totals: computeWeekTotal(wkEntries, emp.hourlyRate, emp.overtimeRate),
        }))
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

    const ytdGross = isSalaried
        ? estimatedSalaryYTD(annualSalary, emp.hireDate)
        : weeks.reduce((s, w) => s + w.totals.gross, 0);

    const today = ymd(new Date());
    const thisWeekStart = mondayOf(new Date());
    const lastWeekStart = addDays(thisWeekStart, -7);
    const lastTwoWeeksStart = addDays(thisWeekStart, -14);

    // Last completed pay period = bi-weekly, last two weeks before this Monday
    const lastPeriodEntries = entries.filter(e => e.date >= lastTwoWeeksStart && e.date < thisWeekStart);
    const lastPeriodTotals = computeWeekTotal(lastPeriodEntries, emp.hourlyRate, emp.overtimeRate);
    const lastPeriodGross = isSalaried ? annualSalary / 26 : lastPeriodTotals.gross;

    // Projected next period: this week + last week (current bi-weekly window)
    const nextPeriodEntries = entries.filter(e => e.date >= lastWeekStart && e.date <= today);
    const nextPeriodTotals = computeWeekTotal(nextPeriodEntries, emp.hourlyRate, emp.overtimeRate);
    const nextPeriodGross = isSalaried ? annualSalary / 26 : nextPeriodTotals.gross;

    function exportCsv() {
        const rows = [
            ['Week Starting', 'Regular Hours', 'Overtime Hours', 'Total Hours', 'Gross Pay'],
            ...weeks.map(w => [
                w.weekStart,
                w.totals.regular.toFixed(2),
                w.totals.overtime.toFixed(2),
                w.totals.total.toFixed(2),
                w.totals.gross.toFixed(2),
            ]),
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${emp!.lastName}-${emp!.firstName}-pay-${new Date().getFullYear()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-white mb-1">{emp.firstName} {emp.lastName}</h1>
                    <p className="text-sm text-white/50">Pay summary &amp; payroll history</p>
                </div>
                <button
                    onClick={exportCsv}
                    className="h-10 px-5 bg-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                >
                    <Download size={16} /> Export CSV
                </button>
            </div>

            <EmployeeTabNav employeeId={emp.id} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <SummaryCard
                    label="YTD Gross Pay"
                    value={fmtMoneyCents(ytdGross)}
                    sub={isSalaried ? 'Salaried estimate' : `${weeks.length} weeks logged`}
                    highlight
                />
                <SummaryCard
                    label="Last Pay Period"
                    value={fmtMoneyCents(lastPeriodGross)}
                    sub={isSalaried ? 'Bi-weekly draw' : `${fmtHours(lastPeriodTotals.total)} biweekly`}
                />
                <SummaryCard
                    label="Projected Next Period"
                    value={fmtMoneyCents(nextPeriodGross)}
                    sub={isSalaried ? 'Bi-weekly draw' : `${fmtHours(nextPeriodTotals.total)} so far`}
                />
            </div>

            {!isSalaried && (
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 mb-6">
                    <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <DollarSign size={16} className="text-[#b8956a]" /> Rates
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Regular</p>
                            <p className="text-base font-bold text-white">${emp.hourlyRate.toFixed(2)}/h</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Overtime</p>
                            <p className="text-base font-bold text-white">${(emp.overtimeRate ?? emp.hourlyRate * 1.5).toFixed(2)}/h</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Type</p>
                            <p className="text-base font-bold text-white">{emp.employmentType}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Status</p>
                            <p className="text-base font-bold text-white">{emp.status}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-white mb-4">Weekly Breakdown ({weeks.length} weeks)</h2>
                {weeks.length === 0 ? (
                    <p className="text-sm text-white/40">No time entries logged this year yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-[10px] uppercase tracking-widest text-white/40">
                                <tr>
                                    <th className="text-left px-2 py-2">Week of</th>
                                    <th className="text-right px-2 py-2">Reg</th>
                                    <th className="text-right px-2 py-2">OT</th>
                                    <th className="text-right px-2 py-2">Total</th>
                                    <th className="text-right px-2 py-2">Gross</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {weeks.map(w => (
                                    <tr key={w.weekStart} className="hover:bg-white/[0.03] transition-colors">
                                        <td className="px-2 py-3 text-white">{shortDate(w.weekStart)}</td>
                                        <td className="px-2 py-3 text-right font-mono text-white/80">{w.totals.regular.toFixed(1)}h</td>
                                        <td className="px-2 py-3 text-right font-mono text-amber-400">{w.totals.overtime > 0 ? `${w.totals.overtime.toFixed(1)}h` : '—'}</td>
                                        <td className="px-2 py-3 text-right font-mono text-white">{w.totals.total.toFixed(1)}h</td>
                                        <td className="px-2 py-3 text-right font-mono text-white font-bold">{fmtMoneyCents(w.totals.gross)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function SummaryCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
    return (
        <div className={`rounded-2xl p-5 border ${highlight ? 'bg-[#b8956a]/10 border-[#b8956a]/30' : 'bg-[#1a1a1a] border-white/6'}`}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-2">{label}</p>
            <p className="text-3xl font-bold text-white mb-1">{value}</p>
            <p className="text-xs text-white/40">{sub}</p>
        </div>
    );
}

function estimatedSalaryYTD(annual: number, hireDate: string | null): number {
    if (annual <= 0) return 0;
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const start = hireDate && new Date(hireDate) > yearStart ? new Date(hireDate) : yearStart;
    const elapsedMs = now.getTime() - start.getTime();
    const yearMs = (new Date(now.getFullYear() + 1, 0, 1).getTime()) - yearStart.getTime();
    return (annual * elapsedMs) / yearMs;
}
