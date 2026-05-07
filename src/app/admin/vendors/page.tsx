'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, AlertCircle, UserPlus, Plug, Download } from 'lucide-react';
import { VendorCard } from '@/components/admin/vendor-card';
import type { Vendor } from '@/lib/vendors';

type FilterKey = 'all' | 'active' | '1099' | 'balance' | 'linked' | 'unlinked';

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: '1099', label: '1099' },
    { key: 'balance', label: 'With Balance' },
    { key: 'linked', label: 'Linked to Sub' },
    { key: 'unlinked', label: 'Not Linked' },
];

interface VendorListResponse {
    rows: Vendor[];
    total: number;
}

export default function VendorsDirectoryPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<FilterKey>('all');
    const [importing, setImporting] = useState(false);
    const [importMessage, setImportMessage] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/vendors?limit=500', { cache: 'no-store' });
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(body.error ?? `HTTP ${res.status}`);
            }
            const body = (await res.json()) as VendorListResponse;
            setVendors(Array.isArray(body.rows) ? body.rows : []);
        } catch (e) {
            setVendors([]);
            setError(e instanceof Error ? e.message : 'Failed to load vendors');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    async function importFromQb() {
        if (!confirm('Pull every vendor from QuickBooks? Existing rows will be updated.')) return;
        setImporting(true);
        setImportMessage(null);
        try {
            const res = await fetch('/api/quickbooks/vendors/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const body = (await res.json()) as { imported?: number; updated?: number; failed?: number; durationMs?: number; error?: string };
            if (!res.ok) throw new Error(body.error ?? 'Import failed');
            setImportMessage(
                `Imported ${body.imported ?? 0} new, updated ${body.updated ?? 0}, failed ${body.failed ?? 0}.`,
            );
            await load();
        } catch (e) {
            setImportMessage(e instanceof Error ? e.message : 'Import failed');
        } finally {
            setImporting(false);
        }
    }

    const counts = useMemo(() => {
        const total = vendors.length;
        const active = vendors.filter((v) => v.active).length;
        const tax1099 = vendors.filter((v) => v.is1099).length;
        const withBalance = vendors.filter((v) => v.balance > 0).length;
        return { total, active, tax1099, withBalance };
    }, [vendors]);

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return vendors.filter((v) => {
            const matchesSearch =
                !q ||
                v.displayName.toLowerCase().includes(q) ||
                (v.companyName ?? '').toLowerCase().includes(q) ||
                (v.email ?? '').toLowerCase().includes(q) ||
                (v.phone ?? '').toLowerCase().includes(q);
            let matchesFilter = true;
            switch (filter) {
                case 'active': matchesFilter = v.active; break;
                case '1099': matchesFilter = v.is1099; break;
                case 'balance': matchesFilter = v.balance > 0; break;
                case 'linked': matchesFilter = Boolean(v.subcontractorId); break;
                case 'unlinked': matchesFilter = !v.subcontractorId; break;
                default: matchesFilter = true;
            }
            return matchesSearch && matchesFilter;
        });
    }, [vendors, searchQuery, filter]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Admin</p>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">Vendors</h1>
                    <p className="text-sm text-white/50">{counts.total} total &middot; suppliers, services, and subs.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => void importFromQb()}
                        disabled={importing}
                        className="h-10 px-4 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/10 transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                        <Download size={16} /> {importing ? 'Importing...' : 'Pull from QB'}
                    </button>
                    <Link
                        href="/admin/vendors/new"
                        className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap"
                    >
                        <Plus size={16} /> New Vendor
                    </Link>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-300 text-sm flex items-start gap-3">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-1">Failed to load vendors</p>
                        <p className="text-red-300/80 text-xs">{error}</p>
                        <button onClick={() => void load()} className="mt-2 text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c]">
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {importMessage && (
                <div className="mb-6 p-4 rounded-2xl border border-[#b8956a]/20 bg-[#b8956a]/5 text-[#b8956a] text-sm flex items-start gap-3">
                    <Plug size={18} className="shrink-0 mt-0.5" />
                    <p>{importMessage}</p>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Total</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{counts.total}</span>
                        <span className="text-xs text-white/40">in CRM</span>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Active</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{counts.active}</span>
                        <span className="text-xs text-white/40">enabled</span>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">1099</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{counts.tax1099}</span>
                        <span className="text-xs text-white/40">tax tracked</span>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b8956a] mb-1">Balance Open</p>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-bold ${counts.withBalance > 0 ? 'text-red-400' : 'text-white'}`}>{counts.withBalance}</span>
                        <span className="text-xs text-white/40">owed</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                <div className="relative flex-1 lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                        type="text"
                        placeholder="Search names, companies, emails, phones..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filter === f.key ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-16 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.02]">
                    <UserPlus size={48} className="mx-auto text-white/10 mb-4" />
                    <h3 className="font-serif text-lg font-bold text-white mb-2">
                        {vendors.length === 0 ? 'No Vendors Yet' : 'No Matches'}
                    </h3>
                    <p className="text-white/40 mb-6 max-w-sm mx-auto">
                        {vendors.length === 0
                            ? 'Pull every vendor from QuickBooks or create one manually to get started.'
                            : 'No results match your filters.'}
                    </p>
                    {vendors.length === 0 ? (
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/admin/integrations/quickbooks"
                                className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full inline-flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors"
                            >
                                <Plug size={16} /> Pull from QuickBooks
                            </Link>
                            <Link
                                href="/admin/vendors/new"
                                className="h-10 px-5 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-full inline-flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                            >
                                <Plus size={16} /> New Vendor
                            </Link>
                        </div>
                    ) : (
                        <button
                            onClick={() => { setSearchQuery(''); setFilter('all'); }}
                            className="text-[#b8956a] hover:text-[#cbb08c] font-semibold text-sm transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((v) => (
                        <VendorCard key={v.id} vendor={v} />
                    ))}
                </div>
            )}
        </div>
    );
}
