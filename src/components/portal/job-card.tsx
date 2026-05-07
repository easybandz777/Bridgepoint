'use client';

import Link from 'next/link';
import { Calendar, MapPin, ChevronRight, ListChecks } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { fmtMoney, fmtShortDate } from '@/lib/portal-client';

export interface PortalJobCardData {
    id: string;
    projectNumber: string;
    name: string;
    status: string;
    address: string;
    city: string;
    state: string;
    clientName: string;
    startDate: string | null;
    endDate: string | null;
    description: string;
    avgCompletion: number;
    phaseCount: number;
    myPhases: { id: string; name: string; status: string; completionPct: number }[];
    myAssignment?: {
        scopeOfWork: string;
        agreedAmount: number;
        billedAmount: number;
        paidAmount: number;
        startDate: string | null;
        endDate: string | null;
        completionPct: number;
        status: string;
    } | null;
}

interface JobCardProps {
    job: PortalJobCardData;
    userType: 'employee' | 'subcontractor';
    compact?: boolean;
}

interface StatusStyle {
    bg: string;
    text: string;
    border: string;
}

function statusStyle(status: string): StatusStyle {
    const s = (status || '').toLowerCase();
    if (s === 'active' || s === 'in progress' || s === 'completed' || s === 'approved' || s === 'paid') {
        return { bg: 'bg-[#34d399]/10', text: 'text-[#34d399]', border: 'border-[#34d399]/20' };
    }
    if (s === 'planning' || s === 'pending' || s === 'scheduled' || s === 'assigned') {
        return { bg: 'bg-[#fbbf24]/10', text: 'text-[#fbbf24]', border: 'border-[#fbbf24]/20' };
    }
    if (s === 'on hold' || s === 'cancelled' || s === 'blocked' || s === 'overdue') {
        return { bg: 'bg-[#f87171]/10', text: 'text-[#f87171]', border: 'border-[#f87171]/20' };
    }
    return { bg: 'bg-white/5', text: 'text-white/60', border: 'border-white/10' };
}

export function JobCard({ job, userType, compact }: JobCardProps) {
    const t = useT();
    const ss = statusStyle(job.status);
    const completion = Math.max(0, Math.min(100, Math.round(job.avgCompletion)));
    const hasDates = job.startDate || job.endDate;
    const dateLine = hasDates
        ? `${fmtShortDate(job.startDate)} – ${fmtShortDate(job.endDate)}`
        : t('jobCard.noDates');
    const cityLine = [job.city, job.state].filter(Boolean).join(', ') || job.address || '';

    return (
        <Link
            href={`/portal/jobs/${job.id}`}
            className="group block rounded-2xl border bg-[#1a1a1a] hover:bg-[#1f1f1f] hover:border-[#b8956a]/30 transition-all p-4 sm:p-5 active:scale-[0.99]"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${ss.bg} ${ss.text} ${ss.border}`}>
                    {job.status}
                </span>
                <ChevronRight size={16} className="text-white/25 group-hover:text-[#b8956a] transition-colors shrink-0" />
            </div>

            <div className="mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 mb-1">
                    {job.projectNumber}
                </p>
                <h3 className="font-serif text-lg sm:text-xl font-semibold text-white leading-tight tracking-tight mb-1 line-clamp-2">
                    {job.name}
                </h3>
                {job.clientName && (
                    <p className="text-xs text-white/45 truncate">{job.clientName}</p>
                )}
            </div>

            <div className="space-y-1.5 mb-4">
                {cityLine && (
                    <div className="flex items-center gap-2 text-xs text-white/55">
                        <MapPin size={12} className="text-white/35 shrink-0" />
                        <span className="truncate">{cityLine}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-xs text-white/55">
                    <Calendar size={12} className="text-white/35 shrink-0" />
                    <span>{dateLine}</span>
                </div>
            </div>

            {!compact && userType === 'subcontractor' && job.myAssignment && (
                <div className="mb-4 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5">
                    {job.myAssignment.scopeOfWork && (
                        <>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#b8956a] mb-1">
                                {t('jobCard.scope')}
                            </p>
                            <p className="text-xs text-white/70 line-clamp-2 mb-2">
                                {job.myAssignment.scopeOfWork}
                            </p>
                        </>
                    )}
                    {job.myAssignment.agreedAmount > 0 && (
                        <p className="text-xs text-white/55">
                            {t('jobCard.agreed')}{' '}
                            <span className="text-white font-semibold">
                                {fmtMoney(job.myAssignment.agreedAmount)}
                            </span>
                        </p>
                    )}
                </div>
            )}

            {!compact && userType === 'employee' && job.myPhases.length > 0 && (
                <div className="mb-4 flex items-center gap-2 text-xs text-white/55">
                    <ListChecks size={12} className="text-white/35 shrink-0" />
                    <span>{t('jobCard.phasesAssigned', { count: job.myPhases.length })}</span>
                </div>
            )}

            <div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider mb-1">
                    <span className="text-white/40 font-semibold">{t('jobCard.completion')}</span>
                    <span className="text-white/70 font-semibold">{completion}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-[width]"
                        style={{
                            width: `${completion}%`,
                            background: 'linear-gradient(90deg, #b8956a 0%, #d4b384 100%)',
                        }}
                    />
                </div>
            </div>
        </Link>
    );
}
