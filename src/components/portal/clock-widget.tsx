'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { portalFetch } from '@/lib/portal-client';
import type { ProjectOption } from './manual-entry-dialog';

const LAST_PROJECT_KEY = 'bp_portal_last_project';
const LAST_PHASE_KEY = 'bp_portal_last_phase';

export interface ClockEntry {
    id: string;
    employeeId: string;
    projectId: string | null;
    phaseId: string | null;
    date: string;
    clockIn: string | null;
    clockOut: string | null;
    notes: string;
    status: string;
    projectName: string | null;
    phaseName: string | null;
}

interface ClockStatusResponse {
    onShift: boolean;
    entry?: ClockEntry;
}

interface ClockInResponse {
    ok: true;
    already?: boolean;
    entry: ClockEntry;
}

interface ClockOutResponse {
    ok: true;
    entry: ClockEntry & {
        hoursRegular: number;
        hoursOvertime: number;
        costAmount: number;
    };
}

interface ClockWidgetProps {
    projects: ProjectOption[];
    onShiftEnd?: () => void;
}

function fmtClockTime(iso: string | null): string {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch { return ''; }
}

function fmtElapsed(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmtElapsedHM(ms: number): string {
    const totalMin = Math.max(0, Math.round(ms / 60000));
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}:${String(m).padStart(2, '0')}`;
}

export function ClockWidget({ projects, onShiftEnd }: ClockWidgetProps) {
    const t = useT();
    const [loading, setLoading] = useState(true);
    const [entry, setEntry] = useState<ClockEntry | null>(null);
    const [projectId, setProjectId] = useState('');
    const [phaseId, setPhaseId] = useState('');
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [now, setNow] = useState(() => Date.now());
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const onShift = Boolean(entry);

    const loadStatus = useCallback(async () => {
        try {
            const r = await portalFetch<ClockStatusResponse>('/api/portal/clock');
            if (r.onShift && r.entry) {
                setEntry(r.entry);
            } else {
                setEntry(null);
            }
        } catch (e) {
            setErr(String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadStatus(); }, [loadStatus]);

    useEffect(() => {
        try {
            const lastProj = window.localStorage.getItem(LAST_PROJECT_KEY) ?? '';
            const lastPhase = window.localStorage.getItem(LAST_PHASE_KEY) ?? '';
            if (lastProj) setProjectId(lastProj);
            if (lastPhase) setPhaseId(lastPhase);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (!onShift) {
            if (tickRef.current) {
                clearInterval(tickRef.current);
                tickRef.current = null;
            }
            return;
        }
        setNow(Date.now());
        tickRef.current = setInterval(() => setNow(Date.now()), 1000);
        return () => {
            if (tickRef.current) {
                clearInterval(tickRef.current);
                tickRef.current = null;
            }
        };
    }, [onShift]);

    const selectedProject = useMemo(
        () => projects.find(p => p.id === projectId) ?? null,
        [projects, projectId],
    );
    const phases = selectedProject?.phases ?? [];

    const startedAtMs = useMemo(() => {
        if (!entry?.clockIn) return null;
        const ms = new Date(entry.clockIn).getTime();
        return Number.isFinite(ms) ? ms : null;
    }, [entry?.clockIn]);

    const elapsedMs = startedAtMs ? Math.max(0, now - startedAtMs) : 0;

    async function handleClockIn() {
        if (!projectId) {
            setErr(t('clock.selectProject'));
            return;
        }
        setBusy(true);
        setErr(null);
        try {
            const r = await portalFetch<ClockInResponse>('/api/portal/clock/in', {
                method: 'POST',
                body: JSON.stringify({
                    projectId: projectId || null,
                    phaseId: phaseId || null,
                    notes,
                }),
            });
            try {
                window.localStorage.setItem(LAST_PROJECT_KEY, projectId);
                window.localStorage.setItem(LAST_PHASE_KEY, phaseId);
            } catch { /* ignore */ }
            setEntry(r.entry);
            setNotes('');
        } catch (e) {
            setErr(String(e));
        } finally {
            setBusy(false);
        }
    }

    async function handleClockOut() {
        if (!entry || !startedAtMs) return;
        const elapsedHM = fmtElapsedHM(Date.now() - startedAtMs);
        if (!window.confirm(t('clock.confirmOutDetail', { duration: elapsedHM }))) return;
        setBusy(true);
        setErr(null);
        try {
            await portalFetch<ClockOutResponse>('/api/portal/clock/out', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            setEntry(null);
            setNotes('');
            onShiftEnd?.();
        } catch (e) {
            setErr(String(e));
        } finally {
            setBusy(false);
        }
    }

    if (loading) {
        return (
            <div className="bg-[#1a1a1a] border border-white/6 rounded-3xl p-8 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-3xl p-5 sm:p-7">
            <div className="text-center mb-5">
                {onShift && entry ? (
                    <>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b8956a] mb-1">
                            {t('dashboard.onShift')}
                        </p>
                        <p className="text-sm text-white/55 mb-3">
                            {t('clock.onShift', { time: fmtClockTime(entry.clockIn) })}
                        </p>
                        <p className="font-serif text-5xl sm:text-6xl font-bold text-white tabular-nums tracking-tight">
                            {fmtElapsed(elapsedMs)}
                        </p>
                    </>
                ) : (
                    <>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 mb-1">
                            {t('clock.title')}
                        </p>
                        <p className="text-sm text-white/55">{t('clock.notOnShift')}</p>
                    </>
                )}
            </div>

            {onShift && entry ? (
                <div className="bg-white/4 border border-white/8 rounded-2xl p-4 mb-5 space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                        {t('clock.workingOn')}
                    </p>
                    <p className="text-base font-semibold text-white truncate">
                        {entry.projectName || t('clock.noProject')}
                    </p>
                    {entry.phaseName && (
                        <p className="text-xs text-[#b8956a] truncate">↳ {entry.phaseName}</p>
                    )}
                    {entry.notes && (
                        <p className="text-xs text-white/50 mt-2 italic">{entry.notes}</p>
                    )}
                </div>
            ) : (
                <div className="space-y-3 mb-5">
                    <label className="block">
                        <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-1.5 block">
                            {t('clock.selectProject')}
                        </span>
                        <select
                            value={projectId}
                            onChange={e => { setProjectId(e.target.value); setPhaseId(''); }}
                            className="w-full h-13 min-h-[48px] px-4 bg-white/5 border border-white/10 rounded-xl text-base text-white focus:outline-none focus:border-[#b8956a]/50"
                        >
                            <option value="">{t('clock.selectProject')}</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.projectNumber ? `${p.projectNumber} · ${p.name}` : p.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    {phases.length > 0 && (
                        <label className="block">
                            <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-1.5 block">
                                {t('clock.selectPhase')}
                            </span>
                            <select
                                value={phaseId}
                                onChange={e => setPhaseId(e.target.value)}
                                className="w-full h-13 min-h-[48px] px-4 bg-white/5 border border-white/10 rounded-xl text-base text-white focus:outline-none focus:border-[#b8956a]/50"
                            >
                                <option value="">{t('clock.selectPhase')}</option>
                                {phases.map(ph => (
                                    <option key={ph.id} value={ph.id}>{ph.name}</option>
                                ))}
                            </select>
                        </label>
                    )}

                    <label className="block">
                        <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-1.5 block">
                            {t('common.notes')}
                        </span>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={2}
                            placeholder={t('clock.notesPlaceholder')}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#b8956a]/50 resize-none"
                        />
                    </label>
                </div>
            )}

            {err && (
                <div className="px-3 py-2 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                    {err}
                </div>
            )}

            <div className="flex justify-center">
                {onShift ? (
                    <button
                        type="button"
                        onClick={handleClockOut}
                        disabled={busy}
                        className="w-full sm:w-[280px] h-16 rounded-2xl flex items-center justify-center gap-3 text-base font-bold uppercase tracking-[0.16em] text-[#0f0f0f] disabled:opacity-50 transition-transform active:scale-[0.98]"
                        style={{ background: 'linear-gradient(135deg, #d4ad7e 0%, #b8956a 60%, #9a7a54 100%)' }}
                    >
                        <Square size={20} fill="currentColor" />
                        {t('clock.out')}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleClockIn}
                        disabled={busy || !projectId}
                        className="w-full sm:w-[280px] h-16 rounded-2xl flex items-center justify-center gap-3 text-base font-bold uppercase tracking-[0.16em] text-[#0f0f0f] disabled:opacity-50 transition-transform active:scale-[0.98]"
                        style={{ background: 'linear-gradient(135deg, #d4ad7e 0%, #b8956a 60%, #9a7a54 100%)' }}
                    >
                        <Play size={20} fill="currentColor" />
                        {t('clock.in')}
                    </button>
                )}
            </div>
        </div>
    );
}
