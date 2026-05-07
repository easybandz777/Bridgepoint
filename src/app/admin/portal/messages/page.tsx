'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Megaphone, Plus, RefreshCw } from 'lucide-react';
import { AnnouncementCard, type Announcement } from '@/components/admin/announcement-card';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

export default function AdminAnnouncementsPage() {
    const [items, setItems] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const r = await fetch('/api/admin/portal/messages', { cache: 'no-store' });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const j = (await r.json()) as Announcement[];
            setItems(Array.isArray(j) ? j : []);
        } catch (e) {
            setError(String(e));
        }
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    async function deleteMessage(id: string) {
        try {
            const r = await fetch(`/api/admin/portal/messages/${id}`, { method: 'DELETE' });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            setItems((prev) => prev.filter((m) => m.id !== id));
        } catch (e) {
            setError(String(e));
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Crew Portal</p>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">Announcements</h1>
                    <p className="text-sm text-white/50">
                        Broadcast messages to crew and subs. Read counts come from the portal.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => load()}
                        disabled={loading}
                        title="Refresh"
                        className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <Link
                        href="/admin/portal/messages/new"
                        className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors whitespace-nowrap"
                    >
                        <Plus size={14} />
                        Send announcement
                    </Link>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-sm text-red-300">
                    Failed to load announcements: {error}
                </div>
            )}

            {loading ? (
                <div className="grid gap-4">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-32 rounded-2xl bg-[#1a1a1a] border border-white/6 animate-pulse" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="py-16 text-center border border-white/5 border-dashed rounded-2xl bg-white/[0.02]">
                    <Megaphone size={40} className="mx-auto text-white/15 mb-4" />
                    <h3 className="font-serif text-lg font-bold text-white mb-2">No announcements yet</h3>
                    <p className="text-white/40 mb-6 max-w-sm mx-auto text-sm">
                        Send your first message to keep the crew informed about schedule changes, safety updates, or kudos.
                    </p>
                    <Link
                        href="/admin/portal/messages/new"
                        className="inline-flex items-center gap-2 h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full hover:bg-[#cbb08c] transition-colors"
                    >
                        <Plus size={14} />
                        Compose announcement
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {items.map((m) => (
                        <AnnouncementCard
                            key={m.id}
                            msg={m}
                            onDelete={(id) => setConfirmId(id)}
                        />
                    ))}
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmId !== null}
                onClose={() => setConfirmId(null)}
                onConfirm={() => {
                    if (confirmId) deleteMessage(confirmId);
                }}
                title="Delete announcement?"
                message="This removes the announcement from the crew portal. Read history is also wiped. This cannot be undone."
                confirmText="Delete"
                destructive
            />
        </div>
    );
}
