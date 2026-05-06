'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Filter, Download, Star, AlertTriangle, ShieldAlert } from 'lucide-react';

interface SubRow {
    id: string;
    company_name: string;
    contact_person: string;
    trades: string[] | string;
    status: string;
    rating: number | string;
    insurance_expiry: string | null;
    metrics?: Record<string, unknown> | string;
}

interface AssignmentRow {
    id: string;
    subcontractor_id: string;
    paid_amount: number | string;
    billed_amount: number | string;
    agreed_amount: number | string;
    created_at: string;
}

interface BillRow {
    id: string;
    subcontractor_id: string | null;
    amount: number | string;
    status: string;
    paid_date: string | null;
    received_date: string | null;
    created_at: string;
}

function toNum(v: unknown): number {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v));
    return Number.isFinite(n) ? n : 0;
}

function parseTrades(t: SubRow['trades']): string[] {
    if (Array.isArray(t)) return t.filter((x) => typeof x === 'string');
    if (typeof t === 'string') {
        try {
            const parsed = JSON.parse(t);
            if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string');
        } catch {
            return [];
        }
    }
    return [];
}

function fmtCurrency(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n);
}

export default function SubcontractorSpendReportPage() {
    const [subs, setSubs] = useState<SubRow[]>([]);
    const [paidByYear, setPaidByYear] = useState<Map<string, number>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [tradeFilter, setTradeFilter] = useState<string>('All');
    const [sortOption, setSortOption] = useState<'SpendDesc' | 'RatingDesc' | 'NameAsc'>('SpendDesc');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const [subsRes, billsRes, assignmentsRes] = await Promise.all([
                    fetch('/api/subcontractors', { cache: 'no-store' }),
                    fetch('/api/project-bills', { cache: 'no-store' }).catch(() => null),
                    fetch('/api/subcontractor-assignments', { cache: 'no-store' }).catch(() => null),
                ]);

                if (!subsRes.ok) throw new Error(`subs status ${subsRes.status}`);
                const subsData = await subsRes.json();
                if (!Array.isArray(subsData)) throw new Error(subsData?.error || 'subs payload not array');

                const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
                const map = new Map<string, number>();

                // Prefer real bills if available
                if (billsRes && billsRes.ok) {
                    const bills = (await billsRes.json()) as BillRow[];
                    if (Array.isArray(bills)) {
                        for (const b of bills) {
                            if (!b.subcontractor_id) continue;
                            if (b.status !== 'Paid') continue;
                            const paidDate = b.paid_date || b.created_at;
                            if (paidDate && paidDate >= yearStart) {
                                map.set(b.subcontractor_id, (map.get(b.subcontractor_id) ?? 0) + toNum(b.amount));
                            }
                        }
                    }
                }

                // Fallback: assignments paid_amount sum (no date filter possible without bills)
                if (map.size === 0 && assignmentsRes && assignmentsRes.ok) {
                    const assignments = (await assignmentsRes.json()) as AssignmentRow[];
                    if (Array.isArray(assignments)) {
                        for (const a of assignments) {
                            const created = a.created_at;
                            if (created && created.slice(0, 10) >= yearStart) {
                                map.set(a.subcontractor_id, (map.get(a.subcontractor_id) ?? 0) + toNum(a.paid_amount));
                            }
                        }
                    }
                }

                if (!cancelled) {
                    setSubs(subsData);
                    setPaidByYear(map);
                    setError(null);
                }
            } catch (e) {
                if (!cancelled) {
                    setSubs([]);
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

    const tradeOptions = useMemo(() => {
        const all = new Set<string>();
        for (const s of subs) parseTrades(s.trades).forEach((t) => all.add(t));
        return Array.from(all).sort();
    }, [subs]);

    const enriched = useMemo(() => {
        return subs.map((s) => {
            const trades = parseTrades(s.trades);
            const ytdPaid = paidByYear.get(s.id) ?? 0;
            return {
                id: s.id,
                companyName: s.company_name,
                contactPerson: s.contact_person,
                trades,
                status: s.status,
                rating: toNum(s.rating),
                insuranceExpiry: s.insurance_expiry,
                ytdPaid,
            };
        });
    }, [subs, paidByYear]);

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        const list = enriched.filter((s) => {
            const matchesSearch = s.companyName.toLowerCase().includes(q) || s.contactPerson.toLowerCase().includes(q);
            const matchesTrade = tradeFilter === 'All' || s.trades.includes(tradeFilter);
            return matchesSearch && matchesTrade;
        });
        list.sort((a, b) => {
            if (sortOption === 'SpendDesc') return b.ytdPaid - a.ytdPaid;
            if (sortOption === 'RatingDesc') return b.rating - a.rating;
            return a.companyName.localeCompare(b.companyName);
        });
        return list;
    }, [enriched, searchQuery, tradeFilter, sortOption]);

    const totals = useMemo(() => {
        const totalSpend = filtered.reduce((s, x) => s + x.ytdPaid, 0);
        const avgRating =
            filtered.length > 0 ? filtered.reduce((s, x) => s + x.rating, 0) / filtered.length : 0;
        return { totalSpend, avgRating, activeCount: filtered.length };
    }, [filtered]);

    const top10 = useMemo(() => {
        return [...enriched].sort((a, b) => b.ytdPaid - a.ytdPaid).slice(0, 10);
    }, [enriched]);

    const tradeBreakdown = useMemo(() => {
        const map = new Map<string, number>();
        for (const s of enriched) {
            if (s.trades.length === 0) {
                map.set('Unspecified', (map.get('Unspecified') ?? 0) + s.ytdPaid);
                continue;
            }
            const split = s.ytdPaid / s.trades.length;
            for (const t of s.trades) {
                map.set(t, (map.get(t) ?? 0) + split);
            }
        }
        return Array.from(map.entries())
            .map(([trade, amount]) => ({ trade, amount }))
            .filter((x) => x.amount > 0)
            .sort((a, b) => b.amount - a.amount);
    }, [enriched]);

    const tradeBreakdownTotal = tradeBreakdown.reduce((s, x) => s + x.amount, 0);
    const top10Max = top10[0]?.ytdPaid ?? 0;

    function exportCsv() {
        const rows = [
            ['Company', 'Contact', 'Trades', 'Status', 'Rating', 'Insurance Expiry', 'YTD Paid'],
            ...filtered.map((s) => [
                s.companyName,
                s.contactPerson,
                s.trades.join('; '),
                s.status,
                s.rating.toFixed(1),
                s.insuranceExpiry ?? '',
                s.ytdPaid.toFixed(2),
            ]),
        ];
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subcontractor-spend-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const today = new Date().toISOString().slice(0, 10);

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
                        <h1 className="font-serif text-3xl font-bold text-white mb-2">Subcontractor Spend</h1>
                        <p className="text-white/50 text-sm">Year-to-date spend per sub, top performers, and breakdown by trade.</p>
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
                    Failed to load: {error}
                </div>
            )}

            {/* Aggregate Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <KpiCell label="Total YTD Spend" value={fmtCurrency(totals.totalSpend)} loading={loading} />
                <KpiCell label="Active Partners" value={String(totals.activeCount)} loading={loading} />
                <KpiCell
                    label="Average Rating"
                    value={totals.avgRating > 0 ? totals.avgRating.toFixed(1) : '—'}
                    accentColor="#b8956a"
                    loading={loading}
                />
            </div>

            {/* Two-column: Top 10 chart + Trade breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top 10 chart */}
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-semibold text-white">Top 10 Subs by YTD Spend</h3>
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-5 bg-white/5 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : top10.length === 0 ? (
                        <p className="text-sm text-white/40 text-center py-4">No spend data yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {top10.map((s) => {
                                const w = top10Max > 0 ? (s.ytdPaid / top10Max) * 100 : 0;
                                return (
                                    <div key={s.id}>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-white/80 truncate pr-2">{s.companyName}</span>
                                            <span className="text-white/60 font-mono shrink-0">{fmtCurrency(s.ytdPaid)}</span>
                                        </div>
                                        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#b8956a]/40 to-[#b8956a] rounded-full"
                                                style={{ width: `${w}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Trade breakdown */}
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white mb-6">Spend by Trade</h3>
                    {loading ? (
                        <div className="space-y-3">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="h-5 bg-white/5 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : tradeBreakdown.length === 0 ? (
                        <p className="text-sm text-white/40 text-center py-4">No trade spend data yet.</p>
                    ) : (
                        <div className="space-y-2.5">
                            {tradeBreakdown.map((t, i) => {
                                const pct = tradeBreakdownTotal > 0 ? (t.amount / tradeBreakdownTotal) * 100 : 0;
                                const colors = ['#b8956a', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#fbbf24', '#22d3ee', '#f87171'];
                                const color = colors[i % colors.length];
                                return (
                                    <div key={t.trade}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="flex items-center gap-2 text-white/80">
                                                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                                                {t.trade}
                                            </span>
                                            <span className="text-white/60 font-mono">
                                                {fmtCurrency(t.amount)} <span className="text-white/30">({pct.toFixed(0)}%)</span>
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${pct}%`, background: color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                            type="text"
                            placeholder="Search sub or contact..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-all"
                        />
                    </div>
                    <select
                        value={tradeFilter}
                        onChange={(e) => setTradeFilter(e.target.value)}
                        className="h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#b8956a]/50 w-full sm:w-48"
                    >
                        <option value="All">All Trades</option>
                        {tradeOptions.map((trade) => (
                            <option key={trade} value={trade}>
                                {trade}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar w-full lg:w-auto justify-start lg:justify-end">
                    <Filter className="text-white/20 mr-1 shrink-0" size={14} />
                    {[
                        { label: 'Highest Spend', val: 'SpendDesc' },
                        { label: 'Highest Rated', val: 'RatingDesc' },
                        { label: 'Name (A-Z)', val: 'NameAsc' },
                    ].map((opt) => (
                        <button
                            key={opt.val}
                            onClick={() => setSortOption(opt.val as 'SpendDesc' | 'RatingDesc' | 'NameAsc')}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                                sortOption === opt.val
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
                                <th className="px-5 py-3 font-semibold text-right">YTD Spend</th>
                                <th className="px-5 py-3 font-semibold text-center">Status</th>
                                <th className="px-5 py-3 font-semibold text-center">COI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                [0, 1, 2, 3].map((i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="px-5 py-4">
                                            <div className="h-6 bg-white/5 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-white/40 text-sm">
                                        No subcontractors yet — run seed from the Dashboard to populate demo data.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((s) => {
                                    const expired = s.insuranceExpiry && s.insuranceExpiry < today;
                                    const expiringSoon =
                                        s.insuranceExpiry &&
                                        !expired &&
                                        new Date(s.insuranceExpiry).getTime() - Date.now() < 30 * 86400000;
                                    return (
                                        <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-5 py-4">
                                                <Link href={`/admin/subcontractors/${s.id}`} className="block">
                                                    <div className="font-medium text-white mb-1 group-hover:text-[#b8956a] transition-colors">{s.companyName}</div>
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {s.trades.slice(0, 3).map((t) => (
                                                            <span key={t} className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest bg-white/5 text-white/60">
                                                                {t}
                                                            </span>
                                                        ))}
                                                        {s.trades.length > 3 && (
                                                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-white/60">+{s.trades.length - 3}</span>
                                                        )}
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span
                                                        className={`font-mono font-bold ${
                                                            s.rating >= 4.5 ? 'text-[#34d399]' : s.rating >= 3.5 ? 'text-amber-400' : 'text-red-400'
                                                        }`}
                                                    >
                                                        {s.rating > 0 ? s.rating.toFixed(1) : '—'}
                                                    </span>
                                                    {s.rating > 0 && (
                                                        <Star
                                                            size={14}
                                                            className={
                                                                s.rating >= 4.5
                                                                    ? 'fill-[#34d399] text-[#34d399]'
                                                                    : s.rating >= 3.5
                                                                    ? 'fill-amber-400 text-amber-400'
                                                                    : 'fill-red-400 text-red-400'
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right font-mono text-white/85">{fmtCurrency(s.ytdPaid)}</td>
                                            <td className="px-5 py-4 text-center">
                                                <span
                                                    className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                                        s.status === 'Active'
                                                            ? 'bg-[#34d399]/15 text-[#34d399]'
                                                            : 'bg-white/10 text-white/40'
                                                    }`}
                                                >
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {expired ? (
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-400" title="Expired">
                                                        <ShieldAlert size={14} />
                                                    </span>
                                                ) : expiringSoon ? (
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 text-amber-400" title="Expiring soon">
                                                        <AlertTriangle size={14} />
                                                    </span>
                                                ) : s.insuranceExpiry ? (
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#34d399]/10 text-[#34d399]" title="Compliant">
                                                        <ShieldAlert size={14} />
                                                    </span>
                                                ) : (
                                                    <span className="text-white/20">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
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
