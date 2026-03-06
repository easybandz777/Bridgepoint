import { DollarSign, FileText, Receipt, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { StatsCard } from '@/components/admin/stats-card';
import { SAMPLE_ESTIMATES } from '@/lib/estimates';
import { SAMPLE_INVOICES } from '@/lib/invoices';
import { SAMPLE_PROJECTS, fmt, overallCompletionPct } from '@/lib/projects';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
    Draft: '#a3a3a3', Sent: '#60a5fa', Approved: '#34d399', Declined: '#f87171',
    Paid: '#34d399', Partial: '#fbbf24', Outstanding: '#60a5fa', Overdue: '#f87171',
};

export default function AdminDashboard() {
    const totalEstimateValue = SAMPLE_ESTIMATES.reduce((s, e) => s + e.total, 0);
    const totalInvoiced = SAMPLE_INVOICES.reduce((s, i) => s + i.total, 0);
    const totalOutstanding = SAMPLE_INVOICES.reduce((s, i) => s + i.amountDue, 0);
    const totalCollected = SAMPLE_INVOICES.reduce((s, i) => s + i.amountPaid, 0);

    const recentActivity = [
        { type: 'estimate', ref: 'BP-2025-0002', label: 'White Oak Hardwood — Okonkwo', status: 'Draft', date: '2025-01-08', link: '/admin/estimates/est-003' },
        { type: 'invoice', ref: 'BPINV-2025-0002A', label: 'White Oak Hardwood — Okonkwo', status: 'Outstanding', date: '2025-02-28', link: '/admin/invoices/inv-003' },
        { type: 'invoice', ref: 'BPINV-2024-0053A', label: 'Kitchen & Bath — Fontaine Estate', status: 'Partial', date: '2025-02-17', link: '/admin/invoices/inv-002' },
        { type: 'estimate', ref: 'BP-2024-0053', label: 'Kitchen & Bath Transformation — Fontaine', status: 'Sent', date: '2024-12-03', link: '/admin/estimates/est-002' },
        { type: 'invoice', ref: 'BPINV-2024-0047A', label: 'Interior & Exterior Repaint — Whitmore', status: 'Paid', date: '2025-01-31', link: '/admin/invoices/inv-001' },
        { type: 'estimate', ref: 'BP-2024-0047', label: 'Full Repaint — Whitmore Residence', status: 'Approved', date: '2024-11-15', link: '/admin/estimates/est-001' },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
            {/* Page header */}
            <div className="mb-6 sm:mb-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Overview</p>
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
                <StatsCard
                    icon={DollarSign}
                    label="YTD Revenue Collected"
                    value={fmt(totalCollected)}
                    sub="Across all paid invoices"
                    trend="up"
                    trendLabel="On track"
                    accent
                />
                <StatsCard
                    icon={TrendingUp}
                    label="Pipeline Value"
                    value={fmt(totalEstimateValue)}
                    sub="Active estimate total"
                    trend="up"
                    trendLabel="+12%"
                />
                <StatsCard
                    icon={Receipt}
                    label="Outstanding Balance"
                    value={fmt(totalOutstanding)}
                    sub="Across all open invoices"
                    trend={totalOutstanding > 50000 ? 'down' : 'neutral'}
                    trendLabel={totalOutstanding > 50000 ? 'Review' : 'Healthy'}
                />
                <StatsCard
                    icon={FileText}
                    label="Active Estimates"
                    value={String(SAMPLE_ESTIMATES.filter(e => e.status !== 'Declined').length)}
                    sub={`${SAMPLE_ESTIMATES.filter(e => e.status === 'Approved').length} approved`}
                />
            </div>

            {/* Two-column: Recent Activity + Quick Actions */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="xl:col-span-2">
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                            <h2 className="font-serif text-base font-semibold text-white">Recent Activity</h2>
                            <Clock size={14} className="text-white/20" />
                        </div>
                        <div className="divide-y divide-white/4">
                            {recentActivity.map((item) => (
                                <Link
                                    key={item.ref}
                                    href={item.link}
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors group"
                                >
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                        style={{
                                            background: item.type === 'estimate' ? 'rgba(96,165,250,0.1)' : 'rgba(184,149,106,0.1)',
                                        }}
                                    >
                                        {item.type === 'estimate'
                                            ? <FileText size={14} style={{ color: '#60a5fa' }} />
                                            : <Receipt size={14} style={{ color: '#b8956a' }} />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-white/80 truncate group-hover:text-white transition-colors">
                                            {item.label}
                                        </p>
                                        <p className="text-[11px] text-white/25 font-mono mt-0.5">{item.ref}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span
                                            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                                            style={{ background: `${STATUS_COLORS[item.status]}15`, color: STATUS_COLORS[item.status] }}
                                        >
                                            {item.status}
                                        </span>
                                        <p className="text-[11px] text-white/20 mt-1">{item.date}</p>
                                    </div>
                                </Link>
                            ))}
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
                            <Link
                                href="/admin/estimates"
                                className="flex items-center gap-3 p-3.5 rounded-xl border border-white/6 hover:border-[#b8956a]/30 hover:bg-[#b8956a]/5 transition-all group"
                            >
                                <FileText size={15} className="text-[#b8956a]" />
                                <div>
                                    <p className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
                                        View All Estimates
                                    </p>
                                    <p className="text-[11px] text-white/25">{SAMPLE_ESTIMATES.length} proposals</p>
                                </div>
                            </Link>
                            <Link
                                href="/admin/invoices"
                                className="flex items-center gap-3 p-3.5 rounded-xl border border-white/6 hover:border-[#b8956a]/30 hover:bg-[#b8956a]/5 transition-all group"
                            >
                                <Receipt size={15} className="text-[#b8956a]" />
                                <div>
                                    <p className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
                                        View All Invoices
                                    </p>
                                    <p className="text-[11px] text-white/25">{SAMPLE_INVOICES.length} invoices</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Invoice Summary */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/6">
                            <h2 className="font-serif text-sm font-semibold text-white">Invoice Summary</h2>
                        </div>
                        <div className="p-4 space-y-3">
                            {[
                                { label: 'Paid', count: SAMPLE_INVOICES.filter(i => i.status === 'Paid').length, color: '#34d399', icon: CheckCircle },
                                { label: 'Partial', count: SAMPLE_INVOICES.filter(i => i.status === 'Partial').length, color: '#fbbf24', icon: Clock },
                                { label: 'Outstanding', count: SAMPLE_INVOICES.filter(i => i.status === 'Outstanding').length, color: '#60a5fa', icon: Receipt },
                            ].map(({ label, count, color, icon: Icon }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon size={13} style={{ color }} />
                                        <span className="text-xs text-white/45">{label}</span>
                                    </div>
                                    <span className="text-xs font-semibold" style={{ color }}>{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Operations Cockpit (New Section) */}
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
                                {SAMPLE_PROJECTS.filter(p => p.status === 'Active').length} Active
                            </span>
                        </div>
                        <div className="space-y-4">
                            {SAMPLE_PROJECTS.filter(p => p.status === 'Active').slice(0, 4).map(project => (
                                <Link key={project.id} href={`/admin/projects/${project.id}`} className="block group">
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-white/80 group-hover:text-[#b8956a] transition-colors">{project.name}</span>
                                        <span className="text-white font-mono">{overallCompletionPct(project)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#b8956a]/50 to-[#b8956a] rounded-full transition-all group-hover:from-[#cbb08c]/50 group-hover:to-[#cbb08c]"
                                            style={{ width: `${overallCompletionPct(project)}%` }}
                                        />
                                    </div>
                                </Link>
                            ))}
                            {SAMPLE_PROJECTS.filter(p => p.status === 'Active').length === 0 && (
                                <p className="text-sm text-white/40 text-center py-4">No active projects currently.</p>
                            )}
                        </div>
                    </div>

                    {/* Attention Required / Financial Exceptions */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-white mb-6">Attention Required</h3>
                        <div className="space-y-3">
                            {/* Logic: Find projects where actual cost > budget */}
                            {SAMPLE_PROJECTS.map(project => {
                                const isOverBudget = project.actualCost > project.estimatedCost;
                                if (!isOverBudget || project.status === 'Completed') return null;

                                const overrun = project.actualCost - project.estimatedCost;

                                return (
                                    <div key={project.id} className="flex items-start gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                            <span className="text-red-400 font-bold text-xs">!</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <Link href={`/admin/projects/${project.id}/financials`} className="text-sm font-medium text-white hover:text-red-300 transition-colors truncate pr-4">
                                                    {project.name}
                                                </Link>
                                                <span className="text-xs font-mono text-red-400 font-bold shrink-0">
                                                    +{fmt(overrun)}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-white/40">Cost overrun detected against baseline budget.</p>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Mock static alerts for demo richness */}
                            <div className="flex items-start gap-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500">
                                    <Clock size={14} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white mb-1">Subcontractor Insurance Expiring</p>
                                    <p className="text-[11px] text-white/40">Okonkwo Hardwood (expires in 12 days)</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-400">
                                    <Receipt size={14} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white mb-1">3 Pending Payout Requests</p>
                                    <p className="text-[11px] text-white/40">Totaling $12,450.00 across 2 active projects.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
