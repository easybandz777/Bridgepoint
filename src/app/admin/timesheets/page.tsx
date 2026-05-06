'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarDays, ClipboardList } from 'lucide-react';
import {
    Employee,
    TimeEntry,
    rowToEmployee,
    rowToTimeEntry,
    fmtHours,
    mondayOf,
    addDays,
    weekDates,
    dayLabel,
    shortDate,
} from '@/lib/employees';

interface OrgTimeEntry extends TimeEntry {
    employeeFirstName: string;
    employeeLastName: string;
    employeeRole: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToOrgTimeEntry(r: any): OrgTimeEntry {
    return {
        ...rowToTimeEntry(r),
        employeeFirstName: String(r.employee_first_name ?? ''),
        employeeLastName: String(r.employee_last_name ?? ''),
        employeeRole: String(r.employee_role ?? ''),
    };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function OrgTimesheetsPage() {
    const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [entries, setEntries] = useState<OrgTimeEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const start = weekStart;
            const end = addDays(weekStart, 6);
            const [empRes, teRes] = await Promise.all([
                fetch('/api/employees'),
                fetch(`/api/time-entries?start=${start}&end=${end}`),
            ]);
            const empData = await empRes.json();
            setEmployees(Array.isArray(empData) ? empData.map(rowToEmployee) : []);
            const teData = await teRes.json();
            setEntries(Array.isArray(teData) ? teData.map(rowToOrgTimeEntry) : []);
        } catch {
            setEntries([]);
        }
        setLoading(false);
    }, [weekStart]);

    useEffect(() => { load(); }, [load]);

    const days = weekDates(weekStart);

    // Build a [employeeId][dateYmd] -> entries[] map
    const byEmpDay = new Map<string, Map<string, OrgTimeEntry[]>>();
    for (const e of entries) {
        if (!byEmpDay.has(e.employeeId)) byEmpDay.set(e.employeeId, new Map());
        const m = byEmpDay.get(e.employeeId)!;
        if (!m.has(e.date)) m.set(e.date, []);
        m.get(e.date)!.push(e);
    }

    // Filter to active employees who have entries OR who are active
    const activeEmployees = employees.filter(e => e.status === 'Active');

    const dayTotals = days.map(d =>
        entries
            .filter(e => e.date === d)
            .reduce((s, e) => s + e.hoursRegular + e.hoursOvertime, 0),
    );
    const grandTotal = dayTotals.reduce((s, n) => s + n, 0);

    function cellTone(es: OrgTimeEntry[]): string {
        if (!es || es.length === 0) return 'bg-white/[0.02] border-white/5';
        const allApproved = es.every(e => e.status === 'Approved');
        const anyRejected = es.some(e => e.status === 'Rejected');
        if (anyRejected) return 'bg-red-500/10 border-red-500/20';
        if (allApproved) return 'bg-[#34d399]/10 border-[#34d399]/20';
        return 'bg-amber-500/10 border-amber-500/20';
    }

    function cellHours(es: OrgTimeEntry[]): { reg: number; ot: number } {
        return {
            reg: es.reduce((s, e) => s + e.hoursRegular, 0),
            ot: es.reduce((s, e) => s + e.hoursOvertime, 0),
        };
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Admin</p>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">Org Timesheets</h1>
                    <p className="text-sm text-white/50">Week-at-a-glance for the whole crew. Click any cell to drill in.</p>
                </div>
                <Link
                    href="/admin/clock"
                    className="h-10 px-5 bg-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                >
                    <ClipboardList size={16} /> Open Clock-In Terminal
                </Link>
            </div>

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setWeekStart(addDays(weekStart, -7))}
                        className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
                        title="Previous week"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => setWeekStart(mondayOf(new Date()))}
                        className="px-3 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                        <CalendarDays size={14} /> This week
                    </button>
                    <button
                        onClick={() => setWeekStart(addDays(weekStart, 7))}
                        className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
                        title="Next week"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <div className="ml-2">
                        <p className="text-[10px] uppercase tracking-widest text-white/40">Week of</p>
                        <p className="text-sm font-semibold text-white">
                            {shortDate(weekStart)} – {shortDate(addDays(weekStart, 6))}
                        </p>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Crew Hours</p>
                    <p className="text-2xl font-bold text-white font-mono">{grandTotal.toFixed(1)}<span className="text-base text-white/40">h</span></p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
                </div>
            ) : activeEmployees.length === 0 ? (
                <div className="py-16 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.02]">
                    <p className="text-sm text-white/40">No active employees yet. Add one from the directory.</p>
                </div>
            ) : (
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/6 bg-black/20">
                                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-white/40 sticky left-0 bg-black/20 z-10 min-w-[180px]">Employee</th>
                                    {days.map((d, i) => (
                                        <th key={d} className="text-center px-2 py-3 text-[10px] uppercase tracking-widest text-white/40 min-w-[80px]">
                                            <div>{dayLabel(d)}</div>
                                            <div className="text-white/30 normal-case tracking-normal">{shortDate(d)}</div>
                                            <div className="text-[9px] text-[#b8956a] font-mono mt-1">{dayTotals[i].toFixed(1)}h</div>
                                        </th>
                                    ))}
                                    <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-white/40 min-w-[80px]">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeEmployees.map(emp => {
                                    const empDays = byEmpDay.get(emp.id) ?? new Map<string, OrgTimeEntry[]>();
                                    const rowTotal = days.reduce((s, d) => {
                                        const e = empDays.get(d) ?? [];
                                        return s + e.reduce((ss, x) => ss + x.hoursRegular + x.hoursOvertime, 0);
                                    }, 0);
                                    return (
                                        <tr key={emp.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                            <td className="px-4 py-2.5 sticky left-0 bg-[#1a1a1a] z-10 border-r border-white/5">
                                                <Link href={`/admin/employees/${emp.id}/timesheets`} className="block hover:text-[#b8956a] transition-colors">
                                                    <p className="text-sm font-medium text-white">{emp.firstName} {emp.lastName}</p>
                                                    <p className="text-[10px] text-white/40 uppercase tracking-wider">{emp.role}</p>
                                                </Link>
                                            </td>
                                            {days.map(d => {
                                                const es = empDays.get(d) ?? [];
                                                const { reg, ot } = cellHours(es);
                                                const total = reg + ot;
                                                return (
                                                    <td key={d} className="px-1 py-1">
                                                        <Link
                                                            href={`/admin/employees/${emp.id}/timesheets`}
                                                            className={`block h-14 rounded-lg border ${cellTone(es)} flex flex-col items-center justify-center transition-all hover:border-white/20`}
                                                            title={es.length === 0 ? 'No entries' : `${es.length} entr${es.length === 1 ? 'y' : 'ies'}`}
                                                        >
                                                            <p className="text-sm font-bold text-white font-mono">
                                                                {total > 0 ? `${total.toFixed(1)}` : '—'}
                                                            </p>
                                                            {ot > 0 && <p className="text-[9px] text-amber-400 mt-0.5">+{ot.toFixed(1)} OT</p>}
                                                        </Link>
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-2.5 text-right font-bold text-white font-mono">{fmtHours(rowTotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <Legend tone="bg-[#34d399]/10 border-[#34d399]/20" label="All approved" />
                <Legend tone="bg-amber-500/10 border-amber-500/20" label="Pending" />
                <Legend tone="bg-red-500/10 border-red-500/20" label="Has rejected" />
                <Legend tone="bg-white/[0.02] border-white/5" label="No entry" />
            </div>
        </div>
    );
}

function Legend({ tone, label }: { tone: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded border ${tone}`} />
            <span className="text-white/50">{label}</span>
        </div>
    );
}
