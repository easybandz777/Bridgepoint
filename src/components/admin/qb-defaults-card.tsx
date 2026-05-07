'use client';

import { useCallback, useEffect, useState } from 'react';
import { Boxes, Loader2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface QbDefaults {
    itemId: string;
    expenseAccountId: string;
    incomeAccountId: string;
    resolvedAt: string;
}

interface QbDefaultsResponse {
    defaults: QbDefaults | null;
    error?: string;
}

interface QbDefaultsCardProps {
    /** Card is hidden until the connection is active. */
    enabled: boolean;
}

function fmtDateTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return '—';
    return d.toLocaleString();
}

export function QbDefaultsCard({ enabled }: QbDefaultsCardProps) {
    const [defaults, setDefaults] = useState<QbDefaults | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const r = await fetch('/api/quickbooks/refs', { cache: 'no-store' });
            const j = (await r.json()) as QbDefaultsResponse;
            if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
            setDefaults(j.defaults ?? null);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, []);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            await load();
            if (!cancelled) setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [enabled, load]);

    async function refresh() {
        setBusy(true);
        setError(null);
        setSuccess(null);
        try {
            const r = await fetch('/api/quickbooks/refs', { method: 'POST' });
            const j = (await r.json()) as QbDefaultsResponse & { ok?: boolean };
            if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
            setDefaults(j.defaults ?? null);
            setSuccess(j.defaults ? 'Defaults resolved.' : 'No defaults could be resolved.');
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    }

    if (!enabled) return null;

    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#b8956a]/15 border border-[#b8956a]/20 flex items-center justify-center shrink-0">
                        <Boxes size={15} className="text-[#b8956a]" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-serif text-base font-semibold text-white">QuickBooks defaults</h2>
                        <p className="text-[11px] text-white/45 mt-0.5">
                            Default Item, Income, and Expense accounts used when pushing invoices and bills.
                        </p>
                    </div>
                </div>
                {defaults && (
                    <button
                        onClick={refresh}
                        disabled={busy}
                        className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 text-xs font-semibold disabled:opacity-50 shrink-0"
                    >
                        {busy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        <span className="hidden sm:inline">Refresh defaults</span>
                        <span className="sm:hidden">Refresh</span>
                    </button>
                )}
            </div>

            <div className="p-5">
                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-4 w-2/3 bg-white/5 rounded" />
                        <div className="h-4 w-1/2 bg-white/5 rounded" />
                        <div className="h-4 w-1/3 bg-white/5 rounded" />
                    </div>
                ) : defaults ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Field label="Item" value={defaults.itemId} />
                            <Field label="Income account" value={defaults.incomeAccountId} />
                            <Field label="Expense account" value={defaults.expenseAccountId} />
                        </div>
                        <p className="text-[11px] text-white/35 mt-3">
                            Resolved {fmtDateTime(defaults.resolvedAt)}
                        </p>
                    </>
                ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="text-sm text-white/55">
                            Defaults will be resolved on first sync.
                        </p>
                        <button
                            onClick={refresh}
                            disabled={busy}
                            className="h-10 px-4 rounded-xl bg-[#b8956a] text-black text-xs font-semibold hover:bg-[#cbb08c] transition-colors flex items-center gap-2 disabled:opacity-50 self-start sm:self-auto"
                        >
                            {busy ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                            Resolve now
                        </button>
                    </div>
                )}

                {error && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-red-300">
                        <AlertCircle size={11} />
                        {error}
                    </p>
                )}
                {success && !error && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-[#34d399]">
                        <CheckCircle size={11} />
                        {success}
                    </p>
                )}
            </div>
        </div>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-black/20 border border-white/6 rounded-xl p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-1">
                {label}
            </p>
            <code className="text-sm text-white/85 font-mono break-all">{value}</code>
        </div>
    );
}
