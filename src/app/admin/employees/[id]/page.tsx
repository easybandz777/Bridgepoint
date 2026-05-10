'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Mail, Phone, MapPin, Calendar, Save, Pencil, X } from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';
import { EmployeeTabNav } from '@/components/admin/employee-tab-nav';
import {
    Employee,
    TimeEntry,
    EmployeeDocument,
    rowToEmployee,
    rowToTimeEntry,
    rowToDocument,
    fmtMoney,
    fmtHours,
    addDays,
    ymd,
} from '@/lib/employees';

export default function EmployeeOverviewPage() {
    const params = useParams();
    const id = params?.id as string;
    const [emp, setEmp] = useState<Employee | null>(null);
    const [recent, setRecent] = useState<TimeEntry[]>([]);
    const [docs, setDocs] = useState<EmployeeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFoundFlag, setNotFoundFlag] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit form state
    const [editPhone, setEditPhone] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editRate, setEditRate] = useState('');
    const [editStatus, setEditStatus] = useState('Active');
    const [editNotes, setEditNotes] = useState('');

    useEffect(() => {
        if (!id) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const today = new Date();
            const start = addDays(ymd(today), -14);
            const end = ymd(today);
            const [empRes, teRes, docsRes] = await Promise.all([
                fetch(`/api/employees/${id}`),
                fetch(`/api/employees/${id}/time-entries?start=${start}&end=${end}`),
                fetch(`/api/employees/${id}/documents`),
            ]);
            if (empRes.status === 404) {
                setNotFoundFlag(true);
                setLoading(false);
                return;
            }
            if (!empRes.ok) throw new Error(`HTTP ${empRes.status}`);
            const data = await empRes.json();
            const next = rowToEmployee(data);
            setEmp(next);
            setEditPhone(next.phone ?? '');
            setEditEmail(next.email ?? '');
            setEditAddress(next.address);
            setEditRate(String(next.salary ?? next.hourlyRate));
            setEditStatus(next.status);
            setEditNotes(next.notes);

            const teData = await teRes.json();
            setRecent(Array.isArray(teData) ? teData.map(rowToTimeEntry) : []);
            const docsData = await docsRes.json();
            setDocs(Array.isArray(docsData) ? docsData.map(rowToDocument) : []);
        } catch (e) {
            setError(String(e));
        }
        setLoading(false);
    }

    async function save() {
        if (!emp) return;
        setSaving(true);
        try {
            const isSalaried = emp.salary != null && emp.hourlyRate === 0;
            const body: Record<string, unknown> = {
                phone: editPhone || null,
                email: editEmail || null,
                address: editAddress,
                status: editStatus,
                notes: editNotes,
            };
            if (isSalaried) {
                body.salary = Number(editRate || 0);
            } else {
                body.hourlyRate = Number(editRate || 0);
                body.overtimeRate = Number(editRate || 0) * 1.5;
            }
            await fetch(`/api/employees/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            setEditing(false);
            load();
        } catch (e) {
            alert(`Save failed: ${String(e)}`);
        }
        setSaving(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
            </div>
        );
    }

    if (notFoundFlag || !emp) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-white/30">
                <p className="text-lg font-serif font-bold text-white mb-2">Employee Not Found</p>
                <p className="text-sm">{error ?? 'This record may have been deleted.'}</p>
            </div>
        );
    }

    const totalRecentHours = recent.reduce((s, e) => s + e.hoursRegular + e.hoursOvertime, 0);
    const totalRecentCost = recent.reduce((s, e) => s + e.costAmount, 0);
    const unverifiedDocs = docs.filter(d => !d.verified);
    const expiredDocs = docs.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date());

    const isSalaried = emp.salary != null && emp.hourlyRate === 0;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#b8956a]/5 to-transparent rounded-bl-[100px] pointer-events-none" />

                <div className="flex flex-col lg:flex-row justify-between gap-8 relative z-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <StatusBadge status={emp.status} />
                            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                {emp.employmentType}
                            </span>
                        </div>
                        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-1">
                            {emp.firstName} {emp.lastName}
                        </h1>
                        <p className="text-sm text-[#b8956a] font-semibold uppercase tracking-wider mb-4">{emp.role}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
                            {emp.address && <span className="flex items-center gap-1.5"><MapPin size={14} /> {emp.address}</span>}
                            {emp.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {emp.phone}</span>}
                            {emp.email && <span className="flex items-center gap-1.5"><Mail size={14} /> {emp.email}</span>}
                            {emp.hireDate && <span className="flex items-center gap-1.5"><Calendar size={14} /> Hired {emp.hireDate}</span>}
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-8 border-t lg:border-t-0 lg:border-l border-white/6 pt-6 lg:pt-0 lg:pl-8">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Pay Rate</p>
                            <p className="text-2xl font-bold text-white">
                                {isSalaried ? fmtMoney(emp.salary ?? 0) : `$${emp.hourlyRate.toFixed(0)}/h`}
                            </p>
                            {isSalaried && <p className="text-[10px] text-white/40 mt-1">Salaried</p>}
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Last 14d</p>
                            <p className="text-2xl font-bold text-white">{fmtHours(totalRecentHours)}</p>
                            <p className="text-[10px] text-white/40 mt-1">{fmtMoney(totalRecentCost)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Compliance</p>
                            <p className={`text-2xl font-bold ${unverifiedDocs.length + expiredDocs.length > 0 ? 'text-amber-400' : 'text-[#34d399]'}`}>
                                {docs.length - unverifiedDocs.length - expiredDocs.length}/{docs.length}
                            </p>
                            <p className="text-[10px] text-white/40 mt-1">verified</p>
                        </div>
                    </div>
                </div>
            </div>

            <EmployeeTabNav employeeId={emp.id} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile card */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-semibold text-white">Personal & Employment</h2>
                            {!editing ? (
                                <button onClick={() => setEditing(true)} className="text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c] transition-colors flex items-center gap-1.5">
                                    <Pencil size={12} /> Edit
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setEditing(false)} className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1.5">
                                        <X size={12} /> Cancel
                                    </button>
                                    <button onClick={save} disabled={saving} className="text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c] transition-colors flex items-center gap-1.5">
                                        <Save size={12} /> {saving ? 'Saving…' : 'Save'}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Info label="Email" value={emp.email ?? '—'} editing={editing} onEdit={
                                <input type="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="email" inputMode="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className={inputCls} />
                            } />
                            <Info label="Phone" value={emp.phone ?? '—'} editing={editing} onEdit={
                                <input type="tel" inputMode="tel" autoComplete="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className={inputCls} />
                            } />
                            <Info label="Address" full value={emp.address || '—'} editing={editing} onEdit={
                                <input autoComplete="street-address" value={editAddress} onChange={e => setEditAddress(e.target.value)} className={inputCls} />
                            } />
                            <Info label={isSalaried ? 'Annual Salary' : 'Hourly Rate'} value={isSalaried ? fmtMoney(emp.salary ?? 0) : `$${emp.hourlyRate.toFixed(2)}/hr`} editing={editing} onEdit={
                                <input type="number" inputMode="decimal" step="0.5" value={editRate} onChange={e => setEditRate(e.target.value)} className={inputCls} />
                            } />
                            <Info label="Status" value={emp.status} editing={editing} onEdit={
                                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className={inputCls}>
                                    <option>Active</option><option>On Leave</option><option>Inactive</option><option>Terminated</option>
                                </select>
                            } />
                        </div>

                        {(editing || emp.notes) && (
                            <div className="mt-5 pt-5 border-t border-white/6">
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Notes</p>
                                {editing ? (
                                    <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
                                ) : (
                                    <p className="text-sm text-white/70 leading-relaxed">{emp.notes || '—'}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Skills & Certs */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Skills & Certifications</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Skills</p>
                                <div className="flex flex-wrap gap-2">
                                    {emp.skills.length === 0 ? <p className="text-sm text-white/30">No skills listed.</p> :
                                        emp.skills.map(s => (
                                            <span key={s} className="px-2.5 py-1 bg-white/5 border border-white/10 text-white/70 text-xs rounded-lg">{s}</span>
                                        ))
                                    }
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Certifications</p>
                                <div className="flex flex-wrap gap-2">
                                    {emp.certifications.length === 0 ? <p className="text-sm text-white/30">No certifications.</p> :
                                        emp.certifications.map(c => (
                                            <span key={c} className="px-2.5 py-1 bg-[#b8956a]/10 border border-[#b8956a]/20 text-[#b8956a] text-xs rounded-lg">{c}</span>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent time entries */}
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Recent Time Entries (last 14 days)</h2>
                        {recent.length === 0 ? (
                            <p className="text-sm text-white/40">No time entries logged in the last two weeks.</p>
                        ) : (
                            <div className="overflow-x-auto -mx-2">
                                <table className="w-full text-sm">
                                    <thead className="text-[10px] uppercase tracking-widest text-white/40">
                                        <tr>
                                            <th className="text-left px-2 py-2">Date</th>
                                            <th className="text-right px-2 py-2">Reg</th>
                                            <th className="text-right px-2 py-2">OT</th>
                                            <th className="text-right px-2 py-2">Cost</th>
                                            <th className="text-left px-2 py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {recent.slice(0, 10).map(te => (
                                            <tr key={te.id}>
                                                <td className="px-2 py-2 text-white/80">{te.date}</td>
                                                <td className="px-2 py-2 text-right font-mono text-white">{te.hoursRegular.toFixed(1)}h</td>
                                                <td className="px-2 py-2 text-right font-mono text-white/60">{te.hoursOvertime > 0 ? `${te.hoursOvertime.toFixed(1)}h` : '—'}</td>
                                                <td className="px-2 py-2 text-right font-mono text-white">{fmtMoney(te.costAmount)}</td>
                                                <td className="px-2 py-2"><StatusBadge status={te.status} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className={`border rounded-2xl p-6 ${unverifiedDocs.length + expiredDocs.length > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-[#1a1a1a] border-white/6'}`}>
                        <h2 className="text-sm font-semibold text-white mb-4">Document Compliance</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/60">On file</span>
                                <span className="font-mono text-white">{docs.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">Verified</span>
                                <span className="font-mono text-[#34d399]">{docs.filter(d => d.verified).length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">Pending verify</span>
                                <span className={`font-mono ${unverifiedDocs.length > 0 ? 'text-amber-400' : 'text-white/40'}`}>{unverifiedDocs.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">Expired</span>
                                <span className={`font-mono ${expiredDocs.length > 0 ? 'text-red-400' : 'text-white/40'}`}>{expiredDocs.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Emergency Contact</h2>
                        {emp.emergencyContact && (emp.emergencyContact as Record<string, string>).name ? (
                            <div className="space-y-2 text-sm">
                                <p className="text-white font-medium">{(emp.emergencyContact as Record<string, string>).name}</p>
                                <p className="text-white/50 text-xs uppercase tracking-wider">{(emp.emergencyContact as Record<string, string>).relationship}</p>
                                <p className="text-white/70 font-mono">{(emp.emergencyContact as Record<string, string>).phone}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-white/30">No emergency contact on file.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const inputCls = 'w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all';

function Info({ label, value, full, editing, onEdit }: { label: string; value: string; full?: boolean; editing: boolean; onEdit: React.ReactNode }) {
    return (
        <div className={full ? 'sm:col-span-2' : ''}>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5">{label}</p>
            {editing ? onEdit : <p className="text-sm text-white">{value}</p>}
        </div>
    );
}
