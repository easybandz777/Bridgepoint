'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, ShieldAlert, AlertCircle, ChevronRight, Star, Award, UserPlus } from 'lucide-react';
import {
    SAMPLE_SUBCONTRACTORS,
    TradeCategory,
    SubStatus
} from '@/lib/subcontractors';
import { StatusBadge } from '@/components/admin/status-badge';
import { formatCurrencyPrecise } from '@/components/admin/cost-card';

export default function SubcontractorsDirectoryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [tradeFilter, setTradeFilter] = useState<TradeCategory | 'All'>('All');
    const [statusFilter, setStatusFilter] = useState<SubStatus | 'All'>('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Stats
    const totalSubs = SAMPLE_SUBCONTRACTORS.length;
    const activeSubs = SAMPLE_SUBCONTRACTORS.filter(s => s.status === 'Active' || s.status === 'Preferred').length;

    // Check for compliance issues (expired or missing docs)
    const subsWithIssues = SAMPLE_SUBCONTRACTORS.filter(s => {
        if (s.insuranceExpiry && new Date(s.insuranceExpiry) < new Date()) return true;

        let missingDocs = false;
        Object.values(s.documentsRequired).forEach(req => {
            if (!req) missingDocs = true;
        });
        return missingDocs;
    });

    // Filter Logic
    const filteredSubs = SAMPLE_SUBCONTRACTORS.filter(sub => {
        const matchesSearch =
            sub.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.primaryContact.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesTrade = tradeFilter === 'All' || sub.trades.includes(tradeFilter);
        const matchesStatus = statusFilter === 'All' || sub.status === statusFilter;

        return matchesSearch && matchesTrade && matchesStatus;
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">Subcontractors</h1>
                    <p className="text-sm text-white/50">Manage trade partners, track performance, and monitor compliance.</p>
                </div>
                <Link
                    href="/admin/subcontractors/new"
                    className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap"
                >
                    <Plus size={16} />
                    Add Subcontractor
                </Link>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Total Subcontractors</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{totalSubs}</span>
                        <span className="text-xs text-white/40">registered</span>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Active Roster</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{activeSubs}</span>
                        <span className="text-xs text-white/40">approved for work</span>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Compliance Alerts</p>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-bold ${subsWithIssues.length > 0 ? 'text-red-400' : 'text-white'}`}>
                                {subsWithIssues.length}
                            </span>
                            <span className="text-xs text-white/40">subs with missing/expired docs</span>
                        </div>
                    </div>
                    {subsWithIssues.length > 0 && (
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                            <ShieldAlert size={20} />
                        </div>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                            type="text"
                            placeholder="Search names, contacts, tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-all font-sans"
                        />
                    </div>
                    <select
                        value={tradeFilter}
                        onChange={(e) => setTradeFilter(e.target.value as any)}
                        className="h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#b8956a]/50 w-32 shrink-0 lg:w-48"
                    >
                        <option value="All">All Trades</option>
                        <option value="General">General</option>
                        <option value="Framing">Framing</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="HVAC">HVAC</option>
                        <option value="Drywall">Drywall</option>
                        <option value="Painting">Painting</option>
                        <option value="Flooring">Flooring</option>
                        <option value="Roofing">Roofing</option>
                        <option value="Landscaping">Landscaping</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar w-full lg:w-auto justify-start lg:justify-end border-b lg:border-b-0 border-white/10 lg:border-none mb-2 lg:mb-0">
                    <Filter className="text-white/20 mr-1 shrink-0" size={14} />
                    {['All', 'Active', 'Preferred', 'Probation', 'Blacklisted'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status as any)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === status
                                    ? 'bg-white/15 text-white'
                                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubs.map(sub => {
                    const hasComplianceIssue = subsWithIssues.some(s => s.id === sub.id);

                    return (
                        <Link
                            key={sub.id}
                            href={`/admin/subcontractors/${sub.id}`}
                            className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 hover:border-white/10 hover:bg-[#1f1f1f] transition-all group flex flex-col relative"
                        >
                            {/* Compliance Warning Badge */}
                            {hasComplianceIssue && (
                                <div className="absolute -top-2 -right-2 bg-[#f87171] text-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-[#1a1a1a]" title="Action required: Missing or expired documentation">
                                    <AlertCircle size={14} />
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <StatusBadge status={sub.status} />
                                        {sub.status === 'Preferred' && (
                                            <Award size={14} className="text-[#34d399]" />
                                        )}
                                    </div>
                                    <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#b8956a] transition-colors leading-snug pr-4">
                                        {sub.companyName}
                                    </h3>
                                    <div className="flex gap-1 flex-wrap mt-1.5">
                                        {sub.trades.slice(0, 2).map((trade, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-white/5 text-white/50 text-[10px] rounded uppercase tracking-wider">{trade}</span>
                                        ))}
                                        {sub.trades.length > 2 && (
                                            <span className="px-1.5 py-0.5 bg-white/5 text-white/50 text-[10px] rounded uppercase tracking-wider">+{sub.trades.length - 2}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-5 space-y-2 flex-grow">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/40">Contact</span>
                                    <span className="text-white font-medium">{sub.primaryContact}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/40">Phone</span>
                                    <span className="text-white font-mono">{sub.phone}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/6 grid grid-cols-3 gap-2 text-center items-center">
                                <div>
                                    <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Rating</div>
                                    <div className="flex items-center justify-center gap-1 font-bold text-white">
                                        <Star size={12} className="text-[#fbbf24] fill-[#fbbf24]" />
                                        {sub.metrics.averageRating.toFixed(1)}
                                    </div>
                                </div>
                                <div className="border-l border-white/6">
                                    <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Jobs</div>
                                    <div className="font-bold text-white font-mono">
                                        {sub.metrics.totalJobsCompleted}
                                    </div>
                                </div>
                                <div className="border-l border-white/6">
                                    <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Reliability</div>
                                    <div className={`font-bold font-mono ${sub.metrics.reliabilityScore >= 90 ? 'text-[#34d399]' : 'text-[#fbbf24]'}`}>
                                        {sub.metrics.reliabilityScore}%
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}

                {filteredSubs.length === 0 && (
                    <div className="col-span-full py-16 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.02]">
                        <UserPlus size={48} className="mx-auto text-white/10 mb-4" />
                        <h3 className="font-serif text-lg font-bold text-white mb-2">No Subcontractors Found</h3>
                        <p className="text-white/40 mb-6 max-w-sm mx-auto">
                            We couldn't find any subcontractors matching your current search or filter criteria.
                        </p>
                        <button
                            onClick={() => { setSearchQuery(''); setTradeFilter('All'); setStatusFilter('All'); }}
                            className="text-[#b8956a] hover:text-[#cbb08c] font-semibold text-sm transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
