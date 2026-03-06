'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Filter, Download, ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from 'lucide-react';
import { SAMPLE_PROJECTS, formatCurrency, BudgetCategory } from '@/lib/projects';

// Helper to aggregate costs across all projects by category
function aggregateCostsByCategory() {
    const aggregates: Record<string, { est: number, act: number }> = {};

    // Initialize standard categories
    const standardCategories: BudgetCategory[] = [
        'Demolition', 'Framing', 'Plumbing', 'Electrical', 'HVAC',
        'Drywall', 'Painting', 'Flooring', 'Cabinets', 'Countertops',
        'Fixtures', 'Appliances', 'Permits', 'Cleaning', 'Other'
    ];

    standardCategories.forEach(cat => {
        aggregates[cat] = { est: 0, act: 0 };
    });

    // We don't have detailed category breakdowns for every sample project,
    // so for this report, we will simulate the breakdown based on the project's total cost.
    // In a real app, you would sum up the actual cost entries and estimate line items.

    SAMPLE_PROJECTS.forEach(p => {
        // Distribute estimated cost
        const estAlloc = {
            'Materials': p.estimatedCost * 0.4,
            'Labor': p.estimatedCost * 0.4,
            'Permits & Fees': p.estimatedCost * 0.05,
            'Equipment': p.estimatedCost * 0.05,
            'Overhead': p.estimatedCost * 0.1
        };

        // Simulating actual cost variations (some categories over, some under)
        const actAlloc = {
            'Materials': p.actualCost * 0.45, // Materials typically go over
            'Labor': p.actualCost * 0.38,
            'Permits & Fees': p.actualCost * 0.05,
            'Equipment': p.actualCost * 0.04,
            'Overhead': p.actualCost * 0.08
        };

        ['Materials', 'Labor', 'Permits & Fees', 'Equipment', 'Overhead'].forEach(cat => {
            if (!aggregates[cat]) aggregates[cat] = { est: 0, act: 0 };
            aggregates[cat].est += estAlloc[cat as keyof typeof estAlloc] || 0;
            aggregates[cat].act += actAlloc[cat as keyof typeof actAlloc] || 0;
        });
    });

    return Object.entries(aggregates)
        // Only keep categories with non-zero values
        .filter(([_, data]) => data.est > 0 || data.act > 0)
        .map(([category, data]) => ({
            category,
            estimated: data.est,
            actual: data.act,
            variance: data.est - data.act,
            variancePct: data.est > 0 ? ((data.act - data.est) / data.est) * 100 : 0
        }))
        .sort((a, b) => b.variancePct - a.variancePct); // Sort by highest overage %
}

export default function EstimateVsActualReportPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [varianceFilter, setVarianceFilter] = useState<'All' | 'Over Budget' | 'Under Budget'>('All');

    const aggregatedData = aggregateCostsByCategory();

    // Filter Logic
    const filteredData = aggregatedData.filter(item => {
        const matchesSearch = item.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter =
            varianceFilter === 'All' ||
            (varianceFilter === 'Over Budget' && item.variancePct > 0) ||
            (varianceFilter === 'Under Budget' && item.variancePct < 0);
        return matchesSearch && matchesFilter;
    });

    // Summary Calcs
    const totalEst = filteredData.reduce((sum, item) => sum + item.estimated, 0);
    const totalAct = filteredData.reduce((sum, item) => sum + item.actual, 0);
    const totalVariance = totalEst - totalAct; // Positive = savings, Negative = overrun

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
                        <h1 className="font-serif text-3xl font-bold text-white mb-2">Aggregate Cost Variances</h1>
                        <p className="text-white/50 text-sm">Analyze estimated vs. actual costs by category across all projects.</p>
                    </div>
                    <button className="h-10 px-5 bg-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/20 transition-colors whitespace-nowrap">
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Aggregate Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">Total Estimated Cost</p>
                    <div className="text-xl sm:text-2xl font-bold text-white font-mono">{formatCurrency(totalEst)}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">Total Actual Cost</p>
                    <div className="text-xl sm:text-2xl font-bold text-white font-mono">{formatCurrency(totalAct)}</div>
                </div>
                <div className={`bg-[#1a1a1a] border rounded-2xl p-5 bg-gradient-to-br ${totalVariance >= 0 ? 'border-[#34d399]/30 from-[#1a1a1a] to-[#34d399]/10' : 'border-red-500/30 from-[#1a1a1a] to-red-500/10'}`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${totalVariance >= 0 ? 'text-[#34d399]' : 'text-red-400'}`}>Net Variance</p>
                    <div className={`text-xl sm:text-2xl font-bold font-mono ${totalVariance >= 0 ? 'text-[#34d399]' : 'text-red-400'}`}>
                        {totalVariance > 0 ? '+' : ''}{formatCurrency(totalVariance)}
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-all font-sans"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full sm:w-auto">
                    <Filter className="text-white/20 mr-1 shrink-0" size={14} />
                    {['All', 'Over Budget', 'Under Budget'].map(status => (
                        <button
                            key={status}
                            onClick={() => setVarianceFilter(status as any)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${varianceFilter === status
                                    ? 'bg-white/15 text-white'
                                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                                }`}
                        >
                            {status}
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
                                <th className="px-5 py-3 font-semibold">Cost Category</th>
                                <th className="px-5 py-3 font-semibold text-right">Aggregate Est.</th>
                                <th className="px-5 py-3 font-semibold text-right">Aggregate Act.</th>
                                <th className="px-5 py-3 font-semibold text-right">Variance ($)</th>
                                <th className="px-5 py-3 font-semibold text-center">Variance (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredData.map(item => {
                                const isOver = item.actual > item.estimated;
                                const isWarning = item.variancePct > 5;

                                return (
                                    <tr key={item.category} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-5 py-4 font-medium text-white">
                                            {item.category}
                                        </td>

                                        <td className="px-5 py-4 text-right font-mono text-white/50">
                                            {formatCurrency(item.estimated)}
                                        </td>

                                        <td className="px-5 py-4 text-right font-mono text-white/80">
                                            {formatCurrency(item.actual)}
                                        </td>

                                        <td className={`px-5 py-4 text-right font-mono font-medium ${isOver ? 'text-red-400' : 'text-[#34d399]'}`}>
                                            {item.variance > 0 ? '+' : ''}{formatCurrency(item.variance)}
                                        </td>

                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {Math.abs(item.variancePct) < 1 ? (
                                                    <span className="text-white/20"><Minus size={14} /></span>
                                                ) : isOver ? (
                                                    <span className={`flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded ${isWarning ? 'bg-red-400/10 text-red-400 font-bold' : 'text-white/60'}`}>
                                                        <ArrowUpRight size={12} /> {item.variancePct.toFixed(1)}%
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-[#34d399] text-xs font-mono bg-[#34d399]/10 px-2 py-0.5 rounded">
                                                        <ArrowDownRight size={12} /> {Math.abs(item.variancePct).toFixed(1)}%
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredData.length === 0 && (
                        <div className="py-12 text-center text-white/40 text-sm">
                            No categories pattern matched.
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
