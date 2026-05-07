'use client';

import { useState } from 'react';
import { CheckCheck, Loader2 } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { portalFetch } from '@/lib/portal-client';
import { MessageCard } from './message-card';
import type { PortalMessage } from '@/app/api/portal/messages/route';

interface MessagesFeedProps {
    messages: PortalMessage[];
    onChange: () => void;
}

export function MessagesFeed({ messages, onChange }: MessagesFeedProps) {
    const t = useT();
    const [busy, setBusy] = useState(false);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const unreadCount = messages.filter(m => !m.isRead).length;

    async function markAll() {
        setBusy(true);
        setError(null);
        try {
            await portalFetch('/api/portal/messages', {
                method: 'POST',
                body: JSON.stringify({ action: 'mark-all-read' }),
            });
            onChange();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('messages.errorMarking'));
        } finally {
            setBusy(false);
        }
    }

    async function markOne(id: string) {
        setMarkingId(id);
        setError(null);
        try {
            await portalFetch(`/api/portal/messages/${id}/read`, { method: 'POST' });
            onChange();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('messages.errorMarking'));
        } finally {
            setMarkingId(null);
        }
    }

    if (messages.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center text-sm text-white/40">
                {t('messages.empty')}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-white/45">
                    {unreadCount > 0
                        ? t('messages.unreadBadge', { count: unreadCount })
                        : ''}
                </p>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={markAll}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-[0.14em] text-[#b8956a] hover:text-[#cbb08c] hover:bg-[#b8956a]/8 border border-[#b8956a]/25 transition-all disabled:opacity-40"
                    >
                        {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}
                        {t('messages.markAllRead')}
                    </button>
                )}
            </div>

            {error && (
                <p className="text-xs text-red-400 px-1">{error}</p>
            )}

            {messages.map(m => (
                <MessageCard
                    key={m.id}
                    message={m}
                    onMarkRead={markOne}
                    marking={markingId === m.id}
                />
            ))}
        </div>
    );
}
