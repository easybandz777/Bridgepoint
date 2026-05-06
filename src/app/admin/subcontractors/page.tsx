'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, ShieldAlert, AlertCircle, Star, Award, UserPlus, Trash2, Database, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';
import type { Subcontractor } from '@/lib/subcontractors';

export default function SubcontractorsDirectoryPage() {
    const [subs, setSubs] = useState<Subcontractor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [tradeFilter, setTradeFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [seeding, setSeeding] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/subcontractors', { cache: 'no-store' });
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(body.error ?? `HTTP ${res.status}`);
            }
            const data = (await res.json()) as Subcontractor[];
            setSubs(Array.isArray(data) ? data : []);
        } catch (e) {
            setSubs([]);
            setError(e instanceof Error ? e.message : 'Failed to load subcontractors');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    async function deleteSub(id: string) {
        if (!confirm('Delete this subcontractor? This will also remove their notes and assignments.')) return;
        try {
            const res = await fetch(`/api/subcontractors/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            setSubs((p) => p.filter((s) => s.id !== id));
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to delete');
        }
    }

    async function loadSampleData() {
        if (!confirm('Load sample subcontractors into the database?')) return;
        setSeeding(true);
        try {
            const res = await fetch('/api/subcontractors/seed', { method: 'POST' });
            const body = (await res.json()) as { inserted?: number; skipped?: boolean; error?: string };
            if (!res.ok) throw new Error(body.error ?? 'Seed failed');
            await load();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to seed');
        } finally {
            setSeeding(false);
        }
    }

    const totalSubs = subs.length;
    const activeSubs = subs.filter((s) => s.status === 'Active' || s.status === 'Preferred').length;
    const subsWithIssues = subs.filter((s) => !s.compliance.isCompliant).length;
    const expiringSoon = subs.filter((s) => s.compliance.coiExpiringSoon).length;

    const allTrades = Array.from(new Set(subs.flatMap((s) => s.trades))).sort();

    const filteredSubs = subs.filter((sub) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            sub.companyName.toLowerCase().includes(q) ||
            sub.contactPerson.toLowerCase().includes(q) ||
            sub.tags.some((t) => t.toLowerCase().includes(q));
        const matchesTrade = tradeFilter === 'All' || sub.trades.includes(tradeFilter as Subcontractor['trades'][number]);
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
                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/subcontractors/compliance"
                        className="h-10 px-4 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/10 transition-colors whitespace-nowrap"
                    >
                        <ShieldCheck size={16} /> Compliance
                    </Link>
                    <Link
                        href="/admin/subcontractors/new"
                        className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap"
                    >
                        <Plus size={16} /> Add Subcontractor
                    </Link>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-300 text-sm flex items-start gap-3">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-1">Failed to load subcontractors</p>
                        <p className="text-red-300/80 text-xs">{error}</p>
                        <button onClick={() => void load()} className="mt-2 text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c]">
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Expiring Soon</p>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-bold ${expiringSoon > 0 ? 'text-[#fbbf24]' : 'text-white'}`}>{expiringSoon}</span>
                        <span className="text-xs text-white/40">COI &le; 30 days</span>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Compliance Alerts</p>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-bold ${subsWithIssues > 0 ? 'text-red-400' : 'text-white'}`}>{subsWithIssues}</span>
                            <span className="text-xs text-white/40">need attention</span>
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
                        {allTrades.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {['All', 'Active', 'Preferred', 'Probation', 'Inactive', 'Blacklisted'].map((s) => (
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
                    <h3 className="font-serif text-lg font-bold text-white mb-2">
                        {subs.length === 0 ? 'No Subcontractors Yet' : 'No Matches'}
                    </h3>
                    <p className="text-white/40 mb-6 max-w-sm mx-auto">
                        {subs.length === 0 ? 'Add your first subcontractor or load sample data to explore the module.' : 'No results match your filters.'}
                    </p>
                    {subs.length === 0 ? (
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/admin/subcontractors/new"
                                className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full inline-flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors"
                            >
                                <Plus size={16} /> Add Subcontractor
                            </Link>
                            <button
                                onClick={() => void loadSampleData()}
                                disabled={seeding}
                                className="h-10 px-5 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-full inline-flex items-center justify-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                                <Database size={16} /> {seeding ? 'Loading...' : 'Load Sample Data'}
                            </button>
                        </div>
                    ) : (
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
                    {filteredSubs.map((sub) => {
                        const hasIssue = !sub.compliance.isCompliant;
                        return (
                            <div key={sub.id} className="relative group">
                                <Link
                                    href={`/admin/subcontractors/${sub.id}`}
                                    className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 hover:border-white/10 hover:bg-[#1f1f1f] transition-all flex flex-col relative block"
                                >
                                    {hasIssue && (
                                        <div className="absolute -top-2 -right-2 bg-[#f87171] text-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-[#1a1a1a]" title={sub.compliance.issues.join('; ')}>
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
                                            <span className="text-white font-medium">{sub.contactPerson}</span>
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
                                                {(sub.metrics.avgRating || sub.rating).toFixed(1)}
                                            </div>
                                        </div>
                                        <div className="border-l border-white/6">
                                            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Jobs</div>
                                            <div className="font-bold text-white font-mono">{sub.metrics.jobsCompleted}</div>
                                        </div>
                                        <div className="border-l border-white/6">
                                            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Reliability</div>
                                            <div className={`font-bold font-mono ${sub.metrics.reliabilityScore >= 90 ? 'text-[#34d399]' : sub.metrics.reliabilityScore >= 75 ? 'text-[#fbbf24]' : 'text-[#f87171]'}`}>
                                                {sub.metrics.reliabilityScore}%
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                                <button
                                    onClick={() => void deleteSub(sub.id)}
                                    title="Delete subcontractor"
                                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all z-10"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
