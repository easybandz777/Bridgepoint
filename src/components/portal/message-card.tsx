'use client';

import { Check, AlertTriangle, Info, Bell } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { fmtDateTime, timeAgo } from '@/lib/portal-client';
import type { PortalMessage } from '@/app/api/portal/messages/route';

interface MessageCardProps {
    message: PortalMessage;
    onMarkRead?: (id: string) => void;
    marking?: boolean;
}

interface LevelStyle {
    cls: string;
    Icon: typeof Info;
    key: string;
}

function levelStyle(level: string): LevelStyle {
    const l = (level || 'info').toLowerCase();
    if (l === 'urgent') {
        return {
            cls: 'bg-[#f87171]/10 text-[#f87171] border-[#f87171]/25',
            Icon: AlertTriangle,
            key: 'messages.levelUrgent',
        };
    }
    if (l === 'important') {
        return {
            cls: 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/25',
            Icon: Bell,
            key: 'messages.levelImportant',
        };
    }
    return {
        cls: 'bg-[#b8956a]/10 text-[#b8956a] border-[#b8956a]/25',
        Icon: Info,
        key: 'messages.levelInfo',
    };
}

export function MessageCard({ message, onMarkRead, marking }: MessageCardProps) {
    const t = useT();
    const ls = levelStyle(message.level);
    const Icon = ls.Icon;

    const containerStyle: React.CSSProperties = message.isRead
        ? { background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }
        : {
            background: 'linear-gradient(90deg, rgba(184,149,106,0.08) 0%, #1a1a1a 25%, #1a1a1a 100%)',
            borderColor: 'rgba(184,149,106,0.25)',
            borderLeftWidth: 3,
            borderLeftColor: '#b8956a',
        };

    return (
        <article
            className="rounded-2xl border p-4 sm:p-5"
            style={containerStyle}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${ls.cls}`}
                >
                    <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${ls.cls}`}>
                            {t(ls.key)}
                        </span>
                        {!message.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#b8956a]" aria-hidden />
                        )}
                        <span className="text-[10px] uppercase tracking-wider text-white/35" title={fmtDateTime(message.createdAt)}>
                            {timeAgo(message.createdAt)}
                        </span>
                    </div>
                    {message.subject && (
                        <h3 className={`font-serif text-base sm:text-lg leading-tight tracking-tight mb-1 ${message.isRead ? 'text-white/90 font-semibold' : 'text-white font-bold'}`}>
                            {message.subject}
                        </h3>
                    )}
                    <p className="text-xs text-white/40 mb-2">
                        {t('messages.from', { sender: message.sender })}
                    </p>
                    <p className="text-sm text-white/75 whitespace-pre-wrap leading-relaxed">
                        {message.body}
                    </p>
                    {!message.isRead && onMarkRead && (
                        <button
                            type="button"
                            onClick={() => onMarkRead(message.id)}
                            disabled={marking}
                            className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#b8956a] hover:text-[#cbb08c] transition-colors disabled:opacity-40"
                        >
                            <Check size={12} />
                            {t('messages.markRead')}
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}
