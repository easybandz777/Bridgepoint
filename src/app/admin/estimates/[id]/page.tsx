import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import { ProposalDocument } from '@/components/admin/proposal-document';
import { QbSyncButton } from '@/components/admin/qb-sync-button';
import { QbStatusPill } from '@/components/admin/qb-status-pill';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEstimate(r: any) {
    return {
        id: r.id, estimateNumber: r.estimate_number, status: r.status,
        createdDate: r.created_date, sentDate: r.sent_date, validUntil: r.valid_until,
        client: r.client, project: r.project, lineItems: r.line_items,
        subtotal: Number(r.subtotal), taxRate: Number(r.tax_rate), taxAmount: Number(r.tax_amount), total: Number(r.total),
        paymentSchedule: r.payment_schedule, terms: r.terms, notes: r.notes, preparedBy: r.prepared_by,
    };
}

export default async function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const rows = await sql`SELECT * FROM estimates WHERE id = ${id}`;
    if (!rows.length) notFound();
    const estimate = rowToEstimate(rows[0]);
    const qbId = (rows[0] as { qb_id?: string | null }).qb_id ?? null;
    const qbSyncedAt = (rows[0] as { qb_synced_at?: string | null }).qb_synced_at ?? null;

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8 print:hidden">
                <Link href="/admin/estimates"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-white/30 hover:text-white/60 uppercase tracking-wider transition-colors">
                    <ArrowLeft size={13} /> Back to Estimates
                </Link>
                <div className="flex items-center gap-3">
                    <QbStatusPill qbId={qbId} lastSyncedAt={qbSyncedAt} />
                    <QbSyncButton entityType="estimate" entityId={id} size="sm" />
                </div>
            </div>
            <ProposalDocument estimate={estimate} />
        </div>
    );
}
