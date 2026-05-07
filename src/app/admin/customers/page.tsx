'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomerCard } from '@/components/admin/customer-card';
import type { Customer } from '@/lib/customers';

type FilterKey = 'all' | 'active' | 'inactive' | 'qb' | 'balance' | 'stale';

interface ListResponse {
    rows: Customer[];
    total: number;
    limit: number;
    offset: number;
}

const FILTERS: Array<{ key: FilterKey; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
    { key: 'qb', label: 'Imported from QB' },
    { key: 'balance', label: 'Has Balance' },
    { key: 'stale', label: 'No Recent Activity' },
];

const PAGE_SIZE = 100;

export default function CustomersListPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<FilterKey>('all');
    const [offset, setOffset] = useState(0);

    // Debounce the search input -> searchTerm
    useEffect(() => {
        const t = setTimeout(() => {
            setSearchTerm(searchInput.trim());
            setOffset(0);
        }, 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.set('q', searchTerm);
            params.set('limit', String(PAGE_SIZE));
            params.set('offset', String(offset));
            if (filter === 'active') params.set('active', 'true');
            if (filter === 'inactive') params.set('active', 'false');
            if (filter === 'qb') params.set('source', 'qb_import');
            if (filter === 'balance') params.set('hasBalance', 'true');

            const res = await fetch(`/api/customers?${params.toString()}`, { cache: 'no-store' });
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(body.error ?? `HTTP ${res.status}`);
            }
            const data = (await res.json()) as ListResponse;
            let rows = Array.isArray(data.rows) ? data.rows : [];

            // "No Recent Activity" is client-side: customers with no balance and no recent updates.
            if (filter === 'stale') {
                const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
                rows = rows.filter((c) => {
                    const updated = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
                    return c.balance === 0 && updated < ninetyDaysAgo;
                });
            }

            setCustomers(rows);
            setTotal(data.total ?? rows.length);
        } catch (e) {
            setCustomers([]);
            setTotal(0);
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [searchTerm, filter, offset]);

    useEffect(() => {
        void load();
    }, [load]);

    function changeFilter(next: FilterKey) {
        setFilter(next);
        setOffset(0);
    }

    const showingFrom = total === 0 ? 0 : offset + 1;
    const showingTo = Math.min(offset + customers.length, total);
    const hasNext = offset + PAGE_SIZE < total;
    const hasPrev = offset > 0;

    const formattedTotal = new Intl.NumberFormat('en-US').format(total);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Admin</p>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">Customers</h1>
                    <p className="text-sm text-white/50">
                        Master record of every household and company we work with.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-white/50 whitespace-nowrap">
                        <span className="font-mono text-white">{formattedTotal}</span> customers
                    </span>
                    <Link
                        href="/admin/customers/new"
                        className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap"
                    >
                        <Plus size={16} /> New Customer
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap mb-5">
                {FILTERS.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => changeFilter(f.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                            filter === f.key
                                ? 'bg-[#b8956a]/15 text-[#b8956a] border border-[#b8956a]/30'
                                : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name, email, phone…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all"
                    />
                </div>
            </div>

            {/* States */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
                </div>
            ) : error ? (
                <div className="py-16 text-center border border-red-500/20 border-dashed rounded-2xl bg-red-500/5">
                    <h3 className="font-serif text-lg font-bold text-red-300 mb-2">Could not load customers</h3>
                    <p className="text-sm text-red-200/70 mb-4 max-w-sm mx-auto">{error}</p>
                    <button
                        onClick={() => void load()}
                        className="text-[#b8956a] hover:text-[#cbb08c] font-semibold text-sm transition-colors"
                    >
                        Try again
                    </button>
                </div>
            ) : customers.length === 0 ? (
                <div className="py-20 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.02]">
                    <UserPlus size={48} className="mx-auto text-white/10 mb-4" />
                    <h3 className="font-serif text-lg font-bold text-white mb-2">
                        {searchTerm || filter !== 'all' ? 'No matching customers' : 'No customers yet'}
                    </h3>
                    <p className="text-white/40 mb-6 max-w-sm mx-auto">
                        {searchTerm || filter !== 'all'
                            ? 'Try a different search term or clear your filters.'
                            : 'Pull your existing customer list from QuickBooks, or add one manually.'}
                    </p>
                    {searchTerm || filter !== 'all' ? (
                        <button
                            onClick={() => { setSearchInput(''); setFilter('all'); setOffset(0); }}
                            className="text-[#b8956a] hover:text-[#cbb08c] font-semibold text-sm transition-colors"
                        >
                            Clear filters
                        </button>
                    ) : (
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                            <Link
                                href="/admin/integrations/quickbooks"
                                className="inline-flex items-center gap-2 h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full hover:bg-[#cbb08c] transition-colors"
                            >
                                Pull from QuickBooks
                            </Link>
                            <Link
                                href="/admin/customers/new"
                                className="inline-flex items-center gap-2 h-10 px-5 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-full hover:bg-white/10 transition-colors"
                            >
                                Add manually
                            </Link>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customers.map((c) => (
                            <CustomerCard key={c.id} customer={c} />
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-white/6">
                        <p className="text-xs text-white/50">
                            Showing <span className="font-mono text-white">{showingFrom.toLocaleString()}</span>
                            {' '}–{' '}
                            <span className="font-mono text-white">{showingTo.toLocaleString()}</span>
                            {' '}of{' '}
                            <span className="font-mono text-white">{formattedTotal}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                                disabled={!hasPrev}
                                className="h-9 px-3 bg-white/5 border border-white/10 text-white text-xs font-semibold rounded-lg flex items-center gap-1 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <button
                                onClick={() => setOffset(offset + PAGE_SIZE)}
                                disabled={!hasNext}
                                className="h-9 px-3 bg-white/5 border border-white/10 text-white text-xs font-semibold rounded-lg flex items-center gap-1 hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
