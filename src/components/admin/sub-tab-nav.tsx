'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User, Briefcase, HandCoins, FileText, Star, Activity } from 'lucide-react';

interface SubTabNavProps {
    subId: string;
}

const TABS = [
    { label: 'Overview', icon: User, segment: '' },
    { label: 'Jobs', icon: Briefcase, segment: 'jobs' },
    { label: 'Financials', icon: HandCoins, segment: 'financials' },
    { label: 'Documents', icon: FileText, segment: 'documents' },
    { label: 'Performance', icon: Star, segment: 'performance' },
    { label: 'Notes', icon: Activity, segment: 'notes' },
];

export function SubTabNav({ subId }: SubTabNavProps) {
    const pathname = usePathname();
    const basePath = `/admin/subcontractors/${subId}`;

    return (
        <div className="flex items-center gap-1 overflow-x-auto pb-4 mb-4 border-b border-white/10 hide-scrollbar">
            {TABS.map((tab) => {
                const href = tab.segment ? `${basePath}/${tab.segment}` : basePath;

                // Exact match for overview, startsWith for sub-pages
                const isActive = tab.segment === ''
                    ? pathname === basePath
                    : pathname.startsWith(href);

                return (
                    <Link
                        key={tab.label}
                        href={href}
                        className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                            isActive
                                ? 'bg-white/10 text-white'
                                : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                        )}
                    >
                        <tab.icon size={14} className={isActive ? 'text-[#b8956a]' : 'text-white/30'} />
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
