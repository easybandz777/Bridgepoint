'use client';

import { useT } from '@/lib/portal-i18n';
import { timeAgo } from '@/lib/portal-client';
import {
    Activity,
    Camera,
    Clock,
    Hammer,
    MessageCircle,
    MessageSquare,
    type LucideIcon,
} from 'lucide-react';

interface ActivityItem {
    id: string;
    entity_type: string;
    action: string;
    description: string;
    created_at: string;
}

interface RecentActivityFeedProps {
    items: ActivityItem[];
}

function iconFor(entityType: string): LucideIcon {
    switch (entityType) {
        case 'project': return Hammer;
        case 'time_entry': return Clock;
        case 'photo': return Camera;
        case 'update': return MessageSquare;
        case 'message': return MessageCircle;
        default: return Activity;
    }
}

export function RecentActivityFeed({ items }: RecentActivityFeedProps) {
    const t = useT();
    return (
        <section>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3">
                {t('dashboard.recentActivity')}
            </h2>
            <div
                className="rounded-2xl border bg-[#1a1a1a]"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
                {items.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-white/35">
                        {t('dashboard.noActivity')}
                    </div>
                ) : (
                    <ul className="divide-y divide-white/5">
                        {items.map(item => {
                            const Icon = iconFor(item.entity_type);
                            return (
                                <li key={item.id} className="px-4 sm:px-5 py-3 flex items-start gap-3">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                        style={{ background: 'rgba(184,149,106,0.10)' }}
                                    >
                                        <Icon size={14} style={{ color: '#b8956a' }} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-white/80 leading-snug">
                                            {item.description || item.action}
                                        </p>
                                        <p className="text-[11px] text-white/35 mt-0.5">
                                            {timeAgo(item.created_at)}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </section>
    );
}
