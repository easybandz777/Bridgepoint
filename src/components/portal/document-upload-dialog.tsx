'use client';

import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { portalFetch } from '@/lib/portal-client';

const EMPLOYEE_DOC_TYPES = [
    'W-4',
    'I-9',
    'Direct Deposit',
    'Background Check',
    'Drug Test',
    'OSHA-10',
    'OSHA-30',
    'Lead-Safe',
    'EPA',
    'License',
    'Other',
];

const SUB_DOC_TYPES = ['W-9', 'COI', 'License', 'Agreement', 'Other'];

interface DocumentUploadDialogProps {
    open: boolean;
    userType: 'employee' | 'subcontractor';
    onClose: () => void;
    onSuccess: () => void;
}

// File upload is URL-based. Crew member pastes a URL of a file they uploaded
// elsewhere (Google Drive, Dropbox, etc); the office verifies the document.
export function DocumentUploadDialog({
    open,
    userType,
    onClose,
    onSuccess,
}: DocumentUploadDialogProps) {
    const t = useT();
    const types = userType === 'employee' ? EMPLOYEE_DOC_TYPES : SUB_DOC_TYPES;

    const [docType, setDocType] = useState(types[0]);
    const [filename, setFilename] = useState('');
    const [url, setUrl] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    function reset() {
        setDocType(types[0]);
        setFilename('');
        setUrl('');
        setExpiryDate('');
        setNotes('');
        setError(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await portalFetch('/api/portal/documents', {
                method: 'POST',
                body: JSON.stringify({
                    docType,
                    filename: filename.trim(),
                    url: url.trim(),
                    expiryDate: expiryDate || null,
                    notes: notes.trim(),
                }),
            });
            reset();
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('documents.errorSaving'));
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
                        <Upload size={16} className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-serif text-lg text-white leading-tight">
                            {t('documents.uploadTitle')}
                        </h2>
                        <p className="text-xs text-white/40 mt-0.5">{t('documents.uploadIntro')}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <Field label={t('documents.docTypeLabel')}>
                        <select
                            value={docType}
                            onChange={(e) => setDocType(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 transition-all"
                        >
                            {types.map(opt => (
                                <option key={opt} value={opt} className="bg-[#1a1a1a]">{opt}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label={t('documents.filenameLabel')}>
                        <input
                            type="text"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base sm:text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 transition-all"
                            placeholder="W-4 2026.pdf"
                        />
                    </Field>

                    <Field label={t('documents.urlLabel')}>
                        <input
                            type="url"
                            inputMode="url"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base sm:text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 transition-all"
                            placeholder="https://"
                        />
                    </Field>

                    <Field label={`${t('documents.expiryLabel')} (${t('common.optional').toLowerCase()})`}>
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 transition-all"
                        />
                    </Field>

                    <Field label={`${t('documents.notesLabel')} (${t('common.optional').toLowerCase()})`}>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 transition-all resize-none"
                        />
                    </Field>

                    {error && (
                        <p className="text-xs text-red-400 flex items-center gap-2">
                            <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                            {error}
                        </p>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => { reset(); onClose(); }}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold uppercase tracking-[0.12em] text-white/60 border border-white/10 hover:bg-white/5 hover:text-white transition-all"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !filename.trim()}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold uppercase tracking-[0.12em] text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)' }}
                        >
                            {submitting && <Loader2 size={14} className="animate-spin" />}
                            {submitting ? t('common.uploading') : t('common.upload')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                {label}
            </span>
            {children}
        </label>
    );
}
