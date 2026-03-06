// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, ShieldAlert, AlertCircle, Star, Award, UserPlus, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';

function fmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function rowToSub(r: any) {
    const trades = Array.isArray(r.trades) ? r.trades : [];
    const metrics = r.metrics ?? { averageRating: 4.0, totalJobsCompleted: 0, reliabilityScore: 100 };
    const documents = Array.isArray(r.documents) ? r.documents : [];
    const isInsuranceExpired = r.insurance_expiry ? new Date(r.insurance_expiry) < new Date() : false;

    return {
        id: r.id,
        companyName: r.company_name,
        primaryContact: r.contact_person,
        phone: r.phone,
        email: r.email,
        address: r.address,
        trades,
        status: r.status,
        rating: Number(r.rating ?? 4),
        tags: Array.isArray(r.tags) ? r.tags : [],
        paymentTerms: r.payment_terms,
        defaultRate: r.default_rate,
        notes: r.notes,
        insuranceExpiry: r.insurance_expiry,
        documents,
        metrics: {
            averageRating: Number(metrics.averageRating ?? 4),
            totalJobsCompleted: Number(metrics.totalJobsCompleted ?? 0),
            reliabilityScore: Number(metrics.reliabilityScore ?? 100),
        },
        hasComplianceIssue: isInsuranceExpired || documents.some((d: any) => !d.verified),
    };
}

export default function SubcontractorsDirectoryPage() {
    const [subs, setSubs] = useState<ReturnType<typeof rowToSub>[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [tradeFilter, setTradeFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    async function load() {
        setLoading(true);
        try {
            const res = await fetch('/api/subcontractors');
            const data = await res.json();
            setSubs(Array.isArray(data) ? data.map(rowToSub) : []);
        } catch {
            setSubs([]);
        }
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function deleteSub(id: string) {
        if (!confirm('Delete this subcontractor?')) return;
        await fetch(`/api/subcontractors/${id}`, { method: 'DELETE' });
        setSubs(p => p.filter(s => s.id !== id));
    }

    const totalSubs = subs.length;
    const activeSubs = subs.filter(s => s.status === 'Active' || s.status === 'Preferred').length;
    const subsWithIssues = subs.filter(s => s.hasComplianceIssue).length;

    const filteredSubs = subs.filter(sub => {
        const matchesSearch =
            sub.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.primaryContact.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesTrade = tradeFilter === 'All' || sub.trades.includes(tradeFilter);
        const matchesStatus = statusFilter === 'All' || sub.status === statusFilter;
        return matchesSearch && matchesTrade && matchesStatus;
    });

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Admin</p>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">Subcontractors</h1>
                    <p className="text-sm text-white/50">Manage trade partners, track performance, and monitor compliance.</p>
                </div>
                <Link
                    href="/admin/subcontractors/new"
                    className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap"
                >
                    <Plus size={16} /> Add Subcontractor
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Total</p>
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
                            <span className={`text-2xl font-bold ${subsWithIssues > 0 ? 'text-red-400' : 'text-white'}`}>{subsWithIssues}</span>
                            <span className="text-xs text-white/40">subs need attention</span>
                        </div>
                    </div>
                    {subsWithIssues > 0 && (
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                            <ShieldAlert size={20} />
                        </div>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                            type="text"
                            placeholder="Search names, contacts, tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all"
                        />
                    </div>
                    <select
                        title="Filter by trade"
                        value={tradeFilter}
                        onChange={(e) => setTradeFilter(e.target.value)}
                        className="h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none shrink-0"
                    >
                        <option value="All">All Trades</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="HVAC">HVAC</option>
                        <option value="Framing">Framing</option>
                        <option value="Drywall">Drywall</option>
                        <option value="Painting">Painting</option>
                        <option value="Flooring">Flooring</option>
                        <option value="Roofing">Roofing</option>
                        <option value="General">General</option>
                    </select>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {['All', 'Active', 'Preferred', 'Probation', 'Blacklisted'].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
                </div>
            ) : filteredSubs.length === 0 ? (
                <div className="py-16 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.02]">
                    <UserPlus size={48} className="mx-auto text-white/10 mb-4" />
                    <h3 className="font-serif text-lg font-bold text-white mb-2">No Subcontractors Found</h3>
                    <p className="text-white/40 mb-6 max-w-sm mx-auto">
                        {subs.length === 0 ? 'Add your first subcontractor to get started.' : 'No results match your filters.'}
                    </p>
                    {subs.length > 0 && (
                        <button
                            onClick={() => { setSearchQuery(''); setTradeFilter('All'); setStatusFilter('All'); }}
                            className="text-[#b8956a] hover:text-[#cbb08c] font-semibold text-sm transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSubs.map(sub => (
                        <div key={sub.id} className="relative group">
                            <Link
                                href={`/admin/subcontractors/${sub.id}`}
                                className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 hover:border-white/10 hover:bg-[#1f1f1f] transition-all flex flex-col relative block"
                            >
                                {sub.hasComplianceIssue && (
                                    <div className="absolute -top-2 -right-2 bg-[#f87171] text-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-[#1a1a1a]" title="Action required: Missing or expired documentation">
                                        <AlertCircle size={14} />
                                    </div>
                                )}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <StatusBadge status={sub.status} />
                                            {sub.status === 'Preferred' && <Award size={14} className="text-[#34d399]" />}
                                        </div>
                                        <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#b8956a] transition-colors leading-snug pr-4">
                                            {sub.companyName}
                                        </h3>
                                        <div className="flex gap-1 flex-wrap mt-1.5">
                                            {sub.trades.slice(0, 2).map((trade: string, i: number) => (
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
                                <div className="pt-4 border-t border-white/6 grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Rating</div>
                                        <div className="flex items-center justify-center gap-1 font-bold text-white">
                                            <Star size={12} className="text-[#fbbf24] fill-[#fbbf24]" />
                                            {sub.metrics.averageRating.toFixed(1)}
                                        </div>
                                    </div>
                                    <div className="border-l border-white/6">
                                        <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Jobs</div>
                                        <div className="font-bold text-white font-mono">{sub.metrics.totalJobsCompleted}</div>
                                    </div>
                                    <div className="border-l border-white/6">
                                        <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Reliability</div>
                                        <div className={`font-bold font-mono ${sub.metrics.reliabilityScore >= 90 ? 'text-[#34d399]' : 'text-[#fbbf24]'}`}>
                                            {sub.metrics.reliabilityScore}%
                                        </div>
                                    </div>
                                </div>
                            </Link>
                            <button
                                onClick={() => deleteSub(sub.id)}
                                title="Delete subcontractor"
                                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all z-10"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
