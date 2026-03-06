import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import { InvoiceDocument } from '@/components/admin/invoice-document';
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

    return (
        <div className="p-8">
            <Link href="/admin/invoices"
                className="inline-flex items-center gap-2 text-xs font-semibold text-white/30 hover:text-white/60 uppercase tracking-wider mb-8 transition-colors print:hidden">
                <ArrowLeft size={13} /> Back to Invoices
            </Link>
            <InvoiceDocument invoice={invoice} />
        </div>
    );
}
