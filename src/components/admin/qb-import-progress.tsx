'use client';

import { Users, Truck, Package, BookOpen, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type EntityKey = 'accounts' | 'customers' | 'vendors' | 'items';

export type EntityState =
    | { status: 'pending' }
    | { status: 'running' }
    | { status: 'success'; imported: number; updated: number; failed: number }
    | { status: 'error'; message: string };

export interface EntityRow {
    key: EntityKey;
    label: string;
    description: string;
    icon: LucideIcon;
}

export const ENTITY_ROWS: EntityRow[] = [
    {
        key: 'accounts',
        label: 'Chart of accounts',
        description: 'Imported first so items can reference income/expense accounts.',
        icon: BookOpen,
    },
    {
        key: 'customers',
        label: 'Customers',
        description: 'Companies and individuals you bill.',
        icon: Users,
    },
    {
        key: 'vendors',
        label: 'Vendors',
        description: 'Suppliers you pay.',
        icon: Truck,
    },
    {
        key: 'items',
        label: 'Items & services',
        description: 'Products and services you sell.',
        icon: Package,
    },
];

interface QbImportProgressProps {
    states: Record<EntityKey, EntityState>;
    onRetry?: (key: EntityKey) => void;
    canRetry: boolean;
}

function StatePill({ state }: { state: EntityState }) {
    if (state.status === 'pending') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-white/45">
                Pending
            </span>
        );
    }
    if (state.status === 'running') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#b8956a]/15 border border-[#b8956a]/30 text-[11px] font-semibold text-[#b8956a] animate-pulse">
                <Loader2 size={11} className="animate-spin" />
                Running
            </span>
        );
    }
    if (state.status === 'success') {
        const parts = [
            `${state.imported} imported`,
            state.updated > 0 ? `${state.updated} updated` : null,
            state.failed > 0 ? `${state.failed} failed` : null,
        ].filter(Boolean);
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#34d399]/10 border border-[#34d399]/25 text-[11px] font-semibold text-[#34d399]">
                <span aria-hidden>✓</span>
                {parts.join(', ')}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-[11px] font-semibold text-red-300 max-w-full">
            <AlertCircle size={11} className="shrink-0" />
            <span className="truncate">{state.message}</span>
        </span>
    );
}

export function QbImportProgress({ states, onRetry, canRetry }: QbImportProgressProps) {
    return (
        <div className="space-y-2">
            {ENTITY_ROWS.map(({ key, label, description, icon: Icon }) => {
                const state = states[key];
                const showRetry = state.status === 'error' && canRetry && onRetry;
                return (
                    <div
                        key={key}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-black/20 border border-white/6 rounded-xl"
                    >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/6 flex items-center justify-center shrink-0">
                                <Icon size={15} className="text-white/55" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-white">{label}</p>
                                <p className="text-[11px] text-white/45 mt-0.5">{description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 sm:max-w-[55%]">
                            <StatePill state={state} />
                            {showRetry && (
                                <button
                                    onClick={() => onRetry(key)}
                                    className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-white/70 text-[11px] font-semibold hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5 shrink-0"
                                >
                                    <RefreshCw size={11} />
                                    Retry
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
