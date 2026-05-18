import { Suspense } from 'react';
import InvoiceForm from '@/components/admin/invoice-form';

export const dynamic = 'force-dynamic';

// InvoiceForm reads ?customerId= via useSearchParams; Next 16 requires
// a Suspense boundary around any client component that does so, even
// when the parent page is dynamic-rendered.
export default function NewInvoicePage() {
    return (
        <Suspense fallback={<div className="p-8 text-white/40 text-sm">Loading invoice form…</div>}>
            <InvoiceForm />
        </Suspense>
    );
}
