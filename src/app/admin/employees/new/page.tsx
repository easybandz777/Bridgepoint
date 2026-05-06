'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EMPLOYEE_ROLES, EmployeeRole, EmploymentType } from '@/lib/employees';

export default function NewEmployeePage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<EmployeeRole>('Painter');
    const [employmentType, setEmploymentType] = useState<EmploymentType>('Full-time');
    const [hireDate, setHireDate] = useState(new Date().toISOString().slice(0, 10));
    const [hourlyRate, setHourlyRate] = useState('24');
    const [salary, setSalary] = useState('');
    const [address, setAddress] = useState('');
    const [skills, setSkills] = useState('');
    const [certifications, setCertifications] = useState('');
    const [notes, setNotes] = useState('');

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const body = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim() || null,
                phone: phone.trim() || null,
                role,
                employmentType,
                status: 'Active',
                hireDate: hireDate || null,
                hourlyRate: salary ? 0 : Number(hourlyRate || 0),
                overtimeRate: salary ? null : Number(hourlyRate || 0) * 1.5,
                salary: salary ? Number(salary) : null,
                address,
                skills: skills.split(',').map(s => s.trim()).filter(Boolean),
                certifications: certifications.split(',').map(s => s.trim()).filter(Boolean),
                notes,
            };
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
            router.push(`/admin/employees/${data.id}`);
        } catch (err) {
            setError(String(err));
            setSubmitting(false);
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <Link href="/admin/employees" className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors mb-3">
                    <ArrowLeft size={14} /> Back to directory
                </Link>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">Add Employee</h1>
                <p className="text-sm text-white/50">Create a new in-house team member.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-200">{error}</div>
                )}

                <Section title="Identity">
                    <Grid>
                        <Field label="First name" required>
                            <input value={firstName} onChange={e => setFirstName(e.target.value)} required className={inputCls} />
                        </Field>
                        <Field label="Last name" required>
                            <input value={lastName} onChange={e => setLastName(e.target.value)} required className={inputCls} />
                        </Field>
                        <Field label="Email">
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Phone">
                            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(404) 555-0100" className={inputCls} />
                        </Field>
                        <Field label="Address" full>
                            <input value={address} onChange={e => setAddress(e.target.value)} className={inputCls} />
                        </Field>
                    </Grid>
                </Section>

                <Section title="Employment">
                    <Grid>
                        <Field label="Role" required>
                            <select value={role} onChange={e => setRole(e.target.value as EmployeeRole)} className={inputCls}>
                                {EMPLOYEE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </Field>
                        <Field label="Type">
                            <select value={employmentType} onChange={e => setEmploymentType(e.target.value as EmploymentType)} className={inputCls}>
                                <option>Full-time</option>
                                <option>Part-time</option>
                                <option>Contract</option>
                                <option>Seasonal</option>
                            </select>
                        </Field>
                        <Field label="Hire date">
                            <input type="date" value={hireDate} onChange={e => setHireDate(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Hourly rate ($/hr)">
                            <input type="number" step="0.5" min="0" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Annual salary ($)" hint="Leave blank if hourly">
                            <input type="number" step="500" min="0" value={salary} onChange={e => setSalary(e.target.value)} className={inputCls} />
                        </Field>
                    </Grid>
                </Section>

                <Section title="Skills & Certifications">
                    <Grid>
                        <Field label="Skills" hint="Comma-separated" full>
                            <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="Cabinet refinishing, Spray finishing" className={inputCls} />
                        </Field>
                        <Field label="Certifications" hint="Comma-separated" full>
                            <input value={certifications} onChange={e => setCertifications(e.target.value)} placeholder="OSHA-10, Lead-Safe Renovator (EPA)" className={inputCls} />
                        </Field>
                        <Field label="Notes" full>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
                        </Field>
                    </Grid>
                </Section>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link href="/admin/employees" className="px-5 h-10 flex items-center text-sm text-white/60 hover:text-white transition-colors">Cancel</Link>
                    <button
                        type="submit"
                        disabled={submitting || !firstName || !lastName}
                        className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center gap-2 hover:bg-[#cbb08c] transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Saving…' : 'Save Employee'}
                    </button>
                </div>
            </form>
        </div>
    );
}

const inputCls = 'w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-white mb-4">{title}</h2>
            {children}
        </div>
    );
}

function Grid({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({
    label,
    children,
    full,
    required,
    hint,
}: {
    label: string;
    children: React.ReactNode;
    full?: boolean;
    required?: boolean;
    hint?: string;
}) {
    return (
        <label className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
            <span className="text-[10px] uppercase tracking-widest text-white/50">
                {label}{required && <span className="text-[#b8956a] ml-1">*</span>}
                {hint && <span className="ml-2 normal-case tracking-normal text-white/30">{hint}</span>}
            </span>
            {children}
        </label>
    );
}
