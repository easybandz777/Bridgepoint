'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    Users,
    Loader2,
    CheckCircle,
    AlertCircle,
    PlayCircle,
    Hammer,
    Receipt,
    FileText,
} from 'lucide-react';

interface BackfillStatus {
    projectsPending: number;
    invoicesPending: number;
    estimatesPending: number;
    totalCustomers: number;
}

interface BackfillResult {
    ok: boolean;
    projectsBackfilled: number;
    invoicesBackfilled: number;
    estimatesBackfilled: number;
    customersCreated: number;
    durationMs: number;
}

interface BackfillCardProps {
    onComplete?: () => void;
}

export function BackfillCard({ onComplete }: BackfillCardProps) {
    const [status, setStatus] = useState<BackfillStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<BackfillResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/backfill/status', { cache: 'no-store' });
            if (!res.ok) throw new Error(`status ${res.status}`);
            const json = (await res.json()) as BackfillStatus;
            setStatus(json);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            await loadStatus();
            if (!cancelled) setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [loadStatus]);

    async function handleRun() {
        setRunning(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch('/api/admin/backfill/customers', { method: 'POST' });
            const json = (await res.json()) as BackfillResult & { error?: string };
            if (!res.ok || !json.ok) {
                throw new Error(json.error ?? `status ${res.status}`);
            }
            setResult(json);
            await loadStatus();
            onComplete?.();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setRunning(false);
        }
    }

    const totalPending = status
        ? status.projectsPending + status.invoicesPending + status.estimatesPending
        : 0;

    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#b8956a]/15 flex items-center justify-center shrink-0">
                    <Users size={18} className="text-[#b8956a]" />
                </div>
                <div className="min-w-0">
                    <h2 className="font-serif text-base font-semibold text-white">Customer Backfill</h2>
                    <p className="text-[11px] text-white/40 mt-0.5">
                        Link existing records to customer entities
                    </p>
                </div>
            </div>

            <div className="p-6 space-y-5">
                <p className="text-xs text-white/55 leading-relaxed">
                    Existing projects, invoices, and estimates have free-form client info. Run
                    backfill to link them to customer records, creating new customers when no
                    match is found.
                </p>

                <div className="grid grid-cols-3 gap-3">
                    <CounterTile
                        icon={Hammer}
                        label="Projects"
                        value={loading ? null : status?.projectsPending ?? 0}
                        color="#34d399"
                    />
                    <CounterTile
                        icon={Receipt}
                        label="Invoices"
                        value={loading ? null : status?.invoicesPending ?? 0}
                        color="#b8956a"
                    />
                    <CounterTile
                        icon={FileText}
                        label="Estimates"
                        value={loading ? null : status?.estimatesPending ?? 0}
                        color="#60a5fa"
                    />
                </div>

                {status && !loading && (
                    <p className="text-[11px] text-white/35">
                        {status.totalCustomers} customer
                        {status.totalCustomers === 1 ? '' : 's'} on file ·{' '}
                        {totalPending === 0 ? 'all caught up' : `${totalPending} record${totalPending === 1 ? '' : 's'} pending`}
                    </p>
                )}

                {result && (
                    <div className="rounded-xl border border-[#34d399]/20 bg-[#34d399]/5 p-4 flex items-start gap-3">
                        <CheckCircle size={14} className="text-[#34d399] mt-0.5 shrink-0" />
                        <div className="text-xs text-white/75 leading-relaxed">
                            <p className="font-semibold text-white mb-1">Backfill complete</p>
                            <p>
                                Created {result.customersCreated} customer
                                {result.customersCreated === 1 ? '' : 's'}, linked{' '}
                                {result.projectsBackfilled} project
                                {result.projectsBackfilled === 1 ? '' : 's'},{' '}
                                {result.invoicesBackfilled} invoice
                                {result.invoicesBackfilled === 1 ? '' : 's'}, and{' '}
                                {result.estimatesBackfilled} estimate
                                {result.estimatesBackfilled === 1 ? '' : 's'} in{' '}
                                {(result.durationMs / 1000).toFixed(1)}s.
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
                        <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-red-300 leading-relaxed">{error}</p>
                    </div>
                )}

                <div className="flex items-center justify-end pt-2 border-t border-white/6">
                    <button
                        onClick={handleRun}
                        disabled={running || loading}
                        className="h-10 px-5 rounded-xl bg-[#b8956a] text-black text-sm font-semibold hover:bg-[#cbb08c] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {running ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Running backfill...
                            </>
                        ) : (
                            <>
                                <PlayCircle size={14} />
                                Run Backfill
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface CounterTileProps {
    icon: typeof Hammer;
    label: string;
    value: number | null;
    color: string;
}

function CounterTile({ icon: Icon, label, value, color }: CounterTileProps) {
    return (
        <div className="rounded-xl border border-white/6 bg-black/20 p-3.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <Icon size={12} style={{ color }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    {label}
                </span>
            </div>
            <p className="text-xl font-semibold font-serif text-white">
                {value === null ? '—' : value}
            </p>
        </div>
    );
}
