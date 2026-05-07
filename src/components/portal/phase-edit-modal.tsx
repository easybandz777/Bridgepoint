'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/admin/modal';
import { useT } from '@/lib/portal-i18n';
import { portalFetch } from '@/lib/portal-client';
import { Play, CheckCircle2, AlertOctagon, Flag, Loader2 } from 'lucide-react';

type PhaseStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Blocked' | 'Skipped';

const STATUSES: PhaseStatus[] = ['Not Started', 'In Progress', 'Completed', 'Blocked', 'Skipped'];

interface PhaseEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    phase: {
        id: string;
        name: string;
        status: string;
        completionPct: number;
        notes: string;
    } | null;
    onSaved: () => void | Promise<void>;
}

function statusKey(s: PhaseStatus): string {
    switch (s) {
        case 'Not Started': return 'phase.notStarted';
        case 'In Progress': return 'phase.inProgress';
        case 'Completed':   return 'phase.completed';
        case 'Blocked':     return 'phase.blocked';
        case 'Skipped':     return 'phase.skipped';
    }
}

export function PhaseEditModal({ isOpen, onClose, projectId, phase, onSaved }: PhaseEditModalProps) {
    const t = useT();

    const [status, setStatus] = useState<PhaseStatus>('Not Started');
    const [pct, setPct] = useState(0);
    const [notes, setNotes] = useState('');
    const [showIssue, setShowIssue] = useState(false);
    const [issueText, setIssueText] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!phase) return;
        setStatus((STATUSES.includes(phase.status as PhaseStatus) ? phase.status : 'Not Started') as PhaseStatus);
        setPct(Math.max(0, Math.min(100, Math.round(phase.completionPct ?? 0))));
        setNotes(phase.notes ?? '');
        setShowIssue(false);
        setIssueText('');
        setError(null);
    }, [phase]);

    if (!phase) return null;

    async function save(overrides: Partial<{ status: PhaseStatus; pct: number; flagOnly: boolean }> = {}) {
        if (!phase) return;
        setSaving(true);
        setError(null);
        const body: Record<string, unknown> = {};
        const finalStatus = overrides.status ?? status;
        const finalPct = overrides.pct ?? pct;
        if (!overrides.flagOnly) {
            body.status = finalStatus;
            body.completionPct = finalPct;
            body.notes = notes;
        }
        if (showIssue && issueText.trim()) {
            body.issueText = issueText.trim();
        }
        try {
            await portalFetch<{ ok: true }>(
                `/api/portal/jobs/${projectId}/phases/${phase.id}`,
                { method: 'PATCH', body: JSON.stringify(body) },
            );
            await onSaved();
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('phase.editTitle')}>
            <div className="space-y-6">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-1">
                        {t('jobDetail.phases')}
                    </p>
                    <h3 className="font-serif text-xl font-bold text-white">{phase.name}</h3>
                </div>

                {/* Quick actions */}
                <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-2">
                        {t('phase.quickActions')}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => save({ status: 'In Progress', pct: pct < 5 ? 10 : pct })}
                            className="flex flex-col items-center justify-center gap-1 p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-200 transition-colors disabled:opacity-60"
                        >
                            <Play size={16} />
                            <span className="text-[10px] uppercase tracking-[0.18em]">{t('phase.markStarted')}</span>
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => save({ status: 'Blocked' })}
                            className="flex flex-col items-center justify-center gap-1 p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 transition-colors disabled:opacity-60"
                        >
                            <AlertOctagon size={16} />
                            <span className="text-[10px] uppercase tracking-[0.18em]">{t('phase.markBlocked')}</span>
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => save({ status: 'Completed', pct: 100 })}
                            className="flex flex-col items-center justify-center gap-1 p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-200 transition-colors disabled:opacity-60"
                        >
                            <CheckCircle2 size={16} />
                            <span className="text-[10px] uppercase tracking-[0.18em]">{t('phase.markCompleted')}</span>
                        </button>
                    </div>
                </div>

                {/* Status selector */}
                <div>
                    <label className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-2 block">
                        {t('phase.statusLabel')}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {STATUSES.map((s) => {
                            const active = status === s;
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatus(s)}
                                    className={[
                                        'px-3 py-2 rounded-xl text-xs font-medium border transition-colors',
                                        active
                                            ? 'bg-[#b8956a] text-black border-[#b8956a]'
                                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10',
                                    ].join(' ')}
                                >
                                    {t(statusKey(s))}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Completion slider */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                            {t('phase.completionPct')}
                        </label>
                        <span className="text-2xl font-bold text-white tabular-nums">{pct}%</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={pct}
                        onChange={(e) => setPct(parseInt(e.target.value, 10))}
                        className="w-full accent-[#b8956a]"
                    />
                    <div className="mt-2 h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-200"
                            style={{
                                width: `${pct}%`,
                                background: 'linear-gradient(90deg, #b8956a 0%, #9a7a54 100%)',
                            }}
                        />
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-2 block">
                        {t('phase.notesLabel')}
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t('phase.notesPlaceholder')}
                        rows={3}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#b8956a]/50 resize-none"
                    />
                </div>

                {/* Issue toggle */}
                <div>
                    {showIssue ? (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] uppercase tracking-[0.18em] text-red-300 flex items-center gap-1">
                                    <Flag size={12} />
                                    {t('phase.issueLabel')}
                                </label>
                                <button
                                    type="button"
                                    onClick={() => { setShowIssue(false); setIssueText(''); }}
                                    className="text-[10px] uppercase tracking-[0.18em] text-white/50 hover:text-white"
                                >
                                    {t('phase.flagIssueRemove')}
                                </button>
                            </div>
                            <textarea
                                value={issueText}
                                onChange={(e) => setIssueText(e.target.value)}
                                placeholder={t('phase.issuePlaceholder')}
                                rows={3}
                                className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-red-400/50 resize-none"
                            />
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowIssue(true)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 rounded-xl text-red-300 text-xs uppercase tracking-[0.18em] transition-colors"
                        >
                            <Flag size={14} />
                            {t('phase.flagIssue')}
                        </button>
                    )}
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="h-10 px-5 text-white/60 hover:text-white text-xs uppercase tracking-[0.18em] transition-colors disabled:opacity-60"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={() => save()}
                        disabled={saving}
                        className="h-10 px-5 bg-[#b8956a] hover:bg-[#cbb08c] text-black rounded-full text-xs uppercase tracking-[0.18em] font-semibold transition-colors flex items-center gap-2 disabled:opacity-60"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                        {saving ? t('common.saving') : t('common.save')}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
