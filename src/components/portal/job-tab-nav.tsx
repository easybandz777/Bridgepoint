'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Image as ImageIcon, MessageSquare, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/portal-i18n';

interface JobTabNavProps {
    projectId: string;
}

interface JobTab {
    labelKey: string;
    icon: LucideIcon;
    segment: string;
}

const TABS: JobTab[] = [
    { labelKey: 'jobDetail.tabOverview', icon: LayoutDashboard, segment: '' },
    { labelKey: 'jobDetail.tabPhotos', icon: ImageIcon, segment: 'photos' },
    { labelKey: 'jobDetail.tabUpdates', icon: MessageSquare, segment: 'updates' },
];

export function JobTabNav({ projectId }: JobTabNavProps) {
    const pathname = usePathname();
    const t = useT();
    const basePath = `/portal/jobs/${projectId}`;

    return (
        <div className="flex items-center gap-1 overflow-x-auto pb-4 mb-4 border-b border-white/10 hide-scrollbar">
            {TABS.map((tab) => {
                const href = tab.segment ? `${basePath}/${tab.segment}` : basePath;
                const isActive = tab.segment === ''
                    ? pathname === basePath
                    : pathname.startsWith(href);

                return (
                    <Link
                        key={tab.segment || 'overview'}
                        href={href}
                        className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                            isActive
                                ? 'bg-white/10 text-white'
                                : 'text-white/40 hover:text-white/80 hover:bg-white/5',
                        )}
                    >
                        <tab.icon size={14} className={isActive ? 'text-[#b8956a]' : 'text-white/30'} />
                        {t(tab.labelKey)}
                    </Link>
                );
            })}
        </div>
    );
}
