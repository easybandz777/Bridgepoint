'use client';

import { useState } from 'react';
import {
    Plug,
    PlugZap,
    Power,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Loader2,
    Building,
    Clock,
} from 'lucide-react';

export interface QbStatusResponse {
    connected: boolean;
    connectionId?: string;
    realmId?: string;
    companyName?: string | null;
    environment?: 'sandbox' | 'production';
    connectedAt?: string;
    connectedBy?: string | null;
    lastRefreshedAt?: string | null;
    accessExpiresAt?: string;
    refreshExpiresAt?: string;
    scopes?: string;
    status?: 'active' | 'disconnected' | 'expired' | 'error';
    stats?: { successes: number; errors: number; last_activity_at: string | null };
    recent?: unknown[];
    hasCredentialsConfigured?: boolean;
    error?: string;
}

interface QbStatusCardProps {
    data: QbStatusResponse | null;
    loading: boolean;
    busy: boolean;
    onConnect: () => void;
    onDisconnect: () => Promise<void>;
    onRefresh: () => Promise<void>;
}

function fmtDateTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return '—';
    return d.toLocaleString();
}

export function QbStatusCard({ data, loading, busy, onConnect, onDisconnect, onRefresh }: QbStatusCardProps) {
    const [confirmDisconnect, setConfirmDisconnect] = useState(false);

    if (loading || !data) {
        return (
            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 animate-pulse">
                <div className="h-6 w-40 bg-white/5 rounded mb-3" />
                <div className="h-4 w-72 bg-white/5 rounded mb-6" />
                <div className="flex gap-3">
                    <div className="h-11 w-44 bg-white/5 rounded-xl" />
                    <div className="h-11 w-32 bg-white/5 rounded-xl" />
                </div>
            </div>
        );
    }

    const isExpired = data.status === 'expired';
    const isError = data.status === 'error';
    const connected = data.connected && data.status === 'active';

    let dot = 'bg-white/30';
    let label = 'Not connected';
    let LabelIcon = Plug;

    if (connected) {
        dot = 'bg-[#34d399] shadow-[0_0_12px_rgba(52,211,153,0.5)]';
        label = `Connected to ${data.companyName ?? 'QuickBooks'}`;
        LabelIcon = PlugZap;
    } else if (isExpired) {
        dot = 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]';
        label = 'Refresh token expired — reconnect required';
        LabelIcon = AlertCircle;
    } else if (isError) {
        dot = 'bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.5)]';
        label = data.error ?? 'Connection error';
        LabelIcon = AlertCircle;
    }

    const envBadge = data.environment ?? 'sandbox';

    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
            <div className="p-6 sm:p-7 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-[#b8956a]/15 flex items-center justify-center shrink-0">
                            <LabelIcon size={20} className="text-[#b8956a]" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2.5 mb-1.5">
                                <span className={`w-2 h-2 rounded-full ${dot}`} />
                                <h2 className="font-serif text-lg sm:text-xl font-semibold text-white">{label}</h2>
                            </div>

                            {connected ? (
                                <div className="space-y-1.5 mt-2">
                                    <div className="flex items-center gap-2 text-xs text-white/55">
                                        <Building size={12} className="text-white/30" />
                                        <span>Realm</span>
                                        <code className="px-1.5 py-0.5 rounded bg-white/5 border border-white/6 text-white/70 font-mono">
                                            {data.realmId}
                                        </code>
                                        <span
                                            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                                envBadge === 'production'
                                                    ? 'bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20'
                                                    : 'bg-amber-400/10 text-amber-300 border-amber-400/20'
                                            }`}
                                        >
                                            {envBadge}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-white/45">
                                        <Clock size={12} className="text-white/30" />
                                        <span>Last refreshed</span>
                                        <span className="text-white/65">{fmtDateTime(data.lastRefreshedAt)}</span>
                                    </div>
                                    {data.connectedBy && (
                                        <div className="text-[11px] text-white/35">
                                            Connected by {data.connectedBy} on {fmtDateTime(data.connectedAt)}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-white/50 max-w-md">
                                    {isExpired
                                        ? 'Reconnect to restore the QuickBooks integration. Your settings will be preserved.'
                                        : 'Connect your QuickBooks Online account to push CRM data and pull payment status automatically.'}
                                </p>
                            )}

                            {data.hasCredentialsConfigured === false && !connected && (
                                <p className="mt-3 text-[11px] text-amber-300 inline-flex items-center gap-1.5">
                                    <AlertCircle size={11} />
                                    QUICKBOOKS_CLIENT_ID / SECRET not configured
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/6">
                    {!connected ? (
                        <button
                            onClick={onConnect}
                            disabled={busy || data.hasCredentialsConfigured === false}
                            className="h-11 px-5 rounded-xl bg-[#b8956a] text-black text-sm font-semibold hover:bg-[#cbb08c] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <PlugZap size={14} />
                            {isExpired ? 'Reconnect to QuickBooks' : 'Connect to QuickBooks'}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onRefresh}
                                disabled={busy}
                                className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-semibold hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {busy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                Test connection
                            </button>
                            {!confirmDisconnect ? (
                                <button
                                    onClick={() => setConfirmDisconnect(true)}
                                    disabled={busy}
                                    className="h-11 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-semibold hover:bg-red-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Power size={14} />
                                    Disconnect
                                </button>
                            ) : (
                                <div className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-red-500/10 border border-red-500/30">
                                    <span className="text-xs text-red-200">Disconnect QuickBooks?</span>
                                    <button
                                        onClick={async () => {
                                            await onDisconnect();
                                            setConfirmDisconnect(false);
                                        }}
                                        disabled={busy}
                                        className="h-7 px-3 rounded-lg bg-red-500 text-white text-[11px] font-semibold hover:bg-red-400 transition-colors disabled:opacity-50"
                                    >
                                        Yes, disconnect
                                    </button>
                                    <button
                                        onClick={() => setConfirmDisconnect(false)}
                                        disabled={busy}
                                        className="h-7 px-3 rounded-lg text-[11px] font-semibold text-white/60 hover:text-white transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                            {data.connected && (
                                <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-[#34d399]">
                                    <CheckCircle size={11} />
                                    Active session
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
