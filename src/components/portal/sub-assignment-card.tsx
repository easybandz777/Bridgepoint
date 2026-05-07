'use client';

import { ClipboardList } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { fmtMoney, fmtShortDate } from '@/lib/portal-client';

export interface SubAssignmentData {
    id: string;
    scopeOfWork: string;
    assignmentStatus: string;
    agreedAmount: number;
    billedAmount: number;
    approvedAmount: number;
    paidAmount: number;
    startDate: string | null;
    endDate: string | null;
    completionPct: number;
    notes: string;
}

interface SubAssignmentCardProps {
    assignment: SubAssignmentData;
}

export function SubAssignmentCard({ assignment }: SubAssignmentCardProps) {
    const t = useT();

    const outstanding = Math.max(0, assignment.approvedAmount - assignment.paidAmount);
    const pct = Math.max(0, Math.min(100, assignment.completionPct));

    return (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ClipboardList size={16} className="text-[#b8956a]" />
                    {t('jobDetail.assignment')}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-[0.18em] text-white/60">
                    {assignment.assignmentStatus}
                </span>
            </div>

            <div className="mb-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-1.5">
                    {t('jobDetail.scopeOfWork')}
                </p>
                <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                    {assignment.scopeOfWork || t('jobDetail.descriptionEmpty')}
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <FinancialBlock label={t('jobDetail.agreed')} value={fmtMoney(assignment.agreedAmount)} />
                <FinancialBlock label={t('jobDetail.billed')} value={fmtMoney(assignment.billedAmount)} />
                <FinancialBlock label={t('jobDetail.paid')} value={fmtMoney(assignment.paidAmount)} />
                <FinancialBlock
                    label={t('jobDetail.outstanding')}
                    value={fmtMoney(outstanding)}
                    accent={outstanding > 0}
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                        {t('common.completion')}
                    </p>
                    <span className="text-sm font-semibold text-white tabular-nums">{pct}%</span>
                </div>
                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, #b8956a 0%, #9a7a54 100%)',
                        }}
                    />
                </div>
                {(assignment.startDate || assignment.endDate) && (
                    <p className="mt-2 text-xs text-white/45">
                        {fmtShortDate(assignment.startDate)} → {fmtShortDate(assignment.endDate)}
                    </p>
                )}
            </div>
        </div>
    );
}

function FinancialBlock({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-1">{label}</p>
            <p className={`text-base font-semibold tabular-nums ${accent ? 'text-[#b8956a]' : 'text-white'}`}>
                {value}
            </p>
        </div>
    );
}
