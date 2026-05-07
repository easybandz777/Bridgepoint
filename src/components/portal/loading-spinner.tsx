/**
 * LoadingSpinner — gold spinner with optional label, shared across portal pages.
 *
 * Usage:
 *   <LoadingSpinner />
 *   <LoadingSpinner label="Loading jobs..." />
 *   <LoadingSpinner label="Saving..." size="sm" inline />
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Render inline (no min-height) instead of as a centered block. */
    inline?: boolean;
    className?: string;
}

const SIZE_PX: Record<NonNullable<LoadingSpinnerProps['size']>, number> = {
    sm: 16,
    md: 22,
    lg: 32,
};

export function LoadingSpinner({
    label,
    size = 'md',
    inline = false,
    className,
}: LoadingSpinnerProps) {
    if (inline) {
        return (
            <span className={cn('inline-flex items-center gap-2 text-white/60', className)}>
                <Loader2 size={SIZE_PX[size]} className="animate-spin text-[#b8956a]" />
                {label && <span className="text-sm">{label}</span>}
            </span>
        );
    }

    return (
        <div
            className={cn(
                'w-full flex flex-col items-center justify-center gap-3 py-12 min-h-[180px]',
                className,
            )}
        >
            <Loader2 size={SIZE_PX[size]} className="animate-spin text-[#b8956a]" />
            {label && <p className="text-xs uppercase tracking-[0.2em] text-white/40">{label}</p>}
        </div>
    );
}
