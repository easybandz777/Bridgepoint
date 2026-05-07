/**
 * ErrorState — shown when an API call fails. Optional retry handler.
 *
 * Usage:
 *   <ErrorState message="Could not load jobs." onRetry={refetch} />
 */

import { AlertCircle, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
    message: string;
    title?: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorState({ message, title = 'Something went wrong', onRetry, className }: ErrorStateProps) {
    return (
        <div
            className={cn(
                'w-full py-12 px-6 flex flex-col items-center justify-center text-center',
                'rounded-2xl border border-red-500/15 bg-red-500/[0.04]',
                className,
            )}
        >
            <div
                className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-2xl"
                style={{ background: 'rgba(239,68,68,0.12)' }}
            >
                <AlertCircle size={22} className="text-red-400" />
            </div>
            <h3 className="font-serif text-base font-bold text-white mb-1.5 tracking-tight">{title}</h3>
            <p className="text-sm text-white/60 max-w-sm leading-relaxed">{message}</p>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-5 inline-flex items-center gap-2 h-9 px-4 rounded-full text-xs font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer bg-white/8 hover:bg-white/12 text-white"
                >
                    <RefreshCcw size={13} />
                    Try again
                </button>
            )}
        </div>
    );
}
