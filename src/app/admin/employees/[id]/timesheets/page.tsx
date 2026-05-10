'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check, X, Plus, CalendarDays } from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';
import { EmployeeTabNav } from '@/components/admin/employee-tab-nav';
import {
    Employee,
    TimeEntry,
    rowToEmployee,
    rowToTimeEntry,
    fmtMoney,
    fmtMoneyCents,
    fmtHours,
    computeWeekTotal,
    mondayOf,
    addDays,
    weekDates,
    dayLabel,
    shortDate,
    ymd,
} from '@/lib/employees';

interface ProjectLite {
    id: string;
    project_number: string;
    name: string;
}

export default function EmployeeTimesheetsPage() {
    const params = useParams();
    const id = params?.id as string;
    const [emp, setEmp] = useState<Employee | null>(null);
    const [weekStart, setWeekStart] = useState<string>(() => mondayOf(new Date()));
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
    const [projects, setProjects] = useState<ProjectLite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);

    // Add form state
    const [addDate, setAddDate] = useState(ymd(new Date()));
    const [addReg, setAddReg] = useState('8');
    const [addOt, setAddOt] = useState('0');
    const [addProject, setAddProject] = useState('');
    const [addNotes, setAddNotes] = useState('');

    const loadEmp = useCallback(async () => {
        const res = await fetch(`/api/employees/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        setEmp(rowToEmployee(data));
    }, [id]);

    const loadWeek = useCallback(async () => {
        setLoading(true);
        try {
            const start = weekStart;
            const end = addDays(weekStart, 6);
            const res = await fetch(`/api/employees/${id}/time-entries?start=${start}&end=${end}`);
            const data = await res.json();
            setEntries(Array.isArray(data) ? data.map(rowToTimeEntry) : []);
        } catch {
            setEntries([]);
        }
        setLoading(false);
    }, [id, weekStart]);

    const loadAll = useCallback(async () => {
        try {
            const yearStart = `${new Date().getFullYear()}-01-01`;
            const today = ymd(new Date());
            const res = await fetch(`/api/employees/${id}/time-entries?start=${yearStart}&end=${today}`);
            const data = await res.json();
            setAllEntries(Array.isArray(data) ? data.map(rowToTimeEntry) : []);
        } catch {
            setAllEntries([]);
        }
    }, [id]);

    const loadProjects = useCallback(async () => {
        try {
            const res = await fetch('/api/projects');
            if (!res.ok) {
                setProjects([]);
                return;
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setProjects(data.map(p => ({
                    id: p.id,
                    project_number: p.project_number ?? '',
                    name: p.name ?? '',
                })));
            }
        } catch {
            setProjects([]);
        }
    }, []);

    useEffect(() => {
        if (!id) return;
        loadEmp();
        loadAll();
        loadProjects();
    }, [id, loadEmp, loadAll, loadProjects]);

    useEffect(() => {
        if (!id) return;
        loadWeek();
    }, [id, weekStart, loadWeek]);

    const days = weekDates(weekStart);
    const byDate: Record<string, TimeEntry[]> = {};
    days.forEach(d => { byDate[d] = []; });
    entries.forEach(te => {
        if (byDate[te.date]) byDate[te.date].push(te);
    });

    const weekTotal = emp
        ? computeWeekTotal(entries, emp.hourlyRate, emp.overtimeRate)
        : { regular: 0, overtime: 0, total: 0, gross: 0 };

    // Bi-weekly: this week + last week
    const lastWeekStart = addDays(weekStart, -7);
    const lastWeekEnd = addDays(weekStart, -1);
    const lastWeekEntries = allEntries.filter(e => e.date >= lastWeekStart && e.date <= lastWeekEnd);
    const biWeekTotal = emp
        ? computeWeekTotal([...entries, ...lastWeekEntries], emp.hourlyRate, emp.overtimeRate)
        : { regular: 0, overtime: 0, total: 0, gross: 0 };

    // YTD
    const ytdTotal = emp
        ? computeWeekTotal(allEntries, emp.hourlyRate, emp.overtimeRate)
        : { regular: 0, overtime: 0, total: 0, gross: 0 };

    const pendingIds = entries.filter(e => e.status === 'Pending').map(e => e.id);

    async function bulkApprove() {
        if (pendingIds.length === 0) return;
        if (!confirm(`Approve ${pendingIds.length} pending entr${pendingIds.length === 1 ? 'y' : 'ies'}?`)) return;
        await Promise.all(pendingIds.map(eid =>
            fetch(`/api/employees/${id}/time-entries/${eid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Approved' }),
            })
        ));
        loadWeek();
        loadAll();
    }

    async function setStatus(entryId: string, status: 'Approved' | 'Rejected') {
        await fetch(`/api/employees/${id}/time-entries/${entryId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        loadWeek();
        loadAll();
    }

    async function deleteEntry(entryId: string) {
        if (!confirm('Delete this time entry?')) return;
        await fetch(`/api/employees/${id}/time-entries/${entryId}`, { method: 'DELETE' });
        loadWeek();
        loadAll();
    }

    async function addEntry(e: React.FormEvent) {
        e.preventDefault();
        await fetch(`/api/employees/${id}/time-entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: addDate,
                hoursRegular: Number(addReg || 0),
                hoursOvertime: Number(addOt || 0),
                projectId: addProject || null,
                notes: addNotes,
                status: 'Pending',
            }),
        });
        setShowAdd(false);
        setAddNotes('');
        loadWeek();
        loadAll();
    }

    if (!emp) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{emp.firstName} {emp.lastName}</h1>
                <p className="text-sm text-white/50">Timesheets, approvals, and pay calculations</p>
            </div>

            <EmployeeTabNav employeeId={emp.id} />

            {/* Week navigator */}
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
                <div className="flex items-center gap-2">
                    {pendingIds.length > 0 && (
                        <button
                            onClick={bulkApprove}
                            className="h-9 px-4 bg-[#34d399]/15 border border-[#34d399]/30 text-[#34d399] text-xs font-semibold rounded-lg hover:bg-[#34d399]/25 transition-colors flex items-center gap-1.5"
                        >
                            <Check size={14} /> Approve all ({pendingIds.length})
                        </button>
                    )}
                    <button
                        onClick={() => setShowAdd(s => !s)}
                        className="h-9 px-4 bg-[#b8956a] text-black text-xs font-semibold rounded-lg hover:bg-[#cbb08c] transition-colors flex items-center gap-1.5"
                    >
                        <Plus size={14} /> Add entry
                    </button>
                </div>
            </div>

            {showAdd && (
                <form onSubmit={addEntry} className="bg-[#1a1a1a] border border-[#b8956a]/30 rounded-2xl p-5 mb-6">
                    <h3 className="text-sm font-semibold text-white mb-4">New Time Entry</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                        <label className="flex flex-col gap-1 sm:col-span-2">
                            <span className="text-[10px] uppercase tracking-widest text-white/50">Date</span>
                            <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)} required className={inputCls} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-white/50">Regular (h)</span>
                            <input type="number" inputMode="decimal" step="0.25" min="0" value={addReg} onChange={e => setAddReg(e.target.value)} className={inputCls} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-white/50">Overtime (h)</span>
                            <input type="number" inputMode="decimal" step="0.25" min="0" value={addOt} onChange={e => setAddOt(e.target.value)} className={inputCls} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-white/50">Project</span>
                            <select value={addProject} onChange={e => setAddProject(e.target.value)} className={inputCls}>
                                <option value="">— None —</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.project_number || p.id} · {p.name}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <label className="flex flex-col gap-1 mb-4">
                        <span className="text-[10px] uppercase tracking-widest text-white/50">Notes</span>
                        <input value={addNotes} onChange={e => setAddNotes(e.target.value)} className={inputCls} />
                    </label>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAdd(false)} className="h-9 px-4 text-xs text-white/60 hover:text-white transition-colors">Cancel</button>
                        <button type="submit" className="h-9 px-4 bg-[#b8956a] text-black text-xs font-semibold rounded-lg hover:bg-[#cbb08c] transition-colors">Save</button>
                    </div>
                </form>
            )}

            {/* Day grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-6">
                {days.map(d => {
                    const dayEntries = byDate[d];
                    const reg = dayEntries.reduce((s, e) => s + e.hoursRegular, 0);
                    const ot = dayEntries.reduce((s, e) => s + e.hoursOvertime, 0);
                    const total = reg + ot;
                    const allApproved = dayEntries.length > 0 && dayEntries.every(e => e.status === 'Approved');
                    const anyRejected = dayEntries.some(e => e.status === 'Rejected');
                    const tone = anyRejected
                        ? 'border-red-500/30 bg-red-500/5'
                        : allApproved
                            ? 'border-[#34d399]/20 bg-[#34d399]/5'
                            : dayEntries.length > 0
                                ? 'border-amber-500/20 bg-amber-500/5'
                                : 'border-white/6 bg-[#1a1a1a]';
                    return (
                        <div key={d} className={`border rounded-xl p-3 min-h-[120px] flex flex-col ${tone}`}>
                            <div className="flex justify-between items-baseline mb-2">
                                <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">{dayLabel(d)}</p>
                                <p className="text-[10px] text-white/40">{shortDate(d)}</p>
                            </div>
                            <p className="text-2xl font-bold text-white font-mono">{total.toFixed(1)}<span className="text-xs text-white/40">h</span></p>
                            {ot > 0 && (
                                <p className="text-[10px] text-amber-400 mt-1">+{ot.toFixed(1)}h OT</p>
                            )}
                            <div className="mt-auto pt-2 space-y-1">
                                {dayEntries.length === 0 ? (
                                    <p className="text-[10px] text-white/30">No entry</p>
                                ) : (
                                    dayEntries.map(e => (
                                        <div key={e.id} className="flex items-center justify-between text-[10px] gap-1">
                                            <StatusBadge status={e.status} className="!text-[9px] !px-1.5 !py-0" />
                                            {e.status === 'Pending' && (
                                                <span className="flex gap-0.5">
                                                    <button onClick={() => setStatus(e.id, 'Approved')} title="Approve" className="w-5 h-5 rounded bg-[#34d399]/15 text-[#34d399] hover:bg-[#34d399]/25 flex items-center justify-center transition-colors">
                                                        <Check size={10} />
                                                    </button>
                                                    <button onClick={() => setStatus(e.id, 'Rejected')} title="Reject" className="w-5 h-5 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 flex items-center justify-center transition-colors">
                                                        <X size={10} />
                                                    </button>
                                                </span>
                                            )}
                                            {e.status !== 'Pending' && (
                                                <button onClick={() => deleteEntry(e.id)} title="Delete" className="text-white/30 hover:text-red-400 transition-colors text-[10px]">×</button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <TotalCard label="This Week" total={weekTotal} />
                <TotalCard label="Bi-Weekly" total={biWeekTotal} />
                <TotalCard label="Year-to-Date" total={ytdTotal} highlight />
            </div>

            {loading && (
                <p className="text-center text-xs text-white/40">Loading…</p>
            )}
        </div>
    );
}

const inputCls = 'h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all';

function TotalCard({ label, total, highlight }: { label: string; total: { regular: number; overtime: number; total: number; gross: number }; highlight?: boolean }) {
    return (
        <div className={`rounded-2xl p-5 border ${highlight ? 'bg-[#b8956a]/10 border-[#b8956a]/30' : 'bg-[#1a1a1a] border-white/6'}`}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-3">{label}</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest mb-0.5">Reg</p>
                    <p className="text-base font-bold text-white font-mono">{fmtHours(total.regular)}</p>
                </div>
                <div>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest mb-0.5">OT</p>
                    <p className="text-base font-bold text-amber-400 font-mono">{fmtHours(total.overtime)}</p>
                </div>
                <div>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest mb-0.5">Total</p>
                    <p className="text-base font-bold text-white font-mono">{fmtHours(total.total)}</p>
                </div>
            </div>
            <div className="pt-3 border-t border-white/6">
                <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Gross Pay</p>
                <p className="text-2xl font-bold text-white">{fmtMoneyCents(total.gross)}</p>
            </div>
        </div>
    );
}
