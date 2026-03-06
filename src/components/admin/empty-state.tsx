import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: ReactNode;
    actionLabel?: string;
    actionHref?: string;
    actionOnClick?: () => void;
    className?: string;
}

export function EmptyState({
    title,
    description,
    icon = <FileQuestion size={32} className="text-white/20" />,
    actionLabel,
    actionHref,
    actionOnClick,
    className
}: EmptyStateProps) {

    return (
        <div className={cn(
            "w-full py-16 px-6 flex flex-col items-center justify-center text-center rounded-2xl border border-white/5 border-dashed bg-white/[0.02]",
            className
        )}>
            <div className="mb-4">
                {icon}
            </div>
            <h3 className="font-serif text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-white/40 max-w-sm mb-6 leading-relaxed">
                {description}
            </p>

            {actionLabel && (
                actionHref ? (
                    <Link
                        href={actionHref}
                        className="h-10 px-5 bg-white text-black text-sm font-semibold rounded-full flex items-center hover:bg-white/90 transition-colors"
                    >
                        {actionLabel}
                    </Link>
                ) : (
                    <button
                        onClick={actionOnClick}
                        className="h-10 px-5 bg-white text-black text-sm font-semibold rounded-full flex items-center hover:bg-white/90 transition-colors"
                    >
                        {actionLabel}
                    </button>
                )
            )}
        </div>
    );
}
