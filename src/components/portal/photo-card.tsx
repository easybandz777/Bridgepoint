'use client';

import { useT } from '@/lib/portal-i18n';
import { cn } from '@/lib/utils';

export interface PhotoCardData {
    id: string;
    tag: string | null;
    caption: string;
    uploadedByName: string;
    createdAt: string;
}

interface PhotoCardProps {
    photo: PhotoCardData;
    onOpen: (photoId: string) => void;
    className?: string;
}

const TAG_LABEL_KEYS: Record<string, string> = {
    before: 'photos.tagBefore',
    during: 'photos.tagDuring',
    after: 'photos.tagAfter',
    issue: 'photos.tagIssue',
    other: 'photos.tagOther',
};

const TAG_COLORS: Record<string, string> = {
    before: 'bg-blue-500/80 text-white',
    during: 'bg-amber-500/85 text-black',
    after: 'bg-emerald-500/85 text-black',
    issue: 'bg-red-500/85 text-white',
    other: 'bg-white/80 text-black',
};

export function PhotoCard({ photo, onOpen, className }: PhotoCardProps) {
    const t = useT();
    const tagLabelKey = photo.tag ? TAG_LABEL_KEYS[photo.tag] : null;
    const tagColor = photo.tag ? (TAG_COLORS[photo.tag] ?? TAG_COLORS.other) : null;

    return (
        <button
            type="button"
            onClick={() => onOpen(photo.id)}
            className={cn(
                'group relative aspect-square overflow-hidden rounded-xl bg-[#1a1a1a] border border-white/5 focus:outline-none focus:ring-2 focus:ring-[#b8956a]/60 transition-transform active:scale-[0.98]',
                className,
            )}
        >
            <img
                src={`/api/portal/photos/${photo.id}/thumbnail`}
                alt={photo.caption || photo.uploadedByName}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200"
                onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = '0.2';
                }}
            />
            {tagLabelKey && tagColor && (
                <span
                    className={cn(
                        'absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider',
                        tagColor,
                    )}
                >
                    {t(tagLabelKey)}
                </span>
            )}
            <span className="pointer-events-none absolute inset-0 ring-0 group-hover:ring-2 group-hover:ring-[#b8956a]/40 transition-all rounded-xl" />
        </button>
    );
}
