'use client';

import { useState } from 'react';
import { RefreshCw, PlugZap, AlertCircle, CheckCircle, Loader2, ExternalLink, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface QbActionsCardProps {
    disabled: boolean;
    onAfter?: () => void | Promise<void>;
}

interface ActionResult {
    ok: boolean;
    message: string;
    detail?: string;
}

interface ActionRowProps {
    icon: LucideIcon;
    title: string;
    description: string;
    buttonLabel: string;
    busy: boolean;
    disabled: boolean;
    result: ActionResult | null;
    onClick: () => void;
}

function ActionRow({ icon: Icon, title, description, buttonLabel, busy, disabled, result, onClick }: ActionRowProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-black/20 border border-white/6 rounded-xl">
            <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/6 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-white/55" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-[11px] text-white/45 mt-0.5">{description}</p>
                    {result && (
                        <p
                            className={`mt-1.5 inline-flex items-center gap-1 text-[11px] ${
                                result.ok ? 'text-[#34d399]' : 'text-red-300'
                            }`}
                        >
                            {result.ok ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                            {result.message}
                            {result.detail && <span className="text-white/40 ml-1">· {result.detail}</span>}
                        </p>
                    )}
                </div>
            </div>
            <button
                onClick={onClick}
                disabled={busy || disabled}
                className="h-10 w-full sm:w-auto px-4 rounded-xl bg-white/5 border border-white/10 text-white/85 text-xs font-semibold hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
                {busy ? 'Working…' : buttonLabel}
            </button>
        </div>
    );
}

type ActionKey = 'sweep' | 'process' | 'refresh' | 'test';

export function QbActionsCard({ disabled, onAfter }: QbActionsCardProps) {
    const [busy, setBusy] = useState<ActionKey | null>(null);
    const [results, setResults] = useState<{
        sweep: ActionResult | null;
        process: ActionResult | null;
        refresh: ActionResult | null;
        test: ActionResult | null;
    }>({ sweep: null, process: null, refresh: null, test: null });

    function setResult(key: ActionKey, value: ActionResult) {
        setResults((prev) => ({ ...prev, [key]: value }));
    }

    async function runSweep() {
        setBusy('sweep');
        try {
            const r = await fetch('/api/quickbooks/payments/sync-all', { method: 'POST' });
            const j = (await r.json().catch(() => ({}))) as {
                error?: string;
                processed?: number;
                updated?: number;
                errors?: number;
            };
            if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
            const detail = [
                j.processed != null ? `${j.processed} processed` : null,
                j.updated != null ? `${j.updated} updated` : null,
                j.errors != null ? `${j.errors} errors` : null,
            ]
                .filter(Boolean)
                .join(', ');
            setResult('sweep', { ok: true, message: 'Payment sweep complete', detail: detail || undefined });
        } catch (e) {
            setResult('sweep', { ok: false, message: e instanceof Error ? e.message : String(e) });
        } finally {
            setBusy(null);
            await onAfter?.();
        }
    }

    async function runProcess() {
        setBusy('process');
        try {
            const r = await fetch('/api/quickbooks/webhook/process', { method: 'POST' });
            const j = (await r.json().catch(() => ({}))) as {
                error?: string;
                processed?: number;
                pending?: number;
                drained?: number;
            };
            if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
            const detail = [
                j.processed != null ? `${j.processed} processed` : null,
                j.pending != null ? `${j.pending} pending` : null,
                j.drained != null ? `${j.drained} drained` : null,
            ]
                .filter(Boolean)
                .join(', ');
            setResult('process', { ok: true, message: 'Webhook events processed', detail: detail || undefined });
        } catch (e) {
            setResult('process', { ok: false, message: e instanceof Error ? e.message : String(e) });
        } finally {
            setBusy(null);
            await onAfter?.();
        }
    }

    async function runRefresh() {
        setBusy('refresh');
        try {
            const r = await fetch('/api/quickbooks/refresh', { method: 'POST' });
            const j = (await r.json().catch(() => ({}))) as { error?: string; accessExpiresAt?: string };
            if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
            const detail = j.accessExpiresAt
                ? `expires ${new Date(j.accessExpiresAt).toLocaleString()}`
                : undefined;
            setResult('refresh', { ok: true, message: 'Access token refreshed', detail });
        } catch (e) {
            setResult('refresh', { ok: false, message: e instanceof Error ? e.message : String(e) });
        } finally {
            setBusy(null);
            await onAfter?.();
        }
    }

    /**
     * Test the connection by calling /api/quickbooks/companyinfo (which fetches
     * /companyinfo/{realmId} from QBO and returns CompanyName). If that route
     * isn't available yet, fall back to /api/quickbooks/refresh — a token
     * refresh round-trips against Intuit's OAuth server, which is a sufficient
     * liveness probe for "is the connection actually healthy right now".
     */
    async function runTest() {
        setBusy('test');
        try {
            let r = await fetch('/api/quickbooks/companyinfo', { method: 'GET' });
            if (r.status === 404) {
                r = await fetch('/api/quickbooks/refresh', { method: 'POST' });
                const j = (await r.json().catch(() => ({}))) as { error?: string; accessExpiresAt?: string };
                if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
                setResult('test', {
                    ok: true,
                    message: 'Connection healthy',
                    detail: 'verified via token refresh',
                });
            } else {
                const j = (await r.json().catch(() => ({}))) as {
                    error?: string;
                    companyName?: string;
                    CompanyName?: string;
                    companyInfo?: { CompanyName?: string };
                };
                if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
                const companyName =
                    j.companyName ?? j.CompanyName ?? j.companyInfo?.CompanyName ?? 'QuickBooks';
                setResult('test', {
                    ok: true,
                    message: `Connection healthy — ${companyName}`,
                });
            }
        } catch (e) {
            setResult('test', { ok: false, message: e instanceof Error ? e.message : String(e) });
        } finally {
            setBusy(null);
            await onAfter?.();
        }
    }

    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                <div>
                    <h2 className="font-serif text-base font-semibold text-white">Maintenance actions</h2>
                    <p className="text-[11px] text-white/45 mt-0.5">
                        Manually drain queues or test the connection.
                    </p>
                </div>
                <ExternalLink size={13} className="text-white/20" />
            </div>
            <div className="p-5 space-y-3">
                <ActionRow
                    icon={RefreshCw}
                    title="Sweep all invoice payments"
                    description="Pulls latest payment status from QuickBooks for every synced invoice and updates the CRM."
                    buttonLabel="Run sweep"
                    busy={busy === 'sweep'}
                    disabled={disabled || busy !== null}
                    result={results.sweep}
                    onClick={runSweep}
                />
                <ActionRow
                    icon={PlugZap}
                    title="Process webhook events"
                    description="Drains any pending webhook events queued from Intuit (data change notifications)."
                    buttonLabel="Process queue"
                    busy={busy === 'process'}
                    disabled={disabled || busy !== null}
                    result={results.process}
                    onClick={runProcess}
                />
                <ActionRow
                    icon={RefreshCw}
                    title="Refresh access token"
                    description="Forces an OAuth refresh to verify the connection is healthy and tokens are valid."
                    buttonLabel="Refresh token"
                    busy={busy === 'refresh'}
                    disabled={disabled || busy !== null}
                    result={results.refresh}
                    onClick={runRefresh}
                />
                <ActionRow
                    icon={Activity}
                    title="Test connection"
                    description="Fetches CompanyInfo from QuickBooks Online to confirm credentials and realm ID are valid end-to-end."
                    buttonLabel="Test connection"
                    busy={busy === 'test'}
                    disabled={disabled || busy !== null}
                    result={results.test}
                    onClick={runTest}
                />
            </div>
        </div>
    );
}
