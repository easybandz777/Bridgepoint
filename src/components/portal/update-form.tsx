'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send, ImagePlus } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { usePortalUser } from '@/lib/portal-context';
import { portalFetch } from '@/lib/portal-client';
import { cn } from '@/lib/utils';

export type UpdateKind = 'note' | 'progress' | 'issue' | 'completion';

interface KindOption {
    value: UpdateKind;
    labelKey: string;
}

const KIND_OPTIONS: KindOption[] = [
    { value: 'note', labelKey: 'updates.kindNote' },
    { value: 'progress', labelKey: 'updates.kindProgress' },
    { value: 'issue', labelKey: 'updates.kindIssue' },
    { value: 'completion', labelKey: 'updates.kindCompletion' },
];

interface UpdateFormProps {
    projectId: string;
    onPosted?: (created: unknown) => void;
}

function getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UpdateForm({ projectId, onPosted }: UpdateFormProps) {
    const t = useT();
    const { user } = usePortalUser();
    const [body, setBody] = useState('');
    const [kind, setKind] = useState<UpdateKind>('note');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initials = getInitials(user.displayName);
    const trimmed = body.trim();
    const canSubmit = trimmed.length > 0 && !submitting;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);
        try {
            const created = await portalFetch<unknown>(
                `/api/portal/jobs/${projectId}/updates`,
                {
                    method: 'POST',
                    body: JSON.stringify({ body: trimmed, kind }),
                },
            );
            setBody('');
            setKind('note');
            onPosted?.(created);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/8 p-4 sm:p-5 mb-6"
            style={{ background: '#1a1a1a' }}
        >
            <div className="flex items-start gap-3">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                    style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)' }}
                >
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder={t('updates.composePlaceholder')}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 transition-all resize-none"
                    />

                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        {KIND_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setKind(opt.value)}
                                className={cn(
                                    'px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors border',
                                    kind === opt.value
                                        ? 'bg-[#b8956a]/15 border-[#b8956a]/40 text-[#b8956a]'
                                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/8',
                                )}
                            >
                                {t(opt.labelKey)}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <p className="text-xs text-red-400 mt-3 flex items-center gap-2">
                            <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                            {error}
                        </p>
                    )}

                    <div className="flex items-center justify-between mt-4 gap-3">
                        <Link
                            href={`/portal/jobs/${projectId}/photos`}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50 hover:text-[#b8956a] transition-colors"
                        >
                            <ImagePlus size={13} />
                            {t('updates.addPhotos')}
                        </Link>

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-[0.14em] text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)' }}
                        >
                            <Send size={13} />
                            {submitting ? t('updates.posting') : t('updates.post')}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
