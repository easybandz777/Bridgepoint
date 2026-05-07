'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { portalFetch } from '@/lib/portal-client';
import { usePortalUser } from '@/lib/portal-context';
import { PhotoUploader, type UploadedPhotoMeta } from '@/components/portal/photo-uploader';
import { PhotoGallery, type GalleryPhoto } from '@/components/portal/photo-gallery';
import { cn } from '@/lib/utils';

interface PhotoApiRow {
    id: string;
    projectId: string;
    phaseId: string | null;
    uploadedByType: string;
    uploadedById: string;
    uploadedByName: string;
    filename: string;
    mimeType: string;
    width: number | null;
    height: number | null;
    sizeBytes: number;
    caption: string;
    tag: string | null;
    takenAt: string | null;
    createdAt: string;
}

const TAG_FILTERS: { key: string | null; labelKey: string }[] = [
    { key: null, labelKey: 'photos.filterAll' },
    { key: 'before', labelKey: 'photos.tagBefore' },
    { key: 'during', labelKey: 'photos.tagDuring' },
    { key: 'after', labelKey: 'photos.tagAfter' },
    { key: 'issue', labelKey: 'photos.tagIssue' },
    { key: 'other', labelKey: 'photos.tagOther' },
];

const LEAD_ROLES = new Set([
    'Lead Painter / Crew Foreman',
    'Project Manager',
    'Estimator / Project Coordinator',
    'Office Manager / Bookkeeper',
]);

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default function PortalJobPhotosPage({ params }: PageProps) {
    const { projectId } = use(params);
    const t = useT();
    const { user } = usePortalUser();

    const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTag, setActiveTag] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setError(null);
            const list = await portalFetch<PhotoApiRow[]>(
                `/api/portal/jobs/${projectId}/photos`,
            );
            setPhotos(
                list.map((p) => ({
                    id: p.id,
                    phaseId: p.phaseId,
                    caption: p.caption,
                    tag: p.tag,
                    uploadedByName: p.uploadedByName,
                    uploadedByType: p.uploadedByType,
                    uploadedById: p.uploadedById,
                    createdAt: p.createdAt,
                })),
            );
        } catch (e) {
            setError(e instanceof Error ? e.message : t('photos.loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [projectId, t]);

    useEffect(() => {
        load();
    }, [load]);

    const isLead = useMemo(() => {
        if (user.userType !== 'employee') return false;
        return LEAD_ROLES.has(user.role);
    }, [user.role, user.userType]);

    const canDelete = useCallback(
        (photo: GalleryPhoto) => {
            if (
                photo.uploadedByType === user.userType &&
                photo.uploadedById === user.userId
            ) {
                return true;
            }
            return isLead;
        },
        [user.userType, user.userId, isLead],
    );

    const handleUploaded = useCallback((meta: UploadedPhotoMeta) => {
        setPhotos((prev) => [
            {
                id: meta.id,
                phaseId: meta.phaseId,
                caption: meta.caption,
                tag: meta.tag,
                uploadedByName: meta.uploadedByName,
                uploadedByType: meta.uploadedByType,
                uploadedById: meta.uploadedById,
                createdAt: meta.createdAt,
            },
            ...prev,
        ]);
    }, []);

    const handleDelete = useCallback(
        async (photoId: string) => {
            try {
                const res = await fetch(`/api/portal/photos/${photoId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
                if (!res.ok) {
                    const j = await res
                        .json()
                        .then((b: { error?: string }) => b.error)
                        .catch(() => null);
                    throw new Error(j ?? `Delete failed (${res.status})`);
                }
                setPhotos((prev) => prev.filter((p) => p.id !== photoId));
            } catch (e) {
                setError(e instanceof Error ? e.message : t('photos.deleteFailed'));
            }
        },
        [t],
    );

    const count = photos.length;
    const countLabel =
        count === 1 ? t('photos.countOne') : t('photos.count', { count });

    return (
        <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto space-y-6">
            <header className="space-y-1">
                <h1 className="font-serif text-2xl sm:text-3xl text-white tracking-tight">
                    {t('photos.title')}
                </h1>
                <p className="text-xs uppercase tracking-[0.18em] text-[#b8956a]">{countLabel}</p>
            </header>

            <PhotoUploader projectId={projectId} onUploaded={handleUploaded} />

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                {TAG_FILTERS.map((f) => {
                    const active = f.key === activeTag;
                    return (
                        <button
                            key={f.key ?? 'all'}
                            type="button"
                            onClick={() => setActiveTag(f.key)}
                            className={cn(
                                'min-h-[44px] px-3 py-2 rounded-xl text-xs uppercase tracking-[0.16em] font-medium whitespace-nowrap transition-colors',
                                active
                                    ? 'bg-white/12 text-white'
                                    : 'bg-white/[0.03] text-white/55 hover:bg-white/8 hover:text-white/80',
                            )}
                        >
                            {t(f.labelKey)}
                        </button>
                    );
                })}
            </div>

            {error && (
                <p className="text-xs text-red-400 flex items-center gap-2">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                    {error}
                </p>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 size={20} className="animate-spin text-[#b8956a]" />
                </div>
            ) : (
                <PhotoGallery
                    photos={photos}
                    canDelete={canDelete}
                    onDelete={handleDelete}
                    activeTag={activeTag}
                />
            )}
        </div>
    );
}
