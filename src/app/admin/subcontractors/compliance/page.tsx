'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, ShieldAlert, ShieldCheck, Download, Search, Calendar, Filter } from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';
import type { Subcontractor } from '@/lib/subcontractors';

type Bucket = 'all' | 'expired' | 'expiring' | 'good' | 'noncompliant';

function bucketOf(s: Subcontractor): Bucket {
    if (!s.compliance.isCompliant) return 'noncompliant';
    if (s.compliance.coiExpired) return 'expired';
    if (s.compliance.coiExpiringSoon) return 'expiring';
    return 'good';
}

function csvEscape(v: string | number | null | undefined): string {
    if (v == null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

function downloadCSV(rows: Subcontractor[]) {
    const header = [
        'Company',
        'Contact',
        'Email',
        'Phone',
        'Status',
        'Trades',
        'COI Expiry',
        'Days Remaining',
        'Has W-9',
        'Has COI',
        'Has MSA',
        'Compliant',
        'Issues',
    ];
    const lines = rows.map((s) => [
        s.companyName,
        s.contactPerson,
        s.email,
        s.phone,
        s.status,
        s.trades.join('; '),
        s.compliance.coiExpiry ?? '',
        s.compliance.coiDaysRemaining ?? '',
        s.compliance.hasW9 ? 'Yes' : 'No',
        s.compliance.hasCOI ? 'Yes' : 'No',
        s.compliance.hasMSA ? 'Yes' : 'No',
        s.compliance.isCompliant ? 'Yes' : 'No',
        s.compliance.issues.join('; '),
    ].map(csvEscape).join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subcontractor-compliance-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default function CompliancePage() {
    const [subs, setSubs] = useState<Subcontractor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bucket, setBucket] = useState<Bucket>('all');
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/subcontractors', { cache: 'no-store' });
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(body.error ?? `HTTP ${res.status}`);
            }
            setSubs((await res.json()) as Subcontractor[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const counts = useMemo(() => ({
        all: subs.length,
        expired: subs.filter((s) => s.compliance.coiExpired).length,
        expiring: subs.filter((s) => s.compliance.coiExpiringSoon).length,
        good: subs.filter((s) => s.compliance.isCompliant && !s.compliance.coiExpiringSoon).length,
        noncompliant: subs.filter((s) => !s.compliance.isCompliant).length,
    }), [subs]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return subs
            .filter((s) => {
                if (bucket === 'all') return true;
                return bucketOf(s) === bucket;
            })
            .filter((s) => {
                if (!q) return true;
                return (
                    s.companyName.toLowerCase().includes(q) ||
                    s.contactPerson.toLowerCase().includes(q) ||
                    s.trades.some((t) => t.toLowerCase().includes(q))
                );
            })
            .sort((a, b) => {
                // Sort by days remaining ascending (most urgent first)
                const ad = a.compliance.coiDaysRemaining ?? 99999;
                const bd = b.compliance.coiDaysRemaining ?? 99999;
                return ad - bd;
            });
    }, [subs, bucket, search]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <Link href="/admin/subcontractors" className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-[#b8956a] hover:text-[#cbb08c] transition-colors mb-3">
                    <ArrowLeft size={14} className="mr-2" /> Back to Subcontractors
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">Compliance Dashboard</h1>
                        <p className="text-sm text-white/50">Org-wide insurance status and document health.</p>
                    </div>
                    <button
                        onClick={() => downloadCSV(filtered)}
                        disabled={filtered.length === 0}
                        className="h-10 px-4 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-300 text-sm flex items-start gap-3">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-1">Failed to load</p>
                        <p className="text-xs">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <FilterCard label="All" count={counts.all} active={bucket === 'all'} onClick={() => setBucket('all')} tone="neutral" />
                <FilterCard label="Expired" count={counts.expired} active={bucket === 'expired'} onClick={() => setBucket('expired')} tone="bad" />
                <FilterCard label="Expiring &le; 30d" count={counts.expiring} active={bucket === 'expiring'} onClick={() => setBucket('expiring')} tone="warn" />
                <FilterCard label="Compliant" count={counts.good} active={bucket === 'good'} onClick={() => setBucket('good')} tone="good" />
                <FilterCard label="Non-Compliant" count={counts.noncompliant} active={bucket === 'noncompliant'} onClick={() => setBucket('noncompliant')} tone="bad" />
            </div>

            <div className="mb-4 flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                        type="text"
                        placeholder="Search company, contact, trade..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50"
                    />
                </div>
                <span className="text-xs text-white/40 flex items-center gap-1.5">
                    <Filter size={12} /> {filtered.length} of {subs.length}
                </span>
            </div>

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" /></div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-white/40">
                        <ShieldCheck size={32} className="mx-auto text-white/10 mb-3" />
                        <p className="text-sm">No subs match this filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
                                    <th className="px-5 py-3 font-semibold">Subcontractor</th>
                                    <th className="px-5 py-3 font-semibold">Status</th>
                                    <th className="px-5 py-3 font-semibold">COI Expiry</th>
                                    <th className="px-5 py-3 font-semibold text-right">Days</th>
                                    <th className="px-5 py-3 font-semibold text-center">W-9</th>
                                    <th className="px-5 py-3 font-semibold text-center">COI</th>
                                    <th className="px-5 py-3 font-semibold text-center">MSA</th>
                                    <th className="px-5 py-3 font-semibold">Issues</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.map((s) => {
                                    const days = s.compliance.coiDaysRemaining;
                                    const dayColor = s.compliance.coiExpired
                                        ? 'text-[#f87171]'
                                        : s.compliance.coiExpiringSoon
                                        ? 'text-[#fbbf24]'
                                        : 'text-[#34d399]';
                                    return (
                                        <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-5 py-4">
                                                <Link href={`/admin/subcontractors/${s.id}`} className="font-medium text-white hover:text-[#b8956a] transition-colors">
                                                    {s.companyName}
                                                </Link>
                                                <div className="text-xs text-white/40 mt-0.5">{s.contactPerson}</div>
                                            </td>
                                            <td className="px-5 py-4"><StatusBadge status={s.status} /></td>
                                            <td className="px-5 py-4 text-white/80 text-sm">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={11} className="text-white/30" />
                                                    {s.compliance.coiExpiry ?? '—'}
                                                </span>
                                            </td>
                                            <td className={`px-5 py-4 text-right font-mono ${dayColor}`}>
                                                {days === null ? '—' : days < 0 ? `${Math.abs(days)}d ago` : `${days}d`}
                                            </td>
                                            <Cell ok={s.compliance.hasW9} />
                                            <Cell ok={s.compliance.hasCOI} />
                                            <Cell ok={s.compliance.hasMSA} />
                                            <td className="px-5 py-4">
                                                {s.compliance.issues.length === 0 ? (
                                                    <span className="text-[#34d399] text-xs">None</span>
                                                ) : (
                                                    <span className="text-xs text-red-300/80">{s.compliance.issues.join('; ')}</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function FilterCard({ label, count, active, onClick, tone }: { label: string; count: number; active: boolean; onClick: () => void; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
    const toneText = tone === 'good' ? 'text-[#34d399]' : tone === 'warn' ? 'text-[#fbbf24]' : tone === 'bad' ? 'text-[#f87171]' : 'text-white';
    return (
        <button
            onClick={onClick}
            className={`p-4 rounded-2xl border transition-colors text-left ${active ? 'bg-white/5 border-white/15' : 'bg-[#1a1a1a] border-white/6 hover:border-white/10'}`}
        >
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-semibold" dangerouslySetInnerHTML={{ __html: label }} />
            <p className={`text-2xl font-bold ${toneText}`}>{count}</p>
        </button>
    );
}

function Cell({ ok }: { ok: boolean }) {
    return (
        <td className="px-5 py-4 text-center">
            {ok ? (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#34d399]/15 text-[#34d399]"><ShieldCheck size={12} /></span>
            ) : (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#f87171]/15 text-[#f87171]"><ShieldAlert size={12} /></span>
            )}
        </td>
    );
}
