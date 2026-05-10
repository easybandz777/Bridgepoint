'use client';

import { useEffect, useState } from 'react';
import {
    KeyRound,
    Mail,
    Clock,
    Power,
    PowerOff,
    RefreshCw,
    Copy,
    Check,
    LogOut,
    AlertTriangle,
    ShieldCheck,
} from 'lucide-react';

type UserType = 'employee' | 'subcontractor';

interface CredentialView {
    exists: boolean;
    credentialId?: string;
    email: string;
    recordEmail?: string;
    enabled?: boolean;
    mustChangePin?: boolean;
    lastLoginAt?: string | null;
    failedAttempts?: number;
    lockedUntil?: string | null;
}

interface PortalAccessCardProps {
    userType: UserType;
    userId: string;
    recordEmail: string | null;
}

function fmtDateTime(iso: string | null | undefined): string {
    if (!iso) return 'Never';
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return '—';
    return d.toLocaleString();
}

export function PortalAccessCard({ userType, userId, recordEmail }: PortalAccessCardProps) {
    const [cred, setCred] = useState<CredentialView | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [issuedPin, setIssuedPin] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [customMode, setCustomMode] = useState(false);
    const [customPin, setCustomPin] = useState('');

    const userLabel = userType === 'employee' ? 'employee' : 'sub';

    async function load() {
        setLoading(true);
        setErr(null);
        try {
            const r = await fetch(`/api/admin/portal/credentials/by-user/${userType}/${userId}`, { cache: 'no-store' });
            const j = (await r.json()) as CredentialView | { error: string };
            if ('error' in j) {
                setErr(j.error);
                setCred(null);
            } else {
                setCred(j);
            }
        } catch (e) {
            setErr(String(e));
        }
        setLoading(false);
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userType, userId]);

    // Pick up a PIN that was just issued in the create-employee/sub flow.
    useEffect(() => {
        try {
            const key = `bp_admin_issued_pin_${userType}_${userId}`;
            const pin = sessionStorage.getItem(key);
            if (pin) {
                setIssuedPin(pin);
                sessionStorage.removeItem(key);
            }
        } catch {}
    }, [userType, userId]);

    async function createCredential() {
        if (!recordEmail) {
            setErr('Add an email to the record before issuing portal access.');
            return;
        }
        const newPin = `${Math.floor(100000 + Math.random() * 900000)}`;
        setBusy(true);
        setErr(null);
        try {
            const r = await fetch(`/api/admin/portal/credentials/by-user/${userType}/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: newPin, enabled: true, mustChangePin: true }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
            setIssuedPin(newPin);
            await load();
        } catch (e) {
            setErr(String(e));
        }
        setBusy(false);
    }

    async function patch(payload: Record<string, unknown>) {
        if (!cred?.credentialId) return;
        setBusy(true);
        setErr(null);
        try {
            const r = await fetch(`/api/admin/portal/credentials/${cred.credentialId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
            if (j.issuedPin) {
                setIssuedPin(String(j.issuedPin));
            }
            await load();
        } catch (e) {
            setErr(String(e));
        }
        setBusy(false);
    }

    async function copyPin() {
        if (!issuedPin) return;
        try {
            await navigator.clipboard.writeText(issuedPin);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // ignore
        }
    }

    if (loading) {
        return (
            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 animate-pulse">
                <div className="h-5 w-32 bg-white/5 rounded mb-4" />
                <div className="space-y-3">
                    <div className="h-10 bg-white/5 rounded-xl" />
                    <div className="h-10 bg-white/5 rounded-xl" />
                    <div className="h-10 bg-white/5 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <KeyRound size={16} className="text-[#b8956a]" />
                    <h2 className="font-serif text-base font-semibold text-white">Portal Access</h2>
                </div>
                {cred?.exists && (
                    <span
                        className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${
                            cred.enabled
                                ? 'bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20'
                                : 'bg-white/5 text-white/40 border-white/10'
                        }`}
                    >
                        {cred.enabled ? 'Active' : 'Disabled'}
                    </span>
                )}
            </div>

            <div className="p-6 space-y-5">
                {err && (
                    <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-300 flex items-start gap-2">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <span>{err}</span>
                    </div>
                )}

                {issuedPin && (
                    <div className="p-4 rounded-xl border border-[#34d399]/30 bg-[#34d399]/5">
                        <div className="flex items-start gap-3">
                            <ShieldCheck size={18} className="text-[#34d399] shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-[#34d399] uppercase tracking-wider mb-1">
                                    New PIN issued
                                </p>
                                <p className="text-[11px] text-white/60 mb-3">
                                    Send this PIN to the user via SMS or in person — it won&apos;t be shown again.
                                </p>
                                <div className="flex items-center gap-3">
                                    <code className="px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-2xl font-mono font-bold text-white tracking-[0.3em]">
                                        {issuedPin}
                                    </code>
                                    <button
                                        onClick={copyPin}
                                        className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                                    >
                                        {copied ? <Check size={13} className="text-[#34d399]" /> : <Copy size={13} />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                    <button
                                        onClick={() => setIssuedPin(null)}
                                        className="text-[11px] font-semibold text-white/40 hover:text-white/70 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Email row */}
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-2">Email</p>
                    <div className="flex items-center gap-3 p-3 bg-black/20 border border-white/6 rounded-xl">
                        <Mail size={14} className="text-white/40 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                                {cred?.email || recordEmail || '—'}
                            </p>
                            <p className="text-[11px] text-white/35 mt-0.5">
                                Email comes from the {userLabel} record.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Last login row */}
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-2">Last login</p>
                    <div className="flex items-center gap-3 p-3 bg-black/20 border border-white/6 rounded-xl">
                        <Clock size={14} className="text-white/40 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white">
                                {cred?.exists ? fmtDateTime(cred.lastLoginAt ?? null) : 'No credential on file'}
                            </p>
                            {cred?.exists && cred.failedAttempts != null && cred.failedAttempts > 0 && (
                                <p className="text-[11px] text-amber-400 mt-0.5">
                                    {cred.failedAttempts} failed attempt(s)
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {!cred?.exists ? (
                    <div className="pt-2">
                        <button
                            onClick={createCredential}
                            disabled={busy || !recordEmail}
                            className="w-full h-11 rounded-xl text-sm font-semibold bg-[#b8956a] text-black hover:bg-[#cbb08c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <KeyRound size={14} />
                            {busy ? 'Issuing…' : 'Create Portal Access'}
                        </button>
                        {!recordEmail && (
                            <p className="text-[11px] text-amber-400 mt-2 text-center">
                                Add an email to the {userLabel} record first.
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Enabled toggle */}
                        <div className="flex items-center justify-between p-3 bg-black/20 border border-white/6 rounded-xl">
                            <div>
                                <p className="text-sm font-semibold text-white">Status</p>
                                <p className="text-[11px] text-white/40">
                                    {cred.enabled ? 'User can log in' : 'Login is blocked'}
                                </p>
                            </div>
                            <button
                                onClick={() => patch({ enabled: !cred.enabled })}
                                disabled={busy}
                                className={`h-9 px-4 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
                                    cred.enabled
                                        ? 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                                        : 'bg-[#34d399] text-black hover:bg-[#5ee2af]'
                                }`}
                            >
                                {cred.enabled ? <PowerOff size={13} /> : <Power size={13} />}
                                {cred.enabled ? 'Disable' : 'Enable'}
                            </button>
                        </div>

                        {/* Force PIN change toggle */}
                        <div className="flex items-center justify-between p-3 bg-black/20 border border-white/6 rounded-xl">
                            <div>
                                <p className="text-sm font-semibold text-white">Force PIN change on next login</p>
                                <p className="text-[11px] text-white/40">
                                    {cred.mustChangePin ? 'User will be prompted on next login' : 'User can keep current PIN'}
                                </p>
                            </div>
                            <button
                                onClick={() => patch({ mustChangePin: !cred.mustChangePin })}
                                disabled={busy}
                                className={`h-9 px-4 rounded-xl text-xs font-semibold transition-colors ${
                                    cred.mustChangePin
                                        ? 'bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/25 hover:bg-[#fbbf24]/25'
                                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                                }`}
                            >
                                {cred.mustChangePin ? 'Required' : 'Not required'}
                            </button>
                        </div>

                        {/* Reset PIN */}
                        <div className="pt-2 border-t border-white/6 space-y-3">
                            <button
                                onClick={() => patch({ resetPin: true })}
                                disabled={busy}
                                className="w-full h-11 rounded-xl text-sm font-semibold bg-[#b8956a] text-black hover:bg-[#cbb08c] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
                                {busy ? 'Working…' : 'Generate New PIN'}
                            </button>

                            <button
                                onClick={() => setCustomMode((v) => !v)}
                                className="w-full text-[11px] font-semibold text-white/40 hover:text-white/70 transition-colors"
                            >
                                {customMode ? 'Hide custom PIN' : 'Set custom PIN'}
                            </button>

                            {customMode && (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        autoComplete="one-time-code"
                                        placeholder="4-12 digits"
                                        value={customPin}
                                        onChange={(e) => setCustomPin(e.target.value.replace(/\D+/g, ''))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-base sm:text-sm font-mono focus:outline-none focus:border-[#b8956a]/60"
                                    />
                                    <button
                                        onClick={() => {
                                            patch({ resetPin: true, newPin: customPin });
                                            setCustomPin('');
                                            setCustomMode(false);
                                        }}
                                        disabled={busy || customPin.length < 4 || customPin.length > 12}
                                        className="w-full h-10 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                                    >
                                        Save Custom PIN
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Revoke sessions */}
                        <div className="pt-2 border-t border-white/6">
                            <button
                                onClick={() => patch({ revokeSessions: true })}
                                disabled={busy}
                                className="w-full h-10 rounded-xl text-xs font-semibold bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <LogOut size={13} />
                                Revoke All Active Sessions
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
