'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { SubTabNav } from '@/components/admin/sub-tab-nav';
import { FileCheck, ShieldAlert, Plus, FileText, Calendar, Trash2, AlertCircle, Check } from 'lucide-react';
import { useSub } from '../use-sub';
import type { DocumentType, RequiredDocument } from '@/lib/subcontractors';

const DOC_TYPES: DocumentType[] = ['W-9', 'COI', 'License', 'Agreement', 'Other'];

function chipForDoc(d: RequiredDocument): { label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' } {
    if (d.expiryDate) {
        const days = Math.floor((new Date(d.expiryDate).getTime() - Date.now()) / 86_400_000);
        if (Number.isNaN(days)) return { label: 'Unverified', tone: 'neutral' };
        if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, tone: 'bad' };
        if (days <= 30) return { label: `Expires in ${days}d`, tone: 'warn' };
    }
    if (d.verified) return { label: 'Verified', tone: 'good' };
    return { label: 'Unverified', tone: 'neutral' };
}

const TONE_CLASSES = {
    good: 'bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20',
    warn: 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20',
    bad: 'bg-[#f87171]/10 text-[#f87171] border-[#f87171]/20',
    neutral: 'bg-white/5 text-white/50 border-white/10',
} as const;

export default function SubcontractorDocumentsPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const subState = useSub(id);

    const [showAdd, setShowAdd] = useState(false);
    const [adding, setAdding] = useState(false);
    const [type, setType] = useState<DocumentType>('COI');
    const [filename, setFilename] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [verified, setVerified] = useState(false);
    const [docs, setDocs] = useState<RequiredDocument[] | null>(null);
    const [busy, setBusy] = useState<string | null>(null);

    if (subState.phase === 'loading') {
        return <div className="flex justify-center py-32"><div className="w-6 h-6 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" /></div>;
    }
    if (subState.phase === 'notfound') return <p className="text-center text-white/40 py-32">Subcontractor not found.</p>;
    if (subState.phase === 'error') {
        return (
            <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-300 flex items-start gap-3 max-w-xl mx-auto mt-12">
                <AlertCircle size={20} className="shrink-0 mt-0.5" /><div>{subState.error}</div>
            </div>
        );
    }

    const sub = subState.sub;
    const documents = docs ?? sub.documents;

    async function addDoc() {
        if (!id || !filename.trim()) return;
        setAdding(true);
        try {
            const res = await fetch(`/api/subcontractors/${id}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    filename: filename.trim(),
                    expiryDate: expiryDate || null,
                    verified,
                    uploadedDate: new Date().toISOString().split('T')[0],
                }),
            });
            const body = (await res.json()) as { document?: RequiredDocument; error?: string };
            if (!res.ok || !body.document) throw new Error(body.error ?? 'Failed');
            setDocs([...documents, body.document]);
            setShowAdd(false);
            setFilename('');
            setExpiryDate('');
            setVerified(false);
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to add document');
        } finally {
            setAdding(false);
        }
    }

    async function verifyDoc(docId: string) {
        if (!id) return;
        setBusy(docId);
        try {
            const res = await fetch(`/api/subcontractors/${id}/documents/${docId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verified: true }),
            });
            const body = (await res.json()) as { document?: RequiredDocument; error?: string };
            if (!res.ok || !body.document) throw new Error(body.error ?? 'Failed');
            setDocs(documents.map((d) => (d.id === docId ? body.document! : d)));
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed');
        } finally {
            setBusy(null);
        }
    }

    async function deleteDoc(docId: string) {
        if (!id || !confirm('Delete this document?')) return;
        setBusy(docId);
        try {
            const res = await fetch(`/api/subcontractors/${id}/documents/${docId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            setDocs(documents.filter((d) => d.id !== docId));
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed');
        } finally {
            setBusy(null);
        }
    }

    const required: { type: DocumentType; label: string; subtitle: string }[] = [
        { type: 'W-9', label: 'W-9 Form', subtitle: 'Taxpayer identification' },
        { type: 'COI', label: 'Certificate of Insurance', subtitle: 'GL + WC coverage' },
        { type: 'Agreement', label: 'Master Subcontractor Agreement', subtitle: 'Signed terms & conditions' },
    ];

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-white mb-1">{sub.companyName}</h1>
                    <p className="text-sm text-white/50">Compliance Documents & Licenses</p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors"
                >
                    <Plus size={16} /> Add Document
                </button>
            </div>

            <SubTabNav subId={sub.id} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Required */}
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-6">Required Documents</h2>
                    <div className="space-y-3">
                        {required.map((req) => {
                            const doc = documents.find((d) => d.type === req.type);
                            const ok = doc && doc.verified && (req.type !== 'COI' || !sub.compliance.coiExpired);
                            return (
                                <div key={req.type} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        {ok ? <FileCheck className="text-[#34d399]" size={20} /> : <ShieldAlert className="text-red-400" size={20} />}
                                        <div>
                                            <p className="text-sm font-medium text-white">{req.label}</p>
                                            <p className="text-xs text-white/40 mt-0.5">{req.subtitle}</p>
                                            {doc?.expiryDate && (
                                                <p className="flex items-center gap-1 text-xs text-white/40 mt-1">
                                                    <Calendar size={11} /> Expires {doc.expiryDate}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {doc ? (
                                        <span className={`text-xs font-semibold border px-2 py-1 rounded ${TONE_CLASSES[chipForDoc(doc).tone]}`}>
                                            {chipForDoc(doc).label}
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => { setType(req.type); setShowAdd(true); }}
                                            className="text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c]"
                                        >
                                            Add
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Vault */}
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-6">Document Vault</h2>
                    {documents.length === 0 ? (
                        <p className="text-sm text-white/40 text-center py-12">No documents on file yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {documents.map((d) => {
                                const chip = chipForDoc(d);
                                return (
                                    <div key={d.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors group border border-transparent hover:border-white/5">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#b8956a] transition-colors shrink-0">
                                                <FileText size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{d.filename}</p>
                                                <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">
                                                    {d.type} {d.uploadedDate && `• ${d.uploadedDate}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-[10px] font-semibold border px-2 py-1 rounded uppercase ${TONE_CLASSES[chip.tone]}`}>
                                                {chip.label}
                                            </span>
                                            {!d.verified && (
                                                <button
                                                    onClick={() => void verifyDoc(d.id)}
                                                    disabled={busy === d.id}
                                                    title="Mark verified"
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-[#34d399] hover:bg-[#34d399]/10 transition-all disabled:opacity-50"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => void deleteDoc(d.id)}
                                                disabled={busy === d.id}
                                                title="Delete"
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {showAdd && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md">
                        <h3 className="font-serif text-lg font-bold text-white mb-4">Add Document</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as DocumentType)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                                >
                                    {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Filename *</label>
                                <input
                                    type="text"
                                    value={filename}
                                    onChange={(e) => setFilename(e.target.value)}
                                    placeholder="e.g. W9_2026.pdf"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Expiry Date</label>
                                <input
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                                />
                            </div>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={verified}
                                    onChange={(e) => setVerified(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm text-white/70">Mark as verified</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-white/60 hover:text-white">Cancel</button>
                            <button
                                onClick={() => void addDoc()}
                                disabled={!filename.trim() || adding}
                                className="px-5 py-2 bg-[#b8956a] text-black text-sm font-semibold rounded-full hover:bg-[#cbb08c] disabled:opacity-50"
                            >
                                {adding ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
