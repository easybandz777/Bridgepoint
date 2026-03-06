import { notFound } from 'next/navigation';
import { SAMPLE_PROJECTS } from '@/lib/projects';

export default async function ProjectLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const project = SAMPLE_PROJECTS.find((p) => p.id === id);

    if (!project) {
        notFound();
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
        </div>
    );
}
