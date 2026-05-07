'use client';

/**
 * /portal/setup
 *
 * Admin-only first-time setup page for the crew portal. Guarded by
 * the same <AdminAuth> wrapper used by /admin so it cannot be reached
 * by employees or subcontractors.
 *
 * The page lets the admin:
 *   1. Run POST /api/portal/seed to create default credentials.
 *   2. Run POST /api/portal/sample-data to populate demo content.
 *   3. Reset all PINs (POST /api/portal/seed?force=true).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    KeyRound,
    Database,
    AlertTriangle,
    Copy,
    CheckCircle2,
    Loader2,
    Users,
    ExternalLink,
    Sparkles,
    LogIn,
} from 'lucide-react';
import { AdminAuth } from '@/components/admin/admin-auth';

interface CredentialRow {
    user_type: 'employee' | 'subcontractor';
    user_id: string;
    email: string;
    name: string;
    phone: string | null;
    default_pin: string;
}

interface SeedResponse {
    ok: boolean;
    created: number;
    skipped: number;
    errors: { user: string; error: string }[];
    error?: string;
}

interface SampleDataResponse {
    ok: boolean;
    updatesCreated: number;
    messagesCreated: number;
    timeEntriesCreated: number;
    projectsTouched: number;
    employeesTouched: number;
    skipped: string[];
    error?: string;
}

export default function PortalSetupPage() {
    return (
        <AdminAuth>
            <SetupContent />
        </AdminAuth>
    );
}

function SetupContent() {
    const [seeding, setSeeding] = useState(false);
    const [seedResult, setSeedResult] = useState<SeedResponse | null>(null);
    const [credentials, setCredentials] = useState<CredentialRow[] | null>(null);
    const [credentialsError, setCredentialsError] = useState<string | null>(null);

    const [sampleLoading, setSampleLoading] = useState(false);
    const [sampleResult, setSampleResult] = useState<SampleDataResponse | null>(null);

    const [resetting, setResetting] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);
    const [resetResult, setResetResult] = useState<SeedResponse | null>(null);

    const [copied, setCopied] = useState<string | null>(null);

    const portalUrl = useMemo(() => {
        if (typeof window === 'undefined') return '';
        return `${window.location.origin}/portal`;
    }, []);

    // ── Load existing credentials so the admin can hand them out ─────────────
    const loadCredentials = useCallback(async () => {
        try {
            const res = await fetch('/api/portal/setup/credentials', { credentials: 'include' });
            if (res.ok) {
                const data = (await res.json()) as { credentials: CredentialRow[] };
                setCredentials(data.credentials);
                setCredentialsError(null);
                return;
            }
            // Endpoint is optional. If not present we just hide the table.
            setCredentialsError(null);
            setCredentials([]);
        } catch {
            setCredentialsError(null);
            setCredentials([]);
        }
    }, []);

    useEffect(() => {
        loadCredentials();
    }, [loadCredentials]);

    // ── Actions ──────────────────────────────────────────────────────────────
    async function runSeed(force = false) {
        const setLoading = force ? setResetting : setSeeding;
        const setResult = force ? setResetResult : setSeedResult;
        setLoading(true);
        setResult(null);
        try {
            const url = force ? '/api/portal/seed?force=true' : '/api/portal/seed';
            const res = await fetch(url, { method: 'POST' });
            const data = (await res.json()) as SeedResponse;
            setResult(data);
            if (data.ok) {
                await loadCredentials();
            }
        } catch (e) {
            setResult({ ok: false, created: 0, skipped: 0, errors: [], error: String(e) });
        } finally {
            setLoading(false);
            if (force) setConfirmReset(false);
        }
    }

    async function runSampleData() {
        setSampleLoading(true);
        setSampleResult(null);
        try {
            const res = await fetch('/api/portal/sample-data', { method: 'POST' });
            const data = (await res.json()) as SampleDataResponse;
            setSampleResult(data);
        } catch (e) {
            setSampleResult({
                ok: false,
                updatesCreated: 0,
                messagesCreated: 0,
                timeEntriesCreated: 0,
                projectsTouched: 0,
                employeesTouched: 0,
                skipped: [],
                error: String(e),
            });
        } finally {
            setSampleLoading(false);
        }
    }

    async function copyText(value: string, key: string) {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(key);
            setTimeout(() => setCopied((c) => (c === key ? null : c)), 1200);
        } catch {
            /* clipboard unavailable */
        }
    }

    return (
        <div
            className="min-h-screen bg-[#0f0f0f] text-white"
            style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(184,149,106,0.06) 0%, transparent 60%)' }}
        >
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="mb-10">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#b8956a] mb-2">
                        Bridgepointe · Admin
                    </p>
                    <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                        Crew Portal Setup
                    </h1>
                    <p className="text-sm text-white/55 max-w-xl leading-relaxed">
                        Run this once after deploying. It seeds login credentials for everyone on the team
                        and (optionally) loads demo content so the portal feels populated on first visit.
                    </p>
                </div>

                {/* ── Step 1: Seed credentials ───────────────────────────── */}
                <SetupCard
                    step={1}
                    icon={KeyRound}
                    title="Create credentials"
                    subtitle="Generates a portal account for every employee and subcontractor with an email. Default PIN is the last 4 digits of their phone (or 1234 if missing)."
                >
                    <button
                        type="button"
                        onClick={() => runSeed(false)}
                        disabled={seeding}
                        className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)', color: 'white' }}
                    >
                        {seeding ? (
                            <>
                                <Loader2 size={15} className="animate-spin" />
                                Seeding...
                            </>
                        ) : (
                            <>
                                <KeyRound size={15} />
                                Seed default PINs
                            </>
                        )}
                    </button>

                    {seedResult && (
                        <ResultPanel result={seedResult} kind="seed" />
                    )}

                    {credentials && credentials.length > 0 && (
                        <CredentialsTable
                            rows={credentials}
                            onCopy={copyText}
                            copied={copied}
                        />
                    )}
                    {credentials && credentials.length === 0 && !credentialsError && (
                        <p className="mt-4 text-xs text-white/40 italic">
                            No credentials to display yet. Click the button above to seed.
                        </p>
                    )}
                </SetupCard>

                {/* ── Step 2: Sample data ────────────────────────────────── */}
                <SetupCard
                    step={2}
                    icon={Database}
                    title="Add sample data (optional)"
                    subtitle="Loads a few demo project updates, crew announcements, and weekly time entries so new accounts see a populated portal. Idempotent — safe to run more than once."
                >
                    <button
                        type="button"
                        onClick={runSampleData}
                        disabled={sampleLoading}
                        className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer bg-white/8 hover:bg-white/12 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sampleLoading ? (
                            <>
                                <Loader2 size={15} className="animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <Sparkles size={15} />
                                Add sample updates and messages
                            </>
                        )}
                    </button>

                    {sampleResult && <SampleResultPanel result={sampleResult} />}
                </SetupCard>

                {/* ── Step 3: Danger / reset ─────────────────────────────── */}
                <SetupCard
                    step={3}
                    icon={AlertTriangle}
                    title="Reset all PINs"
                    subtitle="Wipes every existing PIN and re-applies the default phone-last-4 PIN, forcing each user to set a new one on next login. Use only if PINs need to be reissued."
                    danger
                >
                    {!confirmReset && (
                        <button
                            type="button"
                            onClick={() => setConfirmReset(true)}
                            className="inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30"
                        >
                            <AlertTriangle size={15} />
                            Reset all PINs
                        </button>
                    )}

                    {confirmReset && (
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
                            <p className="text-sm text-white mb-1 font-semibold">Are you sure?</p>
                            <p className="text-xs text-white/60 leading-relaxed mb-4">
                                This will replace the PIN of every existing portal account with their phone-last-4
                                default and end any active sessions on next change. Everyone will need to re-login.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => runSeed(true)}
                                    disabled={resetting}
                                    className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-xs font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                                >
                                    {resetting ? (
                                        <>
                                            <Loader2 size={13} className="animate-spin" />
                                            Resetting...
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle size={13} />
                                            Yes, reset all PINs
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirmReset(false)}
                                    disabled={resetting}
                                    className="inline-flex items-center h-10 px-4 rounded-full text-xs font-semibold uppercase tracking-[0.12em] cursor-pointer bg-white/8 hover:bg-white/12 text-white"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {resetResult && <ResultPanel result={resetResult} kind="reset" />}
                </SetupCard>

                {/* ── Footer: share with team ────────────────────────────── */}
                <div className="mt-10 rounded-3xl border border-white/8 bg-white/[0.02] p-6 sm:p-7">
                    <div className="flex items-center gap-3 mb-3">
                        <Users size={16} className="text-[#b8956a]" />
                        <h3 className="font-serif text-lg font-bold tracking-tight">Share with your team</h3>
                    </div>
                    <p className="text-sm text-white/55 mb-5 leading-relaxed">
                        When you&apos;re done, send your crew this URL. They sign in with their work email
                        and the default PIN listed above (last 4 digits of their phone).
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <code className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white/85 font-mono break-all">
                            {portalUrl || '/portal'}
                        </code>
                        <button
                            type="button"
                            onClick={() => copyText(portalUrl || '/portal', 'portal-url')}
                            className="inline-flex items-center justify-center gap-2 h-12 sm:h-auto px-4 rounded-xl text-xs font-semibold uppercase tracking-[0.12em] cursor-pointer bg-white/8 hover:bg-white/12 text-white"
                        >
                            {copied === 'portal-url' ? (
                                <>
                                    <CheckCircle2 size={14} className="text-emerald-400" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy size={14} />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                    <Link
                        href="/portal/login"
                        className="inline-flex items-center gap-2 text-sm text-[#b8956a] hover:text-[#d8b58a] transition-colors"
                    >
                        <LogIn size={14} />
                        Go to portal login
                        <ExternalLink size={12} />
                    </Link>
                </div>

            </div>
        </div>
    );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface SetupCardProps {
    step: number;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    title: string;
    subtitle: string;
    children: React.ReactNode;
    danger?: boolean;
}

function SetupCard({ step, icon: Icon, title, subtitle, children, danger }: SetupCardProps) {
    return (
        <section
            className={[
                'mb-6 rounded-3xl border p-6 sm:p-7',
                danger ? 'border-red-500/20 bg-red-500/[0.03]' : 'border-white/8 bg-[#1a1a1a]',
            ].join(' ')}
        >
            <div className="flex items-start gap-4 mb-5">
                <div
                    className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-2xl"
                    style={{
                        background: danger
                            ? 'rgba(239,68,68,0.15)'
                            : 'rgba(184,149,106,0.15)',
                    }}
                >
                    <Icon size={18} className={danger ? 'text-red-400' : 'text-[#b8956a]'} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-1">
                        Step {step}
                    </p>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight mb-2">
                        {title}
                    </h2>
                    <p className="text-sm text-white/55 leading-relaxed">{subtitle}</p>
                </div>
            </div>
            <div>{children}</div>
        </section>
    );
}

function ResultPanel({ result, kind }: { result: SeedResponse; kind: 'seed' | 'reset' }) {
    if (!result.ok) {
        return (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                Failed to {kind === 'reset' ? 'reset' : 'seed'} credentials.{' '}
                {result.error ? <span className="text-white/60">{result.error}</span> : null}
            </div>
        );
    }
    return (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <p className="text-sm text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 size={14} />
                {kind === 'reset' ? 'PINs reset.' : 'Credentials seeded.'}
            </p>
            <p className="mt-1 text-xs text-white/55">
                {result.created} created · {result.skipped} skipped · {result.errors.length} errors
            </p>
            {result.errors.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-red-300">
                    {result.errors.slice(0, 5).map((e, i) => (
                        <li key={i}>{e.user}: {e.error}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function SampleResultPanel({ result }: { result: SampleDataResponse }) {
    if (!result.ok) {
        return (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                Failed to load sample data.{' '}
                {result.error ? <span className="text-white/60">{result.error}</span> : null}
            </div>
        );
    }
    return (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <p className="text-sm text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 size={14} />
                Sample data ready.
            </p>
            <p className="mt-1 text-xs text-white/55">
                {result.updatesCreated} updates · {result.messagesCreated} messages ·{' '}
                {result.timeEntriesCreated} time entries
            </p>
            {result.skipped.length > 0 && (
                <p className="mt-1 text-[11px] text-white/40">
                    Skipped: {result.skipped.length} item(s) already had data.
                </p>
            )}
        </div>
    );
}

function CredentialsTable({
    rows,
    onCopy,
    copied,
}: {
    rows: CredentialRow[];
    onCopy: (value: string, key: string) => void;
    copied: string | null;
}) {
    return (
        <div className="mt-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-3 font-semibold">
                Default credentials
            </p>
            <div className="rounded-2xl border border-white/8 overflow-hidden">
                <div className="hidden sm:grid grid-cols-[1fr_1fr_120px_80px] gap-3 px-4 py-3 bg-white/[0.03] border-b border-white/8 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Default PIN</div>
                    <div className="text-right">Copy</div>
                </div>
                <ul className="divide-y divide-white/6">
                    {rows.map((r) => {
                        const key = `${r.user_type}:${r.user_id}`;
                        const text = `${r.email} → ${r.default_pin}`;
                        return (
                            <li
                                key={key}
                                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_80px] gap-1 sm:gap-3 px-4 py-3 items-center"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm text-white truncate">{r.name || '—'}</p>
                                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/35 sm:hidden">
                                        {r.user_type}
                                    </p>
                                </div>
                                <div className="text-xs text-white/65 truncate">{r.email}</div>
                                <div className="text-sm font-mono text-[#b8956a]">{r.default_pin}</div>
                                <div className="sm:text-right">
                                    <button
                                        type="button"
                                        onClick={() => onCopy(text, key)}
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55 hover:text-white transition-colors"
                                    >
                                        {copied === key ? (
                                            <>
                                                <CheckCircle2 size={12} className="text-emerald-400" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={12} />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
