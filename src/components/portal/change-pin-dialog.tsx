'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { changePin } from '@/lib/portal-client';
import { useT } from '@/lib/portal-i18n';

interface ChangePinDialogProps {
    open: boolean;
    forced?: boolean;
    onClose?: () => void;
    onSuccess?: () => void;
}

export function ChangePinDialog({ open, forced = false, onClose, onSuccess }: ChangePinDialogProps) {
    const t = useT();
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!open) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (newPin !== confirm) {
            setError(t('auth.pinMismatch'));
            return;
        }
        if (newPin.trim().length < 4) {
            setError(t('auth.pinTooShort'));
            return;
        }
        setSubmitting(true);
        try {
            await changePin(currentPin, newPin);
            setCurrentPin('');
            setNewPin('');
            setConfirm('');
            onSuccess?.();
        } catch (e) {
            setError(String(e instanceof Error ? e.message : e));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#1a1a1a] border border-white/8 rounded-2xl p-7 shadow-2xl">
                <div className="flex items-center gap-3 mb-5">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)' }}
                    >
                        <KeyRound size={16} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-serif text-lg text-white leading-tight">{t('auth.changePinTitle')}</h2>
                        <p className="text-xs text-white/40 mt-0.5">{t('auth.changePinIntro')}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="current-password"
                        value={currentPin}
                        onChange={(e) => setCurrentPin(e.target.value)}
                        placeholder={t('auth.currentPin')}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 transition-all"
                        required
                        autoFocus
                    />
                    <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="new-password"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder={t('auth.newPin')}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 transition-all"
                        required
                    />
                    <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder={t('auth.confirmPin')}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 transition-all"
                        required
                    />

                    {error && (
                        <p className="text-xs text-red-400 flex items-center gap-2">
                            <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                            {error}
                        </p>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                        {!forced && onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3.5 rounded-xl text-sm font-semibold uppercase tracking-[0.12em] text-white/60 border border-white/10 hover:bg-white/5 hover:text-white transition-all"
                            >
                                {t('common.cancel')}
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={submitting || !currentPin || !newPin || !confirm}
                            className="flex-1 py-3.5 rounded-xl text-sm font-semibold uppercase tracking-[0.12em] text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)' }}
                        >
                            {submitting ? t('common.saving') : t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
