'use client';

import { useState } from 'react';
import { PlugZap, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

type QbEntityType = 'invoice' | 'estimate' | 'project' | 'subcontractor' | 'bill';

interface QbSyncButtonProps {
    entityType: QbEntityType;
    entityId: string;
    projectId?: string;
    label?: string;
    size?: 'sm' | 'md';
    onSynced?: (result: unknown) => void;
}

// Mirrors the server-side QB_DISABLED flag. When set to 'true', every
// QbSyncButton renders null so admins don't see a control that 410s on
// click. See QB_DISCONNECT_RUNBOOK.md.
const QB_DISABLED = process.env.NEXT_PUBLIC_QB_DISABLED === 'true';

export function QbSyncButton({ entityType, entityId, projectId, label, size = 'md', onSynced }: QbSyncButtonProps) {
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [ok, setOk] = useState<boolean | null>(null);

    if (QB_DISABLED) return null;

    async function go() {
        setBusy(true);
        setMsg(null);
        setOk(null);
        try {
            const url =
                entityType === 'invoice' ? `/api/quickbooks/invoices/${entityId}/sync`
                : entityType === 'estimate' ? `/api/quickbooks/estimates/${entityId}/sync`
                : entityType === 'project' ? `/api/projects/${entityId}/sync-to-qb`
                : entityType === 'subcontractor' ? `/api/quickbooks/vendors/${entityId}/sync`
                : entityType === 'bill' ? `/api/quickbooks/bills/${entityId}/sync`
                : null;

            if (!url) throw new Error('Unknown entity type');
            if (entityType === 'bill' && !projectId) {
                throw new Error('projectId is required for bill syncs');
            }

            const r = await fetch(url, { method: 'POST' });
            const j = (await r.json().catch(() => ({}))) as { error?: string };
            if (!r.ok) throw new Error(j.error ?? `Sync failed (HTTP ${r.status})`);

            setMsg('Synced');
            setOk(true);
            onSynced?.(j);
        } catch (e) {
            setMsg(e instanceof Error ? e.message : String(e));
            setOk(false);
        } finally {
            setBusy(false);
        }
    }

    const sizeClasses =
        size === 'sm'
            ? 'h-8 px-3 text-xs'
            : 'h-10 px-4 text-sm';
    const iconSize = size === 'sm' ? 12 : 14;

    return (
        <div className="inline-flex items-center gap-3">
            <button
                onClick={go}
                disabled={busy}
                className={`${sizeClasses} rounded-xl bg-[#b8956a] text-black font-semibold hover:bg-[#cbb08c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap`}
            >
                {busy ? (
                    <Loader2 size={iconSize} className="animate-spin" />
                ) : (
                    <PlugZap size={iconSize} />
                )}
                {busy ? 'Syncing…' : label ?? 'Sync to QuickBooks'}
            </button>
            {msg && (
                <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        ok ? 'text-[#34d399]' : 'text-red-400'
                    }`}
                >
                    {ok ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    {msg}
                </span>
            )}
        </div>
    );
}
