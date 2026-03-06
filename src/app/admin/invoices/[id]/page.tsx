import { notFound } from 'next/navigation';
import { SAMPLE_INVOICES } from '@/lib/invoices';
import { InvoiceDocument } from '@/components/admin/invoice-document';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function generateStaticParams() {
    return SAMPLE_INVOICES.map(i => ({ id: i.id }));
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const invoice = SAMPLE_INVOICES.find(i => i.id === id);
    if (!invoice) notFound();

    return (
        <div className="p-8">
            <Link
                href="/admin/invoices"
                className="inline-flex items-center gap-2 text-xs font-semibold text-white/30 hover:text-white/60 uppercase tracking-wider mb-8 transition-colors print:hidden"
            >
                <ArrowLeft size={13} />
                Back to Invoices
            </Link>
            <InvoiceDocument invoice={invoice} />
        </div>
    );
}
