'use client';

import { use, useEffect, useState } from 'react';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { User, FileText, CheckCircle, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import { getProject, DbProjectFull } from '@/lib/project-api';

function iconFor(action: string) {
    const a = action.toLowerCase();
    if (a.includes('approved') || a.includes('paid') || a.includes('completed')) {
        return <CheckCircle size={16} className="text-[#34d399]" />;
    }
    if (a.includes('created') || a.includes('uploaded') || a.includes('added')) {
        return <FileText size={16} className="text-blue-400" />;
    }
    if (a.includes('rejected') || a.includes('flagged') || a.includes('deleted')) {
        return <AlertCircle size={16} className="text-red-400" />;
    }
    return <MessageSquare size={16} className="text-white/40" />;
}

export default function ProjectActivityPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<DbProjectFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
    if (!project) return <div className="py-24 text-center text-white/50">Project not found.</div>;

    const logs = project.activity;

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                <p className="text-sm text-white/50">Project Activity & Audit Log</p>
            </div>

            <ProjectTabNav projectId={project.id} />

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 sm:p-8">
                <h2 className="text-sm font-semibold text-white mb-8">Recent Activity</h2>

                {logs.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-white/40">No activity logged for this project yet.</p>
                    </div>
                ) : (
                    <div className="relative pl-4 space-y-8 before:absolute before:inset-y-0 before:left-[23px] before:w-[2px] before:bg-white/5">
                        {logs.map((log) => (
                            <div key={log.id} className="relative flex gap-5">
                                <div className="absolute -left-[27px] w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-white/10 flex items-center justify-center shrink-0 mt-1 z-10">
                                    {iconFor(log.action)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-1">
                                        <p className="text-sm font-medium text-white capitalize">
                                            {log.action.replace(/_/g, ' ')}
                                        </p>
                                        <span className="text-[10px] uppercase text-white/40 whitespace-nowrap pt-0.5">
                                            {new Date(log.created_at).toLocaleString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2 text-xs text-white/50">
                                        <User size={12} />
                                        <span>{log.actor || 'system'}</span>
                                    </div>
                                    {log.description && (
                                        <div className="p-3 mt-2 rounded-xl bg-white/5 border border-white/5 text-sm text-white/70 leading-relaxed">
                                            {log.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
