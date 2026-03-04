import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'dark' | 'outline';
  className?: string;
}

export function Badge({
  children,
  variant = 'gold',
  className,
}: BadgeProps) {
  const variants = {
    gold: 'bg-gold/10 text-gold border-gold/20',
    dark: 'bg-charcoal text-warm-white border-charcoal',
    outline: 'bg-transparent text-slate border-slate/30',
  };

  return (
    <span
      className={cn(
        'inline-block border px-3 py-1 text-xs font-sans',
        'font-semibold uppercase tracking-widest',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
