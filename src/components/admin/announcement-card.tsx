'use client';

import { Trash2, Eye, AlertTriangle, Info, Bell } from 'lucide-react';

export interface Announcement {
    id: string;
    audience: 'all' | 'employees' | 'subcontractors' | 'individual';
    recipientType: 'employee' | 'subcontractor' | null;
    recipientId: string | null;
    recipientName: string | null;
    subject: string;
    body: string;
    level: 'info' | 'important' | 'urgent';
    sender: string;
    createdAt: string;
    readCount: number;
}

interface AnnouncementCardProps {
    msg: Announcement;
    onDelete?: (id: string) => void;
}

function audienceLabel(msg: Announcement): string {
    switch (msg.audience) {
        case 'all': return 'Everyone';
        case 'employees': return 'All Employees';
        case 'subcontractors': return 'All Subcontractors';
        case 'individual':
            return msg.recipientName
                ? `Direct · ${msg.recipientName}`
                : `Direct · ${msg.recipientType ?? 'user'}`;
    }
}

function levelStyle(level: Announcement['level']) {
    switch (level) {
        case 'urgent':
            return {
                bg: 'bg-red-500/10',
                text: 'text-red-300',
                border: 'border-red-500/20',
                icon: AlertTriangle,
            };
        case 'important':
            return {
                bg: 'bg-amber-500/10',
                text: 'text-amber-300',
                border: 'border-amber-500/20',
                icon: Bell,
            };
        default:
            return {
                bg: 'bg-blue-500/10',
                text: 'text-blue-300',
                border: 'border-blue-500/20',
                icon: Info,
            };
    }
}

function fmtDateTime(iso: string): string {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return '—';
    return d.toLocaleString();
}

export function AnnouncementCard({ msg, onDelete }: AnnouncementCardProps) {
    const lvl = levelStyle(msg.level);
    const Icon = lvl.icon;

    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${lvl.bg} ${lvl.border} border`}
                    >
                        <Icon size={15} className={lvl.text} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                                className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${lvl.bg} ${lvl.text} ${lvl.border}`}
                            >
                                {msg.level}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/5 text-white/55 border border-white/10">
                                {audienceLabel(msg)}
                            </span>
                        </div>
                        {msg.subject && (
                            <p className="text-sm font-semibold text-white">{msg.subject}</p>
                        )}
                        <p className="text-xs text-white/55 mt-1 whitespace-pre-wrap line-clamp-3">{msg.body}</p>
                    </div>
                </div>
                {onDelete && (
                    <button
                        onClick={() => onDelete(msg.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                        title="Delete announcement"
                    >
                        <Trash2 size={13} />
                    </button>
                )}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/6 text-[11px] text-white/35">
                <span>{fmtDateTime(msg.createdAt)}</span>
                <span className="flex items-center gap-1.5">
                    <Eye size={11} />
                    {msg.readCount} read
                </span>
            </div>
        </div>
    );
}
