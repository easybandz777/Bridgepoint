'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { FileCheck, ShieldAlert, FileText, Calendar, Plus, Trash2 } from 'lucide-react';
import { EmployeeTabNav } from '@/components/admin/employee-tab-nav';
import {
    Employee,
    EmployeeDocument,
    EMPLOYEE_DOC_TYPES,
    rowToEmployee,
    rowToDocument,
} from '@/lib/employees';

const REQUIRED_DOCS: { type: string; label: string; description: string }[] = [
    { type: 'W-4', label: 'W-4 Form', description: 'Federal tax withholding' },
    { type: 'I-9', label: 'I-9 Form', description: 'Employment eligibility verification' },
    { type: 'Direct Deposit', label: 'Direct Deposit', description: 'Banking authorization' },
    { type: 'Background Check', label: 'Background Check', description: 'Pre-employment screening' },
    { type: 'Drug Test', label: 'Drug Test', description: 'Pre-employment screening' },
];

function expiryStatus(d: EmployeeDocument): 'green' | 'amber' | 'red' | null {
    if (!d.expiryDate) return null;
    const exp = new Date(d.expiryDate);
    const now = new Date();
    if (exp < now) return 'red';
    const days = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (days < 30) return 'amber';
    return 'green';
}

export default function EmployeeDocumentsPage() {
    const params = useParams();
    const id = params?.id as string;
    const [emp, setEmp] = useState<Employee | null>(null);
    const [docs, setDocs] = useState<EmployeeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);

    const [newType, setNewType] = useState<string>('W-4');
    const [newFilename, setNewFilename] = useState('');
    const [newExpiry, setNewExpiry] = useState('');

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [empRes, docsRes] = await Promise.all([
                fetch(`/api/employees/${id}`),
                fetch(`/api/employees/${id}/documents`),
            ]);
            const empData = await empRes.json();
            if (empData && !empData.error) setEmp(rowToEmployee(empData));
            const docsData = await docsRes.json();
            setDocs(Array.isArray(docsData) ? docsData.map(rowToDocument) : []);
        } catch {
            setDocs([]);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => { load(); }, [load]);

    async function uploadDoc(e: React.FormEvent) {
        e.preventDefault();
        await fetch(`/api/employees/${id}/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                docType: newType,
                filename: newFilename || `${newType.toLowerCase().replace(/\s+/g, '-')}.pdf`,
                expiryDate: newExpiry || null,
                uploadedDate: new Date().toISOString().slice(0, 10),
                verified: false,
            }),
        });
        setShowAdd(false);
        setNewFilename('');
        setNewExpiry('');
        load();
    }

    async function toggleVerify(doc: EmployeeDocument) {
        await fetch(`/api/employees/${id}/documents/${doc.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verified: !doc.verified }),
        });
        load();
    }

    async function deleteDoc(docId: string) {
        if (!confirm('Delete this document?')) return;
        await fetch(`/api/employees/${id}/documents/${docId}`, { method: 'DELETE' });
        load();
    }

    if (!emp && loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
            </div>
        );
    }

    if (!emp) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-white/30">
                <p className="text-lg font-serif font-bold text-white mb-2">Employee Not Found</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-white mb-1">{emp.firstName} {emp.lastName}</h1>
                    <p className="text-sm text-white/50">Compliance documents and certifications</p>
                </div>
                <button
                    onClick={() => setShowAdd(s => !s)}
                    className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors"
                >
                    <Plus size={16} /> Add document
                </button>
            </div>

            <EmployeeTabNav employeeId={emp.id} />

            {showAdd && (
                <form onSubmit={uploadDoc} className="bg-[#1a1a1a] border border-[#b8956a]/30 rounded-2xl p-5 mb-6">
                    <h3 className="text-sm font-semibold text-white mb-4">Add Document</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-white/50">Type</span>
                            <select value={newType} onChange={e => setNewType(e.target.value)} className={inputCls}>
                                {EMPLOYEE_DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-white/50">Filename</span>
                            <input value={newFilename} onChange={e => setNewFilename(e.target.value)} placeholder="document.pdf" className={inputCls} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-white/50">Expiry (optional)</span>
                            <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} className={inputCls} />
                        </label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAdd(false)} className="h-9 px-4 text-xs text-white/60 hover:text-white transition-colors">Cancel</button>
                        <button type="submit" className="h-9 px-4 bg-[#b8956a] text-black text-xs font-semibold rounded-lg hover:bg-[#cbb08c] transition-colors">Add</button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Required checklist */}
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-6">Required Onboarding Documents</h2>
                    <div className="space-y-3">
                        {REQUIRED_DOCS.map(req => {
                            const doc = docs.find(d => d.docType === req.type);
                            const onFile = !!doc;
                            return (
                                <div key={req.type} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        {onFile ? <FileCheck className="text-[#34d399]" size={20} /> : <ShieldAlert className="text-red-400" size={20} />}
                                        <div>
                                            <p className="text-sm font-medium text-white">{req.label}</p>
                                            <p className="text-xs text-white/40 mt-0.5">{req.description}</p>
                                        </div>
                                    </div>
                                    {onFile ? (
                                        <span className="text-xs font-semibold text-[#34d399] bg-[#34d399]/10 px-2 py-1 rounded">On File</span>
                                    ) : (
                                        <button
                                            onClick={() => { setNewType(req.type); setShowAdd(true); }}
                                            className="text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c] transition-colors"
                                        >
                                            Request
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* All documents */}
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                    <h2 className="text-sm font-semibold text-white mb-6">All Documents ({docs.length})</h2>
                    {docs.length === 0 ? (
                        <p className="text-sm text-white/30">No documents uploaded yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {docs.map(doc => {
                                const exp = expiryStatus(doc);
                                return (
                                    <div key={doc.id} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/[0.07] rounded-xl border border-white/5 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/50 shrink-0">
                                                <FileText size={18} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-white truncate">{doc.filename}</p>
                                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40 mt-0.5">
                                                    <span>{doc.docType}</span>
                                                    {doc.expiryDate && (
                                                        <span className={`flex items-center gap-1 ${
                                                            exp === 'red' ? 'text-red-400' :
                                                                exp === 'amber' ? 'text-amber-400' :
                                                                    'text-[#34d399]'
                                                        }`}>
                                                            <Calendar size={10} /> {doc.expiryDate}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => toggleVerify(doc)}
                                                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded transition-colors ${
                                                    doc.verified
                                                        ? 'bg-[#34d399]/10 text-[#34d399] hover:bg-[#34d399]/20'
                                                        : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                                }`}
                                            >
                                                {doc.verified ? 'Verified' : 'Verify'}
                                            </button>
                                            <button
                                                onClick={() => deleteDoc(doc.id)}
                                                title="Delete"
                                                className="w-11 h-11 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-colors"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const inputCls = 'h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all';
