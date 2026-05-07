'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { EmptyState } from './empty-state';
import { AdminPhotoLightbox, AdminPhotoMeta } from './admin-photo-lightbox';

interface Props {
    projectId: string;
    tag?: string | null;
    uploadedBy?: string | null;
    phaseId?: string | null;
}

export function ProjectPhotoGrid({ projectId, tag, uploadedBy, phaseId }: Props) {
    const [photos, setPhotos] = useState<AdminPhotoMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeIdx, setActiveIdx] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (tag) params.set('tag', tag);
            if (uploadedBy) params.set('uploadedBy', uploadedBy);
            if (phaseId) params.set('phaseId', phaseId);
            const qs = params.toString();
            const url = `/api/admin/projects/${projectId}/photos${qs ? `?${qs}` : ''}`;
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) {
                const t = await res.text();
                throw new Error(`API ${res.status}: ${t}`);
            }
            const data = (await res.json()) as AdminPhotoMeta[];
            setPhotos(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [projectId, tag, uploadedBy, phaseId]);

    useEffect(() => {
        load();
    }, [load]);

    async function handleDelete(photo: AdminPhotoMeta) {
        if (!confirm(`Delete photo "${photo.filename}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`/api/admin/photos/${photo.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const t = await res.text();
                throw new Error(`API ${res.status}: ${t}`);
            }
            setActiveIdx(null);
            await load();
        } catch (e) {
            alert(`Delete failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 text-white/40 gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading photos…
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl text-red-300 text-sm">
                Failed to load photos: {error}
            </div>
        );
    }

    if (photos.length === 0) {
        return (
            <EmptyState
                title="No Photos Yet"
                description="When the crew uploads photos from the portal, they'll appear here."
                icon={<ImageIcon size={48} className="text-white/10" />}
            />
        );
    }

    const active = activeIdx !== null ? photos[activeIdx] : null;
    const goPrev = activeIdx !== null && activeIdx > 0 ? () => setActiveIdx(activeIdx - 1) : undefined;
    const goNext = activeIdx !== null && activeIdx < photos.length - 1 ? () => setActiveIdx(activeIdx + 1) : undefined;

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                {photos.map((p, i) => {
                    const thumbUrl = `/api/admin/photos/${p.id}/thumbnail`;
                    return (
                        <button
                            key={p.id}
                            onClick={() => setActiveIdx(i)}
                            className="group relative block aspect-square overflow-hidden rounded-xl bg-black/40 border border-white/5 hover:border-[#b8956a]/40 transition-colors"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={thumbUrl}
                                alt={p.caption || p.filename}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                            />
                            {p.tag && (
                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[10px] uppercase tracking-wide text-white/80 capitalize">
                                    {p.tag}
                                </span>
                            )}
                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-[11px] text-white/90 truncate text-left">
                                    {p.uploadedByName}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            <AdminPhotoLightbox
                photo={active}
                onClose={() => setActiveIdx(null)}
                onDelete={handleDelete}
                onPrev={goPrev}
                onNext={goNext}
            />
        </>
    );
}
