'use client';

import { useEffect } from 'react';
import { X, Trash2, Download, User as UserIcon, Calendar, Tag as TagIcon } from 'lucide-react';

export interface AdminPhotoMeta {
    id: string;
    projectId: string;
    projectName?: string | null;
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
    hasThumbnail?: boolean;
}

interface Props {
    photo: AdminPhotoMeta | null;
    onClose: () => void;
    onDelete: (photo: AdminPhotoMeta) => void;
    onPrev?: () => void;
    onNext?: () => void;
}

function fmtBytes(b: number): string {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(s: string | null): string {
    if (!s) return '—';
    try {
        return new Date(s).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    } catch {
        return s;
    }
}

export function AdminPhotoLightbox({ photo, onClose, onDelete, onPrev, onNext }: Props) {
    useEffect(() => {
        if (!photo) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && onPrev) onPrev();
            if (e.key === 'ArrowRight' && onNext) onNext();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [photo, onClose, onPrev, onNext]);

    if (!photo) return null;

    const imageUrl = `/api/admin/photos/${photo.id}/image`;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-6xl max-h-[92vh] bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden flex flex-col lg:flex-row shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="flex-1 min-h-[300px] lg:min-h-[600px] flex items-center justify-center bg-black/60 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt={photo.caption || photo.filename}
                        className="max-w-full max-h-[80vh] object-contain"
                    />
                    {onPrev && (
                        <button
                            onClick={onPrev}
                            aria-label="Previous"
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                        >
                            ‹
                        </button>
                    )}
                    {onNext && (
                        <button
                            onClick={onNext}
                            aria-label="Next"
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                        >
                            ›
                        </button>
                    )}
                </div>

                <div className="lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#1a1a1a] flex flex-col">
                    <div className="p-5 border-b border-white/6">
                        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Photo</p>
                        <h3 className="font-serif text-lg font-bold text-white truncate">{photo.filename}</h3>
                        {photo.projectName && (
                            <p className="text-xs text-white/50 mt-1 truncate">{photo.projectName}</p>
                        )}
                    </div>

                    <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                        {photo.caption && (
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Caption</p>
                                <p className="text-sm text-white/80 leading-relaxed">{photo.caption}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Uploader</p>
                            <p className="text-sm text-white flex items-center gap-2">
                                <UserIcon size={12} className="text-white/30" />
                                {photo.uploadedByName || 'Unknown'}
                                <span className="text-[10px] uppercase text-white/40">
                                    {photo.uploadedByType}
                                </span>
                            </p>
                        </div>

                        {photo.tag && (
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Tag</p>
                                <p className="text-sm text-white flex items-center gap-2">
                                    <TagIcon size={12} className="text-white/30" />
                                    <span className="capitalize">{photo.tag}</span>
                                </p>
                            </div>
                        )}

                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Uploaded</p>
                            <p className="text-sm text-white flex items-center gap-2">
                                <Calendar size={12} className="text-white/30" />
                                {fmtDate(photo.createdAt)}
                            </p>
                        </div>

                        {photo.takenAt && photo.takenAt !== photo.createdAt && (
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Taken</p>
                                <p className="text-sm text-white">{fmtDate(photo.takenAt)}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/6">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Size</p>
                                <p className="text-sm text-white">{fmtBytes(photo.sizeBytes)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Dimensions</p>
                                <p className="text-sm text-white">
                                    {photo.width && photo.height ? `${photo.width} × ${photo.height}` : '—'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/6 flex items-center gap-2">
                        <a
                            href={imageUrl}
                            download={photo.filename}
                            className="flex-1 h-9 px-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full text-xs font-semibold text-white/80 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Download size={12} /> Download
                        </a>
                        <button
                            onClick={() => onDelete(photo)}
                            className="h-9 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors"
                        >
                            <Trash2 size={12} /> Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
