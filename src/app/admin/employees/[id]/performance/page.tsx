'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Star, Briefcase, Clock, Award, TrendingUp } from 'lucide-react';
import { EmployeeTabNav } from '@/components/admin/employee-tab-nav';
import {
    Employee,
    TimeEntry,
    rowToEmployee,
    rowToTimeEntry,
    fmtHours,
    fmtMoney,
    addDays,
    ymd,
} from '@/lib/employees';

export default function EmployeePerformancePage() {
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

    // Compute stats
    const projectIds = Array.from(new Set(entries.map(e => e.projectId).filter(Boolean) as string[]));
    const totalHours = entries.reduce((s, e) => s + e.hoursRegular + e.hoursOvertime, 0);
    const totalCost = entries.reduce((s, e) => s + e.costAmount, 0);

    // Approximate weeks worked: distinct ISO week numbers seen.
    const weeksSeen = new Set(entries.map(e => {
        const d = new Date(e.date + 'T00:00:00');
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
        return `${d.getFullYear()}-${week}`;
    }));
    const avgPerWeek = weeksSeen.size > 0 ? totalHours / weeksSeen.size : 0;

    // Attendance: weekdays in YTD that had any time entry, divided by total weekdays
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const weekdaysInYear: string[] = [];
    for (let d = new Date(yearStart); d <= today; d = new Date(d.getTime() + 86400000)) {
        const day = d.getDay();
        if (day !== 0 && day !== 6) weekdaysInYear.push(ymd(d));
    }
    const datesWorked = new Set(entries.filter(e => e.hoursRegular + e.hoursOvertime > 0).map(e => e.date));
    const expectedWorkdays = weekdaysInYear.filter(d => {
        if (!emp.hireDate) return true;
        return d >= emp.hireDate;
    }).length;
    const workedDays = weekdaysInYear.filter(d => datesWorked.has(d)).length;
    const attendanceScore = expectedWorkdays > 0 ? Math.min(100, Math.round((workedDays / expectedWorkdays) * 100)) : 0;

    const last30 = entries.filter(e => e.date >= addDays(ymd(today), -30));
    const last30Hours = last30.reduce((s, e) => s + e.hoursRegular + e.hoursOvertime, 0);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{emp.firstName} {emp.lastName}</h1>
                <p className="text-sm text-white/50">Performance, attendance, and project history</p>
            </div>

            <EmployeeTabNav employeeId={emp.id} />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Stat icon={<Briefcase size={16} />} label="Projects Touched" value={String(projectIds.length)} />
                <Stat icon={<Clock size={16} />} label="Hours YTD" value={fmtHours(totalHours)} />
                <Stat icon={<TrendingUp size={16} />} label="Avg / Week" value={fmtHours(avgPerWeek)} />
                <Stat icon={<Star size={16} />} label="Avg Rating" value={emp.metrics.avgRating.toFixed(1)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-6">Productivity</h2>

                    <div className="space-y-5">
                        <Metric label="Attendance Score" value={`${attendanceScore}%`} barPct={attendanceScore} barColor="#34d399" />
                        <Metric label="Last 30 days" value={fmtHours(last30Hours)} barPct={Math.min(100, (last30Hours / 160) * 100)} barColor="#b8956a" />
                        <Metric
                            label="Billable Cost YTD"
                            value={fmtMoney(totalCost)}
                            barPct={emp.salary ? 100 : Math.min(100, (totalCost / (emp.hourlyRate * 2080)) * 100)}
                            barColor="#60a5fa"
                        />
                    </div>
                </div>

                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Award className="text-[#b8956a]" size={16} /> Recognition
                    </h2>
                    <div className="space-y-3">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Tenure</p>
                            <p className="text-sm font-bold text-white">
                                {emp.hireDate ? yearsSince(emp.hireDate) : '—'}
                            </p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Certifications</p>
                            <p className="text-sm font-bold text-white">{emp.certifications.length} on file</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Jobs Completed</p>
                            <p className="text-sm font-bold text-white">{emp.metrics.jobsCompleted}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-white mb-4">Project History (YTD)</h2>
                {projectIds.length === 0 ? (
                    <p className="text-sm text-white/40">No project-tagged time entries yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {projectIds.map(pid => {
                            const proj = entries.filter(e => e.projectId === pid);
                            const hrs = proj.reduce((s, e) => s + e.hoursRegular + e.hoursOvertime, 0);
                            const cost = proj.reduce((s, e) => s + e.costAmount, 0);
                            return (
                                <li key={pid} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-sm text-white font-mono">{pid}</span>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-white/60">{fmtHours(hrs)}</span>
                                        <span className="text-white font-mono">{fmtMoney(cost)}</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-2">
                {icon}
                {label}
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    );
}

function Metric({ label, value, barPct, barColor }: { label: string; value: string; barPct: number; barColor: string }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60">{label}</span>
                <span className="text-sm font-bold text-white">{value}</span>
            </div>
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, barPct))}%`, background: barColor }} />
            </div>
        </div>
    );
}

function yearsSince(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const yrs = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (yrs < 1) return `${Math.round(yrs * 12)} mo`;
    return `${yrs.toFixed(1)} yrs`;
}
