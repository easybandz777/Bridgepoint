'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { usePortalUser } from '@/lib/portal-context';
import { portalFetch } from '@/lib/portal-client';
import { DocumentList } from '@/components/portal/document-list';
import { DocumentUploadDialog } from '@/components/portal/document-upload-dialog';
import type { PortalDocumentItem } from '@/app/api/portal/documents/route';

interface DocumentsPayload {
    userType: 'employee' | 'subcontractor';
    documents: PortalDocumentItem[];
}

export default function PortalDocumentsPage() {
    const t = useT();
    const { user } = usePortalUser();
    const [data, setData] = useState<DocumentsPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const d = await portalFetch<DocumentsPayload>('/api/portal/documents');
            setData(d);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    async function handleDelete(id: string) {
        if (!window.confirm(t('documents.deleteConfirm'))) return;
        setDeletingId(id);
        try {
            await portalFetch(`/api/portal/documents/${id}`, { method: 'DELETE' });
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : t('documents.errorDeleting'));
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl mx-auto space-y-5">
            <header className="flex items-center justify-between gap-3">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                    {t('documents.title')}
                </h1>
                <button
                    type="button"
                    onClick={() => setUploadOpen(true)}
                    className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-[0.12em] text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)' }}
                >
                    <Plus size={14} />
                    {t('documents.uploadCta')}
                </button>
            </header>

            {loading && (
                <div className="flex items-center justify-center min-h-[40vh] text-white/45 gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">{t('common.loading')}</span>
                </div>
            )}

            {!loading && error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">
                    {t('documents.errorLoading')}
                    <p className="mt-2 text-xs text-red-300/70">{error}</p>
                </div>
            )}

            {!loading && !error && data && (
                <DocumentList
                    documents={data.documents}
                    onDelete={handleDelete}
                    deletingId={deletingId}
                />
            )}

            <DocumentUploadDialog
                open={uploadOpen}
                userType={user.userType}
                onClose={() => setUploadOpen(false)}
                onSuccess={() => {
                    setUploadOpen(false);
                    load();
                }}
            />
        </div>
    );
}
