import { notFound } from 'next/navigation';
import { SAMPLE_PROJECTS } from '@/lib/projects';

export default function ProjectLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: { id: string };
}) {
    const project = SAMPLE_PROJECTS.find((p) => p.id === params.id);

    if (!project) {
        notFound();
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
        </div>
    );
}
