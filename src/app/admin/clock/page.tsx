'use client';

import { useEffect, useState, useCallback } from 'react';
import { LogIn, LogOut, Clock, CheckCircle2 } from 'lucide-react';
import {
    Employee,
    rowToEmployee,
    fmtHours,
    ymd,
} from '@/lib/employees';

interface ProjectLite {
    id: string;
    project_number: string;
    name: string;
    status: string;
}

type ClockState = {
    employeeId: string;
    projectId: string | null;
    startedAt: string; // ISO
};

const STORAGE_KEY = 'bp_clock_active';

export default function ClockPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [projects, setProjects] = useState<ProjectLite[]>([]);
    const [selectedEmpId, setSelectedEmpId] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [active, setActive] = useState<Record<string, ClockState>>({});
    const [now, setNow] = useState(() => new Date());
    const [busy, setBusy] = useState(false);
    const [flash, setFlash] = useState<string | null>(null);

    // Tick clock every second
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // Load persisted active sessions
    useEffect(() => {
        try {
            const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
            if (raw) setActive(JSON.parse(raw));
        } catch {
            // ignore
        }
    }, []);

    function persistActive(next: Record<string, ClockState>) {
        setActive(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            // ignore
        }
    }

    const load = useCallback(async () => {
        try {
            const [empRes, projRes] = await Promise.all([
                fetch('/api/employees'),
                fetch('/api/projects').catch(() => null),
            ]);
            const empData = await empRes.json();
            setEmployees(Array.isArray(empData) ? empData.map(rowToEmployee).filter(e => e.status === 'Active') : []);
            if (projRes && projRes.ok) {
                const projData = await projRes.json();
                if (Array.isArray(projData)) {
                    setProjects(
                        projData
                            .map(p => ({
                                id: p.id,
                                project_number: p.project_number ?? '',
                                name: p.name ?? '',
                                status: p.status ?? '',
                            }))
                            .filter(p => p.status !== 'Completed' && p.status !== 'Cancelled'),
                    );
                }
            }
        } catch {
            setEmployees([]);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    function showFlash(msg: string) {
        setFlash(msg);
        setTimeout(() => setFlash(null), 2500);
    }

    async function clockIn() {
        if (!selectedEmpId) return;
        if (active[selectedEmpId]) {
            showFlash('Already clocked in.');
            return;
        }
        setBusy(true);
        const next = { ...active };
        next[selectedEmpId] = {
            employeeId: selectedEmpId,
            projectId: selectedProjectId || null,
            startedAt: new Date().toISOString(),
        };
        persistActive(next);
        const emp = employees.find(e => e.id === selectedEmpId);
        showFlash(`${emp ? emp.firstName : ''} clocked in.`);
        setSelectedEmpId('');
        setSelectedProjectId('');
        setBusy(false);
    }

    async function clockOut(empId: string) {
        const session = active[empId];
        if (!session) return;
        setBusy(true);
        try {
            const start = new Date(session.startedAt);
            const end = new Date();
            const totalHours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
            const reg = Math.min(totalHours, 8);
            const ot = Math.max(0, totalHours - 8);
            await fetch('/api/time-entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: empId,
                    date: ymd(end),
                    clockIn: start.toTimeString().slice(0, 5),
                    clockOut: end.toTimeString().slice(0, 5),
                    hoursRegular: Math.round(reg * 4) / 4,
                    hoursOvertime: Math.round(ot * 4) / 4,
                    projectId: session.projectId,
                    status: 'Pending',
                }),
            });
            const emp = employees.find(e => e.id === empId);
            showFlash(`${emp ? emp.firstName : ''} clocked out (${fmtHours(totalHours)}).`);
        } catch (e) {
            showFlash(`Error: ${String(e)}`);
        }
        const next = { ...active };
        delete next[empId];
        persistActive(next);
        setBusy(false);
    }

    const activeIds = Object.keys(active);
    const availableEmployees = employees.filter(e => !active[e.id]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#b8956a] mb-2">Bridgepointe Crew Terminal</p>
                    <div className="flex items-center justify-center gap-3 mb-1">
                        <Clock className="text-[#b8956a]" size={32} />
                        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white tabular-nums">
                            {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
                        </h1>
                    </div>
                    <p className="text-sm text-white/40">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>

                {flash && (
                    <div className="mb-6 max-w-2xl mx-auto bg-[#34d399]/10 border border-[#34d399]/30 rounded-2xl p-4 flex items-center gap-3">
                        <CheckCircle2 className="text-[#34d399]" size={20} />
                        <p className="text-sm text-[#34d399] font-semibold">{flash}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Clock In */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-3xl p-6 sm:p-8">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-[#b8956a] mb-4">Clock In</h2>
                        <div className="space-y-4">
                            <label className="block">
                                <span className="text-[11px] uppercase tracking-widest text-white/50 mb-1.5 block">Who's clocking in?</span>
                                <select
                                    value={selectedEmpId}
                                    onChange={e => setSelectedEmpId(e.target.value)}
                                    className="w-full h-14 px-4 bg-white/5 border border-white/10 rounded-xl text-base text-white focus:outline-none focus:border-[#b8956a]/50"
                                >
                                    <option value="">— Select crew member —</option>
                                    {availableEmployees.map(e => (
                                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName} · {e.role}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="text-[11px] uppercase tracking-widest text-white/50 mb-1.5 block">Project (optional)</span>
                                <select
                                    value={selectedProjectId}
                                    onChange={e => setSelectedProjectId(e.target.value)}
                                    className="w-full h-14 px-4 bg-white/5 border border-white/10 rounded-xl text-base text-white focus:outline-none focus:border-[#b8956a]/50"
                                >
                                    <option value="">— No project —</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.project_number || p.id} · {p.name}</option>
                                    ))}
                                </select>
                            </label>
                            <button
                                onClick={clockIn}
                                disabled={!selectedEmpId || busy}
                                className="w-full h-20 bg-[#34d399]/15 hover:bg-[#34d399]/25 border-2 border-[#34d399]/40 hover:border-[#34d399]/60 text-[#34d399] text-xl font-bold rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <LogIn size={28} /> Clock In
                            </button>
                        </div>
                    </div>

                    {/* Currently clocked in */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-3xl p-6 sm:p-8">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-[#b8956a] mb-4">
                            On the Clock ({activeIds.length})
                        </h2>
                        {activeIds.length === 0 ? (
                            <div className="py-12 text-center text-white/30">
                                <Clock size={36} className="mx-auto mb-3 text-white/20" />
                                <p className="text-sm">Nobody's clocked in right now.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeIds.map(empId => {
                                    const session = active[empId];
                                    const emp = employees.find(e => e.id === empId);
                                    if (!emp) return null;
                                    const elapsedMs = now.getTime() - new Date(session.startedAt).getTime();
                                    const hrs = elapsedMs / (1000 * 60 * 60);
                                    const proj = session.projectId ? projects.find(p => p.id === session.projectId) : null;
                                    return (
                                        <div key={empId} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-base font-bold text-white truncate">{emp.firstName} {emp.lastName}</p>
                                                <p className="text-xs text-white/50 uppercase tracking-wider truncate">{emp.role}</p>
                                                {proj && <p className="text-xs text-[#b8956a] mt-1 truncate">↳ {proj.name}</p>}
                                                <p className="text-2xl font-bold text-white font-mono mt-2 tabular-nums">{formatElapsed(hrs)}</p>
                                            </div>
                                            <button
                                                onClick={() => clockOut(empId)}
                                                disabled={busy}
                                                className="h-14 px-5 bg-red-500/15 hover:bg-red-500/25 border-2 border-red-500/40 hover:border-red-500/60 text-red-400 text-sm font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-40"
                                            >
                                                <LogOut size={20} /> Clock Out
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 text-center text-[10px] uppercase tracking-widest text-white/25">
                    Designed for tablet · Sessions persist across reloads · Hours logged on clock-out
                </div>
            </div>
        </div>
    );
}

function formatElapsed(hrs: number): string {
    const totalSec = Math.max(0, Math.floor(hrs * 3600));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
