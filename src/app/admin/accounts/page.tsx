'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Search,
    Download,
    Loader2,
    AlertCircle,
    Wallet,
    BookOpen,
} from 'lucide-react';
import type {
    Account,
    AccountClassification,
    AccountRow,
} from '@/lib/accounts';
import { rowToAccount } from '@/lib/accounts';

type FilterChip = 'All' | 'Active' | 'Bank' | 'Has Balance' | 'By Classification';

interface ClassificationGroup {
    label: string;
    classification: AccountClassification;
    /** Display order of the type buckets shown beneath each classification heading. */
    typeOrder: string[];
    /** If true, balances + class are shown as positive-leaning green text. */
    positiveTone: boolean;
}

const CLASSIFICATION_GROUPS: ClassificationGroup[] = [
    {
        label: 'Assets',
        classification: 'Asset',
        typeOrder: [
            'Bank',
            'Accounts Receivable',
            'Other Current Asset',
            'Fixed Asset',
            'Other Asset',
        ],
        positiveTone: true,
    },
    {
        label: 'Liabilities',
        classification: 'Liability',
        typeOrder: [
            'Accounts Payable',
            'Credit Card',
            'Other Current Liability',
            'Long Term Liability',
        ],
        positiveTone: false,
    },
    {
        label: 'Equity',
        classification: 'Equity',
        typeOrder: ['Equity'],
        positiveTone: false,
    },
    {
        label: 'Revenue',
        classification: 'Revenue',
        typeOrder: ['Income', 'Other Income'],
        positiveTone: true,
    },
    {
        label: 'Expenses',
        classification: 'Expense',
        typeOrder: ['Cost of Goods Sold', 'Expense', 'Other Expense'],
        positiveTone: false,
    },
];

function fmtCurrency(n: number, currency: string): string {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(n);
    } catch {
        return `$${n.toFixed(2)}`;
    }
}

/**
 * Resolve an account's display depth — how many parent hops up to a top-level
 * account. Used for indentation in the chart of accounts.
 */
function depthOf(a: Account, byId: Map<string, Account>): number {
    let depth = 0;
    let cur: Account | undefined = a;
    while (cur && cur.parentAccountId) {
        const parent = byId.get(cur.parentAccountId);
        if (!parent) break;
        depth++;
        cur = parent;
        if (depth > 6) break; // guard against cycles
    }
    return depth;
}

/**
 * Order accounts within a type bucket so parents appear before their children
 * (which lets indentation read naturally). Roots are sorted alphabetically;
 * children inherit their parent's anchor and slot in immediately after.
 */
function orderTreeWithin(rows: Account[]): Account[] {
    const byId = new Map(rows.map(r => [r.id, r] as const));
    const childrenOf = new Map<string | null, Account[]>();
    for (const r of rows) {
        const k = r.parentAccountId && byId.has(r.parentAccountId) ? r.parentAccountId : null;
        const arr = childrenOf.get(k);
        if (arr) arr.push(r);
        else childrenOf.set(k, [r]);
    }
    for (const [, arr] of childrenOf) arr.sort((a, b) => a.name.localeCompare(b.name));

    const out: Account[] = [];
    function walk(parentId: string | null) {
        const list = childrenOf.get(parentId) ?? [];
        for (const a of list) {
            out.push(a);
            walk(a.id);
        }
    }
    walk(null);
    return out;
}

export default function AccountsAdminPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [chip, setChip] = useState<FilterChip>('All');
    const [classFilter, setClassFilter] =
        useState<AccountClassification | 'All'>('All');
    const [importing, setImporting] = useState(false);
    const [flash, setFlash] = useState<string | null>(null);
    const [flashKind, setFlashKind] = useState<'success' | 'error'>('success');

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const r = await fetch('/api/accounts?limit=1000', { cache: 'no-store' });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const j = (await r.json()) as { rows: AccountRow[] };
            // The API returns already-projected Account objects via rowToAccount,
            // but we re-project defensively in case the response shape evolves.
            const rows = Array.isArray(j.rows)
                ? j.rows.map(row => {
                      // The endpoint already returns projected objects in the
                      // Account shape, but if a raw row sneaks through we
                      // normalize it. We treat objects with snake_case keys as
                      // raw rows.
                      const r = row as unknown as Record<string, unknown>;
                      if ('account_type' in r) {
                          return rowToAccount(row);
                      }
                      return row as unknown as Account;
                  })
                : [];
            setAccounts(rows);
        } catch (e) {
            setAccounts([]);
            setError(String(e));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function pullFromQuickbooks() {
        if (importing) return;
        setImporting(true);
        setFlash(null);
        try {
            const r = await fetch('/api/quickbooks/accounts/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actor: 'admin' }),
            });
            const j = (await r.json().catch(() => ({}))) as {
                imported?: number;
                updated?: number;
                failed?: number;
                error?: string;
            };
            if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
            setFlashKind('success');
            setFlash(
                `Pulled accounts: ${j.imported ?? 0} new, ${j.updated ?? 0} updated, ${j.failed ?? 0} failed.`,
            );
            await load();
        } catch (e) {
            setFlashKind('error');
            setFlash(e instanceof Error ? e.message : String(e));
        }
        setImporting(false);
    }

    // ─── Apply filters / search ──────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return accounts.filter(a => {
            if (chip === 'Active' && !a.active) return false;
            if (chip === 'Bank' && a.accountType !== 'Bank') return false;
            if (chip === 'Has Balance' && Number(a.currentBalance) === 0) return false;
            if (chip === 'By Classification' && classFilter !== 'All') {
                if (a.classification !== classFilter) return false;
            }
            if (!q) return true;
            return (
                a.name.toLowerCase().includes(q) ||
                (a.fullName ?? '').toLowerCase().includes(q) ||
                a.accountType.toLowerCase().includes(q) ||
                (a.accountSubtype ?? '').toLowerCase().includes(q)
            );
        });
    }, [accounts, search, chip, classFilter]);

    // ─── Group by classification → type, with parent-aware ordering ──────────
    const grouped = useMemo(() => {
        const byId = new Map(filtered.map(a => [a.id, a] as const));

        return CLASSIFICATION_GROUPS.map(group => {
            const inGroup = filtered.filter(
                a => a.classification === group.classification,
            );
            if (inGroup.length === 0) return null;

            // Bucket by type, preserving the configured display order plus any
            // unexpected types we encounter at the end.
            const byType = new Map<string, Account[]>();
            for (const a of inGroup) {
                const k = a.accountType || 'Other';
                const arr = byType.get(k);
                if (arr) arr.push(a);
                else byType.set(k, [a]);
            }

            const orderedTypes: string[] = [];
            for (const t of group.typeOrder) {
                if (byType.has(t)) orderedTypes.push(t);
            }
            for (const t of byType.keys()) {
                if (!orderedTypes.includes(t)) orderedTypes.push(t);
            }

            const typeBuckets = orderedTypes.map(t => ({
                type: t,
                rows: orderTreeWithin(byType.get(t) ?? []),
            }));

            const subtotal = inGroup.reduce(
                (s, a) => s + Number(a.currentBalance),
                0,
            );

            return { group, typeBuckets, subtotal, byId };
        }).filter(Boolean) as Array<{
            group: ClassificationGroup;
            typeBuckets: { type: string; rows: Account[] }[];
            subtotal: number;
            byId: Map<string, Account>;
        }>;
    }, [filtered]);

    const totalCount = accounts.length;
    const filteredCount = filtered.length;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">
                        Bookkeeping
                    </p>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">
                        Chart of Accounts
                    </h1>
                    <p className="text-sm text-white/50">
                        Mirror of QuickBooks ledger. Used to classify bills, expenses and items.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40 hidden sm:inline">
                        {filteredCount === totalCount
                            ? `${totalCount} account${totalCount === 1 ? '' : 's'}`
                            : `${filteredCount} of ${totalCount}`}
                    </span>
                    <button
                        onClick={pullFromQuickbooks}
                        disabled={importing}
                        className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {importing ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Download size={14} />
                        )}
                        {importing ? 'Pulling…' : 'Pull from QuickBooks'}
                    </button>
                </div>
            </div>

            {/* Flash */}
            {flash && (
                <div
                    className={`mb-6 px-4 py-3 rounded-2xl border text-sm flex items-start gap-3 ${
                        flashKind === 'success'
                            ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-200'
                            : 'bg-red-500/8 border-red-500/20 text-red-200'
                    }`}
                >
                    {flashKind === 'error' && <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                    <span className="flex-1">{flash}</span>
                    <button
                        onClick={() => setFlash(null)}
                        className="text-white/40 hover:text-white shrink-0"
                        aria-label="Dismiss"
                    >
                        <span aria-hidden="true">{'×'}</span>
                    </button>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-80">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                            size={16}
                        />
                        <input
                            type="text"
                            placeholder="Search account name, type, subtype..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all"
                        />
                    </div>
                    {chip === 'By Classification' && (
                        <select
                            title="Filter by classification"
                            value={classFilter}
                            onChange={(e) =>
                                setClassFilter(
                                    e.target.value as AccountClassification | 'All',
                                )
                            }
                            className="h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none shrink-0"
                        >
                            <option value="All">All Classifications</option>
                            <option value="Asset">Asset</option>
                            <option value="Liability">Liability</option>
                            <option value="Equity">Equity</option>
                            <option value="Revenue">Revenue</option>
                            <option value="Expense">Expense</option>
                            <option value="Other">Other</option>
                        </select>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {(
                        ['All', 'Active', 'Bank', 'Has Balance', 'By Classification'] as FilterChip[]
                    ).map((c) => (
                        <button
                            key={c}
                            onClick={() => setChip(c)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                                chip === c
                                    ? 'bg-white/15 text-white'
                                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* States */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
                </div>
            ) : error ? (
                <div className="py-16 text-center border border-red-500/20 border-dashed rounded-2xl bg-red-500/5">
                    <h3 className="font-serif text-lg font-bold text-red-300 mb-2">
                        Could not load accounts
                    </h3>
                    <p className="text-sm text-red-200/70 mb-4 max-w-sm mx-auto">{error}</p>
                    <button
                        onClick={load}
                        className="text-[#b8956a] hover:text-[#cbb08c] font-semibold text-sm transition-colors"
                    >
                        Try again
                    </button>
                </div>
            ) : accounts.length === 0 ? (
                <div className="py-16 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.02]">
                    <BookOpen size={48} className="mx-auto text-white/10 mb-4" />
                    <h3 className="font-serif text-lg font-bold text-white mb-2">
                        Chart of Accounts is empty
                    </h3>
                    <p className="text-white/40 mb-6 max-w-sm mx-auto">
                        Pull accounts from QuickBooks to populate the ledger.
                    </p>
                    <button
                        onClick={pullFromQuickbooks}
                        disabled={importing}
                        className="inline-flex items-center gap-2 h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full hover:bg-[#cbb08c] transition-colors disabled:opacity-60"
                    >
                        {importing ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Download size={14} />
                        )}
                        {importing ? 'Pulling…' : 'Pull from QuickBooks'}
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-16 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.02]">
                    <Wallet size={40} className="mx-auto text-white/10 mb-4" />
                    <h3 className="font-serif text-lg font-bold text-white mb-2">
                        No matching accounts
                    </h3>
                    <p className="text-white/40 mb-6 max-w-sm mx-auto">
                        Try clearing your filters or search.
                    </p>
                    <button
                        onClick={() => {
                            setSearch('');
                            setChip('All');
                            setClassFilter('All');
                        }}
                        className="text-[#b8956a] hover:text-[#cbb08c] font-semibold text-sm transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {grouped.map(({ group, typeBuckets, subtotal, byId }) => (
                        <section
                            key={group.classification}
                            className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden"
                        >
                            <header className="flex items-baseline justify-between px-5 py-4 border-b border-white/8 bg-white/[0.015]">
                                <div className="flex items-baseline gap-3">
                                    <h2 className="font-serif text-lg font-bold text-white">
                                        {group.label}
                                    </h2>
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a]">
                                        {group.classification}
                                    </span>
                                </div>
                                <span
                                    className={`font-mono text-sm font-bold tabular-nums ${
                                        group.positiveTone ? 'text-emerald-300' : 'text-white'
                                    }`}
                                >
                                    {fmtCurrency(subtotal, 'USD')}
                                </span>
                            </header>

                            {typeBuckets.map(({ type, rows }) => (
                                <div key={type} className="border-b last:border-b-0 border-white/6">
                                    <div className="px-5 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 bg-black/15">
                                        {type}
                                    </div>
                                    <ul className="divide-y divide-white/5">
                                        {rows.map((a) => {
                                            const depth = depthOf(a, byId);
                                            const balance = Number(a.currentBalance);
                                            const balanceColor = group.positiveTone
                                                ? 'text-emerald-300'
                                                : 'text-white';
                                            return (
                                                <li key={a.id}>
                                                    <Link
                                                        href={`/admin/accounts/${a.id}`}
                                                        className="flex items-center px-5 py-2.5 hover:bg-white/[0.04] transition-colors group"
                                                    >
                                                        <div
                                                            className="flex-1 min-w-0 flex items-center gap-3"
                                                            style={{
                                                                paddingLeft: `${Math.min(depth, 4) * 18}px`,
                                                            }}
                                                        >
                                                            {depth > 0 && (
                                                                <span
                                                                    aria-hidden="true"
                                                                    className="text-white/20 text-xs"
                                                                >
                                                                    └
                                                                </span>
                                                            )}
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-white truncate group-hover:text-[#b8956a] transition-colors">
                                                                        {a.name}
                                                                    </span>
                                                                    {!a.active && (
                                                                        <span className="text-[9px] uppercase tracking-widest text-white/30 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                                                            Inactive
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {a.accountSubtype && (
                                                                    <div className="text-[11px] text-white/35 truncate mt-0.5">
                                                                        {a.accountSubtype}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="hidden md:block w-32 text-xs text-white/40 truncate pl-4">
                                                            {a.accountType}
                                                        </div>
                                                        <div
                                                            className={`w-32 text-right font-mono text-sm tabular-nums ${
                                                                balance === 0
                                                                    ? 'text-white/30'
                                                                    : balanceColor
                                                            }`}
                                                        >
                                                            {fmtCurrency(balance, a.currency)}
                                                        </div>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
