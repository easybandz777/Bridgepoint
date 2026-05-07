'use client';

import { Trash2, ExternalLink, FileText } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { fmtShortDate } from '@/lib/portal-client';
import type { PortalDocumentItem } from '@/app/api/portal/documents/route';

interface DocumentListProps {
    documents: PortalDocumentItem[];
    onDelete?: (id: string) => void;
    deletingId?: string | null;
}

function isExpired(expiry: string | null): boolean {
    if (!expiry) return false;
    try { return new Date(expiry).getTime() < Date.now(); } catch { return false; }
}

export function DocumentList({ documents, onDelete, deletingId }: DocumentListProps) {
    const t = useT();
    if (documents.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-12 text-center text-sm text-white/40">
                {t('documents.empty')}
            </div>
        );
    }
    return (
        <div className="space-y-3">
            {documents.map(d => (
                <DocRow
                    key={d.id}
                    doc={d}
                    onDelete={onDelete}
                    isDeleting={deletingId === d.id}
                />
            ))}
        </div>
    );
}

function DocRow({
    doc,
    onDelete,
    isDeleting,
}: {
    doc: PortalDocumentItem;
    onDelete?: (id: string) => void;
    isDeleting?: boolean;
}) {
    const t = useT();
    const expired = isExpired(doc.expiryDate);

    return (
        <div
            className="rounded-2xl border p-4 sm:p-5 flex items-start gap-4"
            style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}
        >
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(184,149,106,0.12)' }}
            >
                <FileText size={16} style={{ color: '#b8956a' }} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-[#b8956a]/10 text-[#b8956a] border-[#b8956a]/25">
                        {doc.docType}
                    </span>
                    {doc.verified ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20">
                            {t('documents.verifiedTrue')}
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20">
                            {t('documents.verifiedFalse')}
                        </span>
                    )}
                    {expired && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-[#f87171]/10 text-[#f87171] border-[#f87171]/20">
                            {t('documents.expired')}
                        </span>
                    )}
                </div>

                <p className="text-sm text-white/85 font-medium truncate">{doc.filename}</p>

                <div className="text-xs text-white/40 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {doc.uploadedDate && (
                        <span>{t('documents.uploaded', { date: fmtShortDate(doc.uploadedDate) })}</span>
                    )}
                    {doc.expiryDate && (
                        <span className={expired ? 'text-[#f87171]' : ''}>
                            {t('documents.expires', { date: fmtShortDate(doc.expiryDate) })}
                        </span>
                    )}
                </div>

                {doc.notes && (
                    <p className="text-xs text-white/55 mt-2">{doc.notes}</p>
                )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
                {doc.url && (
                    <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
                        aria-label={t('common.viewDetails')}
                    >
                        <ExternalLink size={14} />
                    </a>
                )}
                {onDelete && !doc.verified && (
                    <button
                        type="button"
                        onClick={() => onDelete(doc.id)}
                        disabled={isDeleting}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/8 transition-all disabled:opacity-30"
                        aria-label={t('common.delete')}
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}
