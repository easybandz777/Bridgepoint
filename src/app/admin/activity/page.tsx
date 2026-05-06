'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Activity as ActivityIcon,
    FileText,
    Receipt,
    Hammer,
    Users,
    User,
    CreditCard,
    Clock,
    Filter,
} from 'lucide-react';

interface ActivityRow {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    actor: string | null;
    description: string | null;
    metadata: unknown;
    created_at: string;
}

const ENTITY_TYPES = [
    'all',
    'estimate',
    'invoice',
    'project',
    'subcontractor',
    'employee',
    'expense',
    'time_entry',
    'bill',
    'change_order',
] as const;

type FilterType = (typeof ENTITY_TYPES)[number];

function timeAgo(iso: string): string {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return '';
    const sec = Math.floor((Date.now() - then) / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day}d ago`;
    return new Date(iso).toLocaleDateString();
}

function entityHref(t: string, id: string): string | null {
    switch (t) {
        case 'estimate': return `/admin/estimates/${id}`;
        case 'invoice': return `/admin/invoices/${id}`;
        case 'project': return `/admin/projects/${id}`;
        case 'subcontractor': return `/admin/subcontractors/${id}`;
        case 'employee': return `/admin/employees/${id}`;
        case 'expense': return `/admin/expenses`;
        case 'time_entry': return `/admin/timesheets`;
        case 'bill':
        case 'project_bill':
        case 'change_order': return `/admin/projects`;
        default: return null;
    }
}

function entityIcon(t: string) {
    switch (t) {
        case 'estimate': return FileText;
        case 'invoice': return Receipt;
        case 'project': return Hammer;
        case 'subcontractor': return Users;
        case 'employee': return User;
        case 'expense': return CreditCard;
        case 'time_entry': return Clock;
        default: return ActivityIcon;
    }
}

function entityColor(t: string): string {
    switch (t) {
        case 'estimate': return '#60a5fa';
        case 'invoice': return '#b8956a';
        case 'project': return '#34d399';
        case 'subcontractor': return '#a78bfa';
        case 'employee': return '#f472b6';
        case 'expense': return '#fbbf24';
        case 'time_entry': return '#22d3ee';
        default: return '#94a3b8';
    }
}

export default function ActivityFeedPage() {
    const [rows, setRows] = useState<ActivityRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterType>('all');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const url = filter === 'all'
                    ? '/api/activity?limit=200'
                    : `/api/activity?limit=200&entity_type=${encodeURIComponent(filter)}`;
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) throw new Error(`status ${res.status}`);
                const json = (await res.json()) as ActivityRow[];
                if (!cancelled) {
                    setRows(json);
                    setError(null);
                }
            } catch (e) {
                if (!cancelled) setError(String(e));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [filter]);

    // Group by date
    const groups = useMemo(() => {
        const m = new Map<string, ActivityRow[]>();
        for (const r of rows) {
            const date = new Date(r.created_at).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
            if (!m.has(date)) m.set(date, []);
            m.get(date)!.push(r);
        }
        return Array.from(m.entries());
    }, [rows]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
            {/* Header */}
            <div className="mb-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Audit Trail</p>
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-white mb-2">Organization Activity</h1>
                <p className="text-sm text-white/50">Reverse-chronological feed of changes across estimates, invoices, projects, subs, employees, and bills.</p>
            </div>

            {/* Filters */}
            <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
                <Filter size={14} className="text-white/30 shrink-0" />
                {ENTITY_TYPES.map((t) => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                            filter === t
                                ? 'bg-[#b8956a]/15 text-[#b8956a]'
                                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                        }`}
                    >
                        {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}
                    </button>
                ))}
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-sm text-red-300">
                    Failed to load activity: {error}
                </div>
            )}

            {/* Feed */}
            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-6 space-y-3">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-9 h-9 rounded-xl bg-white/5" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 w-2/3 bg-white/5 rounded" />
                                    <div className="h-2 w-1/3 bg-white/5 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <ActivityIcon size={32} className="mx-auto text-white/15 mb-3" />
                        <p className="text-sm text-white/50 mb-1">No activity yet.</p>
                        <p className="text-xs text-white/30">Run seed from the dashboard to populate demo data.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/6">
                        {groups.map(([date, entries]) => (
                            <div key={date}>
                                <div className="px-6 py-3 bg-white/[0.02] border-b border-white/4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">{date}</p>
                                </div>
                                <div className="divide-y divide-white/4">
                                    {entries.map((item) => {
                                        const Icon = entityIcon(item.entity_type);
                                        const color = entityColor(item.entity_type);
                                        const href = entityHref(item.entity_type, item.entity_id);
                                        const inner = (
                                            <div className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors group">
                                                <div
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                                    style={{ background: `${color}15` }}
                                                >
                                                    <Icon size={15} style={{ color }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white/85 truncate group-hover:text-white">
                                                        {item.description || `${item.action} on ${item.entity_type}`}
                                                    </p>
                                                    <p className="text-[11px] text-white/30 font-mono mt-0.5">
                                                        <span className="text-white/40">{item.entity_type}</span>
                                                        {' · '}
                                                        <span>{item.actor ?? 'system'}</span>
                                                        {' · '}
                                                        <span className="font-sans">{item.entity_id}</span>
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span
                                                        className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                                                        style={{ background: `${color}15`, color }}
                                                    >
                                                        {item.action}
                                                    </span>
                                                    <p className="text-[11px] text-white/25 mt-1">{timeAgo(item.created_at)}</p>
                                                </div>
                                            </div>
                                        );
                                        return href ? (
                                            <Link key={item.id} href={href}>
                                                {inner}
                                            </Link>
                                        ) : (
                                            <div key={item.id}>{inner}</div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
