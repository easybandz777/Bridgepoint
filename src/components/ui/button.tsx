'use client';

import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-gold text-white hover:bg-gold-dark active:bg-gold-dark',
  secondary:
    'bg-charcoal text-warm-white hover:bg-charcoal-light active:bg-charcoal-light',
  outline:
    'border-2 border-gold text-gold hover:bg-gold hover:text-white',
  ghost:
    'text-charcoal hover:text-gold',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-sans font-medium',
          'tracking-wide uppercase transition-all duration-300',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold',
          'focus-visible:ring-offset-2 disabled:opacity-50',
          'disabled:pointer-events-none cursor-pointer',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
