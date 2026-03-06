'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const ADMIN_PASSWORD = 'bridgepoint2024';
const SESSION_KEY = 'bp_admin_auth';

export function AdminAuth({ children }: { children: React.ReactNode }) {
    const [authed, setAuthed] = useState(false);
    const [password, setPassword] = useState('');
    const [show, setShow] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored === 'true') setAuthed(true);
        setChecking(false);
    }, []);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setTimeout(() => {
            if (password === ADMIN_PASSWORD) {
                sessionStorage.setItem(SESSION_KEY, 'true');
                setAuthed(true);
            } else {
                setError('Incorrect password. Please try again.');
                setPassword('');
            }
            setLoading(false);
        }, 600);
    }

    if (checking) return (
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
        </div>
    );
    if (authed) return <>{children}</>;

    return (
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4"
            style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(184,149,106,0.08) 0%, transparent 60%)' }}>
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
                        style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)' }}>
                        <Lock size={22} className="text-white" />
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-white tracking-tight mb-1">
                        Bridgepoint
                    </h1>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b8956a]">
                        Admin Portal
                    </p>
                </div>

                {/* Card */}
                <div className="bg-[#1a1a1a] border border-white/8 rounded-2xl p-8 shadow-2xl">
                    <div className="mb-6">
                        <h2 className="font-serif text-xl text-white mb-1">Secure Access</h2>
                        <p className="text-sm text-white/40">Enter your admin password to continue.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <input
                                type={show ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Admin password"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/25 text-sm
                           focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 transition-all pr-12"
                                required
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShow(!show)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                            >
                                {show ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        {error && (
                            <p className="text-xs text-red-400 flex items-center gap-2">
                                <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full py-3.5 rounded-xl font-sans text-sm font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer
                         disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)', color: 'white' }}
                        >
                            {loading ? 'Verifying...' : 'Access Admin'}
                        </button>
                    </form>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-white/20 text-xs">
                    <ShieldCheck size={13} />
                    <span>Protected area · Authorized personnel only</span>
                </div>
            </div>
        </div>
    );
}
