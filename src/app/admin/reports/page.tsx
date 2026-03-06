'use client';

import Link from 'next/link';
import { PieChart, TrendingUp, Users, ArrowRight, DollarSign, Calendar, FileText } from 'lucide-react';
import { SAMPLE_PROJECTS, formatCurrency } from '@/lib/projects';

export default function ReportsHubPage() {
    const activeProjectsCount = SAMPLE_PROJECTS.filter(p => p.status === 'Active').length;

    // Quick summary calcs
    const totalEstCost = SAMPLE_PROJECTS.reduce((sum, p) => sum + p.estimatedCost, 0);
    const totalActCost = SAMPLE_PROJECTS.reduce((sum, p) => sum + p.actualCost, 0);
    const totalEstProfit = SAMPLE_PROJECTS.reduce((sum, p) => sum + (p.revenue - p.estimatedCost), 0);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
                    <p className="text-white/50 text-sm">Financial health, job performance, and subcontractor metrics.</p>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Portfolio Estimated Cost</p>
                    <div className="text-2xl font-bold text-white font-mono">{formatCurrency(totalEstCost)}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Portfolio Actual Cost</p>
                    <div className="text-2xl font-bold text-white font-mono">{formatCurrency(totalActCost)}</div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 bg-gradient-to-br from-[#1a1a1a] to-[#b8956a]/5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#34d399] mb-1">Estimated Gross Profit</p>
                    <div className="text-2xl font-bold text-[#34d399] font-mono">{formatCurrency(totalEstProfit)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Profitability Report */}
                <Link
                    href="/admin/reports/profitability"
                    className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 hover:border-[#b8956a]/40 hover:bg-white/5 transition-all group relative overflow-hidden flex flex-col h-full"
                >
                    <div className="absolute -top-12 -right-12 text-[#b8956a]/5 group-hover:text-[#b8956a]/10 transition-colors">
                        <PieChart size={140} />
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#b8956a]/10 flex items-center justify-center text-[#b8956a] mb-6 relative z-10">
                        <PieChart size={24} />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2 relative z-10">Job Profitability</h2>
                    <p className="text-sm text-white/50 mb-6 flex-1 relative z-10">Compare estimated vs actual profit margins across all projects. Quickly identify jobs that are over budget or bleeding margin.</p>

                    <div className="flex items-center text-xs font-semibold uppercase tracking-widest text-[#b8956a] group-hover:text-[#cbb08c] mt-auto relative z-10">
                        View Report <ArrowRight size={14} className="ml-2" />
                    </div>
                </Link>

                {/* 2. Subcontractor Performance */}
                <Link
                    href="/admin/reports/subcontractors"
                    className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 hover:border-[#b8956a]/40 hover:bg-white/5 transition-all group relative overflow-hidden flex flex-col h-full"
                >
                    <div className="absolute -top-12 -right-12 text-[#b8956a]/5 group-hover:text-[#b8956a]/10 transition-colors">
                        <Users size={140} />
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#b8956a]/10 flex items-center justify-center text-[#b8956a] mb-6 relative z-10">
                        <Users size={24} />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2 relative z-10">Subcontractor Scoring</h2>
                    <p className="text-sm text-white/50 mb-6 flex-1 relative z-10">Review ratings, callbacks, and total spend by subcontractor and trade category. Identify your top performers and systemic issues.</p>

                    <div className="flex items-center text-xs font-semibold uppercase tracking-widest text-[#b8956a] group-hover:text-[#cbb08c] mt-auto relative z-10">
                        View Report <ArrowRight size={14} className="ml-2" />
                    </div>
                </Link>

                {/* 3. Est vs Actual Aggregate */}
                <Link
                    href="/admin/reports/estimate-vs-actual"
                    className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 hover:border-[#b8956a]/40 hover:bg-white/5 transition-all group relative overflow-hidden flex flex-col h-full"
                >
                    <div className="absolute -top-12 -right-12 text-[#b8956a]/5 group-hover:text-[#b8956a]/10 transition-colors">
                        <TrendingUp size={140} />
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#b8956a]/10 flex items-center justify-center text-[#b8956a] mb-6 relative z-10">
                        <TrendingUp size={24} />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2 relative z-10">Cost Variances</h2>
                    <p className="text-sm text-white/50 mb-6 flex-1 relative z-10">Aggregate analysis of where estimates differ from reality. See which budget categories consistently go over budget.</p>

                    <div className="flex items-center text-xs font-semibold uppercase tracking-widest text-[#b8956a] group-hover:text-[#cbb08c] mt-auto relative z-10">
                        View Report <ArrowRight size={14} className="ml-2" />
                    </div>
                </Link>

                {/* Future Reports placeholders for visual balance */}
                <div className="bg-[#1a1a1a]/50 border border-white/6 rounded-2xl p-6 flex flex-col h-full relative overflow-hidden group">
                    <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-3 py-1 bg-[#b8956a] text-black text-xs font-bold uppercase tracking-widest rounded">Coming Soon</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/20 mb-6">
                        <Calendar size={24} />
                    </div>
                    <h2 className="text-lg font-bold text-white/40 mb-2">Schedule Efficiency</h2>
                    <p className="text-sm text-white/20 mb-6 flex-1">Track planned vs actual project duration and phase bottlenecks.</p>
                </div>

                <div className="bg-[#1a1a1a]/50 border border-white/6 rounded-2xl p-6 flex flex-col h-full relative overflow-hidden group">
                    <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-3 py-1 bg-[#b8956a] text-black text-xs font-bold uppercase tracking-widest rounded">Coming Soon</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/20 mb-6">
                        <DollarSign size={24} />
                    </div>
                    <h2 className="text-lg font-bold text-white/40 mb-2">Cash Flow Forecast</h2>
                    <p className="text-sm text-white/20 mb-6 flex-1">Project incoming revenue vs outgoing payout commitments over time.</p>
                </div>

                <div className="bg-[#1a1a1a]/50 border border-white/6 rounded-2xl p-6 flex flex-col h-full relative overflow-hidden group">
                    <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-3 py-1 bg-[#b8956a] text-black text-xs font-bold uppercase tracking-widest rounded">Coming Soon</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/20 mb-6">
                        <FileText size={24} />
                    </div>
                    <h2 className="text-lg font-bold text-white/40 mb-2">Change Order Impact</h2>
                    <p className="text-sm text-white/20 mb-6 flex-1">Analyze revenue lift vs margin drain of project change orders.</p>
                </div>

            </div>
        </div>
    );
}
