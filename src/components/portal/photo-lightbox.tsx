'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { fmtDateTime } from '@/lib/portal-client';
import { cn } from '@/lib/utils';

export interface LightboxPhoto {
    id: string;
    caption: string;
    tag: string | null;
    uploadedByName: string;
    uploadedByType: string;
    uploadedById: string;
    createdAt: string;
}

interface PhotoLightboxProps<T extends LightboxPhoto = LightboxPhoto> {
    photos: T[];
    initialId: string;
    canDelete: (photo: T) => boolean;
    onClose: () => void;
    onDelete: (photoId: string) => Promise<void> | void;
}

const TAG_LABEL_KEYS: Record<string, string> = {
    before: 'photos.tagBefore',
    during: 'photos.tagDuring',
    after: 'photos.tagAfter',
    issue: 'photos.tagIssue',
    other: 'photos.tagOther',
};

const SWIPE_THRESHOLD = 50;

export function PhotoLightbox<T extends LightboxPhoto>({
    photos,
    initialId,
    canDelete,
    onClose,
    onDelete,
}: PhotoLightboxProps<T>) {
    const t = useT();
    const startIdx = Math.max(
        0,
        photos.findIndex((p) => p.id === initialId),
    );
    const [idx, setIdx] = useState(startIdx >= 0 ? startIdx : 0);
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const touchStartX = useRef<number | null>(null);

    const current = photos[idx];

    const goPrev = useCallback(() => {
        setIdx((i) => (i > 0 ? i - 1 : photos.length - 1));
        setConfirming(false);
    }, [photos.length]);

    const goNext = useCallback(() => {
        setIdx((i) => (i < photos.length - 1 ? i + 1 : 0));
        setConfirming(false);
    }, [photos.length]);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'ArrowLeft') goPrev();
            else if (e.key === 'ArrowRight') goNext();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goPrev, goNext, onClose]);

    useEffect(() => {
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = original;
        };
    }, []);

    function onTouchStart(e: React.TouchEvent) {
        touchStartX.current = e.touches[0]?.clientX ?? null;
    }
    function onTouchEnd(e: React.TouchEvent) {
        if (touchStartX.current == null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
        if (Math.abs(dx) > SWIPE_THRESHOLD) {
            if (dx > 0) goPrev();
            else goNext();
        }
        touchStartX.current = null;
    }

    async function handleDelete() {
        if (!current) return;
        setDeleting(true);
        try {
            await onDelete(current.id);
        } finally {
            setDeleting(false);
            setConfirming(false);
        }
    }

    if (!current) return null;
    const tagLabelKey = current.tag ? TAG_LABEL_KEYS[current.tag] : null;
    const allowDelete = canDelete(current);

    return (
        <div
            className="fixed inset-0 z-[100] bg-black flex flex-col"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="flex items-center justify-between px-4 py-3 text-white/90 text-sm"
                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}
            >
                <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#b8956a] truncate">
                        {t('photos.uploadedBy', { name: current.uploadedByName || '—' })}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5 truncate">
                        {fmtDateTime(current.createdAt)}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={t('common.close')}
                    className="ml-3 inline-flex items-center justify-center w-11 h-11 rounded-full hover:bg-white/10 transition-colors"
                >
                    <X size={22} />
                </button>
            </div>

            <div
                className="relative flex-1 flex items-center justify-center min-h-0"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <img
                    src={`/api/portal/photos/${current.id}/image`}
                    alt={current.caption || current.uploadedByName}
                    className="max-h-full max-w-full object-contain select-none"
                    draggable={false}
                />

                {photos.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                goPrev();
                            }}
                            aria-label={t('photos.previous')}
                            className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
                        >
                            <ChevronLeft size={26} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                goNext();
                            }}
                            aria-label={t('photos.next')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-12 h-12 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
                        >
                            <ChevronRight size={26} />
                        </button>
                    </>
                )}
            </div>

            <div
                className="px-4 py-4 text-white/90 text-sm"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}
            >
                <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        {tagLabelKey && (
                            <span className="inline-block mb-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-white/15">
                                {t(tagLabelKey)}
                            </span>
                        )}
                        {current.caption && (
                            <p className="text-sm text-white/90 whitespace-pre-wrap break-words">
                                {current.caption}
                            </p>
                        )}
                        {photos.length > 1 && (
                            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 mt-2">
                                {idx + 1} / {photos.length}
                            </p>
                        )}
                    </div>
                    {allowDelete && (
                        <div className="shrink-0">
                            {confirming ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setConfirming(false)}
                                        className="px-3 py-2 min-h-[44px] rounded-xl text-xs uppercase tracking-[0.18em] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                        disabled={deleting}
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className={cn(
                                            'px-3 py-2 min-h-[44px] rounded-xl text-xs uppercase tracking-[0.18em] font-semibold bg-red-500/90 hover:bg-red-500 text-white transition-colors',
                                            deleting && 'opacity-60 cursor-not-allowed',
                                        )}
                                    >
                                        {t('common.confirm')}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setConfirming(true)}
                                    aria-label={t('photos.delete')}
                                    className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-xl text-xs uppercase tracking-[0.18em] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <Trash2 size={16} />
                                    {t('photos.delete')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
