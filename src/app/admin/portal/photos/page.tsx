'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, Image as ImageIcon, Filter as FilterIcon, X } from 'lucide-react';
import { EmptyState } from '@/components/admin/empty-state';
import { AdminPhotoLightbox, AdminPhotoMeta } from '@/components/admin/admin-photo-lightbox';
import { listProjects, DbProject } from '@/lib/project-api';

interface CrossPhotoApi extends AdminPhotoMeta {
    projectName: string | null;
    projectNumber: string | null;
}

interface ListResponse {
    photos: CrossPhotoApi[];
    total: number;
    limit: number;
    offset: number;
}

const TAGS: { value: string; label: string }[] = [
    { value: '', label: 'All tags' },
    { value: 'before', label: 'Before' },
    { value: 'during', label: 'During' },
    { value: 'after', label: 'After' },
    { value: 'issue', label: 'Issue' },
    { value: 'other', label: 'Other' },
];

const UPLOADER_TYPES: { value: string; label: string }[] = [
    { value: '', label: 'All uploaders' },
    { value: 'employee', label: 'Employees' },
    { value: 'subcontractor', label: 'Subcontractors' },
];

const PAGE_SIZE = 60;

export default function AdminCrewPhotosPage() {
    const [photos, setPhotos] = useState<CrossPhotoApi[]>([]);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [projects, setProjects] = useState<DbProject[]>([]);
    const [tag, setTag] = useState<string>('');
    const [projectId, setProjectId] = useState<string>('');
    const [uploaderType, setUploaderType] = useState<string>('');
    const [from, setFrom] = useState<string>('');
    const [to, setTo] = useState<string>('');

    const [activeIdx, setActiveIdx] = useState<number | null>(null);

    const loadProjects = useCallback(async () => {
        try {
            const list = await listProjects();
            setProjects(list);
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (tag) params.set('tag', tag);
            if (projectId) params.set('projectId', projectId);
            if (uploaderType) params.set('uploadedByType', uploaderType);
            if (from) params.set('from', new Date(from).toISOString());
            if (to) {
                const toEnd = new Date(to);
                toEnd.setHours(23, 59, 59, 999);
                params.set('to', toEnd.toISOString());
            }
            params.set('limit', String(PAGE_SIZE));
            params.set('offset', String(offset));

            const res = await fetch(`/api/admin/portal/photos?${params.toString()}`, { cache: 'no-store' });
            if (!res.ok) {
                const t = await res.text();
                throw new Error(`API ${res.status}: ${t}`);
            }
            const data = (await res.json()) as ListResponse;
            setPhotos(data.photos);
            setTotal(data.total);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [tag, projectId, uploaderType, from, to, offset]);

    useEffect(() => {
        load();
    }, [load]);

    // Reset to first page when filters change
    useEffect(() => {
        setOffset(0);
    }, [tag, projectId, uploaderType, from, to]);

    function clearFilters() {
        setTag('');
        setProjectId('');
        setUploaderType('');
        setFrom('');
        setTo('');
    }

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

    const active = activeIdx !== null ? photos[activeIdx] : null;
    const goPrev = activeIdx !== null && activeIdx > 0 ? () => setActiveIdx(activeIdx - 1) : undefined;
    const goNext = activeIdx !== null && activeIdx < photos.length - 1 ? () => setActiveIdx(activeIdx + 1) : undefined;

    const hasFilters = !!(tag || projectId || uploaderType || from || to);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="font-serif text-3xl font-bold text-white mb-1">Crew Photos</h1>
                <p className="text-sm text-white/50">
                    {loading ? 'Loading…' : `${total.toLocaleString()} photo${total === 1 ? '' : 's'} across all projects`}
                </p>
            </div>

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 sm:p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <FilterIcon size={14} className="text-[#b8956a]" />
                    <h2 className="text-sm font-semibold text-white">Filters</h2>
                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="ml-auto text-xs text-white/50 hover:text-white flex items-center gap-1"
                        >
                            <X size={12} /> Clear
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-1 block">
                            Project
                        </label>
                        <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="w-full h-9 px-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        >
                            <option value="">All projects</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-1 block">Tag</label>
                        <select
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            className="w-full h-9 px-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        >
                            {TAGS.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-1 block">
                            Uploader
                        </label>
                        <select
                            value={uploaderType}
                            onChange={(e) => setUploaderType(e.target.value)}
                            className="w-full h-9 px-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        >
                            {UPLOADER_TYPES.map((u) => (
                                <option key={u.value} value={u.value}>
                                    {u.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-1 block">From</label>
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="w-full h-9 px-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50 [color-scheme:dark]"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-white/40 mb-1 block">To</label>
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="w-full h-9 px-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50 [color-scheme:dark]"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24 text-white/40 gap-2">
                    <Loader2 size={16} className="animate-spin" /> Loading photos…
                </div>
            ) : error ? (
                <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl text-red-300 text-sm">
                    Failed to load photos: {error}
                </div>
            ) : photos.length === 0 ? (
                <EmptyState
                    title="No Photos Found"
                    description={
                        hasFilters
                            ? 'No photos match your filters. Try clearing them.'
                            : 'When the crew uploads photos from the portal, they will appear here.'
                    }
                    icon={<ImageIcon size={48} className="text-white/10" />}
                />
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                        {photos.map((p, i) => {
                            const thumbUrl = `/api/admin/photos/${p.id}/thumbnail`;
                            return (
                                <div key={p.id} className="flex flex-col">
                                    <button
                                        onClick={() => setActiveIdx(i)}
                                        className="group relative block aspect-square overflow-hidden rounded-xl bg-black/40 border border-white/5 hover:border-[#b8956a]/40 transition-colors"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={thumbUrl}
                                            alt={p.caption || p.filename}
                                            loading="lazy"
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        {p.tag && (
                                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[10px] uppercase tracking-wide text-white/80 capitalize">
                                                {p.tag}
                                            </span>
                                        )}
                                    </button>
                                    <div className="mt-2 px-1 min-w-0">
                                        {p.projectId ? (
                                            <Link
                                                href={`/admin/projects/${p.projectId}/photos`}
                                                className="text-xs text-[#b8956a] hover:text-[#cbb08c] truncate block"
                                            >
                                                {p.projectName || 'Unknown project'}
                                            </Link>
                                        ) : (
                                            <span className="text-xs text-white/40 truncate block">
                                                {p.projectName || '—'}
                                            </span>
                                        )}
                                        <p className="text-[11px] text-white/40 truncate">{p.uploadedByName}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-8">
                            <button
                                disabled={offset === 0}
                                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                                className="h-9 px-4 bg-white/5 border border-white/10 text-white/70 rounded-full text-xs font-semibold hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                ← Previous
                            </button>
                            <span className="text-xs text-white/50">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                disabled={offset + PAGE_SIZE >= total}
                                onClick={() => setOffset(offset + PAGE_SIZE)}
                                className="h-9 px-4 bg-white/5 border border-white/10 text-white/70 rounded-full text-xs font-semibold hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}

            <AdminPhotoLightbox
                photo={active}
                onClose={() => setActiveIdx(null)}
                onDelete={handleDelete}
                onPrev={goPrev}
                onNext={goNext}
            />
        </div>
    );
}
