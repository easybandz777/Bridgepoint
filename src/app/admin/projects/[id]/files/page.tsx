import { notFound } from 'next/navigation';
import { SAMPLE_PROJECTS } from '@/lib/projects';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { EmptyState } from '@/components/admin/empty-state';
import { FolderUp, File, Image as ImageIcon, FileText } from 'lucide-react';

export default function ProjectFilesPage({ params }: { params: { id: string } }) {
    const project = SAMPLE_PROJECTS.find(p => p.id === params.id);
    if (!project) notFound();

    // Mock file categories for demonstration
    const CATEGORIES = [
        { name: 'Contracts & Approvals', icon: FileText, count: 2 },
        { name: 'Permits & Plans', icon: File, count: 0 },
        { name: 'Progress Photos', icon: ImageIcon, count: 12 },
        { name: 'Change Order Signatures', icon: FileText, count: 1 },
    ];

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                    <p className="text-sm text-white/50">Project Files & Documentation</p>
                </div>
                <button className="h-10 px-5 bg-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/20 transition-colors">
                    <FolderUp size={16} />
                    Upload Files
                </button>
            </div>

            {/* Navigation Tabs */}
            <ProjectTabNav projectId={project.id} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {CATEGORIES.map(cat => (
                    <button key={cat.name} className="flex flex-col items-center justify-center p-6 bg-[#1a1a1a] border border-white/6 rounded-2xl hover:bg-white/5 hover:border-white/10 transition-all group text-center">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#b8956a] group-hover:bg-[#b8956a]/10 transition-colors mb-3">
                            <cat.icon size={24} />
                        </div>
                        <h3 className="font-semibold text-white text-sm mb-1">{cat.name}</h3>
                        <p className="text-xs text-white/40">{cat.count} files</p>
                    </button>
                ))}
            </div>

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-white mb-6">Recent Uploads</h2>
                <EmptyState
                    title="No Recent Files"
                    description="Files uploaded to this project will appear here. Select a category above or upload new files."
                    icon={<FileText size={48} className="text-white/10" />}
                />
            </div>
        </div>
    );
}
