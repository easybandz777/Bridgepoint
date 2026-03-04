import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** Alternate background between warm-white and cream */
  variant?: 'default' | 'alternate' | 'dark';
  /** Constrain content width */
  contained?: boolean;
  /** Additional vertical padding */
  spacious?: boolean;
}

export function Section({
  className,
  variant = 'default',
  contained = true,
  spacious = false,
  children,
  ...props
}: SectionProps) {
  const bg = {
    default: 'bg-warm-white',
    alternate: 'bg-cream',
    dark: 'bg-charcoal text-warm-white',
  }[variant];

  return (
    <section
      className={cn(
        bg,
        spacious ? 'py-24 md:py-32' : 'py-16 md:py-24',
        className
      )}
      {...props}
    >
      {contained ? (
        <div className="mx-auto max-w-7xl px-6 lg:px-8">{children}</div>
      ) : (
        children
      )}
    </section>
  );
}
