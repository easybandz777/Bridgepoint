'use client';

import { useParams } from 'next/navigation';
import { SubTabNav } from '@/components/admin/sub-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import { Mail, Phone, MapPin, Award, ShieldAlert, Star, Briefcase, FileCheck, AlertCircle } from 'lucide-react';
import { useSub } from './use-sub';

export default function SubcontractorOverviewPage() {
    const params = useParams<{ id: string }>();
    const state = useSub(params?.id);

    if (state.phase === 'loading') {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
            </div>
        );
    }

    if (state.phase === 'notfound') {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-white/30">
                <p className="text-lg font-serif font-bold text-white mb-2">Subcontractor Not Found</p>
                <p className="text-sm">This record may have been deleted.</p>
            </div>
        );
    }

    if (state.phase === 'error') {
        return (
            <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-300 flex items-start gap-3 max-w-xl mx-auto mt-12">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold mb-1">Failed to load subcontractor</p>
                    <p className="text-xs text-red-300/80">{state.error}</p>
                </div>
            </div>
        );
    }

    const sub = state.sub;
    const issueCount = sub.compliance.issues.length;

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Profile Header Card */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#b8956a]/5 to-transparent rounded-bl-[100px] pointer-events-none" />

                <div className="flex flex-col lg:flex-row justify-between gap-8 relative z-10">
                    {/* Left: Identity */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <StatusBadge status={sub.status} />
                            {sub.status === 'Preferred' && (
                                <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-[#34d399] font-bold bg-[#34d399]/10 px-2 py-0.5 rounded border border-[#34d399]/20">
                                    <Award size={12} /> Priority Tier
                                </span>
                            )}
                        </div>
                        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
                            {sub.companyName}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/50 mb-4">
                            {sub.address && <span className="flex items-center gap-1.5"><MapPin size={14} /> {sub.address}</span>}
                            <span className="flex items-center gap-1.5"><Phone size={14} /> {sub.phone}</span>
                            <span className="flex items-center gap-1.5"><Mail size={14} /> {sub.email}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {sub.trades.map((trade) => (
                                <span key={trade} className="px-2 py-1 bg-white/5 text-white/60 text-[10px] rounded uppercase tracking-wider">{trade}</span>
                            ))}
                        </div>
                    </div>

                    {/* Right: Key Stats */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-8 border-t lg:border-t-0 lg:border-l border-white/6 pt-6 lg:pt-0 lg:pl-8">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Rating</p>
                            <div className="flex items-baseline gap-1.5">
                                <Star className="text-[#fbbf24] fill-[#fbbf24]" size={20} />
                                <span className="text-2xl font-bold text-white">
                                    {(sub.metrics.avgRating || sub.rating).toFixed(1)}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Jobs Done</p>
                            <div className="flex items-baseline gap-2">
                                <Briefcase className="text-[#b8956a]" size={20} />
                                <span className="text-2xl font-bold text-white">{sub.metrics.jobsCompleted}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Reliability</p>
                            <div className="flex items-baseline gap-2">
                                <FileCheck className={sub.metrics.reliabilityScore >= 90 ? 'text-[#34d399]' : 'text-[#fbbf24]'} size={20} />
                                <span className="text-2xl font-bold text-white">{sub.metrics.reliabilityScore}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SubTabNav subId={sub.id} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Contact */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-6">Key Personnel</h2>
                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                            <div>
                                <p className="text-sm font-medium text-white">{sub.contactPerson}</p>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Primary Point of Contact</p>
                            </div>
                            <div className="flex gap-2">
                                <a href={`tel:${sub.phone}`} title="Call" className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
                                    <Phone size={14} />
                                </a>
                                <a href={`mailto:${sub.email}`} title="Email" className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
                                    <Mail size={14} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {sub.notes && (
                        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                            <h2 className="text-sm font-semibold text-white mb-4">Internal Notes</h2>
                            <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{sub.notes}</p>
                        </div>
                    )}

                    {/* Performance Snapshot */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-6">Performance Snapshot</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Reliability Score</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${sub.metrics.reliabilityScore >= 90 ? 'bg-[#34d399]' : sub.metrics.reliabilityScore >= 75 ? 'bg-[#fbbf24]' : 'bg-[#f87171]'}`} style={{ width: `${sub.metrics.reliabilityScore}%` }} />
                                    </div>
                                    <span className="text-sm font-bold text-white">{sub.metrics.reliabilityScore}%</span>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Payment Terms</p>
                                <p className="text-sm font-bold text-white">{sub.paymentTerms}</p>
                                {sub.defaultRate && <p className="text-xs text-white/40 mt-1">{sub.defaultRate}</p>}
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">On-Time Rate</p>
                                <p className="text-sm font-bold text-white">{sub.metrics.onTimeRate}%</p>
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Active Jobs</p>
                                <p className="text-sm font-bold text-white">{sub.metrics.activeJobs}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className={`border rounded-2xl p-6 ${issueCount > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-[#1a1a1a] border-white/6'}`}>
                        <h2 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${issueCount > 0 ? 'text-red-400' : 'text-white'}`}>
                            {issueCount > 0 ? <ShieldAlert size={16} /> : <FileCheck size={16} className="text-[#34d399]" />}
                            Compliance Status
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">COI Expiry</p>
                                <p className={`text-sm font-medium ${sub.compliance.coiExpired ? 'text-red-400' : sub.compliance.coiExpiringSoon ? 'text-[#fbbf24]' : 'text-white'}`}>
                                    {sub.compliance.coiExpiry || 'Not Provided'}
                                    {sub.compliance.coiDaysRemaining !== null && (
                                        <span className="ml-2 text-xs text-white/40">
                                            {sub.compliance.coiExpired
                                                ? `(${Math.abs(sub.compliance.coiDaysRemaining)} days ago)`
                                                : `(${sub.compliance.coiDaysRemaining} days)`}
                                        </span>
                                    )}
                                </p>
                            </div>

                            {issueCount > 0 ? (
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Issues</p>
                                    <ul className="space-y-1.5">
                                        {sub.compliance.issues.map((issue, i) => (
                                            <li key={i} className="text-sm text-red-300/80 flex items-center gap-2">
                                                <span className="w-1 h-1 rounded-full bg-red-400" /> {issue}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-sm text-[#34d399]">All required documents on file.</p>
                            )}
                        </div>
                    </div>

                    {sub.tags.length > 0 && (
                        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                            <h2 className="text-sm font-semibold text-white mb-4">Profile Tags</h2>
                            <div className="flex flex-wrap gap-2">
                                {sub.tags.map((tag) => (
                                    <span key={tag} className="px-2.5 py-1 bg-white/5 border border-white/10 text-white/60 text-xs rounded-lg">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
