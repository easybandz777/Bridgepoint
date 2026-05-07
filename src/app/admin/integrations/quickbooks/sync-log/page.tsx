'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { QbSyncLogTable, type QbSyncLogEntry } from '@/components/admin/qb-sync-log-table';

type StatusFilter = 'all' | 'success' | 'error' | 'queued' | 'skipped';
type DirectionFilter = 'all' | 'push' | 'pull' | 'auth';

const ENTITY_TYPES: { key: string; label: string }[] = [
    { key: 'all', label: 'All entities' },
    { key: 'invoice', label: 'Invoice' },
    { key: 'estimate', label: 'Estimate' },
    { key: 'customer', label: 'Customer' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'subcontractor', label: 'Subcontractor' },
    { key: 'bill', label: 'Bill' },
    { key: 'payment', label: 'Payment' },
    { key: 'connection', label: 'Connection' },
];

interface SyncLogResponse {
    rows: QbSyncLogEntry[];
    total: number;
    limit: number;
    offset: number;
    error?: string;
}

function defaultDateFrom(): string {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
}

function defaultDateTo(): string {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.toISOString().slice(0, 10);
}

const PAGE_SIZE = 50;

export default function QbSyncLogPage() {
    const [rows, setRows] = useState<QbSyncLogEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [status, setStatus] = useState<StatusFilter>('all');
    const [direction, setDirection] = useState<DirectionFilter>('all');
    const [entityType, setEntityType] = useState<string>('all');
    const [from, setFrom] = useState(defaultDateFrom());
    const [to, setTo] = useState(defaultDateTo());
    const [page, setPage] = useState(0);

    const offset = page * PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.set('limit', String(PAGE_SIZE));
            params.set('offset', String(offset));
            if (status !== 'all') params.set('status', status);
            if (direction !== 'all') params.set('direction', direction);
            if (entityType !== 'all') params.set('entityType', entityType);
            if (from) params.set('from', `${from}T00:00:00.000Z`);
            if (to) params.set('to', `${to}T23:59:59.999Z`);

            const r = await fetch(`/api/quickbooks/sync-log?${params}`, { cache: 'no-store' });
            const j = (await r.json()) as SyncLogResponse;
            if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
            setRows(Array.isArray(j.rows) ? j.rows : []);
            setTotal(j.total ?? 0);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            setRows([]);
            setTotal(0);
        }
        setLoading(false);
    }, [status, direction, entityType, from, to, offset]);

    useEffect(() => {
        void load();
    }, [load]);

    // Reset pagination on filter change
    useEffect(() => {
        setPage(0);
    }, [status, direction, entityType, from, to]);

    const counts = useMemo(
        () => ({
            from: total === 0 ? 0 : offset + 1,
            to: Math.min(offset + rows.length, total),
        }),
        [offset, rows.length, total]
    );

    const statusChips: { key: StatusFilter; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'error', label: 'Errors only' },
        { key: 'success', label: 'Successes' },
        { key: 'queued', label: 'Queued' },
        { key: 'skipped', label: 'Skipped' },
    ];
    const directionChips: { key: DirectionFilter; label: string }[] = [
        { key: 'all', label: 'All flows' },
        { key: 'pull', label: 'Pulls' },
        { key: 'push', label: 'Pushes' },
        { key: 'auth', label: 'Auth' },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <Link
                        href="/admin/integrations/quickbooks"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/45 hover:text-white/80 transition-colors mb-2"
                    >
                        <ArrowLeft size={12} />
                        Back to QuickBooks
                    </Link>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">
                        Integrations
                    </p>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">Sync Activity</h1>
                    <p className="text-sm text-white/50">
                        Every push, pull, and refresh between Bridgepointe and QuickBooks.
                    </p>
                </div>
                <button
                    onClick={() => load()}
                    disabled={loading}
                    title="Refresh"
                    className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-50 self-start"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-4 sm:p-5 mb-6 space-y-4">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-2">Status</p>
                    <div className="flex flex-wrap gap-2">
                        {statusChips.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setStatus(key)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                    status === key
                                        ? 'bg-white/15 text-white'
                                        : 'text-white/45 hover:text-white/75 hover:bg-white/5'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-2">Direction</p>
                    <div className="flex flex-wrap gap-2">
                        {directionChips.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setDirection(key)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                    direction === key
                                        ? 'bg-white/15 text-white'
                                        : 'text-white/45 hover:text-white/75 hover:bg-white/5'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-2">
                            Entity type
                        </p>
                        <select
                            value={entityType}
                            onChange={(e) => setEntityType(e.target.value)}
                            className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#b8956a]/50 transition-all"
                        >
                            {ENTITY_TYPES.map((t) => (
                                <option key={t.key} value={t.key} className="bg-[#1a1a1a]">
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 sm:flex gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-2">From</p>
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#b8956a]/50 transition-all"
                            />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-2">To</p>
                            <input
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#b8956a]/50 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <QbSyncLogTable
                rows={rows}
                loading={loading}
                showRawJson
                emptyLabel="No sync entries match these filters."
                error={error}
                onRetry={() => void load()}
            />

            {total > 0 && (
                <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-[11px] text-white/40">
                        Showing {counts.from}–{counts.to} of {total.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0 || loading}
                            className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={13} />
                            Previous
                        </button>
                        <span className="text-[11px] text-white/40 px-2">
                            Page {page + 1} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                            disabled={page + 1 >= totalPages || loading}
                            className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next
                            <ChevronRight size={13} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
