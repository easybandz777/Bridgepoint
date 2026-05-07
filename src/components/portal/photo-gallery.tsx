'use client';

import { useMemo, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { PhotoCard } from './photo-card';
import { PhotoLightbox, type LightboxPhoto } from './photo-lightbox';

export interface GalleryPhoto extends LightboxPhoto {
    phaseId: string | null;
}

interface PhotoGalleryProps {
    photos: GalleryPhoto[];
    canDelete: (photo: GalleryPhoto) => boolean;
    onDelete: (photoId: string) => Promise<void> | void;
    activeTag: string | null;
}

export function PhotoGallery({ photos, canDelete, onDelete, activeTag }: PhotoGalleryProps) {
    const t = useT();
    const [openId, setOpenId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        if (!activeTag) return photos;
        return photos.filter((p) => p.tag === activeTag);
    }, [photos, activeTag]);

    if (filtered.length === 0) {
        return (
            <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl py-16 px-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-4">
                    <ImageIcon size={20} className="text-white/30" />
                </div>
                <p className="text-sm text-white/50">{t('photos.empty')}</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 sm:gap-2">
                {filtered.map((p) => (
                    <PhotoCard key={p.id} photo={p} onOpen={(id) => setOpenId(id)} />
                ))}
            </div>

            {openId && (
                <PhotoLightbox
                    photos={filtered}
                    initialId={openId}
                    canDelete={canDelete}
                    onClose={() => setOpenId(null)}
                    onDelete={async (photoId) => {
                        await onDelete(photoId);
                        setOpenId((cur) => {
                            if (cur !== photoId) return cur;
                            const remaining = filtered.filter((p) => p.id !== photoId);
                            return remaining[0]?.id ?? null;
                        });
                    }}
                />
            )}
        </>
    );
}
