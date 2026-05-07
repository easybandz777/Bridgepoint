'use client';

import { useMemo, useState } from 'react';
import { Calendar, MapPin, Phone, Mail, User as UserIcon, Activity, ExternalLink } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { fmtShortDate, timeAgo } from '@/lib/portal-client';
import { PhaseRow } from '@/components/portal/phase-row';
import { PhaseEditModal } from '@/components/portal/phase-edit-modal';
import { SubAssignmentCard } from '@/components/portal/sub-assignment-card';
import { useJobDetail } from './layout';

function buildMapsUrl(addressParts: string[]): string {
    const q = encodeURIComponent(addressParts.filter(Boolean).join(', '));
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

type DateTone = 'normal' | 'warn' | 'overdue';
type DateInfoKey =
    | { kind: 'overdue'; count: number }
    | { kind: 'endsToday' }
    | { kind: 'remaining'; count: number; warn: boolean }
    | { kind: 'startsIn'; count: number }
    | { kind: 'startsToday' }
    | { kind: 'none' };

function dateInfoKey(start: string | null, end: string | null): DateInfoKey {
    if (!start && !end) return { kind: 'none' };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayMs = now.getTime();
    if (end) {
        const endDate = new Date(end);
        if (Number.isFinite(endDate.getTime())) {
            const dayMs = 24 * 60 * 60 * 1000;
            const diff = Math.round((endDate.getTime() - todayMs) / dayMs);
            if (diff < 0) return { kind: 'overdue', count: Math.abs(diff) };
            if (diff === 0) return { kind: 'endsToday' };
            return { kind: 'remaining', count: diff, warn: diff <= 5 };
        }
    }
    if (start) {
        const startDate = new Date(start);
        if (Number.isFinite(startDate.getTime())) {
            const dayMs = 24 * 60 * 60 * 1000;
            const diff = Math.round((startDate.getTime() - todayMs) / dayMs);
            if (diff > 0) return { kind: 'startsIn', count: diff };
            if (diff === 0) return { kind: 'startsToday' };
        }
    }
    return { kind: 'none' };
}

function dateInfoToneFor(info: DateInfoKey): DateTone {
    if (info.kind === 'overdue') return 'overdue';
    if (info.kind === 'endsToday' || info.kind === 'startsToday') return 'warn';
    if (info.kind === 'remaining' && info.warn) return 'warn';
    return 'normal';
}

export default function JobOverviewPage() {
    const t = useT();
    const { projectId, data, refresh } = useJobDetail();
    const { project, phases, mySubAssignment, recentActivity, isLead } = data;

    const [editing, setEditing] = useState<typeof phases[number] | null>(null);

    const editablePhasesCount = useMemo(
        () => phases.filter((p) => p.canEdit).length,
        [phases],
    );

    const mapsUrl = buildMapsUrl([project.address, project.city, project.state, project.zip]);
    const fullAddress = [project.address, [project.city, project.state].filter(Boolean).join(', '), project.zip]
        .filter(Boolean)
        .join(' · ');

    const di = dateInfoKey(project.startDate, project.endDate);
    const diTone = dateInfoToneFor(di);
    const diLabel: string =
        di.kind === 'overdue'    ? t('jobDetail.daysOverdue', { count: di.count })
      : di.kind === 'endsToday'  ? t('jobDetail.endsToday')
      : di.kind === 'remaining'  ? t('jobDetail.daysRemaining', { count: di.count })
      : di.kind === 'startsIn'   ? t('jobDetail.startsIn', { count: di.count })
      : di.kind === 'startsToday'? t('jobDetail.startsToday')
      : '';

    return (
        <div className="px-4 sm:px-6 pb-12 max-w-4xl mx-auto space-y-5">
            {/* Address + dates row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <MapPin size={14} className="text-[#b8956a]" />
                        <h2 className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                            {t('jobDetail.address')}
                        </h2>
                    </div>
                    <p className="text-sm text-white/85 leading-relaxed mb-3">
                        {fullAddress || t('jobDetail.tbd')}
                    </p>
                    {fullAddress && (
                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-[#b8956a] hover:text-[#cbb08c]"
                        >
                            {t('jobDetail.openMap')}
                            <ExternalLink size={12} />
                        </a>
                    )}
                </div>

                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar size={14} className="text-[#b8956a]" />
                        <h2 className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                            {t('jobDetail.dates')}
                        </h2>
                    </div>
                    <p className="text-sm text-white/85 mb-1">
                        {fmtShortDate(project.startDate)} → {fmtShortDate(project.endDate)}
                    </p>
                    {diLabel && (
                        <p
                            className={[
                                'text-xs',
                                diTone === 'overdue' ? 'text-red-300' :
                                diTone === 'warn' ? 'text-orange-300' :
                                'text-white/45',
                            ].join(' ')}
                        >
                            {diLabel}
                        </p>
                    )}
                </div>
            </div>

            {/* Description */}
            {project.description && (
                <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
                    <h2 className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">
                        {t('jobDetail.description')}
                    </h2>
                    <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                        {project.description}
                    </p>
                </div>
            )}

            {/* Client */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
                <h2 className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-3 flex items-center gap-2">
                    <UserIcon size={14} className="text-[#b8956a]" />
                    {t('jobDetail.client')}
                </h2>
                <p className="text-base font-semibold text-white mb-2">
                    {project.clientName || t('jobDetail.tbd')}
                </p>
                {isLead && (
                    <div className="flex flex-wrap gap-3 text-xs">
                        {project.clientPhone && (
                            <a
                                href={`tel:${project.clientPhone.replace(/\s/g, '')}`}
                                className="inline-flex items-center gap-1.5 text-white/70 hover:text-[#b8956a] transition-colors"
                            >
                                <Phone size={12} />
                                {project.clientPhone}
                            </a>
                        )}
                        {project.clientEmail && (
                            <a
                                href={`mailto:${project.clientEmail}`}
                                className="inline-flex items-center gap-1.5 text-white/70 hover:text-[#b8956a] transition-colors"
                            >
                                <Mail size={12} />
                                {project.clientEmail}
                            </a>
                        )}
                    </div>
                )}
                {project.projectManager && (
                    <p className="mt-3 text-xs text-white/50">
                        <span className="uppercase tracking-[0.18em]">{t('jobDetail.projectManager')}: </span>
                        <span className="text-white/80">{project.projectManager}</span>
                    </p>
                )}
            </div>

            {/* Sub assignment */}
            {mySubAssignment && <SubAssignmentCard assignment={mySubAssignment} />}

            {/* Phases */}
            <div>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-sm font-semibold text-white">
                        {t('jobDetail.phases')}
                    </h2>
                    {editablePhasesCount > 0 && (
                        <p className="text-xs text-[#b8956a]">{t('jobDetail.tapToUpdate')}</p>
                    )}
                </div>
                {phases.length === 0 ? (
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 text-center text-sm text-white/40">
                        {t('jobDetail.noPhases')}
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {phases.map((phase) => (
                            <PhaseRow
                                key={phase.id}
                                phase={phase}
                                onClick={() => phase.canEdit && setEditing(phase)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity size={14} className="text-[#b8956a]" />
                    {t('jobDetail.recentActivity')}
                </h2>
                {recentActivity.length === 0 ? (
                    <p className="text-sm text-white/40">{t('jobDetail.noActivity')}</p>
                ) : (
                    <ul className="space-y-3">
                        {recentActivity.slice(0, 8).map((a) => (
                            <li key={a.id} className="flex gap-3 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#b8956a] mt-2 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-white/80 leading-snug">
                                        {a.description || a.action}
                                    </p>
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 mt-0.5">
                                        {timeAgo(a.created_at)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <PhaseEditModal
                isOpen={editing !== null}
                onClose={() => setEditing(null)}
                projectId={projectId}
                phase={
                    editing
                        ? {
                              id: editing.id,
                              name: editing.name,
                              status: editing.status,
                              completionPct: editing.completionPct,
                              notes: editing.notes,
                          }
                        : null
                }
                onSaved={async () => {
                    await refresh();
                }}
            />
        </div>
    );
}
