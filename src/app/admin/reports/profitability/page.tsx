// @ts-nocheck
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Filter, Download, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { SAMPLE_PROJECTS, formatCurrency } from '@/lib/projects';

export default function ProfitabilityReportPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Completed'>('All');
    const [sortOption, setSortOption] = useState<'MarginDesc' | 'MarginAsc' | 'RevenueDesc'>('MarginDesc');

    // Filter & Sort Logic
    let filteredProjects = SAMPLE_PROJECTS.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.clientName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
        return matchesSearch && matchesStatus && p.status !== 'Archived';
    });

    filteredProjects.sort((a, b) => {
        const marginA = ((a.revenue - a.actualCost) / a.revenue) * 100;
        const marginB = ((b.revenue - b.actualCost) / b.revenue) * 100;

        if (sortOption === 'MarginDesc') return marginB - marginA;
        if (sortOption === 'MarginAsc') return marginA - marginB;
        return b.revenue - a.revenue;
    });

    // Summary Calcs for filtered set
    const totalRev = filteredProjects.reduce((sum, p) => sum + p.revenue, 0);
    const totalCost = filteredProjects.reduce((sum, p) => sum + p.actualCost, 0);
    const totalProfit = totalRev - totalCost;
    const avgMargin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;

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
                        <p className="text-white/50 text-sm">Analyze margins and track financial performance across all projects.</p>
                    </div>
                    <button className="h-10 px-5 bg-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/20 transition-colors whitespace-nowrap">
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Aggregate Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">Total Revenue</p>
                    <div className="text-xl sm:text-2xl font-bold text-white font-mono">{formatCurrency(totalRev)}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">Total Actual Costs</p>
                    <div className="text-xl sm:text-2xl font-bold text-white font-mono">{formatCurrency(totalCost)}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 bg-gradient-to-br from-[#1a1a1a] to-[#34d399]/10">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#34d399] mb-1">Total Gross Profit</p>
                    <div className="text-xl sm:text-2xl font-bold text-[#34d399] font-mono">{formatCurrency(totalProfit)}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#b8956a]/30 rounded-2xl p-5 bg-gradient-to-br from-[#1a1a1a] to-[#b8956a]/10">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Blended Margin</p>
                    <div className="text-xl sm:text-2xl font-bold text-[#b8956a] font-mono">{avgMargin.toFixed(1)}%</div>
                </div>
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
                        {['All', 'Active', 'Completed'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status as any)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex-1 sm:flex-none ${statusFilter === status
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
                        onChange={(e) => setSortOption(e.target.value as any)}
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
                                <th className="px-5 py-3 font-semibold">Project Name</th>
                                <th className="px-5 py-3 font-semibold text-right">Revenue</th>
                                <th className="px-5 py-3 font-semibold text-right">Est. Cost</th>
                                <th className="px-5 py-3 font-semibold text-right">Actual Cost</th>
                                <th className="px-5 py-3 font-semibold text-right">Gross Profit</th>
                                <th className="px-5 py-3 font-semibold text-right">Margin %</th>
                                <th className="px-5 py-3 font-semibold text-center">Variance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredProjects.map(project => {
                                const gp = project.revenue - project.actualCost;
                                const margin = (gp / project.revenue) * 100;
                                const estMargin = ((project.revenue - project.estimatedCost) / project.revenue) * 100;
                                const variance = margin - estMargin;

                                return (
                                    <tr key={project.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-5 py-4">
                                            <Link href={`/admin/projects/${project.id}/financials`} className="block">
                                                <div className="font-medium text-white mb-0.5 group-hover:text-[#b8956a] transition-colors">{project.name}</div>
                                                <div className="text-xs text-white/40 truncate max-w-[200px]">{project.clientName}</div>
                                            </Link>
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white/80">
                                            {formatCurrency(project.revenue)}
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white/50">
                                            {formatCurrency(project.estimatedCost)}
                                        </td>
                                        <td className={`px-5 py-4 text-right font-mono ${project.actualCost > project.estimatedCost ? 'text-red-400 font-medium' : 'text-white/80'}`}>
                                            {formatCurrency(project.actualCost)}
                                        </td>
                                        <td className="px-5 py-4 text-right font-mono text-white font-medium">
                                            {formatCurrency(gp)}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className={`font-mono font-bold ${margin >= 30 ? 'text-[#34d399]' :
                                                    margin >= 15 ? 'text-amber-400' : 'text-red-400'
                                                    }`}>
                                                    {margin.toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {Math.abs(variance) < 0.1 ? (
                                                    <span className="text-white/20"><Minus size={14} /></span>
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
                            })}
                        </tbody>
                    </table>

                    {filteredProjects.length === 0 && (
                        <div className="py-12 text-center text-white/40 text-sm">
                            No projects found matching your criteria.
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-8 bg-white/5 rounded-xl p-4 flex flex-wrap items-center gap-6 justify-center text-xs text-white/50">
                <span className="font-semibold uppercase tracking-widest text-white/30 mr-2">Margin Targets</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#34d399]" /> Healthy (&gt;30%)</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400" /> Acceptable (15-30%)</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-400" /> At Risk (&lt;15%)</span>
            </div>
        </div>
    );
}
