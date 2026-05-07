/**
 * StatusPill — colored badge for any portal/admin status string.
 *
 * Maps a wide range of statuses (project, phase, time entry, message
 * level, sub-assignment) onto a small fixed palette so colors stay
 * consistent across the portal.
 *
 * Usage:
 *   <StatusPill status="In Progress" />
 *   <StatusPill status="urgent" size="sm" />
 *   <StatusPill status={project.status} variant="outline" />
 */

import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'info' | 'success' | 'warn' | 'danger' | 'gold';

interface StatusPillProps {
    status: string;
    size?: 'sm' | 'md';
    variant?: 'solid' | 'outline';
    className?: string;
}

const STATUS_TO_TONE: Record<string, Tone> = {
    // Projects
    'planning': 'neutral',
    'on hold': 'warn',
    'in progress': 'info',
    'active': 'info',
    'completed': 'success',
    'cancelled': 'danger',
    'closed': 'neutral',

    // Phases
    'not started': 'neutral',
    'blocked': 'danger',

    // Time entries
    'pending': 'warn',
    'approved': 'success',
    'rejected': 'danger',

    // Messages
    'info': 'info',
    'urgent': 'danger',
    'announcement': 'gold',

    // Sub assignments
    'assigned': 'info',
    'on site': 'gold',
    'invoiced': 'info',
    'paid': 'success',

    // Generic
    'draft': 'neutral',
    'sent': 'info',
    'overdue': 'danger',
    'success': 'success',
    'error': 'danger',
};

const TONE_SOLID: Record<Tone, string> = {
    neutral: 'bg-white/8 text-white/70 border-white/10',
    info: 'bg-sky-500/15 text-sky-300 border-sky-500/25',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    warn: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    danger: 'bg-red-500/15 text-red-300 border-red-500/25',
    gold: 'bg-[#b8956a]/15 text-[#b8956a] border-[#b8956a]/30',
};

const TONE_OUTLINE: Record<Tone, string> = {
    neutral: 'border-white/15 text-white/60',
    info: 'border-sky-500/40 text-sky-300',
    success: 'border-emerald-500/40 text-emerald-300',
    warn: 'border-amber-500/40 text-amber-300',
    danger: 'border-red-500/40 text-red-300',
    gold: 'border-[#b8956a]/45 text-[#b8956a]',
};

function toneFor(status: string): Tone {
    const key = String(status ?? '').trim().toLowerCase();
    return STATUS_TO_TONE[key] ?? 'neutral';
}

export function StatusPill({ status, size = 'md', variant = 'solid', className }: StatusPillProps) {
    const tone = toneFor(status);
    const palette = variant === 'outline' ? TONE_OUTLINE[tone] : TONE_SOLID[tone];
    const sizeClass = size === 'sm'
        ? 'h-5 px-2 text-[10px] tracking-[0.12em]'
        : 'h-6 px-2.5 text-[11px] tracking-[0.14em]';

    return (
        <span
            className={cn(
                'inline-flex items-center justify-center rounded-full border font-semibold uppercase whitespace-nowrap',
                sizeClass,
                palette,
                className,
            )}
        >
            {status || '—'}
        </span>
    );
}
