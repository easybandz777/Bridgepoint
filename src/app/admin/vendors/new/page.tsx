'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import type { CustomerAddress } from '@/lib/customers';

export default function NewVendorPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [displayName, setDisplayName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [mobile, setMobile] = useState('');
    const [is1099, setIs1099] = useState(false);
    const [taxIdentifier, setTaxIdentifier] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [active, setActive] = useState(true);
    const [notes, setNotes] = useState('');
    const [bill, setBill] = useState<CustomerAddress>({});

    const updateBill = (key: keyof CustomerAddress, value: string) => {
        setBill((current) => ({ ...current, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const dn = displayName.trim() || companyName.trim();
        if (!dn) {
            setError('Display name (or company name) is required.');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/vendors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName: dn,
                    companyName: companyName.trim() || null,
                    firstName: firstName.trim() || null,
                    lastName: lastName.trim() || null,
                    email: email.trim() || null,
                    phone: phone.trim() || null,
                    mobile: mobile.trim() || null,
                    is1099,
                    taxIdentifier: taxIdentifier.trim() || null,
                    accountNumber: accountNumber.trim() || null,
                    active,
                    notes,
                    billAddress: bill,
                    source: 'crm',
                }),
            });
            const body = (await res.json()) as { id?: string; error?: string };
            if (!res.ok || !body.id) throw new Error(body.error ?? 'Failed to create');
            router.push(`/admin/vendors/${body.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create');
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <Link
                    href="/admin/vendors"
                    className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-[#b8956a] hover:text-[#cbb08c] transition-colors mb-4"
                >
                    <ArrowLeft size={14} className="mr-2" /> Back to Vendors
                </Link>
                <h1 className="font-serif text-3xl font-bold text-white mb-2">New Vendor</h1>
                <p className="text-white/50 text-sm">Add a vendor to the CRM. You can sync to QuickBooks later.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Section title="Identity" step={1}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Display Name *" full>
                            <input
                                required
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="What QuickBooks will store as DisplayName"
                                className="form-input text-base sm:text-sm"
                            />
                        </Field>
                        <Field label="Company Name">
                            <input
                                type="text"
                                autoComplete="organization"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="form-input text-base sm:text-sm"
                            />
                        </Field>
                        <Field label="Active">
                            <label className="inline-flex items-center gap-2 text-sm text-white/70 h-12">
                                <input
                                    type="checkbox"
                                    checked={active}
                                    onChange={(e) => setActive(e.target.checked)}
                                    className="w-5 h-5 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0"
                                />
                                Vendor is active
                            </label>
                        </Field>
                        <Field label="First Name">
                            <input
                                type="text"
                                autoCapitalize="words"
                                autoComplete="given-name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="form-input text-base sm:text-sm"
                            />
                        </Field>
                        <Field label="Last Name">
                            <input
                                type="text"
                                autoCapitalize="words"
                                autoComplete="family-name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="form-input text-base sm:text-sm"
                            />
                        </Field>
                    </div>
                </Section>

                <Section title="Contact" step={2}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Email">
                            <input
                                type="email"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                autoComplete="email"
                                inputMode="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input text-base sm:text-sm"
                            />
                        </Field>
                        <Field label="Phone">
                            <input
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="form-input text-base sm:text-sm"
                            />
                        </Field>
                        <Field label="Mobile" full>
                            <input
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                className="form-input text-base sm:text-sm"
                            />
                        </Field>
                    </div>
                </Section>

                <Section title="Billing Address" step={3}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Line 1" full>
                            <input
                                type="text"
                                autoComplete="street-address"
                                value={bill.line1 ?? ''}
                                onChange={(e) => updateBill('line1', e.target.value)}
                                className="form-input text-base sm:text-sm"
                            />
                        </Field>
                        <Field label="Line 2" full>
                            <input
                                type="text"
                                autoComplete="address-line2"
                                value={bill.line2 ?? ''}
                                onChange={(e) => updateBill('line2', e.target.value)}
                                className="form-input text-base sm:text-sm"
                            />
                        </Field>
                        <Field label="City">
                            <input
                                type="text"
                                autoComplete="address-level2"
                                value={bill.city ?? ''}
                                onChange={(e) => updateBill('city', e.target.value)}
                                className="form-input text-base sm:text-sm"
                            />
                        </Field>
                        <Field label="State">
                            <input
                                type="text"
                                autoComplete="address-level1"
                                value={bill.state ?? ''}
                                onChange={(e) => updateBill('state', e.target.value)}
                                className="form-input text-base sm:text-sm"
                            />
                        </Field>
                        <Field label="ZIP">
                            <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="postal-code"
                                value={bill.zip ?? ''}
                                onChange={(e) => updateBill('zip', e.target.value)}
                                className="form-input text-base sm:text-sm"
                            />
                        </Field>
                        <Field label="Country">
                            <input
                                type="text"
                                autoComplete="country-name"
                                value={bill.country ?? ''}
                                onChange={(e) => updateBill('country', e.target.value)}
                                placeholder="US"
                                className="form-input text-base sm:text-sm"
                            />
                        </Field>
                    </div>
                </Section>

                <Section title="Tax & Account" step={4}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="1099 Tracked" full>
                            <label className="inline-flex items-center gap-2 text-sm text-white/70">
                                <input
                                    type="checkbox"
                                    checked={is1099}
                                    onChange={(e) => setIs1099(e.target.checked)}
                                    className="w-5 h-5 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0"
                                />
                                Issue 1099 to this vendor
                            </label>
                        </Field>
                        <Field label="Tax ID / EIN">
                            <input
                                type="text"
                                value={taxIdentifier}
                                onChange={(e) => setTaxIdentifier(e.target.value)}
                                placeholder="XX-XXXXXXX"
                                className="form-input font-mono text-base sm:text-sm"
                            />
                        </Field>
                        <Field label="Account #">
                            <input
                                type="text"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                className="form-input text-base sm:text-sm"
                            />
                        </Field>
                    </div>
                </Section>

                <Section title="Notes" step={5}>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors min-h-[120px]"
                    />
                </Section>

                {error && (
                    <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-300 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                    <Link
                        href="/admin/vendors"
                        className="h-12 px-6 rounded-full flex items-center justify-center font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting || !(displayName.trim() || companyName.trim())}
                        className="h-12 px-8 bg-[#b8956a] text-black rounded-full flex items-center justify-center gap-2 font-bold hover:bg-[#cbb08c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={16} /> {submitting ? 'Saving...' : 'Create Vendor'}
                    </button>
                </div>
            </form>

            <style jsx>{`
                :global(.form-input) {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 0.75rem;
                    padding: 0.75rem;
                    color: white;
                    outline: none;
                    transition: background 150ms, border-color 150ms;
                }
                :global(.form-input:focus) {
                    border-color: rgba(184, 149, 106, 0.5);
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}

interface SectionProps {
    title: string;
    step: number;
    children: React.ReactNode;
}

function Section({ title, step, children }: SectionProps) {
    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50 font-mono">{step}</span>
                {title}
            </h2>
            {children}
        </div>
    );
}

interface FieldProps {
    label: string;
    children: React.ReactNode;
    full?: boolean;
}

function Field({ label, children, full }: FieldProps) {
    return (
        <div className={full ? 'md:col-span-2' : ''}>
            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">{label}</label>
            {children}
        </div>
    );
}
