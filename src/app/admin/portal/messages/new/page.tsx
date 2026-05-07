'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Info, Bell, AlertTriangle, Users, User, UserCheck } from 'lucide-react';

type Audience = 'all' | 'employees' | 'subcontractors' | 'individual';
type Level = 'info' | 'important' | 'urgent';

interface PickerOption {
    id: string;
    label: string;
    sub?: string;
}

export default function ComposeAnnouncementPage() {
    const router = useRouter();
    const [audience, setAudience] = useState<Audience>('all');
    const [level, setLevel] = useState<Level>('info');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [recipientType, setRecipientType] = useState<'employee' | 'subcontractor'>('employee');
    const [recipientId, setRecipientId] = useState('');
    const [employees, setEmployees] = useState<PickerOption[]>([]);
    const [subs, setSubs] = useState<PickerOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (audience !== 'individual') return;
        let cancelled = false;
        (async () => {
            try {
                const [eRes, sRes] = await Promise.all([
                    fetch('/api/employees', { cache: 'no-store' }),
                    fetch('/api/subcontractors', { cache: 'no-store' }),
                ]);
                if (cancelled) return;
                if (eRes.ok) {
                    const list = (await eRes.json()) as Array<{ id: string; first_name?: string; last_name?: string; role?: string }>;
                    setEmployees(
                        Array.isArray(list)
                            ? list.map((r) => ({
                                  id: r.id,
                                  label: `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || r.id,
                                  sub: r.role,
                              }))
                            : [],
                    );
                }
                if (sRes.ok) {
                    const list = (await sRes.json()) as Array<{ id: string; company_name?: string; contact_person?: string }>;
                    setSubs(
                        Array.isArray(list)
                            ? list.map((r) => ({
                                  id: r.id,
                                  label: r.company_name ?? r.id,
                                  sub: r.contact_person,
                              }))
                            : [],
                    );
                }
            } catch {
                // ignored
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [audience]);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!body.trim()) {
            setError('Body is required.');
            return;
        }
        if (audience === 'individual' && !recipientId) {
            setError('Pick a recipient.');
            return;
        }
        setSubmitting(true);
        try {
            const r = await fetch('/api/admin/portal/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audience,
                    recipientType: audience === 'individual' ? recipientType : undefined,
                    recipientId: audience === 'individual' ? recipientId : undefined,
                    subject: subject.trim(),
                    body: body.trim(),
                    level,
                }),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
            router.push('/admin/portal/messages');
        } catch (e) {
            setError(String(e));
            setSubmitting(false);
        }
    }

    const options = recipientType === 'employee' ? employees : subs;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
            <Link
                href="/admin/portal/messages"
                className="inline-flex items-center gap-2 text-xs font-semibold text-white/40 hover:text-white/70 transition-colors mb-6"
            >
                <ArrowLeft size={13} />
                Back to announcements
            </Link>

            <div className="mb-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] mb-1">Crew Portal</p>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">Send Announcement</h1>
                <p className="text-sm text-white/50">
                    Push a message to the crew portal. Pick the audience, set the urgency, and include enough context.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-6">
                {/* Audience */}
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-3">Audience</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <AudienceTile
                            active={audience === 'all'}
                            onClick={() => setAudience('all')}
                            icon={Users}
                            label="Everyone"
                        />
                        <AudienceTile
                            active={audience === 'employees'}
                            onClick={() => setAudience('employees')}
                            icon={UserCheck}
                            label="Employees"
                        />
                        <AudienceTile
                            active={audience === 'subcontractors'}
                            onClick={() => setAudience('subcontractors')}
                            icon={Users}
                            label="Subcontractors"
                        />
                        <AudienceTile
                            active={audience === 'individual'}
                            onClick={() => setAudience('individual')}
                            icon={User}
                            label="Individual"
                        />
                    </div>

                    {audience === 'individual' && (
                        <div className="mt-4 space-y-3">
                            <div className="flex gap-2">
                                {(['employee', 'subcontractor'] as const).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => {
                                            setRecipientType(t);
                                            setRecipientId('');
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                            recipientType === t
                                                ? 'bg-white/15 text-white'
                                                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                                        }`}
                                    >
                                        {t === 'employee' ? 'Employees' : 'Subcontractors'}
                                    </button>
                                ))}
                            </div>
                            <select
                                value={recipientId}
                                onChange={(e) => setRecipientId(e.target.value)}
                                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-[#b8956a]/60"
                            >
                                <option value="">Pick a recipient…</option>
                                {options.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.label}{o.sub ? ` — ${o.sub}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Level */}
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-3">Level</p>
                    <div className="grid grid-cols-3 gap-2">
                        <LevelTile
                            active={level === 'info'}
                            onClick={() => setLevel('info')}
                            icon={Info}
                            label="Info"
                            color="#60a5fa"
                        />
                        <LevelTile
                            active={level === 'important'}
                            onClick={() => setLevel('important')}
                            icon={Bell}
                            label="Important"
                            color="#fbbf24"
                        />
                        <LevelTile
                            active={level === 'urgent'}
                            onClick={() => setLevel('urgent')}
                            icon={AlertTriangle}
                            label="Urgent"
                            color="#f87171"
                        />
                    </div>
                </div>

                {/* Subject + body */}
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 space-y-4">
                    <div>
                        <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-2 block">
                            Subject
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Schedule update for Tuesday..."
                            maxLength={140}
                            className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#b8956a]/60"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-2 block">
                            Body <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Write the message here. Plain text. Will appear on every recipient's portal feed."
                            rows={8}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#b8956a]/60 resize-y"
                            required
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-end gap-3">
                    <Link
                        href="/admin/portal/messages"
                        className="h-11 px-5 rounded-xl text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-colors flex items-center"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting || !body.trim()}
                        className="h-11 px-6 rounded-xl text-sm font-semibold bg-[#b8956a] text-black hover:bg-[#cbb08c] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <Send size={14} />
                        {submitting ? 'Sending…' : 'Send announcement'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function AudienceTile({
    active,
    onClick,
    icon: Icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: typeof Users;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`p-3 rounded-xl border transition-colors flex flex-col items-center gap-2 ${
                active
                    ? 'border-[#b8956a]/50 bg-[#b8956a]/10 text-white'
                    : 'border-white/10 bg-white/[0.02] text-white/55 hover:bg-white/5 hover:text-white'
            }`}
        >
            <Icon size={16} />
            <span className="text-xs font-semibold">{label}</span>
        </button>
    );
}

function LevelTile({
    active,
    onClick,
    icon: Icon,
    label,
    color,
}: {
    active: boolean;
    onClick: () => void;
    icon: typeof Info;
    label: string;
    color: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`p-3 rounded-xl border transition-colors flex items-center justify-center gap-2 text-xs font-semibold ${
                active ? '' : 'border-white/10 bg-white/[0.02] text-white/55 hover:bg-white/5 hover:text-white'
            }`}
            style={
                active
                    ? { background: `${color}18`, color, borderColor: `${color}50` }
                    : undefined
            }
        >
            <Icon size={14} />
            {label}
        </button>
    );
}
