/**
 * Portal i18n primitive.
 *
 * The crew portal is bilingual EN/ES. Every user-facing string must be
 * looked up via the `t()` helper exposed by the `useT()` hook. The
 * preferred language is stored in localStorage and picked up on mount;
 * the shell renders a language toggle that updates it.
 *
 * To add strings:
 *   1. Add a key to the appropriate per-feature dictionary file
 *      (./auth.ts, ./jobs.ts, etc).
 *   2. Reference it from your component: `const t = useT(); t('jobs.title')`.
 *
 * Missing keys fall through to the key itself in development so it's
 * obvious what to translate.
 */

'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import { auth as AUTH } from './auth';
import { common as COMMON } from './common';
import { dashboard as DASHBOARD } from './dashboard';
import { jobs as JOBS } from './jobs';
import { photos as PHOTOS } from './photos';
import { updates as UPDATES } from './updates';
import { clock as CLOCK } from './clock';
import { profile as PROFILE } from './profile';
import { messages as MESSAGES } from './messages';

export type Locale = 'en' | 'es';

const LOCALE_KEY = 'bp_portal_locale';

// Each per-feature module exports a `Dict` shaped like { en, es } where
// each side is a flat key→string map. We merge them into one big
// dictionary at module load.

export type LocaleDict = Record<string, string>;
export interface FeatureDict {
    en: LocaleDict;
    es: LocaleDict;
}

const FEATURES: FeatureDict[] = [
    AUTH, COMMON, DASHBOARD, JOBS, PHOTOS, UPDATES, CLOCK, PROFILE, MESSAGES,
];

const MERGED: Record<Locale, LocaleDict> = (() => {
    const en: LocaleDict = {};
    const es: LocaleDict = {};
    for (const f of FEATURES) {
        Object.assign(en, f.en);
        Object.assign(es, f.es);
    }
    return { en, es };
})();

// ─── Context ────────────────────────────────────────────────────────────────

interface I18nContextValue {
    locale: Locale;
    setLocale: (l: Locale) => void;
    t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function PortalI18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('en');
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(LOCALE_KEY);
            if (saved === 'en' || saved === 'es') {
                setLocaleState(saved);
            } else {
                // Fall back to browser preference if Spanish.
                const nav = (typeof navigator !== 'undefined' && navigator.language) || 'en';
                if (nav.toLowerCase().startsWith('es')) setLocaleState('es');
            }
        } catch {}
        setHydrated(true);
    }, []);

    const setLocale = useCallback((l: Locale) => {
        setLocaleState(l);
        try { window.localStorage.setItem(LOCALE_KEY, l); } catch {}
        try { document.documentElement.lang = l; } catch {}
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        try { document.documentElement.lang = locale; } catch {}
    }, [hydrated, locale]);

    const t = useCallback(
        (key: string, vars?: Record<string, string | number>) => {
            const dict = MERGED[locale];
            const raw = dict[key] ?? MERGED.en[key] ?? key;
            if (!vars) return raw;
            return Object.entries(vars).reduce(
                (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
                raw,
            );
        },
        [locale],
    );

    const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
    const ctx = useContext(I18nContext);
    if (!ctx) {
        // Safe fallback — avoids crashing when used outside the provider.
        return ((key: string) => MERGED.en[key] ?? key) as I18nContextValue['t'];
    }
    return ctx.t;
}

export function useLocale(): { locale: Locale; setLocale: (l: Locale) => void } {
    const ctx = useContext(I18nContext);
    if (!ctx) return { locale: 'en', setLocale: () => {} };
    return { locale: ctx.locale, setLocale: ctx.setLocale };
}
