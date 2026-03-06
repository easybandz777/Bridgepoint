import { notFound } from 'next/navigation';
import { SAMPLE_PROJECTS } from '@/lib/projects';
import { SAMPLE_ACTIVITY_LOGS } from '@/lib/job-costing';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { User, FileText, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';

export default function ProjectActivityPage({ params }: { params: { id: string } }) {
    const project = SAMPLE_PROJECTS.find(p => p.id === params.id);
    if (!project) notFound();

    // In a real app we'd filter by various related IDs, here we just show all logs
    // that might be loosely related or just the whole sample set for demo purposes
    // Since we don't have projectId natively on the ActivityLog object in the sample,
    // we'll just mock taking a subset or all of them.
    const logs = [...SAMPLE_ACTIVITY_LOGS].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const getIconForAction = (action: string) => {
        if (action.includes('Approved')) return <CheckCircle size={16} className="text-[#34d399]" />;
        if (action.includes('Created') || action.includes('Uploaded')) return <FileText size={16} className="text-blue-400" />;
        if (action.includes('Rejected') || action.includes('Flagged')) return <AlertCircle size={16} className="text-red-400" />;
        return <MessageSquare size={16} className="text-white/40" />;
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-6">
                <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                <p className="text-sm text-white/50">Project Activity & Audit Log</p>
            </div>

            {/* Navigation Tabs */}
            <ProjectTabNav projectId={project.id} />

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 sm:p-8">
                <h2 className="text-sm font-semibold text-white mb-8">Recent Activity</h2>

                <div className="relative pl-4 space-y-8 before:absolute before:inset-y-0 before:left-[23px] before:w-[2px] before:bg-white/5">
                    {logs.map((log, index) => (
                        <div key={log.id} className="relative flex gap-5">
                            {/* Timeline Node */}
                            <div className="absolute -left-[27px] w-8 h-8 rounded-full bg-[#1a1a1a] border-2 border-white/10 flex items-center justify-center shrink-0 mt-1 z-10">
                                {getIconForAction(log.action)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-1">
                                    <p className="text-sm font-medium text-white">
                                        {log.action}
                                    </p>
                                    <span className="text-[10px] uppercase text-white/40 whitespace-nowrap pt-0.5">
                                        {new Date(log.timestamp).toLocaleString(undefined, {
                                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mb-2 text-xs text-white/50">
                                    <User size={12} />
                                    <span>{log.userId}</span>
                                </div>
                                {log.details && (
                                    <div className="p-3 mt-2 rounded-xl bg-white/5 border border-white/5 text-sm text-white/70 leading-relaxed">
                                        {log.details}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {logs.length === 0 && (
                    <div className="py-12 text-center">
                        <p className="text-white/40">No activity logged for this project yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
