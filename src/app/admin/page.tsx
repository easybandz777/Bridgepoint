'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    DollarSign,
    FileText,
    Receipt,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertTriangle,
    ShieldAlert,
    Hammer,
    Activity as ActivityIcon,
    Users,
    User,
    CreditCard,
    Database,
    Calendar,
} from 'lucide-react';
import { StatsCard } from '@/components/admin/stats-card';

// ─── Types matching /api/dashboard payload ────────────────────────────────────

interface DashboardKPIs {
    ytdCollected: number;
    pipelineValue: number;
    outstandingAR: number;
    activeProjects: number;
}

interface DashboardActivity {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    actor: string | null;
    description: string | null;
    metadata: unknown;
    created_at: string;
}

interface DashboardActiveProject {
    id: string;
    projectNumber: string;
    name: string;
    status: string;
    estimatedRevenue: number;
    estimatedCost: number;
    actualCost: number;
    startDate: string | null;
    endDate: string | null;
    completionPct: number;
}

interface OverBudgetProject {
    id: string;
    name: string;
    projectNumber: string;
    estimatedCost: number;
    actualCost: number;
    overrun: number;
}

interface ExpiringCOI {
    id: string;
    company_name: string;
    contact_person: string;
    insurance_expiry: string;
}

interface OverdueBill {
    id: string;
    projectId: string | null;
    subcontractorId: string | null;
    billNumber: string | null;
    amount: number;
    dueDate: string;
}

interface DashboardData {
    kpis: DashboardKPIs;
    recentActivity: DashboardActivity[];
    activeProjects: DashboardActiveProject[];
    attention: {
        overBudget: OverBudgetProject[];
        expiringCOIs: ExpiringCOI[];
        overdueBills: OverdueBill[];
        unapprovedTime: { count: number; hours: number };
    };
    thisWeek: {
        hoursLogged: number;
        billsDue: { count: number; total: number };
        estimatesExpiring: number;
        weekStart: string;
        weekEnd: string;
    };
    invoiceCounts: Record<string, number>;
    estimateCounts: Record<string, number>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n);
}

function timeAgo(iso: string): string {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return '';
    const sec = Math.floor((Date.now() - then) / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day}d ago`;
    return new Date(iso).toLocaleDateString();
}

function daysUntil(dateStr: string): number {
    const d = new Date(dateStr).getTime();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((d - today.getTime()) / (24 * 60 * 60 * 1000));
}

function entityHref(entity_type: string, entity_id: string): string | null {
    switch (entity_type) {
        case 'estimate': return `/admin/estimates/${entity_id}`;
        case 'invoice': return `/admin/invoices/${entity_id}`;
        case 'project': return `/admin/projects/${entity_id}`;
        case 'subcontractor': return `/admin/subcontractors/${entity_id}`;
        case 'employee': return `/admin/employees/${entity_id}`;
        case 'expense': return `/admin/expenses`;
        case 'time_entry': return `/admin/timesheets`;
        case 'bill':
        case 'project_bill': return `/admin/projects`;
        case 'change_order': return `/admin/projects`;
        default: return null;
    }
}

function entityIcon(entity_type: string) {
    switch (entity_type) {
        case 'estimate': return FileText;
        case 'invoice': return Receipt;
        case 'project': return Hammer;
        case 'subcontractor': return Users;
        case 'employee': return User;
        case 'expense': return CreditCard;
        case 'time_entry': return Clock;
        default: return ActivityIcon;
    }
}

function entityColor(entity_type: string): string {
    switch (entity_type) {
        case 'estimate': return '#60a5fa';
        case 'invoice': return '#b8956a';
        case 'project': return '#34d399';
        case 'subcontractor': return '#a78bfa';
        case 'employee': return '#f472b6';
        case 'expense': return '#fbbf24';
        case 'time_entry': return '#22d3ee';
        default: return '#94a3b8';
    }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [seedMessage, setSeedMessage] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/dashboard', { cache: 'no-store' });
                if (!res.ok) throw new Error(`status ${res.status}`);
                const json = (await res.json()) as DashboardData;
                if (!cancelled) {
                    setData(json);
                    setError(null);
                }
            } catch (e) {
                if (!cancelled) setError(String(e));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    async function handleSeedAll() {
        setSeeding(true);
        setSeedMessage(null);
        try {
            const res = await fetch('/api/setup/seed-all', { method: 'POST' });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                setSeedMessage(
                    json.summary
                        ? `Seeded: ${json.summary.succeeded}/${json.summary.attempted} domains.`
                        : 'Seed complete.'
                );
                // Reload dashboard
                const r2 = await fetch('/api/dashboard', { cache: 'no-store' });
                if (r2.ok) setData(await r2.json());
            } else {
                setSeedMessage(`Seed error: ${json.error ?? res.status}`);
            }
        } catch (e) {
            setSeedMessage(`Seed error: ${String(e)}`);
        } finally {
            setSeeding(false);
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
            {/* Page header */}
            <div className="mb-6 sm:mb-8 flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Overview</p>
                    <h1 className="font-serif text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
                </div>
                <div className="flex items-center gap-2">
                    {seedMessage && (
                        <span className="text-[11px] text-white/50">{seedMessage}</span>
                    )}
                    <button
                        onClick={handleSeedAll}
                        disabled={seeding}
                        className="h-9 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <Database size={13} />
                        {seeding ? 'Seeding…' : 'Seed Demo Data'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-sm text-red-300">
                    Failed to load dashboard: {error}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
                {loading || !data ? (
                    [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)
                ) : (
                    <>
                        <StatsCard
                            icon={DollarSign}
                            label="YTD Revenue Collected"
                            value={fmtCurrency(data.kpis.ytdCollected)}
                            sub="Across all paid invoices"
                            trend="up"
                            trendLabel="On track"
                            accent
                        />
                        <StatsCard
                            icon={TrendingUp}
                            label="Pipeline Value"
                            value={fmtCurrency(data.kpis.pipelineValue)}
                            sub="Active estimate total"
                            trend="up"
                            trendLabel="Open"
                        />
                        <StatsCard
                            icon={Receipt}
                            label="Outstanding A/R"
                            value={fmtCurrency(data.kpis.outstandingAR)}
                            sub="Across all open invoices"
                            trend={data.kpis.outstandingAR > 50000 ? 'down' : 'neutral'}
                            trendLabel={data.kpis.outstandingAR > 50000 ? 'Review' : 'Healthy'}
                        />
                        <StatsCard
                            icon={Hammer}
                            label="Active Projects"
                            value={String(data.kpis.activeProjects)}
                            sub="Currently in progress"
                        />
                    </>
                )}
            </div>

            {/* This Week widget */}
            {!loading && data && (
                <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <ThisWeekTile
                        icon={Clock}
                        label="Hours Logged This Week"
                        value={`${data.thisWeek.hoursLogged.toFixed(1)} hrs`}
                        color="#22d3ee"
                    />
                    <ThisWeekTile
                        icon={Receipt}
                        label="Bills Due This Week"
                        value={`${data.thisWeek.billsDue.count} (${fmtCurrency(data.thisWeek.billsDue.total)})`}
                        color="#fbbf24"
                    />
                    <ThisWeekTile
                        icon={Calendar}
                        label="Estimates Expiring (≤7d)"
                        value={String(data.thisWeek.estimatesExpiring)}
                        color="#f472b6"
                    />
                </div>
            )}

            {/* Two-column: Recent Activity + Quick Actions */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="xl:col-span-2">
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                            <h2 className="font-serif text-base font-semibold text-white">Recent Activity</h2>
                            <Link href="/admin/activity" className="text-[11px] font-semibold uppercase tracking-widest text-[#b8956a] hover:text-[#cbb08c]">
                                View all
                            </Link>
                        </div>
                        <div className="divide-y divide-white/4">
                            {loading ? (
                                <div className="p-6 space-y-3">
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex gap-3 animate-pulse">
                                            <div className="w-8 h-8 rounded-xl bg-white/5" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3 w-2/3 bg-white/5 rounded" />
                                                <div className="h-2 w-1/3 bg-white/5 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : data && data.recentActivity.length > 0 ? (
                                data.recentActivity.map((item) => {
                                    const Icon = entityIcon(item.entity_type);
                                    const color = entityColor(item.entity_type);
                                    const href = entityHref(item.entity_type, item.entity_id);
                                    const inner = (
                                        <div className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors group">
                                            <div
                                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                                style={{ background: `${color}15` }}
                                            >
                                                <Icon size={14} style={{ color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-white/80 truncate group-hover:text-white transition-colors">
                                                    {item.description || `${item.action} on ${item.entity_type}`}
                                                </p>
                                                <p className="text-[11px] text-white/25 font-mono mt-0.5">
                                                    {item.entity_type} · {item.actor ?? 'system'}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span
                                                    className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                                                    style={{ background: `${color}15`, color }}
                                                >
                                                    {item.action}
                                                </span>
                                                <p className="text-[11px] text-white/20 mt-1">{timeAgo(item.created_at)}</p>
                                            </div>
                                        </div>
                                    );
                                    return href ? (
                                        <Link key={item.id} href={href}>
                                            {inner}
                                        </Link>
                                    ) : (
                                        <div key={item.id}>{inner}</div>
                                    );
                                })
                            ) : (
                                <div className="px-6 py-12 text-center">
                                    <ActivityIcon size={28} className="mx-auto text-white/20 mb-3" />
                                    <p className="text-sm text-white/50">No activity yet — run seed to populate demo data.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/6">
                            <h2 className="font-serif text-base font-semibold text-white">Quick Access</h2>
                        </div>
                        <div className="p-4 space-y-2">
                            <QuickLink
                                href="/admin/estimates"
                                icon={FileText}
                                label="View All Estimates"
                                sub={
                                    data
                                        ? `${Object.values(data.estimateCounts).reduce((a, b) => a + b, 0)} total`
                                        : 'Loading…'
                                }
                            />
                            <QuickLink
                                href="/admin/invoices"
                                icon={Receipt}
                                label="View All Invoices"
                                sub={
                                    data
                                        ? `${Object.values(data.invoiceCounts).reduce((a, b) => a + b, 0)} total`
                                        : 'Loading…'
                                }
                            />
                            <QuickLink
                                href="/admin/projects"
                                icon={Hammer}
                                label="View All Projects"
                                sub={data ? `${data.kpis.activeProjects} active` : 'Loading…'}
                            />
                        </div>
                    </div>

                    {/* Invoice Summary */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/6">
                            <h2 className="font-serif text-sm font-semibold text-white">Invoice Summary</h2>
                        </div>
                        <div className="p-4 space-y-3">
                            {[
                                { label: 'Paid', color: '#34d399', icon: CheckCircle },
                                { label: 'Partial', color: '#fbbf24', icon: Clock },
                                { label: 'Outstanding', color: '#60a5fa', icon: Receipt },
                                { label: 'Overdue', color: '#f87171', icon: AlertTriangle },
                            ].map(({ label, color, icon: Icon }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon size={13} style={{ color }} />
                                        <span className="text-xs text-white/45">{label}</span>
                                    </div>
                                    <span className="text-xs font-semibold" style={{ color }}>
                                        {data?.invoiceCounts[label] ?? 0}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Operations Cockpit */}
            <div className="mt-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="font-serif text-xl font-bold text-white mb-1">Operations Cockpit</h2>
                        <p className="text-[11px] text-white/40">Active projects, cost tracking & exceptions</p>
                    </div>
                    <Link
                        href="/admin/projects"
                        className="text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c] transition-colors"
                    >
                        View All Projects &rarr;
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Active Jobs Overview */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-semibold text-white">Active Projects Timeline</h3>
                            <span className="px-2.5 py-1 bg-[#34d399]/10 text-[#34d399] rounded text-[10px] font-bold uppercase tracking-widest">
                                {data?.activeProjects.length ?? 0} Active
                            </span>
                        </div>
                        <div className="space-y-4">
                            {loading ? (
                                [0, 1, 2].map((i) => (
                                    <div key={i} className="space-y-2 animate-pulse">
                                        <div className="h-3 w-1/2 bg-white/5 rounded" />
                                        <div className="h-1.5 w-full bg-white/5 rounded-full" />
                                    </div>
                                ))
                            ) : data && data.activeProjects.length > 0 ? (
                                data.activeProjects.slice(0, 5).map((p) => (
                                    <Link key={p.id} href={`/admin/projects/${p.id}`} className="block group">
                                        <div className="flex justify-between text-sm mb-1.5">
                                            <span className="text-white/80 group-hover:text-[#b8956a] transition-colors truncate pr-2">{p.name}</span>
                                            <span className="text-white font-mono shrink-0">{p.completionPct}%</span>
                                        </div>
                                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#b8956a]/50 to-[#b8956a] rounded-full transition-all group-hover:from-[#cbb08c]/50 group-hover:to-[#cbb08c]"
                                                style={{ width: `${p.completionPct}%` }}
                                            />
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <Hammer size={28} className="mx-auto text-white/20 mb-2" />
                                    <p className="text-sm text-white/40">No active projects.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Attention Required */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-white mb-6">Attention Required</h3>
                        <div className="space-y-3">
                            {loading ? (
                                <>
                                    {[0, 1, 2].map((i) => (
                                        <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                                    ))}
                                </>
                            ) : data ? (
                                <>
                                    {data.attention.overBudget.map((p) => (
                                        <div key={p.id} className="flex items-start gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                                            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                                <span className="text-red-400 font-bold text-xs">!</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                    <Link href={`/admin/projects/${p.id}/financials`} className="text-sm font-medium text-white hover:text-red-300 transition-colors truncate">
                                                        {p.name}
                                                    </Link>
                                                    <span className="text-xs font-mono text-red-400 font-bold shrink-0">
                                                        +{fmtCurrency(p.overrun)}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-white/40">Cost overrun against baseline budget.</p>
                                            </div>
                                        </div>
                                    ))}

                                    {data.attention.expiringCOIs.map((s) => {
                                        const days = daysUntil(s.insurance_expiry);
                                        return (
                                            <Link
                                                key={s.id}
                                                href={`/admin/subcontractors/${s.id}`}
                                                className="flex items-start gap-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl hover:bg-amber-500/10 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500">
                                                    <ShieldAlert size={14} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-white mb-1">COI Expiring · {s.company_name}</p>
                                                    <p className="text-[11px] text-white/40">
                                                        {days <= 0 ? 'EXPIRED' : `expires in ${days} days`}
                                                    </p>
                                                </div>
                                            </Link>
                                        );
                                    })}

                                    {data.attention.overdueBills.map((b) => (
                                        <div key={b.id} className="flex items-start gap-4 p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                                            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-400">
                                                <Receipt size={14} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-white mb-1">Overdue Bill {b.billNumber ?? ''}</p>
                                                <p className="text-[11px] text-white/40">
                                                    {fmtCurrency(b.amount)} · due {b.dueDate}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {data.attention.unapprovedTime.count > 0 && (
                                        <Link
                                            href="/admin/timesheets"
                                            className="flex items-start gap-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl hover:bg-blue-500/10 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-400">
                                                <Clock size={14} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-white mb-1">
                                                    {data.attention.unapprovedTime.count} time entries pending approval
                                                </p>
                                                <p className="text-[11px] text-white/40">
                                                    {data.attention.unapprovedTime.hours.toFixed(1)} hours awaiting review
                                                </p>
                                            </div>
                                        </Link>
                                    )}

                                    {data.attention.overBudget.length === 0 &&
                                        data.attention.expiringCOIs.length === 0 &&
                                        data.attention.overdueBills.length === 0 &&
                                        data.attention.unapprovedTime.count === 0 && (
                                            <div className="text-center py-8">
                                                <CheckCircle size={28} className="mx-auto text-[#34d399]/40 mb-2" />
                                                <p className="text-sm text-white/40">All clear — no issues need attention.</p>
                                            </div>
                                        )}
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <div className="rounded-2xl p-6 border border-white/6 bg-[#1a1a1a] animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-white/5 mb-4" />
            <div className="h-6 w-2/3 bg-white/5 rounded mb-2" />
            <div className="h-3 w-1/3 bg-white/5 rounded" />
        </div>
    );
}

function ThisWeekTile({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: typeof Clock;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 flex items-center gap-4">
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color}15` }}
            >
                <Icon size={18} style={{ color }} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-0.5">{label}</p>
                <p className="text-base font-semibold text-white truncate">{value}</p>
            </div>
        </div>
    );
}

function QuickLink({
    href,
    icon: Icon,
    label,
    sub,
}: {
    href: string;
    icon: typeof FileText;
    label: string;
    sub: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-white/6 hover:border-[#b8956a]/30 hover:bg-[#b8956a]/5 transition-all group"
        >
            <Icon size={15} className="text-[#b8956a]" />
            <div>
                <p className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
                    {label}
                </p>
                <p className="text-[11px] text-white/25">{sub}</p>
            </div>
        </Link>
    );
}
