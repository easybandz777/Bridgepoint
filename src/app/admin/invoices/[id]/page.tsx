import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import { InvoiceDocument } from '@/components/admin/invoice-document';
import { InvoicePaymentsCard } from '@/components/admin/invoice-payments-card';
import { QbSyncButton } from '@/components/admin/qb-sync-button';
import { QbStatusPill } from '@/components/admin/qb-status-pill';
import { listPayments } from '@/lib/stripe/payments';
import { getAppUrl } from '@/lib/stripe/client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInvoice(r: any) {
    return {
        id: r.id, invoiceNumber: r.invoice_number, estimateRef: r.estimate_ref,
        status: r.status, issuedDate: r.issued_date, dueDate: r.due_date, paidDate: r.paid_date,
        client: r.client, project: r.project, lineItems: r.line_items,
        subtotal: Number(r.subtotal), taxRate: Number(r.tax_rate), taxAmount: Number(r.tax_amount), total: Number(r.total),
        amountPaid: Number(r.amount_paid), amountDue: Number(r.amount_due),
        paymentInstructions: r.payment_instructions, notes: r.notes,
    };
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const rows = await sql`SELECT * FROM invoices WHERE id = ${id}`;
    if (!rows.length) notFound();
    const invoice = rowToInvoice(rows[0]);
    const qbId = (rows[0] as { qb_id?: string | null }).qb_id ?? null;
    const qbSyncedAt = (rows[0] as { qb_synced_at?: string | null }).qb_synced_at ?? null;

    // Pre-fetch payments server-side so the card paints with data on first render.
    // Swallow errors so the page still renders if the payments table is missing
    // in this environment — the card will retry client-side.
    let initialPayments;
    try {
        initialPayments = await listPayments({ invoiceId: id });
    } catch (e) {
        console.error('[admin/invoices/[id]] listPayments failed:', e);
        initialPayments = undefined;
    }

    const payUrl = `${getAppUrl()}/pay/${id}`;

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8 print:hidden">
                <Link href="/admin/invoices"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-white/30 hover:text-white/60 uppercase tracking-wider transition-colors">
                    <ArrowLeft size={13} /> Back to Invoices
                </Link>
                <div className="flex items-center gap-3">
                    <QbStatusPill qbId={qbId} lastSyncedAt={qbSyncedAt} />
                    <QbSyncButton entityType="invoice" entityId={id} size="sm" />
                </div>
            </div>
            <InvoiceDocument invoice={invoice} />
            <InvoicePaymentsCard
                invoiceId={invoice.id}
                invoiceNumber={invoice.invoiceNumber}
                amountDue={invoice.amountDue}
                initialPayments={initialPayments}
                payUrl={payUrl}
            />
        </div>
    );
}
