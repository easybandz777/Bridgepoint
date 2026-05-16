'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertCircle, X, ExternalLink, Archive, Info } from 'lucide-react';
import { QbStatusCard, type QbStatusResponse } from '@/components/admin/qb-status-card';
import { QbStatsRow } from '@/components/admin/qb-stats-row';
import { QbActionsCard } from '@/components/admin/qb-actions-card';
import { QbSyncLogTable, type QbSyncLogEntry } from '@/components/admin/qb-sync-log-table';
import { QbDefaultsCard } from '@/components/admin/qb-defaults-card';
import { QbImportCard } from '@/components/admin/qb-import-card';
import { QbHowItWorks } from '@/components/admin/qb-how-it-works';

interface FlashMessage {
    kind: 'success' | 'error';
    text: string;
}

export default function QuickBooksIntegrationPage() {
    const [data, setData] = useState<QbStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [flash, setFlash] = useState<FlashMessage | null>(null);
    const [showReEnable, setShowReEnable] = useState(false);

    const load = useCallback(async () => {
        setError(null);
        try {
            const r = await fetch('/api/quickbooks/status', { cache: 'no-store' });
            const j = (await r.json()) as QbStatusResponse;
            if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
            setData(j);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            await load();
            if (!cancelled) setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [load]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('qb_connected') === '1') {
            setFlash({ kind: 'success', text: 'QuickBooks connected successfully.' });
            cleanUrl();
        }
        const errParam = params.get('qb_error');
        if (errParam) {
            setFlash({ kind: 'error', text: decodeURIComponent(errParam) });
            cleanUrl();
        }
    }, []);

    function cleanUrl() {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        url.searchParams.delete('qb_connected');
        url.searchParams.delete('qb_error');
        window.history.replaceState({}, '', url.toString());
    }

    function handleConnect() {
        window.location.href = '/api/quickbooks/connect';
    }

    async function handleDisconnect() {
        setBusy(true);
        try {
            const r = await fetch('/api/quickbooks/disconnect', { method: 'POST' });
            const j = (await r.json().catch(() => ({}))) as { error?: string };
            if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
            setFlash({ kind: 'success', text: 'QuickBooks disconnected.' });
            await load();
        } catch (e) {
            setFlash({ kind: 'error', text: e instanceof Error ? e.message : String(e) });
        } finally {
            setBusy(false);
        }
    }

    async function handleRefresh() {
        setBusy(true);
        try {
            const r = await fetch('/api/quickbooks/refresh', { method: 'POST' });
            const j = (await r.json().catch(() => ({}))) as { error?: string };
            if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
            setFlash({ kind: 'success', text: 'Connection healthy. Token refreshed.' });
            await load();
        } catch (e) {
            setFlash({ kind: 'error', text: e instanceof Error ? e.message : String(e) });
        } finally {
            setBusy(false);
        }
    }

    const disabled = data?.disabled === true;
    const connected = !disabled && data?.connected && data.status === 'active';
    const recent: QbSyncLogEntry[] = Array.isArray(data?.recent) ? (data!.recent as QbSyncLogEntry[]) : [];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">
                        Integrations
                    </p>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">
                        QuickBooks Integration
                    </h1>
                    <p className="text-sm text-white/50 max-w-2xl">
                        Push CRM data to QuickBooks Online and pull payment status back automatically.
                    </p>
                </div>
                <a
                    href="https://app.qbo.intuit.com/app/homepage"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-semibold hover:text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2 self-start sm:self-auto"
                >
                    Open QuickBooks
                    <ExternalLink size={12} />
                </a>
            </div>

            {flash && (
                <div
                    className={`mb-6 p-4 rounded-2xl border text-sm flex items-start gap-3 ${
                        flash.kind === 'success'
                            ? 'bg-[#34d399]/5 border-[#34d399]/20 text-[#34d399]'
                            : 'bg-red-500/5 border-red-500/20 text-red-300'
                    }`}
                >
                    {flash.kind === 'success' ? (
                        <CheckCircle size={16} className="shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    )}
                    <p className="flex-1">{flash.text}</p>
                    <button
                        onClick={() => setFlash(null)}
                        className="opacity-60 hover:opacity-100 transition-opacity"
                        aria-label="Dismiss"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-sm text-red-300 flex items-center justify-between gap-3">
                    <span>Failed to load status: {error}</span>
                    <button
                        onClick={() => {
                            setLoading(true);
                            void load().finally(() => setLoading(false));
                        }}
                        className="h-8 px-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs font-semibold hover:bg-red-500/20 transition-colors shrink-0"
                    >
                        Retry
                    </button>
                </div>
            )}

            {disabled && (
                <div className="mb-6 p-5 rounded-2xl border border-[#b8956a]/25 bg-[#b8956a]/5 text-sm flex items-start gap-3">
                    <Archive size={18} className="shrink-0 mt-0.5 text-[#b8956a]" />
                    <div className="flex-1 min-w-0">
                        <p className="text-white/85 font-semibold mb-1">
                            QuickBooks is disabled — CRM is now the system of record
                        </p>
                        <p className="text-white/55">
                            All QuickBooks API routes return 410 Gone, the auto-sync cron is a no-op,
                            and every &ldquo;Sync to QB&rdquo; button is hidden across the admin. Existing
                            <code className="px-1 py-0.5 mx-1 rounded bg-white/5 border border-white/6 text-white/70 font-mono text-[11px]">qb_id</code>
                            columns and sync history are preserved so the rollback path is intact.
                        </p>
                        <button
                            onClick={() => setShowReEnable(true)}
                            className="mt-3 h-9 px-4 rounded-xl bg-white/5 border border-white/10 text-white/80 text-xs font-semibold hover:text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2"
                        >
                            <Info size={12} />
                            How do I re-enable?
                        </button>
                    </div>
                </div>
            )}

            {showReEnable && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowReEnable(false)}
                >
                    <div
                        className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-lg w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="font-serif text-lg font-semibold text-white">Re-enable QuickBooks</h3>
                            <button
                                onClick={() => setShowReEnable(false)}
                                className="text-white/40 hover:text-white/80 transition-colors"
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <ol className="space-y-3 text-sm text-white/65 list-decimal list-inside">
                            <li>
                                In Vercel project env (and your local
                                <code className="px-1 py-0.5 mx-1 rounded bg-white/5 border border-white/6 text-white/80 font-mono text-[11px]">.env.local</code>),
                                set both
                                <code className="px-1 py-0.5 mx-1 rounded bg-white/5 border border-white/6 text-white/80 font-mono text-[11px]">QB_DISABLED=false</code>
                                and
                                <code className="px-1 py-0.5 mx-1 rounded bg-white/5 border border-white/6 text-white/80 font-mono text-[11px]">NEXT_PUBLIC_QB_DISABLED=false</code>.
                            </li>
                            <li>Redeploy the app so the new env values take effect.</li>
                            <li>
                                Reconnect on this page (click <span className="text-white/85 font-semibold">Connect to QuickBooks</span>).
                                Existing rows with <code className="px-1 py-0.5 rounded bg-white/5 border border-white/6 text-white/80 font-mono text-[11px]">qb_id</code> set will resume syncing.
                            </li>
                        </ol>
                        <p className="text-[11px] text-white/40 mt-4">
                            See <code className="px-1 py-0.5 rounded bg-white/5 border border-white/6 text-white/60 font-mono">QB_DISCONNECT_RUNBOOK.md</code> at the project root for the full procedure.
                        </p>
                        <div className="mt-5 flex justify-end">
                            <button
                                onClick={() => setShowReEnable(false)}
                                className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-semibold hover:text-white hover:bg-white/10 transition-colors"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!disabled && <QbHowItWorks />}

            <div className="space-y-6">
                <QbStatusCard
                    data={data}
                    loading={loading}
                    busy={busy}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    onRefresh={handleRefresh}
                />

                {!disabled && connected && (
                    <QbStatsRow
                        successes={data?.stats?.successes ?? 0}
                        errors={data?.stats?.errors ?? 0}
                        lastActivityAt={data?.stats?.last_activity_at ?? null}
                        refreshExpiresAt={data?.refreshExpiresAt}
                    />
                )}

                {!disabled && <QbImportCard disabled={!connected} onAfter={load} />}

                {!disabled && <QbDefaultsCard enabled={Boolean(connected)} />}

                {!disabled && <QbActionsCard disabled={!connected} onAfter={load} />}

                {!disabled && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-serif text-base font-semibold text-white">Recent sync activity</h2>
                                <p className="text-[11px] text-white/45 mt-0.5">
                                    Latest 10 entries across pushes and pulls.
                                </p>
                            </div>
                            <Link
                                href="/admin/integrations/quickbooks/sync-log"
                                className="text-[11px] font-semibold text-[#b8956a] hover:text-[#cbb08c] transition-colors inline-flex items-center gap-1"
                            >
                                View all
                                <ExternalLink size={11} />
                            </Link>
                        </div>
                        <QbSyncLogTable rows={recent} loading={loading} />
                    </div>
                )}
            </div>
        </div>
    );
}
