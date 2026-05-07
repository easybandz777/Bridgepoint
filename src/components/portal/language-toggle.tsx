'use client';

import { useLocale, useT } from '@/lib/portal-i18n';
import { cn } from '@/lib/utils';
import { Languages } from 'lucide-react';

interface LanguageToggleProps {
    variant?: 'default' | 'compact';
    showIcon?: boolean;
    className?: string;
}

export function LanguageToggle({ variant = 'default', showIcon = false, className }: LanguageToggleProps) {
    const { locale, setLocale } = useLocale();
    const t = useT();

    const compact = variant === 'compact';

    return (
        <div
            role="group"
            aria-label={t('lang.toggle')}
            className={cn(
                'inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1',
                className,
            )}
        >
            {showIcon && (
                <span className="pl-1.5 pr-0.5 text-white/40">
                    <Languages size={compact ? 12 : 14} />
                </span>
            )}
            <button
                type="button"
                onClick={() => setLocale('en')}
                aria-pressed={locale === 'en'}
                className={cn(
                    'rounded-lg font-semibold uppercase tracking-[0.18em] transition-all',
                    compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1 text-[11px]',
                    locale === 'en'
                        ? 'bg-[#b8956a]/20 text-[#b8956a]'
                        : 'text-white/45 hover:text-white/80',
                )}
            >
                EN
            </button>
            <button
                type="button"
                onClick={() => setLocale('es')}
                aria-pressed={locale === 'es'}
                className={cn(
                    'rounded-lg font-semibold uppercase tracking-[0.18em] transition-all',
                    compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1 text-[11px]',
                    locale === 'es'
                        ? 'bg-[#b8956a]/20 text-[#b8956a]'
                        : 'text-white/45 hover:text-white/80',
                )}
            >
                ES
            </button>
        </div>
    );
}
