'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Download, ArrowUpRight, ArrowDownRight, Minus, Trophy, AlertTriangle } from 'lucide-react';

interface ProjectRow {
    id: string;
    project_number: string;
    name: string;
    status: string;
    client_name: string;
    estimated_revenue: number | string;
    estimated_cost: number | string;
    actual_revenue: number | string;
    actual_cost: number | string;
    invoiced_amount: number | string;
    collected_amount: number | string;
}

interface NormalizedProject {
    id: string;
    projectNumber: string;
    name: string;
    status: string;
    clientName: string;
    estimatedRevenue: number;
    estimatedCost: number;
    actualRevenue: number;
    actualCost: number;
    revenue: number; // best available revenue
}

function toNum(v: unknown): number {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
}

function fmtCurrency(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n);
}

export default function ProfitabilityReportPage() {
    const [projects, setProjects] = useState<NormalizedProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Completed'>('All');
    const [sortOption, setSortOption] = useState<'MarginDesc' | 'MarginAsc' | 'RevenueDesc'>('MarginDesc');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/projects', { cache: 'no-store' });
                if (!res.ok) throw new Error(`status ${res.status}`);
                const data = (await res.json()) as ProjectRow[] | { error: string };
                if (!cancelled) {
                    if (Array.isArray(data)) {
                        const normalized = data.map((p) => {
                            const estRev = toNum(p.estimated_revenue);
                            const actRev = toNum(p.actual_revenue);
                            return {
                                id: p.id,
                                projectNumber: p.project_number,
                                name: p.name,
                                status: p.status,
                                clientName: p.client_name,
                                estimatedRevenue: estRev,
                                estimatedCost: toNum(p.estimated_cost),
                                actualRevenue: actRev,
                                actualCost: toNum(p.actual_cost),
                                revenue: actRev > 0 ? actRev : estRev,
                            };
                        });
                        setProjects(normalized);
                        setError(null);
                    } else {
                        setProjects([]);
                        setError(data.error);
                    }
                }
            } catch (e) {
                if (!cancelled) {
                    setProjects([]);
                    setError(String(e));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const filteredProjects = useMemo(() => {
        const q = searchQuery.toLowerCase();
        const filtered = projects.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q);
            const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
            return matchesSearch && matchesStatus && p.status !== 'Archived';
        });
        const withMargin = filtered.map((p) => {
            const gp = p.revenue - p.actualCost;
            const margin = p.revenue > 0 ? (gp / p.revenue) * 100 : 0;
            return { ...p, gp, margin };
        });
        withMargin.sort((a, b) => {
            if (sortOption === 'MarginDesc') return b.margin - a.margin;
            if (sortOption === 'MarginAsc') return a.margin - b.margin;
            return b.revenue - a.revenue;
        });
        return withMargin;
    }, [projects, searchQuery, statusFilter, sortOption]);

    const totals = useMemo(() => {
        const totalRev = filteredProjects.reduce((s, p) => s + p.revenue, 0);
        const totalCost = filteredProjects.reduce((s, p) => s + p.actualCost, 0);
        const totalProfit = totalRev - totalCost;
        const avgMargin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;
        return { totalRev, totalCost, totalProfit, avgMargin };
    }, [filteredProjects]);

    const topMarginId = filteredProjects[0]?.id;
    const worstMargin = [...filteredProjects].sort((a, b) => a.margin - b.margin)[0];

    function exportCsv() {
        const rows = [
            ['Project Number', 'Name', 'Client', 'Status', 'Revenue', 'Estimated Cost', 'Actual Cost', 'Gross Profit', 'Margin %'],
            ...filteredProjects.map((p) => [
                p.projectNumber,
                p.name,
                p.clientName,
                p.status,
                p.revenue.toFixed(2),
                p.estimatedCost.toFixed(2),
                p.actualCost.toFixed(2),
                p.gp.toFixed(2),
                p.margin.toFixed(2),
            ]),
        ];
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `profitability-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin/reports" className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-[#b8956a] hover:text-[#cbb08c] transition-colors mb-4">
                    <ArrowLeft size={14} className="mr-2" />
                    Back to Reports
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="font-serif text-3xl font-bold text-white mb-2">Job Profitability Report</h1>
                        <p className="text-white/50 text-sm">Margin and gross profit analysis across every project on the books.</p>
                    </div>
                    <button
                        onClick={exportCsv}
                        className="h-10 px-5 bg-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/20 transition-colors whitespace-nowrap"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-sm text-red-300">
                    Failed to load projects: {error}
                </div>
            )}

            {/* Aggregate Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <KpiCell label="Total Revenue" value={fmtCurrency(totals.totalRev)} loading={loading} />
                <KpiCell label="Total Actual Costs" value={fmtCurrency(totals.totalCost)} loading={loading} />
                <KpiCell
                    label="Total Gross Profit"
                    value={fmtCurrency(totals.totalProfit)}
                    accentColor="#34d399"
                    loading={loading}
                />
                <KpiCell
                    label="Blended Margin"
                    value={`${totals.avgMargin.toFixed(1)}%`}
                    accentColor="#b8956a"
                    loading={loading}
                />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-all"
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-full sm:w-auto overflow-x-auto hide-scrollbar">
                        {(['All', 'Active', 'Completed'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex-1 sm:flex-none ${
                                    statusFilter === status
                                        ? 'bg-white/10 text-white shadow-sm'
                                        : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as 'MarginDesc' | 'MarginAsc' | 'RevenueDesc')}
                        className="h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#b8956a]/50 w-full sm:w-auto cursor-pointer"
                    >
                        <option value="MarginDesc">Highest Margin %</option>
                        <option value="MarginAsc">Lowest Margin %</option>
                        <option value="RevenueDesc">Highest Revenue</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                <th className="px-5 py-3 font-semibold">Project</th>
                                <th className="px-5 py-3 font-semibold text-right">Revenue</th>
                                <th className="px-5 py-3 font-semibold text-right">Est. Cost</th>
                                <th className="px-5 py-3 font-semibold text-right">Actual Cost</th>
                                <th className="px-5 py-3 font-semibold text-right">Gross Profit</th>
                                <th className="px-5 py-3 font-semibold text-right">Margin %</th>
                                <th className="px-5 py-3 font-semibold text-center">vs Est.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                [0, 1, 2, 3].map((i) => (
                                    <tr key={i}>
                                        <td colSpan={7} className="px-5 py-4">
                                            <div className="h-6 bg-white/5 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-white/40 text-sm">
                                        No projects yet — run seed from the Dashboard to populate demo data.
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map((p) => {
                                    const estMargin = p.revenue > 0 ? ((p.revenue - p.estimatedCost) / p.revenue) * 100 : 0;
                                    const variance = p.margin - estMargin;
                                    const isTop = p.id === topMarginId && p.margin > 0;
                                    const isWorst = worstMargin && p.id === worstMargin.id && p.margin < estMargin;
                                    return (
                                        <tr
                                            key={p.id}
                                            className={`hover:bg-white/[0.02] transition-colors group ${
                                                isTop ? 'bg-[#34d399]/[0.04]' : isWorst ? 'bg-red-500/[0.04]' : ''
                                            }`}
                                        >
                                            <td className="px-5 py-4">
                                                <Link href={`/admin/projects/${p.id}/financials`} className="block">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        {isTop && <Trophy size={12} className="text-[#34d399]" />}
                                                        {isWorst && <AlertTriangle size={12} className="text-red-400" />}
                                                        <span className="font-medium text-white group-hover:text-[#b8956a] transition-colors">{p.name}</span>
                                                    </div>
                                                    <div className="text-xs text-white/40 truncate max-w-[260px]">{p.clientName}</div>
                                                </Link>
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono text-white/80">{fmtCurrency(p.revenue)}</td>
                                            <td className="px-5 py-4 text-right font-mono text-white/50">{fmtCurrency(p.estimatedCost)}</td>
                                            <td className={`px-5 py-4 text-right font-mono ${p.actualCost > p.estimatedCost ? 'text-red-400 font-medium' : 'text-white/80'}`}>
                                                {fmtCurrency(p.actualCost)}
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono text-white font-medium">{fmtCurrency(p.gp)}</td>
                                            <td className="px-5 py-4 text-right">
                                                <span
                                                    className={`font-mono font-bold ${
                                                        p.margin >= 30 ? 'text-[#34d399]' : p.margin >= 15 ? 'text-amber-400' : 'text-red-400'
                                                    }`}
                                                >
                                                    {p.margin.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="flex items-center justify-center">
                                                    {Math.abs(variance) < 0.1 ? (
                                                        <span className="text-white/20">
                                                            <Minus size={14} />
                                                        </span>
                                                    ) : variance > 0 ? (
                                                        <span className="flex items-center gap-1 text-[#34d399] text-xs font-mono bg-[#34d399]/10 px-2 py-0.5 rounded">
                                                            <ArrowUpRight size={12} /> {Math.abs(variance).toFixed(1)}%
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-red-400 text-xs font-mono bg-red-400/10 px-2 py-0.5 rounded">
                                                            <ArrowDownRight size={12} /> {Math.abs(variance).toFixed(1)}%
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-8 bg-white/5 rounded-xl p-4 flex flex-wrap items-center gap-6 justify-center text-xs text-white/50">
                <span className="font-semibold uppercase tracking-widest text-white/30 mr-2">Margin Targets</span>
                <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#34d399]" /> Healthy (&gt;30%)
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" /> Acceptable (15-30%)
                </span>
                <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400" /> At Risk (&lt;15%)
                </span>
            </div>
        </div>
    );
}

function KpiCell({
    label,
    value,
    accentColor,
    loading,
}: {
    label: string;
    value: string;
    accentColor?: string;
    loading: boolean;
}) {
    return (
        <div
            className="bg-[#1a1a1a] border rounded-2xl p-5"
            style={{
                borderColor: accentColor ? `${accentColor}33` : 'rgba(255,255,255,0.06)',
                background: accentColor ? `linear-gradient(135deg, #1a1a1a, ${accentColor}10)` : '#1a1a1a',
            }}
        >
            <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                style={{ color: accentColor ?? 'rgba(255,255,255,0.4)' }}
            >
                {label}
            </p>
            {loading ? (
                <div className="h-7 bg-white/5 rounded animate-pulse" />
            ) : (
                <div
                    className="text-xl sm:text-2xl font-bold font-mono"
                    style={{ color: accentColor ?? '#fff' }}
                >
                    {value}
                </div>
            )}
        </div>
    );
}
