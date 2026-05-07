'use client';

import { ChevronRight } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { fmtShortDate } from '@/lib/portal-client';

export interface PhaseRowData {
    id: string;
    name: string;
    status: string;
    phaseOrder: number;
    completionPct: number;
    startDate: string | null;
    endDate: string | null;
    actualStartDate: string | null;
    actualEndDate: string | null;
    notes: string;
    assignedSubIds: string[];
    canEdit: boolean;
}

interface PhaseRowProps {
    phase: PhaseRowData;
    onClick: () => void;
}

const STATUS_TONE: Record<string, string> = {
    'Not Started':  'bg-white/10 text-white/55 border-white/10',
    'In Progress':  'bg-blue-500/15 text-blue-300 border-blue-500/30',
    'Completed':    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    'Blocked':      'bg-red-500/15 text-red-300 border-red-500/30',
    'Skipped':      'bg-white/5 text-white/40 border-white/10',
};

function statusBadge(status: string, label: string) {
    const tone = STATUS_TONE[status] ?? 'bg-white/10 text-white/60 border-white/10';
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.18em] border whitespace-nowrap ${tone}`}>
            {label}
        </span>
    );
}

function statusLabel(status: string, t: (k: string) => string): string {
    switch (status) {
        case 'Not Started': return t('phase.notStarted');
        case 'In Progress': return t('phase.inProgress');
        case 'Completed':   return t('phase.completed');
        case 'Blocked':     return t('phase.blocked');
        case 'Skipped':     return t('phase.skipped');
        default: return status;
    }
}

export function PhaseRow({ phase, onClick }: PhaseRowProps) {
    const t = useT();

    const pct = Math.max(0, Math.min(100, phase.completionPct));
    const start = phase.actualStartDate ?? phase.startDate;
    const end = phase.actualEndDate ?? phase.endDate;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!phase.canEdit}
            className={[
                'w-full text-left bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 transition-all',
                phase.canEdit ? 'hover:bg-[#202020] hover:border-[#b8956a]/30 cursor-pointer' : 'cursor-default opacity-90',
            ].join(' ')}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-mono">
                            {t('phase.order', { num: phase.phaseOrder })}
                        </span>
                        {statusBadge(phase.status, statusLabel(phase.status, t))}
                    </div>
                    <h3 className="text-base font-semibold text-white truncate mb-1">
                        {phase.name}
                    </h3>
                    <p className="text-xs text-white/45">
                        {start || end
                            ? t('phase.dates', { start: fmtShortDate(start), end: fmtShortDate(end) })
                            : t('phase.noDates')}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white tabular-nums">{pct}%</span>
                        {phase.canEdit && <ChevronRight size={16} className="text-white/40" />}
                    </div>
                    {phase.canEdit && (
                        <span className="text-[10px] uppercase tracking-[0.18em] text-[#b8956a]">
                            {t('phase.update')}
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-3 h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #b8956a 0%, #9a7a54 100%)',
                    }}
                />
            </div>
        </button>
    );
}
