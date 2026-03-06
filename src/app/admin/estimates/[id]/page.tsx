import { notFound } from 'next/navigation';
import { SAMPLE_ESTIMATES } from '@/lib/estimates';
import { ProposalDocument } from '@/components/admin/proposal-document';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function generateStaticParams() {
    return SAMPLE_ESTIMATES.map(e => ({ id: e.id }));
}

export default async function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const estimate = SAMPLE_ESTIMATES.find(e => e.id === id);
    if (!estimate) notFound();

    return (
        <div className="p-8">
            <Link
                href="/admin/estimates"
                className="inline-flex items-center gap-2 text-xs font-semibold text-white/30 hover:text-white/60 uppercase tracking-wider mb-8 transition-colors print:hidden"
            >
                <ArrowLeft size={13} />
                Back to Estimates
            </Link>
            <ProposalDocument estimate={estimate} />
        </div>
    );
}
