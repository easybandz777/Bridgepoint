'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SubTabNav } from '@/components/admin/sub-tab-nav';
import { Send, Trash2, AlertCircle, MessageSquare } from 'lucide-react';
import { useSub } from '../use-sub';
import type { SubcontractorNote } from '@/lib/subcontractors';

function formatDateTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (sameDay) return `Today at ${time}`;
    if (isYesterday) return `Yesterday at ${time}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${time}`;
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? 'A').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

export default function SubcontractorNotesPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const subState = useSub(id);

    const [notes, setNotes] = useState<SubcontractorNote[]>([]);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const loadNotes = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/subcontractors/${id}/notes`, { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setNotes((await res.json()) as SubcontractorNote[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load notes');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { void loadNotes(); }, [loadNotes]);

    async function submitNote(e: React.FormEvent) {
        e.preventDefault();
        if (!id || !draft.trim() || saving) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/subcontractors/${id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: draft.trim(), author: 'admin' }),
            });
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(body.error ?? 'Failed to add note');
            }
            setDraft('');
            await loadNotes();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to add note');
        } finally {
            setSaving(false);
        }
    }

    async function deleteNote(noteId: string) {
        if (!id || !confirm('Delete this note?')) return;
        try {
            const res = await fetch(`/api/subcontractors/${id}/notes/${noteId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            setNotes((p) => p.filter((n) => n.id !== noteId));
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to delete note');
        }
    }

    if (subState.phase === 'loading') {
        return <div className="flex justify-center py-32"><div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" /></div>;
    }
    if (subState.phase === 'notfound') {
        return <p className="text-center text-white/40 py-32">Subcontractor not found.</p>;
    }
    if (subState.phase === 'error') {
        return (
            <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-300 flex items-start gap-3 max-w-xl mx-auto mt-12">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>{subState.error}</div>
            </div>
        );
    }
    const sub = subState.sub;

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{sub.companyName}</h1>
                <p className="text-sm text-white/50">Internal Notes Timeline</p>
            </div>

            <SubTabNav subId={sub.id} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col h-[600px] bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {loading ? (
                            <div className="flex justify-center py-12"><div className="w-5 h-5 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" /></div>
                        ) : error ? (
                            <div className="text-center text-red-300/80 py-12 flex flex-col items-center gap-3">
                                <AlertCircle size={24} />
                                <p className="text-sm">{error}</p>
                                <button onClick={() => void loadNotes()} className="text-xs text-[#b8956a] font-semibold">Retry</button>
                            </div>
                        ) : notes.length === 0 ? (
                            <div className="text-center text-white/30 py-16">
                                <MessageSquare size={32} className="mx-auto text-white/10 mb-3" />
                                <p className="text-sm">No notes yet. Start the timeline below.</p>
                            </div>
                        ) : (
                            notes.map((n) => (
                                <div key={n.id} className="flex gap-4 group">
                                    <div className="w-8 h-8 rounded-full bg-[#b8956a] flex items-center justify-center text-black font-bold text-xs shrink-0 mt-1">
                                        {initials(n.author)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold text-white">{n.author}</span>
                                            <span className="text-xs text-white/40">{formatDateTime(n.createdAt)}</span>
                                            {n.tag && (
                                                <span className="text-[10px] uppercase tracking-widest font-bold text-[#b8956a] bg-[#b8956a]/10 px-2 py-0.5 rounded">{n.tag}</span>
                                            )}
                                        </div>
                                        <div className="p-4 bg-white/5 border border-white/5 rounded-xl rounded-tl-none text-sm text-white/70 whitespace-pre-wrap">
                                            {n.note}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => void deleteNote(n.id)}
                                        title="Delete note"
                                        className="opacity-0 group-hover:opacity-100 self-start mt-1 w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={submitNote} className="p-4 bg-[#141414] border-t border-white/5">
                        <div className="relative">
                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder="Add an internal note about this subcontractor..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pr-12 text-sm text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors min-h-[80px] resize-none"
                                disabled={saving}
                            />
                            <button
                                type="submit"
                                disabled={!draft.trim() || saving}
                                className="absolute right-3 bottom-3 w-8 h-8 rounded-lg bg-[#b8956a] text-black flex items-center justify-center hover:bg-[#cbb08c] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Save note"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                        <p className="text-[10px] text-white/30 mt-2 ml-1">Notes are only visible to internal staff.</p>
                    </form>
                </div>

                <aside className="space-y-6">
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Quick Stats</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/40">Notes Logged</span>
                                <span className="font-mono text-white">{notes.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Reliability</span>
                                <span className={`font-mono ${sub.metrics.reliabilityScore >= 90 ? 'text-[#34d399]' : 'text-[#fbbf24]'}`}>{sub.metrics.reliabilityScore}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/40">Active Jobs</span>
                                <span className="font-mono text-white">{sub.metrics.activeJobs}</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
