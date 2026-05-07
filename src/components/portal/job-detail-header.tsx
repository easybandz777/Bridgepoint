'use client';

import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';

interface JobDetailHeaderProject {
    id: string;
    projectNumber: string;
    name: string;
    status: string;
    address: string;
    city: string;
    state: string;
    zip: string;
}

const STATUS_TONE: Record<string, string> = {
    'Active':       'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    'In Progress':  'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    'Planning':     'bg-blue-500/15 text-blue-300 border-blue-500/30',
    'Scheduled':    'bg-blue-500/15 text-blue-300 border-blue-500/30',
    'On Hold':      'bg-orange-500/15 text-orange-300 border-orange-500/30',
    'Blocked':      'bg-red-500/15 text-red-300 border-red-500/30',
    'Completed':    'bg-[#b8956a]/20 text-[#b8956a] border-[#b8956a]/30',
    'Cancelled':    'bg-white/10 text-white/40 border-white/10',
    'Not Started':  'bg-white/10 text-white/50 border-white/10',
    'Skipped':      'bg-white/10 text-white/40 border-white/10',
};

function statusClass(status: string): string {
    return STATUS_TONE[status] ?? 'bg-white/10 text-white/60 border-white/10';
}

function formatLocation(p: JobDetailHeaderProject): string {
    const parts: string[] = [];
    if (p.address) parts.push(p.address);
    const cityState = [p.city, p.state].filter(Boolean).join(', ');
    if (cityState) parts.push(cityState);
    if (p.zip) parts.push(p.zip);
    return parts.join(' · ');
}

export function JobDetailHeader({ project }: { project: JobDetailHeaderProject }) {
    const t = useT();
    const location = formatLocation(project);

    return (
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5 sm:p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
                <Link
                    href="/portal/jobs"
                    className="text-white/40 hover:text-white/80 transition-colors flex items-center gap-1 text-xs uppercase tracking-[0.2em]"
                >
                    <ArrowLeft size={14} />
                    {t('common.back')}
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-white/50 tracking-wider">
                            {project.projectNumber}
                        </span>
                        <span
                            className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.18em] border ${statusClass(project.status)}`}
                        >
                            {project.status}
                        </span>
                    </div>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight mb-2 truncate">
                        {project.name}
                    </h1>
                    {location && (
                        <p className="text-sm text-white/55 flex items-center gap-2">
                            <MapPin size={14} className="text-[#b8956a] shrink-0" />
                            <span className="truncate">{location}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
