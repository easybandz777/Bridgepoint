import { notFound } from 'next/navigation';
import { SAMPLE_SUBCONTRACTORS } from '@/lib/subcontractors';

export default async function SubcontractorLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const sub = SAMPLE_SUBCONTRACTORS.find((s) => s.id === id);

    if (!sub) {
        notFound();
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
        </div>
    );
}
