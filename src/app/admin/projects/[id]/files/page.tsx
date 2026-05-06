'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { ProjectTabNav } from '@/components/admin/project-tab-nav';
import { EmptyState } from '@/components/admin/empty-state';
import {
    FolderUp,
    File as FileIcon,
    Image as ImageIcon,
    FileText,
    Loader2,
    Save,
    Trash2,
    ExternalLink,
} from 'lucide-react';
import { getProject, DbProjectFull, createFile, deleteFile } from '@/lib/project-api';

const CATEGORIES = [
    { name: 'Contract', icon: FileText },
    { name: 'Permit', icon: FileIcon },
    { name: 'Drawing', icon: FileIcon },
    { name: 'Photo', icon: ImageIcon },
    { name: 'Change Order', icon: FileText },
    { name: 'General', icon: FileIcon },
] as const;

interface FileFormState {
    filename: string;
    url: string;
    category: string;
    description: string;
    fileType: string;
}

function emptyForm(): FileFormState {
    return { filename: '', url: '', category: 'General', description: '', fileType: '' };
}

export default function ProjectFilesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<DbProjectFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState<FileFormState>(emptyForm());

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const p = await getProject(id);
            setProject(p);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    async function handleAdd() {
        try {
            await createFile(id, { ...form, actor: 'admin' });
            setAdding(false);
            setForm(emptyForm());
            await load();
        } catch (e) {
            alert(`Create failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    async function handleDelete(fileId: string) {
        if (!confirm('Delete this file reference?')) return;
        try {
            await deleteFile(id, fileId);
            await load();
        } catch (e) {
            alert(`Delete failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24 text-white/40 gap-2">
                <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
        );
    }
    if (error) return <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl text-red-300">{error}</div>;
    if (!project) return <div className="py-24 text-center text-white/50">Project not found.</div>;

    const categoryCounts: Record<string, number> = {};
    for (const f of project.files) {
        categoryCounts[f.category] = (categoryCounts[f.category] ?? 0) + 1;
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-white mb-1">{project.name}</h1>
                    <p className="text-sm text-white/50">Project Files & Documentation</p>
                </div>
                <button
                    onClick={() => setAdding((v) => !v)}
                    className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors"
                >
                    <FolderUp size={16} /> {adding ? 'Cancel' : 'Add File Link'}
                </button>
            </div>

            <ProjectTabNav projectId={project.id} />

            {adding && (
                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 mb-6">
                    <p className="text-xs text-white/40 mb-3">
                        File storage isn’t connected yet — paste a URL pointing at the file in your existing storage (Drive, S3, Dropbox, etc).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <input
                            placeholder="Filename"
                            value={form.filename}
                            onChange={(e) => setForm({ ...form, filename: e.target.value })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        />
                        <input
                            placeholder="URL (https://…)"
                            value={form.url}
                            onChange={(e) => setForm({ ...form, url: e.target.value })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        />
                        <select
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c.name} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <input
                            placeholder="File Type (pdf, jpg, dwg…)"
                            value={form.fileType}
                            onChange={(e) => setForm({ ...form, fileType: e.target.value })}
                            className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#b8956a]/50"
                        />
                    </div>
                    <textarea
                        placeholder="Description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white min-h-[60px] focus:outline-none focus:border-[#b8956a]/50 mb-3"
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setAdding(false)} className="h-9 px-4 text-white/50 hover:text-white text-sm font-semibold">
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={!form.filename || !form.url}
                            className="h-9 px-4 bg-[#b8956a] text-black rounded-full text-sm font-semibold hover:bg-[#cbb08c] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save size={14} /> Register File
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {CATEGORIES.map((cat) => (
                    <div
                        key={cat.name}
                        className="flex flex-col items-center justify-center p-5 bg-[#1a1a1a] border border-white/6 rounded-2xl text-center"
                    >
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 mb-2">
                            <cat.icon size={18} />
                        </div>
                        <h3 className="font-semibold text-white text-xs mb-1">{cat.name}</h3>
                        <p className="text-xs text-white/40">{categoryCounts[cat.name] ?? 0} files</p>
                    </div>
                ))}
            </div>

            <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-white mb-6">All Files</h2>
                {project.files.length === 0 ? (
                    <EmptyState
                        title="No Files Yet"
                        description="Add a link to a file in your existing storage with the button above."
                        icon={<FileText size={48} className="text-white/10" />}
                    />
                ) : (
                    <div className="divide-y divide-white/5">
                        {project.files.map((f) => (
                            <div key={f.id} className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <FileIcon size={16} className="text-white/30 shrink-0" />
                                    <div className="min-w-0">
                                        <div className="text-sm text-white truncate">{f.filename}</div>
                                        <div className="text-xs text-white/40 flex items-center gap-2 truncate">
                                            <span>{f.category}</span>
                                            {f.description && <span>· {f.description}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <a
                                        href={f.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-8 px-3 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-full flex items-center gap-1"
                                    >
                                        Open <ExternalLink size={10} />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(f.id)}
                                        className="h-8 w-8 text-red-400/70 hover:text-red-400 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
