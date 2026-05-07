'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { ProjectUpdateList } from '@/components/admin/project-update-list';
import { Loader2 } from 'lucide-react';
import { getProject, DbProjectFull } from '@/lib/project-api';

const KIND_FILTERS: { value: string | null; label: string }[] = [
    { value: null, label: 'All' },
    { value: 'note', label: 'Notes' },
    { value: 'progress', label: 'Progress' },
    { value: 'issue', label: 'Issues' },
    { value: 'completion', label: 'Completion' },
    { value: 'status_change', label: 'Status Changes' },
];

export default function ProjectUpdatesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<DbProjectFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeKind, setActiveKind] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    useEffect(() => {
        (async () => {
            try {
                const p = await getProject(id);
                setProject(p);
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24 text-white/40 gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
        );
    }
    if (error) {
        return (
            <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl text-red-300 text-sm">
                Failed to load: {error}
            </div>
        );
    }
    if (!project) {
        return (
            <div className="py-24 text-center text-white/50">
                Project not found.
                <div className="mt-4">
                    <Link href="/admin/projects" className="text-[#b8956a] hover:text-[#cbb08c]">
                        Back to projects
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                <p className="text-sm text-white/50">
                    Updates {count > 0 ? <span className="text-white/70">· {count}</span> : null}
                </p>
            </div>

            <ProjectTabNav projectId={project.id} />

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 sm:p-6 mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                    {KIND_FILTERS.map((k) => {
                        const isActive = activeKind === k.value;
                        return (
                            <button
                                key={k.label}
                                onClick={() => setActiveKind(k.value)}
                                className={`h-8 px-3 rounded-full text-xs font-semibold transition-colors ${
                                    isActive
                                        ? 'bg-[#b8956a] text-black'
                                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                                }`}
                            >
                                {k.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <ProjectUpdateList projectId={id} kind={activeKind} onCount={setCount} />
        </div>
    );
}
