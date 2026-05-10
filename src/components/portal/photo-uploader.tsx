'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2, Upload } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { cn } from '@/lib/utils';

export interface UploadedPhotoMeta {
    id: string;
    projectId: string;
    phaseId: string | null;
    filename: string;
    mimeType: string;
    width: number | null;
    height: number | null;
    sizeBytes: number;
    caption: string;
    tag: string | null;
    uploadedByName: string;
    uploadedByType: string;
    uploadedById: string;
    createdAt: string;
    takenAt: string | null;
}

interface PhotoUploaderProps {
    projectId: string;
    phaseId?: string | null;
    onUploaded: (photo: UploadedPhotoMeta) => void;
}

interface PendingPhoto {
    id: string;
    file: File;
    previewUrl: string;
    caption: string;
}

interface CompressedImage {
    blob: Blob;
    w: number;
    h: number;
}

const TAGS = ['before', 'during', 'after', 'issue', 'other'] as const;
type TagOption = (typeof TAGS)[number];

const FULL_MAX = 1600;
const FULL_QUALITY = 0.85;
const THUMB_MAX = 320;
const THUMB_QUALITY = 0.7;

async function compress(file: File, maxLong: number, quality: number): Promise<CompressedImage> {
    const bmp = await createImageBitmap(file);
    try {
        const scale = Math.min(1, maxLong / Math.max(bmp.width, bmp.height));
        const w = Math.max(1, Math.round(bmp.width * scale));
        const h = Math.max(1, Math.round(bmp.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable');
        ctx.drawImage(bmp, 0, 0, w, h);
        const blob: Blob = await new Promise((resolve, reject) => {
            canvas.toBlob(
                (b) => {
                    if (b) resolve(b);
                    else reject(new Error('Compression failed'));
                },
                'image/jpeg',
                quality,
            );
        });
        return { blob, w, h };
    } finally {
        bmp.close();
    }
}

function makeId() {
    return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function PhotoUploader({ projectId, phaseId = null, onUploaded }: PhotoUploaderProps) {
    const t = useT();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [pending, setPending] = useState<PendingPhoto[]>([]);
    const [batchTag, setBatchTag] = useState<TagOption>('during');
    const [batchCaption, setBatchCaption] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            for (const p of pending) URL.revokeObjectURL(p.previewUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const acceptFiles = useCallback((files: FileList | File[]) => {
        const toAdd: PendingPhoto[] = [];
        for (const f of Array.from(files)) {
            if (!f.type.startsWith('image/')) continue;
            toAdd.push({
                id: makeId(),
                file: f,
                previewUrl: URL.createObjectURL(f),
                caption: '',
            });
        }
        if (toAdd.length === 0) return;
        setPending((prev) => [...prev, ...toAdd]);
        setError(null);
    }, []);

    function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files) acceptFiles(e.target.files);
        e.target.value = '';
    }

    function onDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer?.files?.length) acceptFiles(e.dataTransfer.files);
    }

    function removePending(id: string) {
        setPending((prev) => {
            const target = prev.find((p) => p.id === id);
            if (target) URL.revokeObjectURL(target.previewUrl);
            return prev.filter((p) => p.id !== id);
        });
    }

    function updateCaption(id: string, caption: string) {
        setPending((prev) => prev.map((p) => (p.id === id ? { ...p, caption } : p)));
    }

    async function uploadOne(item: PendingPhoto): Promise<UploadedPhotoMeta | null> {
        const full = await compress(item.file, FULL_MAX, FULL_QUALITY);
        const thumb = await compress(item.file, THUMB_MAX, THUMB_QUALITY);

        const form = new FormData();
        const filename = item.file.name || 'photo.jpg';
        form.append('file', full.blob, filename);
        form.append('thumbnail', thumb.blob, `thumb-${filename}`);
        form.append('filename', filename);
        form.append('mimeType', 'image/jpeg');
        form.append('width', String(full.w));
        form.append('height', String(full.h));
        form.append('tag', batchTag);
        form.append('caption', item.caption.trim() || batchCaption.trim());
        if (phaseId) form.append('phaseId', phaseId);

        const res = await fetch(`/api/portal/jobs/${projectId}/photos`, {
            method: 'POST',
            body: form,
            credentials: 'include',
        });
        if (!res.ok) {
            const msg = await res
                .json()
                .then((j: { error?: string }) => j.error)
                .catch(() => null);
            throw new Error(msg ?? `Upload failed (${res.status})`);
        }
        return (await res.json()) as UploadedPhotoMeta;
    }

    async function startUpload() {
        if (pending.length === 0 || uploading) return;
        setUploading(true);
        setError(null);
        const total = pending.length;
        const queue = [...pending];
        let success = 0;
        for (let i = 0; i < queue.length; i++) {
            setProgress({ current: i + 1, total });
            try {
                const meta = await uploadOne(queue[i]);
                if (meta) {
                    onUploaded(meta);
                    success++;
                    URL.revokeObjectURL(queue[i].previewUrl);
                    setPending((prev) => prev.filter((p) => p.id !== queue[i].id));
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : t('photos.uploadFailed'));
                break;
            }
        }
        setUploading(false);
        setProgress(null);
        if (success === total) {
            setBatchCaption('');
        }
    }

    const tagLabelKey: Record<TagOption, string> = {
        before: 'photos.tagBefore',
        during: 'photos.tagDuring',
        after: 'photos.tagAfter',
        issue: 'photos.tagIssue',
        other: 'photos.tagOther',
    };

    const uploadCtaKey =
        pending.length === 1 ? 'photos.startUploadOne' : 'photos.startUpload';

    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-4 sm:p-5 space-y-4">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={onFilePick}
                className="sr-only"
            />

            <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                    }
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={cn(
                    'rounded-xl border-2 border-dashed py-8 px-5 text-center transition-colors cursor-pointer min-h-[44px]',
                    dragOver
                        ? 'border-[#b8956a] bg-[#b8956a]/10'
                        : 'border-white/15 hover:border-white/30 bg-white/[0.02]',
                )}
            >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/5 mb-3">
                    <Camera size={18} className="text-[#b8956a]" />
                </div>
                <p className="text-sm text-white/80">{t('photos.dragDrop')}</p>
                <p className="text-xs text-white/40 mt-1">{t('photos.captureHint')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-white/40 mb-1.5">
                        {t('photos.tagSelector')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {TAGS.map((tagOption) => {
                            const active = tagOption === batchTag;
                            return (
                                <button
                                    key={tagOption}
                                    type="button"
                                    onClick={() => setBatchTag(tagOption)}
                                    className={cn(
                                        'min-h-[44px] px-3 py-2 rounded-xl text-xs uppercase tracking-[0.16em] font-medium transition-colors',
                                        active
                                            ? 'bg-[#b8956a] text-black'
                                            : 'bg-white/5 text-white/70 hover:bg-white/10',
                                    )}
                                >
                                    {t(tagLabelKey[tagOption])}
                                </button>
                            );
                        })}
                    </div>
                </label>
                <label className="block">
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-white/40 mb-1.5">
                        {t('photos.batchCaption')}
                    </span>
                    <input
                        type="text"
                        value={batchCaption}
                        onChange={(e) => setBatchCaption(e.target.value)}
                        placeholder={t('photos.captionPlaceholder')}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-base sm:text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 transition-all min-h-[44px]"
                    />
                </label>
            </div>

            {pending.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                        {t('photos.previewLabel')}
                    </p>
                    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {pending.map((p) => (
                            <li
                                key={p.id}
                                className="relative rounded-xl bg-black/30 border border-white/8 overflow-hidden flex flex-col"
                            >
                                <div className="relative aspect-square bg-black/50">
                                    <img
                                        src={p.previewUrl}
                                        alt={p.file.name}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePending(p.id)}
                                        aria-label={t('photos.removeSelected')}
                                        disabled={uploading}
                                        className="absolute top-1.5 right-1.5 inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors disabled:opacity-40"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={p.caption}
                                    onChange={(e) => updateCaption(p.id, e.target.value)}
                                    placeholder={t('photos.captionPlaceholder')}
                                    disabled={uploading}
                                    className="w-full bg-transparent border-t border-white/8 px-2.5 py-2 text-base sm:text-xs text-white placeholder-white/25 focus:outline-none focus:bg-white/5 transition-colors"
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-400 flex items-center gap-2">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                    {error}
                </p>
            )}

            {progress && (
                <div className="space-y-1.5">
                    <p className="text-xs text-white/60">
                        {t('photos.uploading', { current: progress.current, total: progress.total })}
                    </p>
                    <div className="w-full h-1.5 rounded-full bg-white/8 overflow-hidden">
                        <div
                            className="h-full bg-[#b8956a] transition-all"
                            style={{
                                width: `${(progress.current / Math.max(1, progress.total)) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs uppercase tracking-[0.16em] font-medium transition-colors disabled:opacity-40"
                >
                    <ImagePlus size={16} />
                    {t('photos.uploadCta')}
                </button>
                <button
                    type="button"
                    onClick={startUpload}
                    disabled={uploading || pending.length === 0}
                    className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-xs uppercase tracking-[0.16em] font-semibold text-black transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)' }}
                >
                    <Upload size={16} />
                    {pending.length === 1
                        ? t(uploadCtaKey)
                        : t(uploadCtaKey, { count: pending.length })}
                </button>
            </div>
        </div>
    );
}
