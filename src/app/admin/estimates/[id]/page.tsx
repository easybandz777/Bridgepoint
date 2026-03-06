import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import { ProposalDocument } from '@/components/admin/proposal-document';
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

    return (
        <div className="p-8">
            <Link href="/admin/estimates"
                className="inline-flex items-center gap-2 text-xs font-semibold text-white/30 hover:text-white/60 uppercase tracking-wider mb-8 transition-colors print:hidden">
                <ArrowLeft size={13} /> Back to Estimates
            </Link>
            <ProposalDocument estimate={estimate} />
        </div>
    );
}
