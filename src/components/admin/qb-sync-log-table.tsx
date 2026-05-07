'use client';

import { useState } from 'react';
import {
    CheckCircle,
    AlertCircle,
    Clock,
    ChevronDown,
} from 'lucide-react';

export interface QbSyncLogEntry {
    id: string;
    connectionId?: string | null;
    entityType: string;
    entityId?: string | null;
    qbEntityId?: string | null;
    direction: string;
    action: string;
    status: string;
    error?: string | null;
    request?: unknown;
    response?: unknown;
    durationMs?: number | null;
    actor?: string;
    createdAt: string;
    // also accept the raw shape returned by /api/quickbooks/status
    connection_id?: string | null;
    entity_type?: string;
    entity_id?: string | null;
    qb_entity_id?: string | null;
    duration_ms?: number | null;
    created_at?: string;
}

interface QbSyncLogTableProps {
    rows: QbSyncLogEntry[];
    loading?: boolean;
    showRawJson?: boolean;
    emptyLabel?: string;
    /** When set, renders an error block (with optional Retry CTA) instead of the table. */
    error?: string | null;
    onRetry?: () => void;
}

function normalize(row: QbSyncLogEntry) {
    return {
        id: row.id,
        entityType: row.entityType ?? row.entity_type ?? '',
        entityId: row.entityId ?? row.entity_id ?? null,
        qbEntityId: row.qbEntityId ?? row.qb_entity_id ?? null,
        direction: row.direction,
        action: row.action,
        status: row.status,
        error: row.error ?? null,
        request: row.request,
        response: row.response,
        durationMs: row.durationMs ?? row.duration_ms ?? null,
        actor: row.actor ?? null,
        createdAt: row.createdAt ?? row.created_at ?? '',
    };
}

function fmtDateTime(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return '—';
    return d.toLocaleString();
}

function StatusIcon({ status }: { status: string }) {
    if (status === 'success') return <CheckCircle size={12} className="text-[#34d399]" />;
    if (status === 'error') return <AlertCircle size={12} className="text-red-400" />;
    if (status === 'queued') return <Clock size={12} className="text-amber-400" />;
    return <Clock size={12} className="text-white/35" />;
}

function StatusPill({ status }: { status: string }) {
    const styles =
        status === 'success'
            ? 'bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20'
            : status === 'error'
            ? 'bg-red-500/10 text-red-300 border-red-500/20'
            : status === 'queued'
            ? 'bg-amber-400/10 text-amber-300 border-amber-400/20'
            : 'bg-white/5 text-white/50 border-white/10';
    return (
        <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${styles}`}
        >
            <StatusIcon status={status} />
            {status}
        </span>
    );
}

function DirectionPill({ direction }: { direction: string }) {
    const styles =
        direction === 'push'
            ? 'bg-[#b8956a]/15 text-[#b8956a] border-[#b8956a]/25'
            : direction === 'pull'
            ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20'
            : 'bg-white/5 text-white/50 border-white/10';
    return (
        <span
            className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles}`}
        >
            {direction}
        </span>
    );
}

export function QbSyncLogTable({
    rows,
    loading,
    showRawJson = false,
    emptyLabel,
    error,
    onRetry,
}: QbSyncLogTableProps) {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [showFullError, setShowFullError] = useState<string | null>(null);

    if (loading) {
        return (
            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 space-y-3">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-3 h-3 rounded-full bg-white/5 mt-2" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-1/3 bg-white/5 rounded" />
                            <div className="h-2 w-1/2 bg-white/5 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#1a1a1a] border border-red-500/20 rounded-2xl px-6 py-10 text-center">
                <AlertCircle size={28} className="mx-auto text-red-400/70 mb-3" />
                <p className="text-sm text-red-200 max-w-md mx-auto">Failed to load sync activity.</p>
                <p className="text-[11px] text-red-300/70 mt-1.5 max-w-md mx-auto break-words">{error}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="mt-4 h-9 px-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs font-semibold hover:bg-red-500/20 transition-colors"
                    >
                        Retry
                    </button>
                )}
            </div>
        );
    }

    if (!rows || rows.length === 0) {
        return (
            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl px-6 py-12 text-center">
                <Clock size={28} className="mx-auto text-white/15 mb-3" />
                <p className="text-sm text-white/55">
                    {emptyLabel ?? 'No sync activity yet — push an invoice to start.'}
                </p>
                <p className="text-[11px] text-white/30 mt-1">
                    Logs will show up here as soon as the integration starts pushing or pulling data.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
            <div className="hidden md:grid grid-cols-12 items-center gap-3 px-6 py-3 border-b border-white/6 bg-white/[0.02] text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                <div className="col-span-3">When</div>
                <div className="col-span-2">Entity</div>
                <div className="col-span-2">Action</div>
                <div className="col-span-1">Direction</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Duration</div>
                <div className="col-span-1 text-right" />
            </div>

            {rows.map((raw) => {
                const r = normalize(raw);
                const isOpen = expanded === r.id;
                const expandable = showRawJson && (r.request != null || r.response != null || r.error);
                return (
                    <div key={r.id} className="border-b border-white/6 last:border-b-0">
                        <button
                            onClick={() => expandable && setExpanded(isOpen ? null : r.id)}
                            disabled={!expandable}
                            className={`w-full text-left px-6 py-3 grid grid-cols-2 md:grid-cols-12 items-center gap-3 transition-colors ${
                                expandable ? 'hover:bg-white/[0.03] cursor-pointer' : 'cursor-default'
                            }`}
                        >
                            <div className="col-span-2 md:col-span-3">
                                <p className="text-xs text-white/85 font-medium">{fmtDateTime(r.createdAt)}</p>
                                {r.actor && <p className="text-[10px] text-white/30">by {r.actor}</p>}
                            </div>
                            <div className="col-span-1 md:col-span-2 min-w-0">
                                <p className="text-xs text-white/75 truncate">{r.entityType}</p>
                                {r.qbEntityId && (
                                    <p className="text-[10px] text-white/30 truncate font-mono">QB#{r.qbEntityId}</p>
                                )}
                            </div>
                            <div className="col-span-1 md:col-span-2 min-w-0">
                                <p className="text-xs text-white/65 truncate">{r.action}</p>
                                {r.entityId && (
                                    <p className="text-[10px] text-white/25 truncate font-mono">{r.entityId}</p>
                                )}
                            </div>
                            <div className="col-span-1 md:col-span-1">
                                <DirectionPill direction={r.direction} />
                            </div>
                            <div className="col-span-1 md:col-span-1">
                                <StatusPill status={r.status} />
                            </div>
                            <div className="col-span-1 md:col-span-2 min-w-0">
                                <p className="text-[11px] text-white/45">
                                    {r.durationMs != null ? `${r.durationMs}ms` : '—'}
                                </p>
                                {r.error && (
                                    <p className="text-[10px] text-red-300 truncate" title={r.error}>
                                        {r.error.length > 200 ? `${r.error.slice(0, 200)}…` : r.error}
                                    </p>
                                )}
                            </div>
                            <div className="col-span-1 md:col-span-1 text-right">
                                {expandable && (
                                    <ChevronDown
                                        size={14}
                                        className={`inline-block text-white/30 transition-transform ${
                                            isOpen ? 'rotate-180' : ''
                                        }`}
                                    />
                                )}
                            </div>
                        </button>

                        {expandable && isOpen && (
                            <div className="px-6 pb-5 pt-1 space-y-3 bg-black/30">
                                {r.error && (
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-300/70 mb-1.5">
                                            Error
                                        </p>
                                        <pre className="text-[11px] text-red-200 bg-red-500/5 border border-red-500/20 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-words">
                                            {r.error.length > 200 && showFullError !== r.id
                                                ? `${r.error.slice(0, 200)}…`
                                                : r.error}
                                        </pre>
                                        {r.error.length > 200 && (
                                            <button
                                                onClick={() =>
                                                    setShowFullError(showFullError === r.id ? null : r.id)
                                                }
                                                className="mt-1.5 text-[11px] font-semibold text-red-300/80 hover:text-red-200 transition-colors"
                                            >
                                                {showFullError === r.id ? 'Show less' : 'View full'}
                                            </button>
                                        )}
                                    </div>
                                )}
                                {r.request != null && (
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-1.5">
                                            Request
                                        </p>
                                        <pre className="text-[11px] text-white/80 bg-white/[0.02] border border-white/6 rounded-xl p-3 overflow-x-auto font-mono">
                                            {JSON.stringify(r.request, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                {r.response != null && (
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-1.5">
                                            Response
                                        </p>
                                        <pre className="text-[11px] text-white/80 bg-white/[0.02] border border-white/6 rounded-xl p-3 overflow-x-auto font-mono">
                                            {JSON.stringify(r.response, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
