// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { SubTabNav } from '@/components/admin/sub-tab-nav';
import { StatusBadge } from '@/components/admin/status-badge';
import { Mail, Phone, MapPin, Award, ShieldAlert, Star, Briefcase, FileCheck } from 'lucide-react';

function rowToSub(r: any) {
    const trades = Array.isArray(r.trades) ? r.trades : [];
    const metrics = r.metrics ?? { averageRating: 4.0, totalJobsCompleted: 0, reliabilityScore: 100 };
    const documents = Array.isArray(r.documents) ? r.documents : [];
    const isInsuranceExpired = r.insurance_expiry ? new Date(r.insurance_expiry) < new Date() : false;
    const unverifiedDocs = documents.filter((d: any) => !d.verified).map((d: any) => d.type);

    return {
        id: r.id,
        companyName: r.company_name,
        primaryContact: r.contact_person,
        phone: r.phone,
        email: r.email,
        address: r.address,
        trades,
        status: r.status,
        rating: Number(r.rating ?? 4),
        tags: Array.isArray(r.tags) ? r.tags : [],
        paymentTerms: r.payment_terms,
        defaultRate: r.default_rate,
        notes: r.notes,
        insuranceExpiry: r.insurance_expiry,
        documents,
        metrics: {
            averageRating: Number(metrics.averageRating ?? 4),
            totalJobsCompleted: Number(metrics.totalJobsCompleted ?? 0),
            reliabilityScore: Number(metrics.reliabilityScore ?? 100),
        },
        isInsuranceExpired,
        unverifiedDocs,
    };
}

export default function SubcontractorOverviewPage() {
    const params = useParams();
    const id = params?.id as string;
    const [sub, setSub] = useState<ReturnType<typeof rowToSub> | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFoundFlag, setNotFoundFlag] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/subcontractors/${id}`)
            .then(res => {
                if (res.status === 404) { setNotFoundFlag(true); return null; }
                return res.json();
            })
            .then(data => {
                if (data) setSub(rowToSub(data));
                setLoading(false);
            })
            .catch(() => { setLoading(false); });
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
            </div>
        );
    }

    if (notFoundFlag || !sub) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-white/30">
                <p className="text-lg font-serif font-bold text-white mb-2">Subcontractor Not Found</p>
                <p className="text-sm">This record may have been deleted.</p>
            </div>
        );
    }

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
                            <span className="flex items-center gap-1.5"><MapPin size={14} /> {sub.address}</span>
                            <span className="flex items-center gap-1.5"><Phone size={14} /> {sub.phone}</span>
                            <span className="flex items-center gap-1.5"><Mail size={14} /> {sub.email}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {sub.trades.map((trade: string) => (
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
                                <span className="text-2xl font-bold text-white">{sub.metrics.averageRating.toFixed(1)}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Jobs Done</p>
                            <div className="flex items-baseline gap-2">
                                <Briefcase className="text-[#b8956a]" size={20} />
                                <span className="text-2xl font-bold text-white">{sub.metrics.totalJobsCompleted}</span>
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

            {/* Navigation Tabs */}
            <SubTabNav subId={sub.id} />

            {/* Overview Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Contact */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-6">Key Personnel</h2>
                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                            <div>
                                <p className="text-sm font-medium text-white">{sub.primaryContact}</p>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Primary Point of Contact</p>
                            </div>
                            <div className="flex gap-2">
                                <a href={`tel:${sub.phone}`} title="Call" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
                                    <Phone size={14} />
                                </a>
                                <a href={`mailto:${sub.email}`} title="Email" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
                                    <Mail size={14} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {sub.notes && (
                        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                            <h2 className="text-sm font-semibold text-white mb-4">Internal Notes</h2>
                            <p className="text-sm text-white/60 leading-relaxed">{sub.notes}</p>
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
                                        <div className="h-full bg-[#34d399] rounded-full" style={{ width: `${sub.metrics.reliabilityScore}%` }} />
                                    </div>
                                    <span className="text-sm font-bold text-white">{sub.metrics.reliabilityScore}%</span>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Payment Terms</p>
                                <p className="text-sm font-bold text-white">{sub.paymentTerms}</p>
                                {sub.defaultRate && <p className="text-xs text-white/40 mt-1">{sub.defaultRate}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Compliance Box */}
                    <div className={`border rounded-2xl p-6 ${sub.isInsuranceExpired || sub.unverifiedDocs.length > 0
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-[#1a1a1a] border-white/6'
                        }`}>
                        <h2 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${sub.isInsuranceExpired || sub.unverifiedDocs.length > 0 ? 'text-red-400' : 'text-white'}`}>
                            {sub.isInsuranceExpired || sub.unverifiedDocs.length > 0 ? (
                                <ShieldAlert size={16} />
                            ) : (
                                <FileCheck size={16} className="text-[#34d399]" />
                            )}
                            Compliance Status
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Insurance Expiry</p>
                                <p className={`text-sm font-medium ${sub.isInsuranceExpired ? 'text-red-400' : 'text-white'}`}>
                                    {sub.insuranceExpiry || 'Not Provided'}
                                    {sub.isInsuranceExpired && ' (Expired)'}
                                </p>
                            </div>

                            {sub.unverifiedDocs.length > 0 ? (
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Needs Verification</p>
                                    <ul className="space-y-1.5">
                                        {sub.unverifiedDocs.map((doc: string, i: number) => (
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
                        </div>
                    </div>

                    {/* Profile Tags */}
                    {sub.tags.length > 0 && (
                        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                            <h2 className="text-sm font-semibold text-white mb-4">Profile Tags</h2>
                            <div className="flex flex-wrap gap-2">
                                {sub.tags.map((tag: string) => (
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
