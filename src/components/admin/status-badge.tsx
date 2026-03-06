import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

// Common status types across the system
type StatusCategory =
    | 'neutral'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'brand';

interface StatusBadgeProps {
    status: string;
    category?: StatusCategory;
    className?: string;
    icon?: ReactNode;
}

export function StatusBadge({ status, category = 'neutral', className, icon }: StatusBadgeProps) {

    // Auto-detect category if not provided
    if (!category || category === 'neutral') {
        const s = status.toLowerCase();

        // Success
        if (['completed', 'approved', 'paid', 'customer approved', 'internal approved', 'active', 'preferred'].includes(s)) category = 'success';

        // Warning
        if (['in progress', 'partial', 'partially approved', 'probation', 'under review', 'pending', 'scheduled'].includes(s)) category = 'warning';

        // Danger
        if (['declined', 'overdue', 'rejected', 'blacklisted', 'disputed', 'issue flagged', 'blocked', 'cancelled'].includes(s)) category = 'danger';

        // Info
        if (['sent', 'assigned', 'invited'].includes(s)) category = 'info';

        // Neutral
        if (['draft', 'not started', 'inactive', 'on hold', 'skipped'].includes(s)) category = 'neutral';
    }

    const styles: Record<StatusCategory, { bg: string, text: string, border: string }> = {
        success: { bg: 'bg-[#34d399]/10', text: 'text-[#34d399]', border: 'border-[#34d399]/20' },
        warning: { bg: 'bg-[#fbbf24]/10', text: 'text-[#fbbf24]', border: 'border-[#fbbf24]/20' },
        danger: { bg: 'bg-[#f87171]/10', text: 'text-[#f87171]', border: 'border-[#f87171]/20' },
        info: { bg: 'bg-[#60a5fa]/10', text: 'text-[#60a5fa]', border: 'border-[#60a5fa]/20' },
        brand: { bg: 'bg-[#b8956a]/10', text: 'text-[#b8956a]', border: 'border-[#b8956a]/20' },
        neutral: { bg: 'bg-white/5', text: 'text-white/60', border: 'border-white/10' },
    };

    const s = styles[category];

    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border',
            s.bg,
            s.text,
            s.border,
            className
        )}>
            {icon && <span className="shrink-0">{icon}</span>}
            {status}
        </span>
    );
}
