import { DollarSign, FileText, Receipt, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { StatsCard } from '@/components/admin/stats-card';
import { SAMPLE_ESTIMATES } from '@/lib/estimates';
import { SAMPLE_INVOICES } from '@/lib/invoices';
import Link from 'next/link';

function fmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

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
        </div>
    );
}
