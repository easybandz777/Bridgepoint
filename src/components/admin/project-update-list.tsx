'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Loader2,
    MessageSquare,
    Trash2,
    AlertCircle,
    CheckCircle,
    Activity as ActivityIcon,
    RefreshCcw,
    StickyNote,
} from 'lucide-react';
import { EmptyState } from './empty-state';

interface UpdateAttachment {
    type: string;
    id: string;
    filename?: string;
    mimeType?: string;
    thumbnailUrl?: string;
    imageUrl?: string;
}

export interface ProjectUpdate {
    id: string;
    projectId: string;
    phaseId: string | null;
    phaseName: string | null;
    authorType: string;
    authorId: string;
    authorName: string;
    kind: string;
    body: string;
    statusChange: string | null;
    completionPct: number | null;
    attachments: UpdateAttachment[];
    createdAt: string;
}

interface Props {
    projectId: string;
    kind?: string | null;
    onCount?: (count: number) => void;
}

const KIND_META: Record<
    string,
    { label: string; cls: string; icon: typeof MessageSquare }
> = {
    note: { label: 'Note', cls: 'bg-white/10 text-white/70', icon: StickyNote },
    progress: { label: 'Progress', cls: 'bg-blue-500/15 text-blue-300', icon: ActivityIcon },
    issue: { label: 'Issue', cls: 'bg-red-500/15 text-red-300', icon: AlertCircle },
    completion: { label: 'Completion', cls: 'bg-emerald-500/15 text-emerald-300', icon: CheckCircle },
    status_change: { label: 'Status', cls: 'bg-[#b8956a]/15 text-[#b8956a]', icon: RefreshCcw },
};

function initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function timeAgo(s: string): string {
    try {
        const d = new Date(s).getTime();
        const diff = Date.now() - d;
        if (diff < 60_000) return 'just now';
        if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
        if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
        if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
        return new Date(s).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return s;
    }
}

export function ProjectUpdateList({ projectId, kind, onCount }: Props) {
    const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (kind) params.set('kind', kind);
            const qs = params.toString();
            const url = `/api/admin/projects/${projectId}/updates${qs ? `?${qs}` : ''}`;
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) {
                const t = await res.text();
                throw new Error(`API ${res.status}: ${t}`);
            }
            const data = (await res.json()) as ProjectUpdate[];
            setUpdates(data);
            onCount?.(data.length);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [projectId, kind, onCount]);

    useEffect(() => {
        load();
    }, [load]);

    async function handleDelete(u: ProjectUpdate) {
        if (!confirm(`Delete this ${KIND_META[u.kind]?.label ?? 'update'} from ${u.authorName}?`)) return;
        try {
            const res = await fetch(`/api/admin/updates/${u.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const t = await res.text();
                throw new Error(`API ${res.status}: ${t}`);
            }
            await load();
        } catch (e) {
            alert(`Delete failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 text-white/40 gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading updates…
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl text-red-300 text-sm">
                Failed to load updates: {error}
            </div>
        );
    }

    if (updates.length === 0) {
        return (
            <EmptyState
                title="No Updates Yet"
                description="When the crew posts notes, progress, or issues from the portal, they'll appear here."
                icon={<MessageSquare size={48} className="text-white/10" />}
            />
        );
    }

    return (
        <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-[19px] before:w-[2px] before:bg-white/5">
            {updates.map((u) => {
                const meta = KIND_META[u.kind] ?? KIND_META.note;
                const Icon = meta.icon;
                return (
                    <div key={u.id} className="relative flex gap-5">
                        <div className="absolute -left-[27px] z-10 mt-1 w-10 h-10 rounded-full bg-[#1a1a1a] border-2 border-white/10 flex items-center justify-center text-[11px] font-semibold text-white/80 shrink-0">
                            {initials(u.authorName)}
                        </div>

                        <div className="flex-1 min-w-0 pl-6">
                            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-semibold text-white truncate">
                                                {u.authorName || 'Unknown'}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-wide text-white/40 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                                                {u.authorType}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${meta.cls}`}>
                                                <Icon size={10} /> {meta.label}
                                            </span>
                                        </div>
                                        {u.phaseName && (
                                            <p className="text-xs text-white/40 mt-1">
                                                in <span className="text-white/60">{u.phaseName}</span>
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[10px] uppercase tracking-wide text-white/40 whitespace-nowrap">
                                            {timeAgo(u.createdAt)}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(u)}
                                            className="w-7 h-7 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-300 flex items-center justify-center transition-colors"
                                            aria-label="Delete"
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">
                                    {u.body}
                                </p>

                                {(u.statusChange || (u.completionPct !== null && u.completionPct !== undefined)) && (
                                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                                        {u.statusChange && (
                                            <span className="text-xs text-white/60 px-2 py-1 rounded-full bg-white/5 border border-white/5">
                                                Status → <span className="text-white/90">{u.statusChange}</span>
                                            </span>
                                        )}
                                        {u.completionPct !== null && u.completionPct !== undefined && (
                                            <span className="text-xs text-white/60 px-2 py-1 rounded-full bg-white/5 border border-white/5">
                                                Completion: <span className="text-[#b8956a] font-semibold">{u.completionPct}%</span>
                                            </span>
                                        )}
                                    </div>
                                )}

                                {u.attachments && u.attachments.length > 0 && (
                                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                        {u.attachments.map((att) => {
                                            if (att.type !== 'photo') return null;
                                            const thumb = att.thumbnailUrl ?? `/api/admin/photos/${att.id}/thumbnail`;
                                            const full = att.imageUrl ?? `/api/admin/photos/${att.id}/image`;
                                            return (
                                                <a
                                                    key={att.id}
                                                    href={full}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block aspect-square overflow-hidden rounded-lg bg-black/40 border border-white/5 hover:border-[#b8956a]/40 transition-colors"
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={thumb}
                                                        alt={att.filename ?? 'attachment'}
                                                        loading="lazy"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
