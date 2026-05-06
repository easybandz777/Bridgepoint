'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User, Clock, FileText, Star, Wallet } from 'lucide-react';

interface EmployeeTabNavProps {
    employeeId: string;
}

const TABS = [
    { label: 'Overview', icon: User, segment: '' },
    { label: 'Timesheets', icon: Clock, segment: 'timesheets' },
    { label: 'Documents', icon: FileText, segment: 'documents' },
    { label: 'Performance', icon: Star, segment: 'performance' },
    { label: 'Pay', icon: Wallet, segment: 'pay' },
];

export function EmployeeTabNav({ employeeId }: EmployeeTabNavProps) {
    const pathname = usePathname();
    const basePath = `/admin/employees/${employeeId}`;

    return (
        <div className="flex items-center gap-1 overflow-x-auto pb-4 mb-4 border-b border-white/10 hide-scrollbar">
            {TABS.map((tab) => {
                const href = tab.segment ? `${basePath}/${tab.segment}` : basePath;
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
                                : 'text-white/40 hover:text-white/80 hover:bg-white/5',
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
