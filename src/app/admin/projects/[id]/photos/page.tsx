'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { ProjectPhotoGrid } from '@/components/admin/project-photo-grid';
import { Loader2 } from 'lucide-react';
import { getProject, DbProjectFull } from '@/lib/project-api';

const TAGS: { value: string | null; label: string }[] = [
    { value: null, label: 'All' },
    { value: 'before', label: 'Before' },
    { value: 'during', label: 'During' },
    { value: 'after', label: 'After' },
    { value: 'issue', label: 'Issue' },
    { value: 'other', label: 'Other' },
];

interface UploaderOption {
    id: string;
    name: string;
    type: string;
}

interface PhotoMetaRow {
    uploadedById: string;
    uploadedByName: string;
    uploadedByType: string;
}

export default function ProjectPhotosPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<DbProjectFull | null>(null);
    const [projectLoading, setProjectLoading] = useState(true);
    const [projectError, setProjectError] = useState<string | null>(null);

    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [activeUploader, setActiveUploader] = useState<string>('');
    const [uploaders, setUploaders] = useState<UploaderOption[]>([]);
    const [photoCount, setPhotoCount] = useState<number>(0);

    useEffect(() => {
        (async () => {
            try {
                const p = await getProject(id);
                setProject(p);
            } catch (e) {
                setProjectError(e instanceof Error ? e.message : String(e));
            } finally {
                setProjectLoading(false);
            }
        })();
    }, [id]);

    const loadUploaders = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/projects/${id}/photos`, { cache: 'no-store' });
            if (!res.ok) return;
            const photos = (await res.json()) as PhotoMetaRow[];
            const map = new Map<string, UploaderOption>();
            for (const p of photos) {
                if (!map.has(p.uploadedById)) {
                    map.set(p.uploadedById, {
                        id: p.uploadedById,
                        name: p.uploadedByName || 'Unknown',
                        type: p.uploadedByType,
                    });
                }
            }
            setUploaders(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
            setPhotoCount(photos.length);
        } catch {
            // ignore — grid will show errors
        }
    }, [id]);

    useEffect(() => {
        loadUploaders();
    }, [loadUploaders]);

    if (projectLoading) {
        return (
            <div className="flex items-center justify-center py-24 text-white/40 gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
        );
    }
    if (projectError) {
        return (
            <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl text-red-300 text-sm">
                Failed to load: {projectError}
            </div>
        );
    }
    if (!project) {
        return (
            <div className="py-24 text-center text-white/50">
                Project not found.
                <div className="mt-4">
                    <Link href="/admin/projects" className="text-[#b8956a] hover:text-[#cbb08c]">
                        Back to projects
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                <p className="text-sm text-white/50">
                    Photos {photoCount > 0 ? <span className="text-white/70">· {photoCount}</span> : null}
                </p>
            </div>

            <ProjectTabNav projectId={project.id} />

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        {TAGS.map((t) => {
                            const isActive = activeTag === t.value;
                            return (
                                <button
                                    key={t.label}
                                    onClick={() => setActiveTag(t.value)}
                                    className={`h-8 px-3 rounded-full text-xs font-semibold transition-colors ${
                                        isActive
                                            ? 'bg-[#b8956a] text-black'
                                            : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">
                            Uploader
                        </label>
                        <select
                            value={activeUploader}
                            onChange={(e) => setActiveUploader(e.target.value)}
                            className="h-8 px-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#b8956a]/50"
                        >
                            <option value="">Everyone</option>
                            {uploaders.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name} ({u.type})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <ProjectPhotoGrid
                projectId={id}
                tag={activeTag}
                uploadedBy={activeUploader || null}
            />
        </div>
    );
}
