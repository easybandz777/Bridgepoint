import { Suspense } from 'react';
import EstimateForm from '@/components/admin/estimate-form';

export const dynamic = 'force-dynamic';

// EstimateForm reads ?customerId= via useSearchParams; Next 16 requires
// a Suspense boundary around any client component that does so, even
// when the parent page is dynamic-rendered.
export default function NewEstimatePage() {
    return (
        <Suspense fallback={<div className="p-8 text-white/40 text-sm">Loading estimate form…</div>}>
            <EstimateForm />
        </Suspense>
    );
}
