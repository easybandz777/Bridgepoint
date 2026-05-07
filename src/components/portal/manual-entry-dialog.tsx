'use client';

import { useEffect, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { portalFetch } from '@/lib/portal-client';
import type { TimesheetEntry } from './time-entry-row';

export interface ProjectOption {
    id: string;
    name: string;
    projectNumber?: string;
    phases?: { id: string; name: string }[];
}

interface ManualEntryDialogProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    initialDate?: string;
    entry?: TimesheetEntry | null;
    projects: ProjectOption[];
}

interface SaveBody {
    date: string;
    projectId: string | null;
    phaseId: string | null;
    hoursRegular: number;
    hoursOvertime: number;
    notes: string;
}

export function ManualEntryDialog({
    open,
    onClose,
    onSaved,
    initialDate,
    entry,
    projects,
}: ManualEntryDialogProps) {
    const t = useT();
    const isEdit = Boolean(entry);

    const [date, setDate] = useState('');
    const [projectId, setProjectId] = useState('');
    const [phaseId, setPhaseId] = useState('');
    const [hoursRegular, setHoursRegular] = useState('8');
    const [hoursOvertime, setHoursOvertime] = useState('0');
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        if (entry) {
            setDate(entry.date);
            setProjectId(entry.projectId ?? '');
            setPhaseId(entry.phaseId ?? '');
            setHoursRegular(String(entry.hoursRegular));
            setHoursOvertime(String(entry.hoursOvertime));
            setNotes(entry.notes ?? '');
        } else {
            const fallback = initialDate ?? new Date().toISOString().slice(0, 10);
            setDate(fallback);
            setProjectId('');
            setPhaseId('');
            setHoursRegular('8');
            setHoursOvertime('0');
            setNotes('');
        }
        setErr(null);
        setBusy(false);
    }, [open, entry, initialDate]);

    if (!open) return null;

    const selectedProject = projects.find(p => p.id === projectId) ?? null;
    const phases = selectedProject?.phases ?? [];

    async function handleSave() {
        if (!projectId) {
            setErr(t('clock.selectProject'));
            return;
        }
        const reg = Number(hoursRegular);
        const ot = Number(hoursOvertime);
        if (!Number.isFinite(reg) || !Number.isFinite(ot)) {
            setErr(t('common.error'));
            return;
        }
        if (reg <= 0 && ot <= 0) {
            setErr(t('timesheets.errHoursRequired'));
            return;
        }
        setBusy(true);
        setErr(null);
        const body: SaveBody = {
            date,
            projectId: projectId || null,
            phaseId: phaseId || null,
            hoursRegular: reg,
            hoursOvertime: ot,
            notes,
        };
        try {
            if (isEdit && entry) {
                await portalFetch(`/api/portal/timesheets/${entry.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(body),
                });
            } else {
                await portalFetch('/api/portal/timesheets', {
                    method: 'POST',
                    body: JSON.stringify(body),
                });
            }
            onSaved();
            onClose();
        } catch (e) {
            setErr(String(e));
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete() {
        if (!isEdit || !entry) return;
        if (!window.confirm(t('timesheets.confirmDelete'))) return;
        setBusy(true);
        setErr(null);
        try {
            await portalFetch(`/api/portal/timesheets/${entry.id}`, { method: 'DELETE' });
            onSaved();
            onClose();
        } catch (e) {
            setErr(String(e));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
            <div
                className="w-full sm:max-w-lg bg-[#1a1a1a] border-t sm:border border-white/8 rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[92vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-white/8 shrink-0">
                    <h2 className="font-serif text-xl font-semibold text-white">
                        {isEdit ? t('timesheets.editEntry') : t('timesheets.addEntry')}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('common.close')}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/5"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <label className="block">
                        <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-1.5 block">
                            {t('timesheets.date')}
                        </span>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-base text-white focus:outline-none focus:border-[#b8956a]/50"
                        />
                    </label>

                    <label className="block">
                        <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-1.5 block">
                            {t('clock.selectProject')}
                        </span>
                        <select
                            value={projectId}
                            onChange={e => { setProjectId(e.target.value); setPhaseId(''); }}
                            className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-base text-white focus:outline-none focus:border-[#b8956a]/50"
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
                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-base text-white focus:outline-none focus:border-[#b8956a]/50"
                            >
                                <option value="">{t('clock.selectPhase')}</option>
                                {phases.map(ph => (
                                    <option key={ph.id} value={ph.id}>{ph.name}</option>
                                ))}
                            </select>
                        </label>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-1.5 block">
                                {t('timesheets.regular')}
                            </span>
                            <input
                                type="number"
                                min={0}
                                max={24}
                                step={0.25}
                                value={hoursRegular}
                                onChange={e => setHoursRegular(e.target.value)}
                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-base text-white tabular-nums focus:outline-none focus:border-[#b8956a]/50"
                            />
                        </label>
                        <label className="block">
                            <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-1.5 block">
                                {t('timesheets.overtime')}
                            </span>
                            <input
                                type="number"
                                min={0}
                                max={12}
                                step={0.25}
                                value={hoursOvertime}
                                onChange={e => setHoursOvertime(e.target.value)}
                                className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-base text-white tabular-nums focus:outline-none focus:border-[#b8956a]/50"
                            />
                        </label>
                    </div>

                    <label className="block">
                        <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-1.5 block">
                            {t('common.notes')}
                        </span>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            placeholder={t('timesheets.notesPlaceholder')}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#b8956a]/50 resize-none"
                        />
                    </label>

                    {err && (
                        <div className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                            {err}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-white/8 shrink-0 flex items-center gap-3">
                    {isEdit && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={busy}
                            className="h-12 w-12 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition-colors"
                            aria-label={t('common.delete')}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="flex-1 h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold uppercase tracking-[0.14em] hover:bg-white/10 disabled:opacity-40 transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={busy}
                        className="flex-1 h-12 px-4 rounded-xl text-sm font-semibold uppercase tracking-[0.14em] text-[#0f0f0f] disabled:opacity-50 transition-colors"
                        style={{ background: 'linear-gradient(135deg, #d4ad7e 0%, #b8956a 60%, #9a7a54 100%)' }}
                    >
                        {busy ? t('common.saving') : t('common.save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
