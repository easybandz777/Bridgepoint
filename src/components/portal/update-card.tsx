'use client';

import { useState } from 'react';
import { Trash2, ShieldCheck } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { usePortalUser } from '@/lib/portal-context';
import { portalFetch, timeAgo } from '@/lib/portal-client';
import { cn } from '@/lib/utils';

export interface UpdateAttachment {
    type?: string;
    id?: string;
    filename?: string;
    mimeType?: string;
    thumbnailUrl?: string;
    [k: string]: unknown;
}

export interface PortalUpdate {
    id: string;
    projectId: string;
    phaseId: string | null;
    phaseName: string | null;
    authorType: string;
    authorId: string;
    authorName: string;
    kind: string;
    body: string;
    statusChange: string | null;
    completionPct: number | null;
    attachments: UpdateAttachment[];
    createdAt: string;
}

interface UpdateCardProps {
    update: PortalUpdate;
    canModerate: boolean;
    onDeleted?: (id: string) => void;
}

interface KindStyle {
    label: string;
    pill: string;
    dot: string;
}

function getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function kindStyles(kind: string, t: (k: string) => string): KindStyle {
    switch (kind) {
        case 'progress':
            return {
                label: t('updates.kindProgress'),
                pill: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
                dot: 'bg-blue-400',
            };
        case 'issue':
            return {
                label: t('updates.kindIssue'),
                pill: 'bg-orange-500/15 text-orange-300 border-orange-400/30',
                dot: 'bg-orange-400',
            };
        case 'completion':
            return {
                label: t('updates.kindCompletion'),
                pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
                dot: 'bg-emerald-400',
            };
        case 'status_change':
            return {
                label: t('updates.kindStatusChange'),
                pill: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
                dot: 'bg-purple-400',
            };
        case 'note':
        default:
            return {
                label: t('updates.kindNote'),
                pill: 'bg-white/8 text-white/70 border-white/15',
                dot: 'bg-white/40',
            };
    }
}

export function UpdateCard({ update, canModerate, onDeleted }: UpdateCardProps) {
    const t = useT();
    const { user } = usePortalUser();
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = update.authorType === 'admin';
    const isAuthor =
        update.authorType === user.userType && update.authorId === user.userId;
    const canDelete = isAuthor || canModerate;

    const initials = getInitials(update.authorName);
    const styles = kindStyles(update.kind, t);

    const avatarBg = isAdmin
        ? 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)'
        : 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)';

    async function handleDelete() {
        if (!confirm(t('updates.confirmDelete'))) return;
        setDeleting(true);
        setError(null);
        try {
            await portalFetch(`/api/portal/updates/${update.id}`, { method: 'DELETE' });
            onDeleted?.(update.id);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            setDeleting(false);
        }
    }

    const photoAttachments = update.attachments.filter(
        (a) => a.type === 'photo' && typeof a.id === 'string',
    );

    return (
        <article
            className="group relative rounded-2xl border border-white/8 p-4 sm:p-5"
            style={{ background: '#1a1a1a' }}
        >
            <div className="flex items-start gap-3">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                    style={{ background: avatarBg }}
                >
                    {isAdmin ? <ShieldCheck size={16} /> : initials}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                        <span className="text-sm font-semibold text-white">
                            {update.authorName || (isAdmin ? t('common.author.admin') : t('common.author.crew'))}
                        </span>
                        <span
                            className={cn(
                                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.12em] border',
                                styles.pill,
                            )}
                        >
                            <span className={cn('w-1 h-1 rounded-full', styles.dot)} />
                            {styles.label}
                        </span>
                        <span className="text-[11px] text-white/40">
                            {timeAgo(update.createdAt)}
                        </span>
                        {update.phaseName && (
                            <span className="text-[11px] text-white/40">
                                · {t('updates.phaseLabel')}: {update.phaseName}
                            </span>
                        )}
                    </div>

                    {update.kind === 'status_change' && update.statusChange && (
                        <p className="text-xs text-purple-300 mb-1.5 italic">
                            {t('updates.markedStatus', { status: update.statusChange })}
                        </p>
                    )}

                    {update.completionPct != null && (
                        <p className="text-xs text-emerald-300 mb-1.5 italic">
                            {t('updates.markedComplete', {
                                pct: Math.round(update.completionPct),
                            })}
                        </p>
                    )}

                    {update.body && (
                        <p className="text-sm text-white/85 whitespace-pre-wrap break-words">
                            {update.body}
                        </p>
                    )}

                    {photoAttachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {photoAttachments.map((a) => (
                                <div
                                    key={String(a.id)}
                                    className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-white/5"
                                >
                                    {a.thumbnailUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={a.thumbnailUrl}
                                            alt={a.filename ?? ''}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-white/30">
                                            IMG
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <p className="text-xs text-red-400 mt-2">{error}</p>
                    )}
                </div>

                {canDelete && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        title={t('updates.delete')}
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </article>
    );
}
