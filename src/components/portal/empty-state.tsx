/**
 * EmptyState — centered "nothing here yet" placeholder used across portal pages.
 *
 * Usage:
 *   import { Inbox } from 'lucide-react';
 *   <EmptyState
 *     icon={Inbox}
 *     title="No jobs yet"
 *     subtitle="When you're assigned to a project, it will show up here."
 *     cta={<Link href="/portal/dashboard">Back to dashboard</Link>}
 *   />
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    subtitle?: string;
    cta?: ReactNode;
    className?: string;
}

export function EmptyState({ icon: Icon, title, subtitle, cta, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                'w-full py-16 px-6 flex flex-col items-center justify-center text-center',
                'rounded-2xl border border-white/8 border-dashed bg-white/[0.02]',
                className,
            )}
        >
            {Icon && (
                <div
                    className="mb-5 inline-flex items-center justify-center w-14 h-14 rounded-2xl"
                    style={{ background: 'rgba(184,149,106,0.1)' }}
                >
                    <Icon size={24} className="text-[#b8956a]" />
                </div>
            )}
            <h3 className="font-serif text-lg font-bold text-white mb-2 tracking-tight">{title}</h3>
            {subtitle && (
                <p className="text-sm text-white/50 max-w-sm leading-relaxed">{subtitle}</p>
            )}
            {cta && <div className="mt-6">{cta}</div>}
        </div>
    );
}
