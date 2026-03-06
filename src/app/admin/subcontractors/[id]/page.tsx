import { notFound } from 'next/navigation';
import { SAMPLE_SUBCONTRACTORS } from '@/lib/subcontractors';
import { SubTabNav } from '@/components/admin/sub-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import { Mail, Phone, MapPin, Award, ShieldAlert, Star, Briefcase, FileCheck } from 'lucide-react';

export default function SubcontractorOverviewPage({ params }: { params: { id: string } }) {
    const sub = SAMPLE_SUBCONTRACTORS.find(s => s.id === params.id);
    if (!sub) notFound();

    // Check compliance
    const isInsuranceExpired = sub.insuranceExpiry ? new Date(sub.insuranceExpiry) < new Date() : false;
    const missingDocs = Object.entries(sub.documentsRequired)
        .filter(([_, present]) => !present)
        .map(([name]) => name.replace('has', 'Missing '));

    return (
        <div>
            {/* Profile Header Card */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 sm:p-8 mb-8 sticky top-6 z-10 shadow-2xl relative overflow-hidden">
                {/* Background Pattern */}
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
                            <span className="flex items-center gap-1.5"><MapPin size={14} /> {sub.address}</span>
                            <span className="flex items-center gap-1.5"><Phone size={14} /> {sub.phone}</span>
                            <span className="flex items-center gap-1.5"><Mail size={14} /> {sub.email}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {sub.trades.map(trade => (
                                <span key={trade} className="px-2 py-1 bg-white/5 text-white/60 text-[10px] rounded uppercase tracking-wider">{trade}</span>
                            ))}
                        </div>
                    </div>

                    {/* Right: Key Stats */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-8 border-t lg:border-t-0 lg:border-l border-white/6 pt-6 lg:pt-0 lg:pl-8">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Internal Rating</p>
                            <div className="flex items-baseline gap-1.5">
                                <Star className="text-[#fbbf24] fill-[#fbbf24]" size={20} />
                                <span className="text-2xl font-bold text-white">{sub.metrics.averageRating.toFixed(1)}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Jobs Completed</p>
                            <div className="flex items-baseline gap-2">
                                <Briefcase className="text-[#b8956a]" size={20} />
                                <span className="text-2xl font-bold text-white">{sub.metrics.totalJobsCompleted}</span>
                            </div>
                        </div>
                        <div className="sm:col-span-1">
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Reliability</p>
                            <div className="flex items-baseline gap-2">
                                <FileCheck className={sub.metrics.reliabilityScore >= 90 ? 'text-[#34d399]' : 'text-[#fbbf24]'} size={20} />
                                <span className="text-2xl font-bold text-white">{sub.metrics.reliabilityScore}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <SubTabNav subId={sub.id} />

            {/* Overview Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Performance Snapshot */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-6">Performance Snapshot</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">On-Time Completion Rate</p>
                                <div className="mt-2 flex items-center gap-3">
                                    <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#34d399] rounded-full" style={{ width: '85%' }} />
                                    </div>
                                    <span className="text-sm font-bold text-white">85%</span>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Callback/Issue Rate</p>
                                <div className="mt-2 flex items-center gap-3">
                                    <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#34d399] rounded-full" style={{ width: '12%' }} />
                                    </div>
                                    <span className="text-sm font-bold text-white">12%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact & Admin */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-6">Key Personnel</h2>
                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                            <div>
                                <p className="text-sm font-medium text-white">{sub.primaryContact}</p>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Primary Point of Contact</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
                                    <Phone size={14} />
                                </button>
                                <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
                                    <Mail size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Compliance Box */}
                    <div className={`border rounded-2xl p-6 ${isInsuranceExpired || missingDocs.length > 0
                            ? 'bg-red-500/5 border-red-500/20'
                            : 'bg-[#1a1a1a] border-white/6'
                        }`}>
                        <h2 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isInsuranceExpired || missingDocs.length > 0 ? 'text-red-400' : 'text-white'
                            }`}>
                            {isInsuranceExpired || missingDocs.length > 0 ? (
                                <ShieldAlert size={16} />
                            ) : (
                                <FileCheck size={16} className="text-[#34d399]" />
                            )}
                            Compliance Status
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Insurance Expiry</p>
                                <p className={`text-sm font-medium ${isInsuranceExpired ? 'text-red-400' : 'text-white'}`}>
                                    {sub.insuranceExpiry || 'Not Provided'}
                                    {isInsuranceExpired && ' (Expired)'}
                                </p>
                            </div>

                            {missingDocs.length > 0 ? (
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Missing Documents</p>
                                    <ul className="space-y-1.5">
                                        {missingDocs.map((doc, i) => (
                                            <li key={i} className="text-sm text-red-300/80 flex items-center gap-2">
                                                <span className="w-1 h-1 rounded-full bg-red-400" /> {doc}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Documentation</p>
                                    <p className="text-sm text-[#34d399]">All required documents on file.</p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/6 mt-2">
                                <button className="text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c] transition-colors">
                                    Request Updated Documents
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Taxonomy / Tags */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Profile Tags</h2>
                        <div className="flex flex-wrap gap-2">
                            {sub.tags.map(tag => (
                                <span key={tag} className="px-2.5 py-1 bg-white/5 border border-white/10 text-white/60 text-xs rounded-lg">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
