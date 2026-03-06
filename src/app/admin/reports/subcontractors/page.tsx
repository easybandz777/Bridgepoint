// @ts-nocheck
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Filter, Download, Star, AlertTriangle, ShieldAlert } from 'lucide-react';
import { SAMPLE_SUBCONTRACTORS, TradeCategory } from '@/lib/subcontractors';
import { formatCurrency } from '@/lib/projects';

export default function SubcontractorReportPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [tradeFilter, setTradeFilter] = useState<TradeCategory | 'All'>('All');
    const [sortOption, setSortOption] = useState<'RatingDesc' | 'SpendDesc' | 'IssuesDesc'>('RatingDesc');

    // Filter & Sort Logic
    let filteredSubs = SAMPLE_SUBCONTRACTORS.filter(sub => {
        const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTrade = tradeFilter === 'All' || sub.trades.includes(tradeFilter);
        return matchesSearch && matchesTrade;
    });

    filteredSubs.sort((a, b) => {
        if (sortOption === 'RatingDesc') return b.rating - a.rating;
        if (sortOption === 'SpendDesc') return b.stats.ytdPaid - a.stats.ytdPaid;
        if (sortOption === 'IssuesDesc') return b.stats.incidents - a.stats.incidents;
        return 0;
    });

    // Summary Calcs
    const totalSpend = filteredSubs.reduce((sum, sub) => sum + sub.stats.ytdPaid, 0);
    const avgRating = filteredSubs.reduce((sum, sub) => sum + sub.rating, 0) / (filteredSubs.length || 1);
    const totalIssues = filteredSubs.reduce((sum, sub) => sum + sub.stats.incidents, 0);

    // Get unique trades from sample data for the filter
    const allTrades = Array.from(new Set(SAMPLE_SUBCONTRACTORS.flatMap(s => s.trades))).sort();

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
                        <h1 className="font-serif text-3xl font-bold text-white mb-2">Subcontractor Performance</h1>
                        <p className="text-white/50 text-sm">Review ratings, callbacks, compliance, and total spend across all trade partners.</p>
                    </div>
                    <button className="h-10 px-5 bg-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/20 transition-colors whitespace-nowrap">
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Aggregate Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">Total Sub Spend (YTD)</p>
                    <div className="text-xl sm:text-2xl font-bold text-white font-mono">{formatCurrency(totalSpend)}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">Active Partners</p>
                    <div className="text-xl sm:text-2xl font-bold text-white font-mono">{filteredSubs.length}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 bg-gradient-to-br from-[#1a1a1a] to-[#b8956a]/5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Average Network Rating</p>
                    <div className="text-xl sm:text-2xl font-bold text-[#b8956a] font-mono flex items-center gap-2">
                        {avgRating.toFixed(1)} <Star size={20} className="fill-[#b8956a] text-[#b8956a]" />
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-red-500/10 rounded-2xl p-5 bg-gradient-to-br from-[#1a1a1a] to-red-500/5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-red-400 mb-1">Total Issues/Callbacks</p>
                    <div className="text-xl sm:text-2xl font-bold text-red-400 font-mono">{totalIssues}</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                            type="text"
                            placeholder="Search sub name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-all font-sans"
                        />
                    </div>
                    <select
                        value={tradeFilter}
                        onChange={(e) => setTradeFilter(e.target.value as any)}
                        className="h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#b8956a]/50 w-full sm:w-48"
                    >
                        <option value="All">All Trades</option>
                        {allTrades.map(trade => (
                            <option key={trade} value={trade}>{trade}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar w-full lg:w-auto justify-start lg:justify-end">
                    <Filter className="text-white/20 mr-1 shrink-0" size={14} />
                    {[
                        { label: 'Highest Rated', val: 'RatingDesc' },
                        { label: 'Highest Spend', val: 'SpendDesc' },
                        { label: 'Most Issues', val: 'IssuesDesc' },
                    ].map(opt => (
                        <button
                            key={opt.val}
                            onClick={() => setSortOption(opt.val as any)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${sortOption === opt.val
                                ? 'bg-white/15 text-white'
                                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                <th className="px-5 py-3 font-semibold">Subcontractor</th>
                                <th className="px-5 py-3 font-semibold text-center">Rating</th>
                                <th className="px-5 py-3 font-semibold text-center">Jobs<br />(Completed)</th>
                                <th className="px-5 py-3 font-semibold text-right">YTD Spend</th>
                                <th className="px-5 py-3 font-semibold text-center">Issues</th>
                                <th className="px-5 py-3 font-semibold text-center">Compliance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredSubs.map(sub => {
                                const hasDocsIssue = !sub.compliance.hasW9 || !sub.compliance.hasCOI || sub.compliance.insuranceExpiry < new Date().toISOString().split('T')[0];

                                return (
                                    <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-5 py-4">
                                            <Link href={`/admin/subcontractors/${sub.id}/performance`} className="block">
                                                <div className="font-medium text-white mb-1 group-hover:text-[#b8956a] transition-colors">{sub.name}</div>
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {sub.trades.slice(0, 2).map(trade => (
                                                        <span key={trade} className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest bg-white/5 text-white/60">
                                                            {trade}
                                                        </span>
                                                    ))}
                                                    {sub.trades.length > 2 && (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-white/60">+{sub.trades.length - 2}</span>
                                                    )}
                                                </div>
                                            </Link>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span className={`font-mono font-bold ${sub.rating >= 4.5 ? 'text-[#34d399]' : sub.rating >= 3.5 ? 'text-amber-400' : 'text-red-400'}`}>
                                                    {sub.rating.toFixed(1)}
                                                </span>
                                                <Star size={14} className={sub.rating >= 4.5 ? 'fill-[#34d399] text-[#34d399]' : sub.rating >= 3.5 ? 'fill-amber-400 text-amber-400' : 'fill-red-400 text-red-400'} />
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 text-center font-mono text-white/80">
                                            {sub.stats.completedJobs}
                                        </td>

                                        <td className="px-5 py-4 text-right font-mono text-white/80">
                                            {formatCurrency(sub.stats.ytdPaid)}
                                        </td>

                                        <td className="px-5 py-4 text-center">
                                            {sub.stats.incidents > 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/10 text-amber-500">
                                                    <AlertTriangle size={12} /> {sub.stats.incidents}
                                                </span>
                                            ) : (
                                                <span className="text-white/20">-</span>
                                            )}
                                        </td>

                                        <td className="px-5 py-4 text-center">
                                            {hasDocsIssue ? (
                                                <Link href={`/admin/subcontractors/${sub.id}/documents`} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Action Required">
                                                    <ShieldAlert size={14} />
                                                </Link>
                                            ) : (
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#34d399]/10 text-[#34d399]" title="Compliant">
                                                    <ShieldAlert size={14} />
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredSubs.length === 0 && (
                        <div className="py-12 text-center text-white/40 text-sm">
                            No subcontractors found matching your criteria.
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
