'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ChevronLeft,
    Loader2,
    AlertCircle,
    Download,
    BookOpen,
    Wallet,
    RefreshCw,
} from 'lucide-react';
import type { Account, AccountRow } from '@/lib/accounts';
import { rowToAccount } from '@/lib/accounts';

interface DetailState {
    account: Account | null;
    parent: Account | null;
    children: Account[];
}

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

function fmtDateTime(s: string | null): string {
    if (!s) return '—';
    try {
        return new Date(s).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return s;
    }
}

function classificationToTone(c: string | null): {
    pillBg: string;
    pillText: string;
    balanceColor: string;
} {
    if (c === 'Asset' || c === 'Revenue') {
        return {
            pillBg: 'bg-emerald-500/10 border-emerald-500/25',
            pillText: 'text-emerald-300',
            balanceColor: 'text-emerald-300',
        };
    }
    return {
        pillBg: 'bg-white/5 border-white/15',
        pillText: 'text-white/80',
        balanceColor: 'text-white',
    };
}

export default function AccountDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    const [state, setState] = useState<DetailState>({
        account: null,
        parent: null,
        children: [],
    });
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [flash, setFlash] = useState<string | null>(null);
    const [flashKind, setFlashKind] = useState<'success' | 'error'>('success');

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        setNotFound(false);
        try {
            const res = await fetch(`/api/accounts/${encodeURIComponent(id)}`, {
                cache: 'no-store',
            });
            if (res.status === 404) {
                setNotFound(true);
                setLoading(false);
                return;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const raw = (await res.json()) as Account | AccountRow;
            const account = 'account_type' in raw ? rowToAccount(raw) : (raw as Account);

            // Fetch all accounts once for parent + children resolution. The
            // chart of accounts is small enough that this is cheaper than two
            // separate filtered fetches and avoids race conditions on the
            // detail page.
            const allRes = await fetch('/api/accounts?limit=1000', { cache: 'no-store' });
            let parent: Account | null = null;
            let children: Account[] = [];
            if (allRes.ok) {
                const allJson = (await allRes.json()) as { rows: Account[] | AccountRow[] };
                const all: Account[] = Array.isArray(allJson.rows)
                    ? allJson.rows.map(r =>
                          'account_type' in (r as object)
                              ? rowToAccount(r as AccountRow)
                              : (r as Account),
                      )
                    : [];
                if (account.parentAccountId) {
                    parent = all.find(a => a.id === account.parentAccountId) ?? null;
                }
                children = all
                    .filter(a => a.parentAccountId === account.id)
                    .sort((a, b) => a.name.localeCompare(b.name));
            }

            setState({ account, parent, children });
        } catch (e) {
            setError(String(e));
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    async function refreshFromQb() {
        if (refreshing) return;
        setRefreshing(true);
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
                `Refreshed: ${j.imported ?? 0} new, ${j.updated ?? 0} updated, ${j.failed ?? 0} failed.`,
            );
            await load();
        } catch (e) {
            setFlashKind('error');
            setFlash(e instanceof Error ? e.message : String(e));
        }
        setRefreshing(false);
    }

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
                <Link
                    href="/admin/accounts"
                    className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors mb-6"
                >
                    <ChevronLeft size={14} /> Back to Chart of Accounts
                </Link>
                <div className="py-16 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.02]">
                    <BookOpen size={40} className="mx-auto text-white/10 mb-4" />
                    <h3 className="font-serif text-lg font-bold text-white mb-2">
                        Account not found
                    </h3>
                    <p className="text-white/40 mb-6 max-w-sm mx-auto">
                        This account may have been removed or never imported from QuickBooks.
                    </p>
                </div>
            </div>
        );
    }

    if (error || !state.account) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
                <Link
                    href="/admin/accounts"
                    className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors mb-6"
                >
                    <ChevronLeft size={14} /> Back to Chart of Accounts
                </Link>
                <div className="py-16 text-center border border-red-500/20 border-dashed rounded-2xl bg-red-500/5">
                    <h3 className="font-serif text-lg font-bold text-red-300 mb-2">
                        Could not load account
                    </h3>
                    <p className="text-sm text-red-200/70 mb-4 max-w-sm mx-auto">
                        {error ?? 'Unknown error'}
                    </p>
                    <button
                        onClick={load}
                        className="text-[#b8956a] hover:text-[#cbb08c] font-semibold text-sm transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    const a = state.account;
    const balance = Number(a.currentBalance);
    const tone = classificationToTone(a.classification);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <Link
                href="/admin/accounts"
                className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors mb-6"
            >
                <ChevronLeft size={14} /> Back to Chart of Accounts
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">
                        {a.classification ?? 'Other'} · {a.accountType}
                    </p>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1 truncate">
                        {a.name}
                    </h1>
                    {a.fullName && a.fullName !== a.name && (
                        <p className="text-sm text-white/50 truncate">{a.fullName}</p>
                    )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {!a.active && (
                        <span className="text-[10px] uppercase tracking-widest text-white/40 px-2 py-1 rounded bg-white/5 border border-white/10">
                            Inactive
                        </span>
                    )}
                    <button
                        onClick={refreshFromQb}
                        disabled={refreshing}
                        className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {refreshing ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <RefreshCw size={14} />
                        )}
                        {refreshing ? 'Refreshing…' : 'Refresh from QuickBooks'}
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

            {/* Balance hero */}
            <section className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 mb-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">
                            Current Balance
                        </p>
                        <p
                            className={`font-mono text-3xl sm:text-4xl font-bold tabular-nums ${tone.balanceColor}`}
                        >
                            {fmtCurrency(balance, a.currency)}
                        </p>
                        <p className="text-xs text-white/40 mt-2">
                            Last synced from QuickBooks {fmtDateTime(a.qbSyncedAt)}
                        </p>
                    </div>
                    <span
                        className={`text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full border ${tone.pillBg} ${tone.pillText}`}
                    >
                        {a.classification ?? 'Other'}
                    </span>
                </div>
            </section>

            {/* Details grid */}
            <section className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 mb-6">
                <h2 className="font-serif text-base font-bold text-white mb-4">Details</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">
                            Account Type
                        </dt>
                        <dd className="text-white">{a.accountType}</dd>
                    </div>
                    <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">
                            Subtype
                        </dt>
                        <dd className="text-white">{a.accountSubtype ?? '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">
                            Classification
                        </dt>
                        <dd className="text-white">{a.classification ?? '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">
                            Currency
                        </dt>
                        <dd className="text-white font-mono">{a.currency}</dd>
                    </div>
                    <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">
                            Status
                        </dt>
                        <dd className="text-white">{a.active ? 'Active' : 'Inactive'}</dd>
                    </div>
                    <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">
                            QB Account Id
                        </dt>
                        <dd className="text-white font-mono text-xs break-all">
                            {a.qbId ?? '—'}
                        </dd>
                    </div>
                    {state.parent && (
                        <div className="sm:col-span-2">
                            <dt className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">
                                Parent Account
                            </dt>
                            <dd>
                                <Link
                                    href={`/admin/accounts/${state.parent.id}`}
                                    className="text-[#b8956a] hover:text-[#cbb08c] transition-colors inline-flex items-center gap-1"
                                >
                                    <Wallet size={12} />
                                    {state.parent.fullName ?? state.parent.name}
                                </Link>
                            </dd>
                        </div>
                    )}
                    {a.description && (
                        <div className="sm:col-span-2">
                            <dt className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">
                                Description
                            </dt>
                            <dd className="text-white/80 whitespace-pre-wrap">{a.description}</dd>
                        </div>
                    )}
                </dl>
            </section>

            {/* Sub-accounts */}
            {state.children.length > 0 && (
                <section className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden mb-6">
                    <header className="px-5 py-4 border-b border-white/8 flex items-baseline justify-between">
                        <h2 className="font-serif text-base font-bold text-white">
                            Sub-accounts
                        </h2>
                        <span className="text-xs text-white/40">
                            {state.children.length} child
                            {state.children.length === 1 ? '' : 'ren'}
                        </span>
                    </header>
                    <ul className="divide-y divide-white/5">
                        {state.children.map((c) => {
                            const childBal = Number(c.currentBalance);
                            const childTone = classificationToTone(c.classification);
                            return (
                                <li key={c.id}>
                                    <Link
                                        href={`/admin/accounts/${c.id}`}
                                        className="flex items-center px-5 py-3 hover:bg-white/[0.04] transition-colors group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-white truncate group-hover:text-[#b8956a] transition-colors">
                                                {c.name}
                                            </div>
                                            <div className="text-[11px] text-white/40 truncate mt-0.5">
                                                {c.accountType}
                                                {c.accountSubtype ? ` · ${c.accountSubtype}` : ''}
                                            </div>
                                        </div>
                                        <div
                                            className={`w-32 text-right font-mono text-sm tabular-nums ${
                                                childBal === 0
                                                    ? 'text-white/30'
                                                    : childTone.balanceColor
                                            }`}
                                        >
                                            {fmtCurrency(childBal, c.currency)}
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {/* Footer */}
            <p className="text-xs text-white/40 flex items-center gap-2">
                <Download size={12} />
                Last synced from QuickBooks {fmtDateTime(a.qbSyncedAt)}
                {' · '}
                Source: {a.source}
            </p>
        </div>
    );
}
