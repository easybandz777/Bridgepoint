'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { usePortalUser } from '@/lib/portal-context';
import { ProfileForm } from '@/components/portal/profile-form';
import { ChangePinDialog } from '@/components/portal/change-pin-dialog';

export default function PortalProfilePage() {
    const t = useT();
    const { user, refresh } = usePortalUser();
    const [pinOpen, setPinOpen] = useState(false);

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl mx-auto space-y-6">
            <header>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight mb-1">
                    {t('profile.title')}
                </h1>
                <p className="text-sm text-white/45">
                    {t('profile.signedInAs', { name: user.displayName })}
                </p>
            </header>

            <ProfileForm />

            <div
                className="rounded-2xl border p-5 sm:p-6 flex items-center justify-between gap-4"
                style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(184,149,106,0.12)' }}
                    >
                        <KeyRound size={16} style={{ color: '#b8956a' }} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{t('profile.changePin')}</p>
                        <p className="text-xs text-white/45 truncate">{t('auth.changePinIntro')}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setPinOpen(true)}
                    className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-[0.12em] text-white/70 border border-white/10 hover:bg-white/5 hover:text-white transition-all"
                >
                    {t('profile.changePin')}
                </button>
            </div>

            <ChangePinDialog
                open={pinOpen}
                onClose={() => setPinOpen(false)}
                onSuccess={() => {
                    setPinOpen(false);
                    refresh();
                }}
            />
        </div>
    );
}
