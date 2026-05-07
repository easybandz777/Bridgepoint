'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    AlertCircle,
    Loader2,
    Plug,
    PlugZap,
    Download,
    Sparkles,
} from 'lucide-react';
import {
    QbImportProgress,
    ENTITY_ROWS,
    type EntityKey,
    type EntityState,
} from '@/components/admin/qb-import-progress';
import type { QbStatusResponse } from '@/components/admin/qb-status-card';

type Step = 1 | 2 | 3 | 4;

interface ImportResultLib {
    imported: number;
    updated: number;
    failed: number;
    durationMs?: number;
    error?: string;
}

const ENDPOINT_BY_KEY: Record<EntityKey, string> = {
    accounts: '/api/quickbooks/accounts/import',
    customers: '/api/quickbooks/customers/import',
    vendors: '/api/quickbooks/vendors/import',
    items: '/api/quickbooks/items/import',
};

const ORDER: EntityKey[] = ['accounts', 'customers', 'vendors', 'items'];

function initialStates(): Record<EntityKey, EntityState> {
    return {
        accounts: { status: 'pending' },
        customers: { status: 'pending' },
        vendors: { status: 'pending' },
        items: { status: 'pending' },
    };
}

async function callImport(key: EntityKey): Promise<EntityState> {
    try {
        const r = await fetch(ENDPOINT_BY_KEY[key], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actor: 'admin' }),
        });
        const j = (await r.json().catch(() => ({}))) as ImportResultLib;
        if (!r.ok) {
            return { status: 'error', message: j.error ?? `HTTP ${r.status}` };
        }
        return {
            status: 'success',
            imported: Number(j.imported ?? 0),
            updated: Number(j.updated ?? 0),
            failed: Number(j.failed ?? 0),
        };
    } catch (e) {
        return { status: 'error', message: e instanceof Error ? e.message : String(e) };
    }
}

export default function QuickBooksImportWizardPage() {
    const [step, setStep] = useState<Step>(1);
    const [statusData, setStatusData] = useState<QbStatusResponse | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [states, setStates] = useState<Record<EntityKey, EntityState>>(initialStates());
    const [running, setRunning] = useState(false);
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [finishedAt, setFinishedAt] = useState<number | null>(null);

    const loadStatus = useCallback(async () => {
        setStatusLoading(true);
        setStatusError(null);
        try {
            const r = await fetch('/api/quickbooks/status', { cache: 'no-store' });
            const j = (await r.json()) as QbStatusResponse;
            if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
            setStatusData(j);
        } catch (e) {
            setStatusError(e instanceof Error ? e.message : String(e));
        } finally {
            setStatusLoading(false);
        }
    }, []);

    useEffect(() => {
        if (step === 2) void loadStatus();
    }, [step, loadStatus]);

    const setEntityState = useCallback((key: EntityKey, state: EntityState) => {
        setStates((prev) => ({ ...prev, [key]: state }));
    }, []);

    const runAll = useCallback(async () => {
        setRunning(true);
        setStartedAt(Date.now());
        setFinishedAt(null);
        // Reset to pending in case of re-run.
        setStates(initialStates());
        for (const key of ORDER) {
            setEntityState(key, { status: 'running' });
            const result = await callImport(key);
            setEntityState(key, result);
        }
        setFinishedAt(Date.now());
        setRunning(false);
    }, [setEntityState]);

    const retry = useCallback(
        async (key: EntityKey) => {
            setEntityState(key, { status: 'running' });
            const result = await callImport(key);
            setEntityState(key, result);
        },
        [setEntityState],
    );

    const connected = statusData?.connected && statusData.status === 'active';
    const allDone = ORDER.every((k) => states[k].status === 'success' || states[k].status === 'error');
    const allSuccess = ORDER.every((k) => states[k].status === 'success');

    const totals = ORDER.reduce(
        (acc, k) => {
            const s = states[k];
            if (s.status === 'success') {
                acc[k] = s.imported + s.updated;
            } else {
                acc[k] = 0;
            }
            return acc;
        },
        { accounts: 0, customers: 0, vendors: 0, items: 0 } as Record<EntityKey, number>,
    );

    const elapsedSec =
        startedAt && finishedAt
            ? Math.max(1, Math.round((finishedAt - startedAt) / 1000))
            : 0;

    return (
        <div className="min-h-screen bg-[#0e0e0e]">
            <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-10">
                <div className="mb-8">
                    <Link
                        href="/admin/integrations/quickbooks"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/50 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={12} />
                        Back to QuickBooks integration
                    </Link>
                </div>

                <StepRail step={step} />

                {step === 1 && (
                    <Step1Welcome onContinue={() => setStep(2)} />
                )}
                {step === 2 && (
                    <Step2Preflight
                        loading={statusLoading}
                        error={statusError}
                        data={statusData}
                        connected={Boolean(connected)}
                        onRetry={loadStatus}
                        onBack={() => setStep(1)}
                        onContinue={() => setStep(3)}
                    />
                )}
                {step === 3 && (
                    <Step3Import
                        states={states}
                        running={running}
                        allDone={allDone}
                        onStart={runAll}
                        onRetry={retry}
                        onBack={() => !running && setStep(2)}
                        onContinue={() => setStep(4)}
                    />
                )}
                {step === 4 && (
                    <Step4Done
                        totals={totals}
                        elapsedSec={elapsedSec}
                        allSuccess={allSuccess}
                    />
                )}
            </div>
        </div>
    );
}

// ─── Step rail ────────────────────────────────────────────────────────────

function StepRail({ step }: { step: Step }) {
    const labels: Record<Step, string> = {
        1: 'Welcome',
        2: 'Pre-flight',
        3: 'Pull data',
        4: 'Done',
    };
    return (
        <div className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-2">
                Initial Import · Step {step} of 4
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-4">
                {labels[step]}
            </h1>
            <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                    <div
                        key={n}
                        className={`h-1 rounded-full ${
                            n <= step ? 'bg-[#b8956a]' : 'bg-white/10'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Step 1 — Welcome ─────────────────────────────────────────────────────

function Step1Welcome({ onContinue }: { onContinue: () => void }) {
    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#b8956a]/15 border border-[#b8956a]/25 flex items-center justify-center shrink-0">
                    <Download size={18} className="text-[#b8956a]" />
                </div>
                <div>
                    <h2 className="font-serif text-xl font-semibold text-white mb-1">
                        Pull your data from QuickBooks
                    </h2>
                    <p className="text-sm text-white/55 leading-relaxed">
                        We&rsquo;ll import your customers, vendors, items, and chart of accounts.
                        This is safe to run multiple times.
                    </p>
                </div>
            </div>

            <div className="bg-black/20 border border-white/6 rounded-xl p-5 mb-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45 mb-3">
                    What happens
                </p>
                <ul className="space-y-2.5 text-sm text-white/70">
                    <li className="flex items-start gap-2.5">
                        <span className="text-[#b8956a] mt-0.5" aria-hidden>
                            ✓
                        </span>
                        <span>
                            Records are matched by their QuickBooks ID, so nothing gets
                            duplicated even if you re-run the import.
                        </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                        <span className="text-[#b8956a] mt-0.5" aria-hidden>
                            ✓
                        </span>
                        <span>
                            CRM-only fields you&rsquo;ve added are preserved &mdash; we only
                            refresh the fields QuickBooks owns.
                        </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                        <span className="text-[#b8956a] mt-0.5" aria-hidden>
                            ✓
                        </span>
                        <span>
                            You can re-run anytime to pick up changes from QuickBooks.
                        </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                        <span className="text-[#b8956a] mt-0.5" aria-hidden>
                            ✓
                        </span>
                        <span>
                            Imports run sequentially to respect QuickBooks rate limits.
                            Large data sets may take several minutes.
                        </span>
                    </li>
                </ul>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={onContinue}
                    className="h-11 px-5 rounded-xl bg-gradient-to-b from-[#cbb08c] to-[#b8956a] text-black text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-[#b8956a]/20"
                >
                    Continue
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
}

// ─── Step 2 — Pre-flight ──────────────────────────────────────────────────

function Step2Preflight({
    loading,
    error,
    data,
    connected,
    onRetry,
    onBack,
    onContinue,
}: {
    loading: boolean;
    error: string | null;
    data: QbStatusResponse | null;
    connected: boolean;
    onRetry: () => void;
    onBack: () => void;
    onContinue: () => void;
}) {
    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 sm:p-8">
            <h2 className="font-serif text-xl font-semibold text-white mb-2">
                Check your connection
            </h2>
            <p className="text-sm text-white/55 mb-6">
                Before importing, we need an active QuickBooks connection.
            </p>

            <div className="bg-black/20 border border-white/6 rounded-xl p-5 mb-6 min-h-[88px] flex items-center">
                {loading ? (
                    <div className="flex items-center gap-3 text-sm text-white/65">
                        <Loader2 size={16} className="animate-spin text-[#b8956a]" />
                        Checking connection&hellip;
                    </div>
                ) : error ? (
                    <div className="flex items-start justify-between w-full gap-3">
                        <div className="flex items-start gap-3 text-sm text-red-300">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>Failed to load status: {error}</span>
                        </div>
                        <button
                            onClick={onRetry}
                            className="h-9 px-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs font-semibold hover:bg-red-500/20 transition-colors shrink-0"
                        >
                            Retry
                        </button>
                    </div>
                ) : connected ? (
                    <div className="flex items-start gap-3 w-full">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#34d399] mt-1.5 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                        <div className="min-w-0">
                            <p className="text-sm text-white">
                                Connected to{' '}
                                <span className="font-semibold">
                                    {data?.companyName ?? 'QuickBooks'}
                                </span>{' '}
                                <span className="text-white/45">
                                    ({data?.environment ?? 'sandbox'})
                                </span>
                            </p>
                            <p className="text-[11px] text-white/45 mt-1">
                                Realm {data?.realmId ?? '—'} · ready to import
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                        <div className="flex items-start gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                            <div>
                                <p className="text-sm text-white">Not connected</p>
                                <p className="text-[11px] text-white/45 mt-1">
                                    Please connect to QuickBooks before importing.
                                </p>
                            </div>
                        </div>
                        <a
                            href="/api/quickbooks/connect"
                            className="h-10 px-4 rounded-xl bg-[#b8956a] text-black text-xs font-semibold hover:bg-[#cbb08c] transition-colors flex items-center justify-center gap-2 shrink-0"
                        >
                            <Plug size={12} />
                            Connect now
                        </a>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-3">
                <button
                    onClick={onBack}
                    className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                    <ArrowLeft size={14} />
                    Back
                </button>
                <button
                    onClick={onContinue}
                    disabled={!connected || loading}
                    className="h-11 px-5 rounded-xl bg-gradient-to-b from-[#cbb08c] to-[#b8956a] text-black text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-[#b8956a]/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    Continue
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
}

// ─── Step 3 — Import ──────────────────────────────────────────────────────

function Step3Import({
    states,
    running,
    allDone,
    onStart,
    onRetry,
    onBack,
    onContinue,
}: {
    states: Record<EntityKey, EntityState>;
    running: boolean;
    allDone: boolean;
    onStart: () => void;
    onRetry: (key: EntityKey) => void;
    onBack: () => void;
    onContinue: () => void;
}) {
    const hasStarted = Object.values(states).some((s) => s.status !== 'pending');

    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 sm:p-8">
            <h2 className="font-serif text-xl font-semibold text-white mb-2">
                Pull data from QuickBooks
            </h2>
            <p className="text-sm text-white/55 mb-6">
                We&rsquo;ll run each import in sequence. Total time depends on the size of
                your QuickBooks data.
            </p>

            <div className="mb-6">
                <button
                    onClick={onStart}
                    disabled={running}
                    className="w-full h-12 rounded-xl bg-gradient-to-b from-[#cbb08c] to-[#b8956a] text-black text-sm font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#b8956a]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
                >
                    {running ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Importing&hellip;
                        </>
                    ) : hasStarted ? (
                        <>
                            <PlugZap size={14} />
                            Run again
                        </>
                    ) : (
                        <>
                            <Download size={14} />
                            Start import
                        </>
                    )}
                </button>
            </div>

            <QbImportProgress states={states} onRetry={onRetry} canRetry={!running} />

            <div className="flex items-center justify-between gap-3 mt-8">
                <button
                    onClick={onBack}
                    disabled={running}
                    className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <ArrowLeft size={14} />
                    Back
                </button>
                <button
                    onClick={onContinue}
                    disabled={!allDone}
                    className="h-11 px-5 rounded-xl bg-gradient-to-b from-[#cbb08c] to-[#b8956a] text-black text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-[#b8956a]/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    Continue
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
}

// ─── Step 4 — Done ────────────────────────────────────────────────────────

function Step4Done({
    totals,
    elapsedSec,
    allSuccess,
}: {
    totals: Record<EntityKey, number>;
    elapsedSec: number;
    allSuccess: boolean;
}) {
    const summaryLabels: Record<EntityKey, string> = {
        accounts: 'accounts',
        customers: 'customers',
        vendors: 'vendors',
        items: 'items',
    };
    const phrase = ENTITY_ROWS.map((r) => `${totals[r.key].toLocaleString()} ${summaryLabels[r.key]}`).join(
        ', ',
    );

    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-3 mb-6">
                <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                        allSuccess
                            ? 'bg-[#34d399]/15 border-[#34d399]/30'
                            : 'bg-amber-500/15 border-amber-500/30'
                    }`}
                >
                    {allSuccess ? (
                        <CheckCircle size={18} className="text-[#34d399]" />
                    ) : (
                        <AlertCircle size={18} className="text-amber-400" />
                    )}
                </div>
                <div>
                    <h2 className="font-serif text-xl font-semibold text-white mb-1">
                        {allSuccess ? 'Import complete' : 'Import finished with issues'}
                    </h2>
                    <p className="text-sm text-white/55 leading-relaxed">
                        Imported {phrase}
                        {elapsedSec > 0 ? ` in ${elapsedSec} seconds` : ''}.
                    </p>
                </div>
            </div>

            <div className="bg-black/20 border border-[#b8956a]/20 rounded-xl p-5 mb-6">
                <div className="flex items-start gap-3">
                    <Sparkles size={16} className="text-[#b8956a] mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-white mb-1">Next steps</p>
                        <p className="text-[13px] text-white/60 leading-relaxed mb-3">
                            Now go set defaults for invoices &amp; bills, then start working
                            with your imported records.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/admin/integrations/quickbooks"
                                className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-white/85 text-[12px] font-semibold hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                            >
                                Set defaults
                                <ArrowRight size={11} />
                            </Link>
                            <Link
                                href="/admin/customers"
                                className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-white/85 text-[12px] font-semibold hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                            >
                                Browse customers
                                <ArrowRight size={11} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <Link
                    href="/admin"
                    className="h-11 px-5 rounded-xl bg-gradient-to-b from-[#cbb08c] to-[#b8956a] text-black text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-[#b8956a]/20"
                >
                    Go to dashboard
                    <ArrowRight size={14} />
                </Link>
            </div>
        </div>
    );
}
