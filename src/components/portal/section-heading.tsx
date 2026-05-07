/**
 * SectionHeading — reusable header for sections inside portal pages.
 *
 * Usage:
 *   <SectionHeading title="Recent updates" subtitle="Last 7 days" />
 *   <SectionHeading
 *     title="Photos"
 *     subtitle="From the crew"
 *     action={<button>Upload</button>}
 *   />
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    className?: string;
    /** Use a smaller heading variant. */
    compact?: boolean;
}

export function SectionHeading({
    title,
    subtitle,
    action,
    className,
    compact = false,
}: SectionHeadingProps) {
    return (
        <div
            className={cn(
                'flex items-end justify-between gap-4',
                compact ? 'mb-3' : 'mb-5',
                className,
            )}
        >
            <div className="min-w-0">
                <h2
                    className={cn(
                        'font-serif font-bold text-white tracking-tight truncate',
                        compact ? 'text-lg' : 'text-xl sm:text-2xl',
                    )}
                >
                    {title}
                </h2>
                {subtitle && (
                    <p
                        className={cn(
                            'text-white/45 leading-snug',
                            compact ? 'text-xs mt-0.5' : 'text-sm mt-1',
                        )}
                    >
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
