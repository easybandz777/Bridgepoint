// @ts-nocheck
import { notFound } from 'next/navigation';
import { SAMPLE_SUBCONTRACTORS } from '@/lib/subcontractors';
import { SubTabNav } from '@/components/admin/sub-tab-nav';
import { FileCheck, ShieldAlert, Upload, FileText, Calendar } from 'lucide-react';

export default function SubcontractorDocumentsPage({ params }: { params: { id: string } }) {
    const sub = SAMPLE_SUBCONTRACTORS.find(s => s.id === params.id);
    if (!sub) notFound();

    const isInsuranceExpired = sub.insuranceExpiry ? new Date(sub.insuranceExpiry) < new Date() : false;

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-white mb-1">{sub.companyName}</h1>
                    <p className="text-sm text-white/50">Compliance Documents & Licenses</p>
                </div>
                <button className="h-10 px-5 bg-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/20 transition-colors">
                    <Upload size={16} />
                    Upload Document
                </button>
            </div>

            <SubTabNav subId={sub.id} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Required Documents Checklist */}
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-6">Required Compliance Documents</h2>

                    <div className="space-y-3">
                        {/* W9 */}
                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                {sub.documentsRequired.hasW9 ? (
                                    <FileCheck className="text-[#34d399]" size={20} />
                                ) : (
                                    <ShieldAlert className="text-red-400" size={20} />
                                )}
                                <div>
                                    <p className="text-sm font-medium text-white">W-9 Form</p>
                                    <p className="text-xs text-white/40 mt-0.5">Taxpayer Identification</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {sub.documentsRequired.hasW9 ? (
                                    <span className="text-xs font-semibold text-[#34d399] bg-[#34d399]/10 px-2 py-1 rounded">On File</span>
                                ) : (
                                    <button className="text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c] transition-colors">Request</button>
                                )}
                            </div>
                        </div>

                        {/* COI */}
                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                {sub.documentsRequired.hasCOI && !isInsuranceExpired ? (
                                    <FileCheck className="text-[#34d399]" size={20} />
                                ) : (
                                    <ShieldAlert className="text-red-400" size={20} />
                                )}
                                <div>
                                    <p className="text-sm font-medium text-white">Certificate of Insurance (COI)</p>
                                    <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                                        <Calendar size={12} />
                                        <span className={isInsuranceExpired ? 'text-red-400 font-semibold' : ''}>
                                            Expires: {sub.insuranceExpiry || 'Not provided'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {sub.documentsRequired.hasCOI && !isInsuranceExpired ? (
                                    <span className="text-xs font-semibold text-[#34d399] bg-[#34d399]/10 px-2 py-1 rounded">On File</span>
                                ) : (
                                    <button className="text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c] transition-colors">
                                        {isInsuranceExpired ? 'Request Renewal' : 'Request'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* MSA */}
                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                {sub.documentsRequired.hasMSA ? (
                                    <FileCheck className="text-[#34d399]" size={20} />
                                ) : (
                                    <ShieldAlert className="text-red-400" size={20} />
                                )}
                                <div>
                                    <p className="text-sm font-medium text-white">Master Subcontractor Agreement</p>
                                    <p className="text-xs text-white/40 mt-0.5">Signed contract covering terms & conditions</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {sub.documentsRequired.hasMSA ? (
                                    <span className="text-xs font-semibold text-[#34d399] bg-[#34d399]/10 px-2 py-1 rounded">On File</span>
                                ) : (
                                    <button className="text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c] transition-colors">Send for Signature</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Other Files / Vault */}
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-6">File Vault</h2>

                    {/* Mock files */}
                    <div className="space-y-2">
                        {[
                            { name: 'State Business License - 2024.pdf', date: 'Jan 15, 2024', size: '1.2 MB' },
                            { name: 'Lead Paint Certification.jpg', date: 'Mar 10, 2023', size: '2.4 MB' },
                            { name: 'OSHA 30 Core Team List.pdf', date: 'Feb 22, 2023', size: '0.8 MB' }
                        ].map((file, i) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors group cursor-pointer border border-transparent hover:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#b8956a] transition-colors">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white group-hover:text-[#b8956a] transition-colors">{file.name}</p>
                                        <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">{file.date} • {file.size}</p>
                                    </div>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 text-xs font-semibold text-white/60 hover:text-white transition-all">
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
