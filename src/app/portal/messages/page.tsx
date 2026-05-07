'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { portalFetch } from '@/lib/portal-client';
import { MessagesFeed } from '@/components/portal/messages-feed';
import type { PortalMessage } from '@/app/api/portal/messages/route';

interface MessagesPayload {
    messages: PortalMessage[];
    unreadCount: number;
}

export default function PortalMessagesPage() {
    const t = useT();
    const [data, setData] = useState<MessagesPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setError(null);
        try {
            const d = await portalFetch<MessagesPayload>('/api/portal/messages');
            setData(d);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl mx-auto space-y-5">
            <header>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                    {t('messages.title')}
                </h1>
            </header>

            {loading && !data && (
                <div className="flex items-center justify-center min-h-[40vh] text-white/45 gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">{t('common.loading')}</span>
                </div>
            )}

            {!loading && error && !data && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
                    {t('messages.errorLoading')}
                    <p className="mt-2 text-xs text-red-300/70">{error}</p>
                </div>
            )}

            {data && (
                <MessagesFeed messages={data.messages} onChange={load} />
            )}
        </div>
    );
}
