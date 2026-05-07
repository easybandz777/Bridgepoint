'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck } from 'lucide-react';
import { portalLogin } from '@/lib/portal-client';
import { useT } from '@/lib/portal-i18n';
import { LanguageToggle } from '@/components/portal/language-toggle';
import { SITE_CONFIG } from '@/lib/constants';

export default function PortalLoginPage() {
    const router = useRouter();
    const t = useT();
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await portalLogin(email.trim(), pin.trim());
            router.push('/portal/dashboard');
            router.refresh();
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            const lowered = msg.toLowerCase();
            if (lowered.includes('locked') || lowered.includes('attempts')) {
                setError(t('auth.locked'));
            } else if (lowered.includes('disabled')) {
                setError(t('auth.disabled'));
            } else {
                setError(t('auth.invalid'));
            }
            setPin('');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4"
            style={{
                backgroundImage:
                    'radial-gradient(ellipse at 50% 0%, rgba(184,149,106,0.08) 0%, transparent 60%)',
            }}
        >
            <div className="w-full max-w-md">
                {/* Language toggle */}
                <div className="flex justify-end mb-4">
                    <LanguageToggle showIcon />
                </div>

                {/* Logo block */}
                <div className="text-center mb-10">
                    <div
                        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
                        style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)' }}
                    >
                        <Lock size={22} className="text-white" />
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-white tracking-tight mb-1">
                        {SITE_CONFIG.name}
                    </h1>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b8956a]">
                        {t('auth.title')}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-8 shadow-2xl">
                    <div className="mb-6">
                        <h2 className="font-serif text-xl text-white mb-1">{t('auth.cardHeading')}</h2>
                        <p className="text-sm text-white/40">{t('auth.cardSubheading')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('auth.email')}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 transition-all"
                            required
                            autoFocus
                        />
                        <input
                            type="password"
                            inputMode="numeric"
                            autoComplete="current-password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder={t('auth.pin')}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 transition-all"
                            required
                        />

                        {error && (
                            <p className="text-xs text-red-400 flex items-center gap-2">
                                <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !email || !pin}
                            className="w-full py-3.5 rounded-xl font-sans text-sm font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-white"
                            style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)' }}
                        >
                            {loading ? t('auth.signingIn') : t('auth.signIn')}
                        </button>
                    </form>

                    <p className="mt-5 text-xs text-white/35 text-center">
                        {t('auth.forgotPin')}
                    </p>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-white/20 text-xs">
                    <ShieldCheck size={13} />
                    <span>{t('auth.protected')}</span>
                </div>
            </div>
        </div>
    );
}
