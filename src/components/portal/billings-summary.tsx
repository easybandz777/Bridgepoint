'use client';

import Link from 'next/link';
import { useT } from '@/lib/portal-i18n';
import { fmtMoney, fmtShortDate } from '@/lib/portal-client';

export interface PortalBillingAssignment {
    id: string;
    projectId: string;
    projectName: string;
    scopeOfWork: string;
    agreedAmount: number;
    billedAmount: number;
    paidAmount: number;
    completionPct: number;
    status: string;
    startDate: string | null;
    endDate: string | null;
}

export interface PortalBillingsResponse {
    userType: 'subcontractor';
    totals: { agreedAmount: number; billedAmount: number; approvedAmount: number; paidAmount: number };
    assignments: PortalBillingAssignment[];
}

interface BillingsSummaryProps {
    data: PortalBillingsResponse;
}

export function BillingsSummary({ data }: BillingsSummaryProps) {
    const t = useT();
    const { totals, assignments } = data;
    const unpaid = Math.max(0, totals.billedAmount - totals.paidAmount);

    return (
        <div className="space-y-6">
            <div
                className="relative rounded-2xl p-5 sm:p-7 border overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #1e1a14 0%, #2a2218 60%, #1a1610 100%)',
                    borderColor: 'rgba(184,149,106,0.32)',
                }}
            >
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at top right, rgba(184,149,106,0.18) 0%, transparent 50%)' }}
                />
                <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                    <Stat label={t('pay.subAgreed')} value={fmtMoney(totals.agreedAmount)} />
                    <Stat label={t('pay.subBilled')} value={fmtMoney(totals.billedAmount)} />
                    <Stat label={t('pay.subPaid')} value={fmtMoney(totals.paidAmount)} />
                    <Stat label={t('pay.subUnpaid')} value={fmtMoney(unpaid)} accent />
                </div>
            </div>

            <section>
                <h2 className="font-serif text-xl font-bold text-white tracking-tight mb-3">
                    {t('pay.subAssignments')}
                </h2>
                {assignments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-10 text-center text-sm text-white/40">
                        {t('pay.noAssignments')}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {assignments.map(a => (
                            <AssignmentCard key={a.id} a={a} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 mb-1.5">
                {label}
            </p>
            <p className={`font-serif text-2xl sm:text-3xl font-bold tracking-tight ${accent ? 'text-[#b8956a]' : 'text-white'}`}>
                {value}
            </p>
        </div>
    );
}

function AssignmentCard({ a }: { a: PortalBillingAssignment }) {
    const t = useT();
    const completion = Math.max(0, Math.min(100, Math.round(a.completionPct)));
    const unpaid = Math.max(0, a.billedAmount - a.paidAmount);
    const dateLine = (a.startDate || a.endDate)
        ? `${fmtShortDate(a.startDate)} – ${fmtShortDate(a.endDate)}`
        : '';

    return (
        <Link
            href={a.projectId ? `/portal/jobs/${a.projectId}` : '#'}
            className="block rounded-2xl border bg-[#1a1a1a] hover:bg-[#1f1f1f] hover:border-[#b8956a]/30 transition-all p-4 sm:p-5"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                    <h3 className="font-serif text-lg font-semibold text-white leading-tight tracking-tight truncate">
                        {a.projectName || a.scopeOfWork || '—'}
                    </h3>
                    {dateLine && (
                        <p className="text-xs text-white/40 mt-0.5">{dateLine}</p>
                    )}
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-white/5 text-white/60 border-white/10 shrink-0">
                    {a.status}
                </span>
            </div>

            {a.scopeOfWork && a.projectName && (
                <p className="text-xs text-white/55 mb-3 line-clamp-2">{a.scopeOfWork}</p>
            )}

            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">{t('pay.subAgreed')}</p>
                    <p className="text-white font-semibold tabular-nums">{fmtMoney(a.agreedAmount)}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">{t('pay.subPaid')}</p>
                    <p className="text-white font-semibold tabular-nums">{fmtMoney(a.paidAmount)}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">{t('pay.subUnpaid')}</p>
                    <p className="text-[#b8956a] font-semibold tabular-nums">{fmtMoney(unpaid)}</p>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider mb-1">
                    <span className="text-white/40 font-semibold">{t('common.completion')}</span>
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
