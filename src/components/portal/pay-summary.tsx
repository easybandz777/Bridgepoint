'use client';

import { useT } from '@/lib/portal-i18n';
import { fmtMoneyCents, fmtHours, fmtShortDate } from '@/lib/portal-client';

export interface PortalPayWeek {
    weekStart: string;
    weekEnd: string;
    regular: number;
    overtime: number;
    total: number;
    gross: number;
    status: 'Pending' | 'Approved' | 'Mixed' | 'Empty';
}

export interface PortalPayResponse {
    userType: 'employee';
    employee: { hourlyRate: number; overtimeRate: number | null; salary: number | null };
    weeks: PortalPayWeek[];
    ytd: { regular: number; overtime: number; total: number; gross: number };
}

interface PaySummaryProps {
    data: PortalPayResponse;
}

export function PaySummary({ data }: PaySummaryProps) {
    const t = useT();
    const { weeks, ytd, employee } = data;
    const thisWeek = weeks[0];
    const isSalary = !!employee.salary && employee.salary > 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BigCard
                    label={t('pay.thisWeek')}
                    primary={fmtMoneyCents(thisWeek?.gross ?? 0)}
                    accent
                    rows={[
                        { label: t('pay.regularHours'), value: fmtHours(thisWeek?.regular ?? 0) },
                        { label: t('pay.overtimeHours'), value: fmtHours(thisWeek?.overtime ?? 0) },
                        { label: t('pay.totalHours'), value: fmtHours(thisWeek?.total ?? 0) },
                    ]}
                />
                <BigCard
                    label={t('pay.ytd')}
                    primary={fmtMoneyCents(ytd.gross)}
                    rows={[
                        { label: t('pay.regularHours'), value: fmtHours(ytd.regular) },
                        { label: t('pay.overtimeHours'), value: fmtHours(ytd.overtime) },
                        { label: t('pay.totalHours'), value: fmtHours(ytd.total) },
                    ]}
                />
            </div>

            <div
                className="rounded-2xl border p-4 sm:p-5"
                style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}
            >
                <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                        {t('pay.payRate')}
                    </p>
                </div>
                <p className="text-sm text-white/85">
                    {isSalary
                        ? `${t('pay.salaried')} · ${fmtMoneyCents(employee.salary ?? 0)}/yr`
                        : `${fmtMoneyCents(employee.hourlyRate)}/hr${employee.overtimeRate ? ` · OT ${fmtMoneyCents(employee.overtimeRate)}/hr` : ''}`}
                </p>
            </div>

            <section>
                <h2 className="font-serif text-xl font-bold text-white tracking-tight mb-3">
                    {t('pay.history')}
                </h2>
                <div
                    className="rounded-2xl border overflow-hidden"
                    style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}
                >
                    {weeks.map((w, i) => (
                        <WeekRow key={w.weekStart} week={w} first={i === 0} />
                    ))}
                </div>
            </section>
        </div>
    );
}

function BigCard({
    label,
    primary,
    rows,
    accent,
}: {
    label: string;
    primary: string;
    rows: { label: string; value: string }[];
    accent?: boolean;
}) {
    return (
        <div
            className="relative rounded-2xl p-5 sm:p-6 border overflow-hidden"
            style={{
                background: accent
                    ? 'linear-gradient(135deg, #1e1a14 0%, #241f16 100%)'
                    : '#1a1a1a',
                borderColor: accent ? 'rgba(184,149,106,0.3)' : 'rgba(255,255,255,0.06)',
            }}
        >
            {accent && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at top right, rgba(184,149,106,0.10) 0%, transparent 60%)' }}
                />
            )}
            <div className="relative">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 mb-2">
                    {label}
                </p>
                <p className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                    {primary}
                </p>
                <div className="space-y-1.5">
                    {rows.map(r => (
                        <div key={r.label} className="flex items-center justify-between text-xs">
                            <span className="text-white/45">{r.label}</span>
                            <span className="text-white/80 font-semibold tabular-nums">{r.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function WeekRow({ week, first }: { week: PortalPayWeek; first: boolean }) {
    const t = useT();
    return (
        <div
            className={`px-4 sm:px-5 py-3.5 flex items-center justify-between gap-4 ${first ? '' : 'border-t border-white/5'}`}
        >
            <div className="min-w-0">
                <p className="text-sm text-white/85 font-medium">
                    {t('pay.weekOf', { date: fmtShortDate(week.weekStart) })}
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                    {fmtHours(week.total)} · R {fmtHours(week.regular)} · OT {fmtHours(week.overtime)}
                </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-white tabular-nums">
                    {fmtMoneyCents(week.gross)}
                </span>
                <StatusBadge status={week.status} />
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: PortalPayWeek['status'] }) {
    const t = useT();
    const map: Record<PortalPayWeek['status'], { cls: string; key: string }> = {
        Approved: { cls: 'bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20', key: 'pay.statusApproved' },
        Pending: { cls: 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20', key: 'pay.statusPending' },
        Mixed: { cls: 'bg-[#b8956a]/10 text-[#b8956a] border-[#b8956a]/20', key: 'pay.statusMixed' },
        Empty: { cls: 'bg-white/5 text-white/40 border-white/10', key: 'pay.statusEmpty' },
    };
    const m = map[status];
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${m.cls}`}>
            {t(m.key)}
        </span>
    );
}
