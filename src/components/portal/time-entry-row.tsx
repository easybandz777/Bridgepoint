'use client';

import { Edit, Clock } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { fmtHours, fmtMoneyCents } from '@/lib/portal-client';

export interface TimesheetEntry {
    id: string;
    employeeId: string;
    projectId: string | null;
    phaseId: string | null;
    date: string;
    clockIn: string | null;
    clockOut: string | null;
    hoursRegular: number;
    hoursOvertime: number;
    costAmount: number;
    status: string;
    notes: string;
    approvedBy: string | null;
    approvedAt: string | null;
    createdAt: string;
    projectName: string | null;
    phaseName: string | null;
}

interface TimeEntryRowProps {
    entry: TimesheetEntry;
    onEdit?: (entry: TimesheetEntry) => void;
}

function fmtClockTime(iso: string | null): string {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch { return ''; }
}

function statusStyles(status: string) {
    if (status === 'Approved') {
        return { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)', color: '#34d399' };
    }
    if (status === 'Rejected') {
        return { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', color: '#f87171' };
    }
    return { bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)', color: '#facc15' };
}

export function TimeEntryRow({ entry, onEdit }: TimeEntryRowProps) {
    const t = useT();
    const isPending = entry.status === 'Pending';
    const totalHours = entry.hoursRegular + entry.hoursOvertime;
    const ss = statusStyles(entry.status);

    const statusLabel = entry.status === 'Approved'
        ? t('timesheets.statusApproved')
        : entry.status === 'Rejected'
            ? t('timesheets.statusRejected')
            : t('timesheets.statusPending');

    const inOut = entry.clockIn || entry.clockOut
        ? `${fmtClockTime(entry.clockIn)}${entry.clockOut ? ` - ${fmtClockTime(entry.clockOut)}` : entry.clockIn ? ' …' : ''}`
        : '';

    function handleClick() {
        if (!isPending) return;
        onEdit?.(entry);
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={!isPending}
            className="w-full text-left bg-white/5 border border-white/8 hover:border-white/15 rounded-2xl p-3 sm:p-4 flex items-center gap-3 transition-colors disabled:cursor-default disabled:hover:border-white/8"
        >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#b8956a]/10 border border-[#b8956a]/20 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-[#b8956a]" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 mb-0.5">
                    <p className="font-serif text-base sm:text-lg font-semibold text-white tabular-nums">
                        {fmtHours(totalHours)}
                    </p>
                    {entry.hoursOvertime > 0 && (
                        <span className="text-[10px] uppercase tracking-[0.18em] text-[#b8956a]">
                            +{fmtHours(entry.hoursOvertime)} OT
                        </span>
                    )}
                </div>
                <p className="text-xs text-white/55 truncate">
                    {entry.projectName || t('clock.noProject')}
                    {entry.phaseName ? ` · ${entry.phaseName}` : ''}
                </p>
                {(inOut || entry.notes) && (
                    <p className="text-[11px] text-white/35 mt-0.5 truncate">
                        {inOut}
                        {inOut && entry.notes ? ' · ' : ''}
                        {entry.notes}
                    </p>
                )}
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-[0.14em] border"
                    style={{ background: ss.bg, borderColor: ss.border, color: ss.color }}
                >
                    {statusLabel}
                </span>
                <p className="text-[11px] text-white/40 tabular-nums">{fmtMoneyCents(entry.costAmount)}</p>
                {isPending && onEdit && (
                    <Edit size={12} className="text-white/30" />
                )}
            </div>
        </button>
    );
}
