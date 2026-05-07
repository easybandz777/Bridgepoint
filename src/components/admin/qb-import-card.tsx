'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Download,
    Users,
    Truck,
    Package,
    BookOpen,
    Loader2,
    AlertCircle,
    CheckCircle,
    ArrowRight,
    Clock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type EntityKey = 'accounts' | 'customers' | 'vendors' | 'items';

interface EntityResultLib {
    imported?: number;
    updated?: number;
    failed?: number;
    error?: string;
}

interface ImportAllResponse {
    ok: boolean;
    durationMs: number;
    accounts: EntityResultLib;
    customers: EntityResultLib;
    vendors: EntityResultLib;
    items: EntityResultLib;
    error?: string;
}

interface RowResult {
    ok: boolean;
    message: string;
}

interface RowConfig {
    key: EntityKey;
    label: string;
    endpoint: string;
    icon: LucideIcon;
}

const ROWS: RowConfig[] = [
    { key: 'accounts', label: 'Accounts', endpoint: '/api/quickbooks/accounts/import', icon: BookOpen },
    { key: 'customers', label: 'Customers', endpoint: '/api/quickbooks/customers/import', icon: Users },
    { key: 'vendors', label: 'Vendors', endpoint: '/api/quickbooks/vendors/import', icon: Truck },
    { key: 'items', label: 'Items', endpoint: '/api/quickbooks/items/import', icon: Package },
];

interface QbImportCardProps {
    disabled: boolean;
    onAfter?: () => void | Promise<void>;
}

function fmtRelative(ts: number | null): string {
    if (!ts) return 'Never';
    const diffMs = Date.now() - ts;
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
}

function summarize(r: EntityResultLib): RowResult {
    if (r.error) return { ok: false, message: r.error };
    const parts = [
        `${Number(r.imported ?? 0)} imported`,
        Number(r.updated ?? 0) > 0 ? `${Number(r.updated)} updated` : null,
        Number(r.failed ?? 0) > 0 ? `${Number(r.failed)} failed` : null,
    ].filter(Boolean);
    return { ok: true, message: parts.join(', ') };
}

export function QbImportCard({ disabled, onAfter }: QbImportCardProps) {
    const [busyKey, setBusyKey] = useState<EntityKey | 'all' | null>(null);
    const [rowResults, setRowResults] = useState<Record<EntityKey, RowResult | null>>({
        accounts: null,
        customers: null,
        vendors: null,
        items: null,
    });
    const [allError, setAllError] = useState<string | null>(null);
    const [lastImportedAt, setLastImportedAt] = useState<number | null>(null);

    // Re-render the relative timestamp as it ages so "Just now" → "1m ago".
    const [, setTick] = useState(0);
    useEffect(() => {
        if (!lastImportedAt) return;
        const id = setInterval(() => setTick((n) => n + 1), 30_000);
        return () => clearInterval(id);
    }, [lastImportedAt]);

    const setRow = useCallback((key: EntityKey, result: RowResult | null) => {
        setRowResults((prev) => ({ ...prev, [key]: result }));
    }, []);

    async function runOne(row: RowConfig) {
        setBusyKey(row.key);
        setAllError(null);
        try {
            const r = await fetch(row.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actor: 'admin' }),
            });
            const j = (await r.json().catch(() => ({}))) as EntityResultLib;
            if (!r.ok) {
                setRow(row.key, { ok: false, message: j.error ?? `HTTP ${r.status}` });
            } else {
                setRow(row.key, summarize(j));
                setLastImportedAt(Date.now());
            }
        } catch (e) {
            setRow(row.key, { ok: false, message: e instanceof Error ? e.message : String(e) });
        } finally {
            setBusyKey(null);
            await onAfter?.();
        }
    }

    async function runAll() {
        setBusyKey('all');
        setAllError(null);
        // Reset row results — they'll fill in as the orchestration finishes.
        setRowResults({ accounts: null, customers: null, vendors: null, items: null });
        try {
            const r = await fetch('/api/quickbooks/import-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actor: 'admin' }),
            });
            const j = (await r.json().catch(() => ({}))) as ImportAllResponse;
            if (!r.ok) {
                setAllError(j.error ?? `HTTP ${r.status}`);
            } else {
                for (const row of ROWS) {
                    setRow(row.key, summarize(j[row.key]));
                }
                setLastImportedAt(Date.now());
            }
        } catch (e) {
            setAllError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusyKey(null);
            await onAfter?.();
        }
    }

    const lastImportedLabel = useMemo(() => fmtRelative(lastImportedAt), [lastImportedAt]);
    const anyResult = ROWS.some((r) => rowResults[r.key] != null);

    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/6 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#b8956a]/15 border border-[#b8956a]/20 flex items-center justify-center shrink-0">
                        <Download size={15} className="text-[#b8956a]" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-serif text-base font-semibold text-white">Initial import</h2>
                        <p className="text-[11px] text-white/45 mt-0.5">
                            Pull customers, vendors, items, and accounts from QuickBooks into the CRM.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <button
                    onClick={runAll}
                    disabled={disabled || busyKey !== null}
                    className="w-full h-11 rounded-xl bg-gradient-to-b from-[#cbb08c] to-[#b8956a] text-black text-sm font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#b8956a]/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:shadow-none"
                >
                    {busyKey === 'all' ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Pulling everything&hellip;
                        </>
                    ) : (
                        <>
                            <Download size={14} />
                            Pull All From QB
                        </>
                    )}
                </button>

                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-2">
                        Or pull individual entities
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {ROWS.map((row) => {
                            const Icon = row.icon;
                            const result = rowResults[row.key];
                            const isBusy = busyKey === row.key || busyKey === 'all';
                            return (
                                <button
                                    key={row.key}
                                    onClick={() => runOne(row)}
                                    disabled={disabled || busyKey !== null}
                                    className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white/85 text-xs font-semibold hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                    title={result ? result.message : `Pull ${row.label.toLowerCase()}`}
                                >
                                    {isBusy && busyKey === row.key ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <Icon size={12} />
                                    )}
                                    <span className="truncate">{row.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {(anyResult || allError) && (
                    <div className="bg-black/20 border border-white/6 rounded-xl p-4 space-y-1.5">
                        {allError && (
                            <p className="inline-flex items-start gap-1.5 text-[11px] text-red-300">
                                <AlertCircle size={11} className="shrink-0 mt-0.5" />
                                <span className="break-words">{allError}</span>
                            </p>
                        )}
                        {ROWS.map((row) => {
                            const result = rowResults[row.key];
                            if (!result) return null;
                            return (
                                <p
                                    key={row.key}
                                    className={`flex items-start gap-1.5 text-[11px] ${
                                        result.ok ? 'text-[#34d399]' : 'text-red-300'
                                    }`}
                                >
                                    {result.ok ? (
                                        <CheckCircle size={11} className="shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertCircle size={11} className="shrink-0 mt-0.5" />
                                    )}
                                    <span className="text-white/65 font-semibold w-20 shrink-0">
                                        {row.label}
                                    </span>
                                    <span className="break-words">{result.message}</span>
                                </p>
                            );
                        })}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-white/6">
                    <p className="inline-flex items-center gap-1.5 text-[11px] text-white/45">
                        <Clock size={11} />
                        Last imported: <span className="text-white/70 font-semibold">{lastImportedLabel}</span>
                    </p>
                    <Link
                        href="/admin/integrations/quickbooks/import"
                        className="text-[11px] font-semibold text-[#b8956a] hover:text-[#cbb08c] transition-colors inline-flex items-center gap-1"
                    >
                        View detailed wizard
                        <ArrowRight size={11} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
