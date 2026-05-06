'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Filter, Download, Users, TrendingUp, Clock } from 'lucide-react';

interface EmployeeRow {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    employment_type: string;
    status: string;
    hourly_rate: number | string;
    overtime_rate: number | string | null;
    metrics?: Record<string, unknown> | string;
}

interface TimeEntryRow {
    id: string;
    employee_id: string;
    project_id: string | null;
    date: string;
    hours_regular: number | string;
    hours_overtime: number | string;
    cost_amount: number | string;
    status: string;
}

interface ProjectRow {
    id: string;
    name: string;
    project_number: string;
}

function toNum(v: unknown): number {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
}

function fmtCurrency(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n);
}

export default function EmployeeLaborReportPage() {
    const [employees, setEmployees] = useState<EmployeeRow[]>([]);
    const [timeEntries, setTimeEntries] = useState<TimeEntryRow[]>([]);
    const [projects, setProjects] = useState<Map<string, ProjectRow>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<'CostDesc' | 'HoursDesc' | 'OTPctDesc'>('CostDesc');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const [empRes, teRes, projRes] = await Promise.all([
                    fetch('/api/employees', { cache: 'no-store' }).catch(() => null),
                    fetch('/api/employee-time-entries', { cache: 'no-store' }).catch(() => null),
                    fetch('/api/projects', { cache: 'no-store' }).catch(() => null),
                ]);

                let emps: EmployeeRow[] = [];
                let entries: TimeEntryRow[] = [];
                let projs: ProjectRow[] = [];

                if (empRes && empRes.ok) {
                    const j = await empRes.json();
                    if (Array.isArray(j)) emps = j;
                }
                if (teRes && teRes.ok) {
                    const j = await teRes.json();
                    if (Array.isArray(j)) entries = j;
                } else {
                    // Try alternate path used by other agents
                    const alt = await fetch('/api/time-entries', { cache: 'no-store' }).catch(() => null);
                    if (alt && alt.ok) {
                        const j = await alt.json();
                        if (Array.isArray(j)) entries = j;
                    }
                }
                if (projRes && projRes.ok) {
                    const j = await projRes.json();
                    if (Array.isArray(j)) projs = j;
                }

                if (!cancelled) {
                    setEmployees(emps);
                    setTimeEntries(entries);
                    setProjects(new Map(projs.map((p) => [p.id, p])));
                    setError(null);
                }
            } catch (e) {
                if (!cancelled) setError(String(e));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const yearStart = useMemo(() => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10), []);

    const summaryByEmployee = useMemo(() => {
        const map = new Map<string, { hoursReg: number; hoursOT: number; cost: number; entries: TimeEntryRow[] }>();
        for (const t of timeEntries) {
            if (t.date < yearStart) continue;
            const cur = map.get(t.employee_id) ?? { hoursReg: 0, hoursOT: 0, cost: 0, entries: [] };
            cur.hoursReg += toNum(t.hours_regular);
            cur.hoursOT += toNum(t.hours_overtime);
            cur.cost += toNum(t.cost_amount);
            cur.entries.push(t);
            map.set(t.employee_id, cur);
        }
        return map;
    }, [timeEntries, yearStart]);

    const enriched = useMemo(() => {
        return employees.map((e) => {
            const summary = summaryByEmployee.get(e.id) ?? { hoursReg: 0, hoursOT: 0, cost: 0, entries: [] };
            const totalHours = summary.hoursReg + summary.hoursOT;
            const otPct = totalHours > 0 ? (summary.hoursOT / totalHours) * 100 : 0;
            return {
                id: e.id,
                name: `${e.first_name} ${e.last_name}`,
                role: e.role,
                employmentType: e.employment_type,
                status: e.status,
                hourlyRate: toNum(e.hourly_rate),
                hoursRegular: summary.hoursReg,
                hoursOT: summary.hoursOT,
                totalHours,
                cost: summary.cost,
                otPct,
                entries: summary.entries,
            };
        });
    }, [employees, summaryByEmployee]);

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        const list = enriched.filter((e) => e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q));
        list.sort((a, b) => {
            if (sortOption === 'CostDesc') return b.cost - a.cost;
            if (sortOption === 'HoursDesc') return b.totalHours - a.totalHours;
            return b.otPct - a.otPct;
        });
        return list;
    }, [enriched, searchQuery, sortOption]);

    const totals = useMemo(() => {
        const hours = filtered.reduce((s, e) => s + e.totalHours, 0);
        const cost = filtered.reduce((s, e) => s + e.cost, 0);
        const overtime = filtered.reduce((s, e) => s + e.hoursOT, 0);
        return { hours, cost, overtime, otPct: hours > 0 ? (overtime / hours) * 100 : 0 };
    }, [filtered]);

    const selected = useMemo(() => filtered.find((e) => e.id === selectedEmployeeId) ?? null, [filtered, selectedEmployeeId]);

    const hoursByProjectForSelected = useMemo(() => {
        if (!selected) return [];
        const map = new Map<string, number>();
        for (const t of selected.entries) {
            const projId = t.project_id ?? 'unassigned';
            map.set(projId, (map.get(projId) ?? 0) + toNum(t.hours_regular) + toNum(t.hours_overtime));
        }
        return Array.from(map.entries())
            .map(([projId, hours]) => ({
                projectId: projId,
                hours,
                projectName: projId === 'unassigned' ? 'Unassigned' : projects.get(projId)?.name ?? projId,
            }))
            .sort((a, b) => b.hours - a.hours);
    }, [selected, projects]);

    function exportCsv() {
        const rows = [
            ['Employee', 'Role', 'Status', 'Hourly Rate', 'Regular Hours', 'OT Hours', 'Total Hours', 'OT %', 'Total Cost YTD'],
            ...filtered.map((e) => [
                e.name,
                e.role,
                e.status,
                e.hourlyRate.toFixed(2),
                e.hoursRegular.toFixed(2),
                e.hoursOT.toFixed(2),
                e.totalHours.toFixed(2),
                e.otPct.toFixed(2),
                e.cost.toFixed(2),
            ]),
        ];
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `labor-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin/reports" className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-[#b8956a] hover:text-[#cbb08c] transition-colors mb-4">
                    <ArrowLeft size={14} className="mr-2" />
                    Back to Reports
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="font-serif text-3xl font-bold text-white mb-2">Labor &amp; Employees</h1>
                        <p className="text-white/50 text-sm">Year-to-date hours, payroll burden, hours by project, and overtime analysis.</p>
                    </div>
                    <button
                        onClick={exportCsv}
                        className="h-10 px-5 bg-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/20 transition-colors whitespace-nowrap"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-sm text-red-300">
                    Failed to load data: {error}
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KpiCell
                    label="Total Hours YTD"
                    value={`${totals.hours.toFixed(1)} hrs`}
                    icon={Clock}
                    loading={loading}
                />
                <KpiCell
                    label="Payroll Burden YTD"
                    value={fmtCurrency(totals.cost)}
                    icon={TrendingUp}
                    accentColor="#b8956a"
                    loading={loading}
                />
                <KpiCell
                    label="Overtime Hours"
                    value={`${totals.overtime.toFixed(1)} hrs`}
                    loading={loading}
                />
                <KpiCell
                    label="Overtime %"
                    value={`${totals.otPct.toFixed(1)}%`}
                    accentColor={totals.otPct > 15 ? '#f87171' : '#34d399'}
                    loading={loading}
                />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full md:w-auto">
                    <Filter className="text-white/20 mr-1 shrink-0" size={14} />
                    {[
                        { label: 'Highest Cost', val: 'CostDesc' },
                        { label: 'Most Hours', val: 'HoursDesc' },
                        { label: 'Most OT %', val: 'OTPctDesc' },
                    ].map((opt) => (
                        <button
                            key={opt.val}
                            onClick={() => setSortOption(opt.val as 'CostDesc' | 'HoursDesc' | 'OTPctDesc')}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                                sortOption === opt.val
                                    ? 'bg-white/15 text-white'
                                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                <th className="px-5 py-3 font-semibold">Employee</th>
                                <th className="px-5 py-3 font-semibold text-right">Hourly</th>
                                <th className="px-5 py-3 font-semibold text-right">Reg Hrs</th>
                                <th className="px-5 py-3 font-semibold text-right">OT Hrs</th>
                                <th className="px-5 py-3 font-semibold text-right">OT %</th>
                                <th className="px-5 py-3 font-semibold text-right">Total Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                [0, 1, 2].map((i) => (
                                    <tr key={i}>
                                        <td colSpan={6} className="px-5 py-4">
                                            <div className="h-6 bg-white/5 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-white/40 text-sm">
                                        <Users size={28} className="mx-auto text-white/20 mb-2" />
                                        No employees yet — run seed from the Dashboard to populate demo data.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((e) => {
                                    const isSelected = e.id === selectedEmployeeId;
                                    return (
                                        <tr
                                            key={e.id}
                                            onClick={() => setSelectedEmployeeId(isSelected ? null : e.id)}
                                            className={`cursor-pointer hover:bg-white/[0.03] transition-colors ${isSelected ? 'bg-[#b8956a]/[0.04]' : ''}`}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="font-medium text-white">{e.name}</div>
                                                <div className="text-xs text-white/40 mt-0.5">{e.role} · {e.employmentType}</div>
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono text-white/70">{fmtCurrency(e.hourlyRate)}/hr</td>
                                            <td className="px-5 py-4 text-right font-mono text-white/80">{e.hoursRegular.toFixed(1)}</td>
                                            <td className={`px-5 py-4 text-right font-mono ${e.hoursOT > 0 ? 'text-amber-400' : 'text-white/30'}`}>
                                                {e.hoursOT.toFixed(1)}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className={`font-mono font-semibold ${e.otPct > 15 ? 'text-red-400' : e.otPct > 5 ? 'text-amber-400' : 'text-[#34d399]'}`}>
                                                    {e.otPct.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono text-white font-medium">{fmtCurrency(e.cost)}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Drill-down: hours by project for selected */}
            {selected && (
                <div className="bg-[#1a1a1a] border border-[#b8956a]/30 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">
                        Hours by Project — <span className="text-[#b8956a]">{selected.name}</span>
                    </h3>
                    {hoursByProjectForSelected.length === 0 ? (
                        <p className="text-sm text-white/40">No project hours recorded yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {hoursByProjectForSelected.map((row) => {
                                const max = hoursByProjectForSelected[0].hours;
                                const w = max > 0 ? (row.hours / max) * 100 : 0;
                                return (
                                    <div key={row.projectId}>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <Link
                                                href={row.projectId === 'unassigned' ? '/admin/timesheets' : `/admin/projects/${row.projectId}`}
                                                className="text-white/80 hover:text-[#b8956a] truncate pr-2"
                                            >
                                                {row.projectName}
                                            </Link>
                                            <span className="text-white/60 font-mono shrink-0">{row.hours.toFixed(1)} hrs</span>
                                        </div>
                                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-[#b8956a]/40 to-[#b8956a] rounded-full" style={{ width: `${w}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function KpiCell({
    label,
    value,
    accentColor,
    loading,
    icon: Icon,
}: {
    label: string;
    value: string;
    accentColor?: string;
    loading: boolean;
    icon?: typeof Clock;
}) {
    return (
        <div
            className="bg-[#1a1a1a] border rounded-2xl p-5"
            style={{
                borderColor: accentColor ? `${accentColor}33` : 'rgba(255,255,255,0.06)',
                background: accentColor ? `linear-gradient(135deg, #1a1a1a, ${accentColor}10)` : '#1a1a1a',
            }}
        >
            <div className="flex items-center gap-2 mb-1">
                {Icon && <Icon size={12} style={{ color: accentColor ?? 'rgba(255,255,255,0.4)' }} />}
                <p
                    className="text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: accentColor ?? 'rgba(255,255,255,0.4)' }}
                >
                    {label}
                </p>
            </div>
            {loading ? (
                <div className="h-7 bg-white/5 rounded animate-pulse" />
            ) : (
                <div
                    className="text-xl sm:text-2xl font-bold font-mono"
                    style={{ color: accentColor ?? '#fff' }}
                >
                    {value}
                </div>
            )}
        </div>
    );
}
