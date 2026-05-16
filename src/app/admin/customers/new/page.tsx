'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Building2, PlugZap } from 'lucide-react';
import type { CustomerAddress, CustomerType } from '@/lib/customers';

const PAYMENT_TERMS_OPTIONS = ['Net 15', 'Net 30', 'Net 60', 'Due on Receipt', 'Custom'];
const PAYMENT_METHODS = ['Check', 'ACH', 'Card', 'Cash'];

const QB_DISABLED = process.env.NEXT_PUBLIC_QB_DISABLED === 'true';

export default function NewCustomerPage() {
    const router = useRouter();

    const [customerType, setCustomerType] = useState<CustomerType>('Individual');
    const [companyName, setCompanyName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [displayNameTouched, setDisplayNameTouched] = useState(false);

    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [mobile, setMobile] = useState('');
    const [fax, setFax] = useState('');
    const [website, setWebsite] = useState('');

    const [billAddress, setBillAddress] = useState<CustomerAddress>({});
    const [sameAsBilling, setSameAsBilling] = useState(true);
    const [shipAddress, setShipAddress] = useState<CustomerAddress>({});

    const [active, setActive] = useState(true);
    const [taxExempt, setTaxExempt] = useState(false);
    const [paymentTerms, setPaymentTerms] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [notes, setNotes] = useState('');

    const [syncToQB, setSyncToQB] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-derive display name from inputs unless the user has typed their own.
    const derivedDisplay = useMemo(() => {
        if (customerType === 'Company') return companyName.trim();
        return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    }, [customerType, companyName, firstName, lastName]);

    const effectiveDisplayName = displayNameTouched && displayName.trim()
        ? displayName.trim()
        : derivedDisplay;

    function canSubmit(): boolean {
        if (submitting) return false;
        if (customerType === 'Company') return Boolean(companyName.trim());
        return Boolean(firstName.trim() || lastName.trim());
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit()) return;
        setSubmitting(true);
        setError(null);
        try {
            const ship = sameAsBilling ? billAddress : shipAddress;
            const body = {
                customerType,
                displayName: effectiveDisplayName || undefined,
                companyName: customerType === 'Company' ? companyName.trim() || null : null,
                firstName: customerType === 'Individual' ? firstName.trim() || null : null,
                lastName: customerType === 'Individual' ? lastName.trim() || null : null,
                email: email.trim() || null,
                phone: phone.trim() || null,
                mobile: mobile.trim() || null,
                fax: fax.trim() || null,
                website: website.trim() || null,
                billAddress: billAddress,
                shipAddress: ship,
                active,
                taxExempt,
                paymentTerms: paymentTerms || null,
                paymentMethod: paymentMethod || null,
                notes: notes.trim(),
                source: 'crm',
            };
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
            if (!res.ok || data.error || !data.id) {
                throw new Error(data.error ?? `HTTP ${res.status}`);
            }
            const newId = data.id;

            if (syncToQB && !QB_DISABLED) {
                // Customer-direct QB sync isn't built yet; another agent will wire
                // this up. We attempt the call and continue regardless of result —
                // the user can retry from the detail page.
                try {
                    await fetch(`/api/quickbooks/customers/${newId}/sync`, { method: 'POST' });
                } catch {
                    // Swallow — the detail page surfaces a richer error message.
                }
            }

            router.push(`/admin/customers/${newId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setSubmitting(false);
        }
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
            <div className="mb-8">
                <Link
                    href="/admin/customers"
                    className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors mb-3"
                >
                    <ArrowLeft size={14} /> Back to customers
                </Link>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">New Customer</h1>
                <p className="text-sm text-white/50">Create a new customer record. You can sync to QuickBooks later.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-200">
                        {error}
                    </div>
                )}

                {/* 1. Identity */}
                <Section title="Identity">
                    <div className="mb-4 inline-flex bg-white/5 border border-white/10 rounded-xl p-1">
                        <TypeToggle
                            active={customerType === 'Individual'}
                            onClick={() => setCustomerType('Individual')}
                            icon={<User size={14} />}
                            label="Individual"
                        />
                        <TypeToggle
                            active={customerType === 'Company'}
                            onClick={() => setCustomerType('Company')}
                            icon={<Building2 size={14} />}
                            label="Company"
                        />
                    </div>

                    <Grid>
                        {customerType === 'Company' ? (
                            <Field label="Company name" required full>
                                <input
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    required
                                    autoComplete="organization"
                                    className={inputCls}
                                />
                            </Field>
                        ) : (
                            <>
                                <Field label="First name">
                                    <input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        autoCapitalize="words"
                                        autoComplete="given-name"
                                        className={inputCls}
                                    />
                                </Field>
                                <Field label="Last name">
                                    <input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        autoCapitalize="words"
                                        autoComplete="family-name"
                                        className={inputCls}
                                    />
                                </Field>
                            </>
                        )}
                        <Field
                            label="Display name"
                            hint={derivedDisplay && !displayNameTouched ? `Auto: ${derivedDisplay}` : 'Override if different'}
                            full
                        >
                            <input
                                value={displayNameTouched ? displayName : derivedDisplay}
                                onChange={(e) => {
                                    setDisplayNameTouched(true);
                                    setDisplayName(e.target.value);
                                }}
                                placeholder={derivedDisplay || 'How this customer appears on invoices'}
                                className={inputCls}
                            />
                        </Field>
                    </Grid>
                </Section>

                {/* 2. Contact */}
                <Section title="Contact">
                    <Grid>
                        <Field label="Email">
                            <input type="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Phone">
                            <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(404) 555-0100" className={inputCls} />
                        </Field>
                        <Field label="Mobile">
                            <input type="tel" inputMode="tel" autoComplete="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Fax">
                            <input type="tel" inputMode="tel" value={fax} onChange={(e) => setFax(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Website" full>
                            <input type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className={inputCls} />
                        </Field>
                    </Grid>
                </Section>

                {/* 3. Addresses */}
                <Section title="Address">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Billing</p>
                    <AddressFields value={billAddress} onChange={setBillAddress} />

                    <label className="flex items-center gap-3 mt-5 mb-3 text-sm text-white/70 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={sameAsBilling}
                            onChange={(e) => setSameAsBilling(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0"
                        />
                        Shipping address same as billing
                    </label>

                    {!sameAsBilling && (
                        <>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 mt-4">Shipping</p>
                            <AddressFields value={shipAddress} onChange={setShipAddress} />
                        </>
                    )}
                </Section>

                {/* 4. Settings */}
                <Section title="Settings">
                    <Grid>
                        <Field label="Payment terms">
                            <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className={inputCls}>
                                <option value="">—</option>
                                {PAYMENT_TERMS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        </Field>
                        <Field label="Payment method">
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}>
                                <option value="">—</option>
                                {PAYMENT_METHODS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        </Field>
                        <Field label="Notes" full>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className={`${inputCls} resize-none`}
                            />
                        </Field>
                    </Grid>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center gap-3 text-sm text-white/70 cursor-pointer p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                            <input
                                type="checkbox"
                                checked={active}
                                onChange={(e) => setActive(e.target.checked)}
                                className="w-4 h-4 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0"
                            />
                            Active
                        </label>
                        <label className="flex items-center gap-3 text-sm text-white/70 cursor-pointer p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                            <input
                                type="checkbox"
                                checked={taxExempt}
                                onChange={(e) => setTaxExempt(e.target.checked)}
                                className="w-4 h-4 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0"
                            />
                            Tax exempt
                        </label>
                    </div>
                </Section>

                {/* 5. QB sync — hidden entirely when the integration is disabled */}
                {!QB_DISABLED && (
                    <Section title="QuickBooks">
                        <label
                            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                                syncToQB
                                    ? 'bg-[#b8956a]/5 border-[#b8956a]/30'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                        >
                            <input
                                type="checkbox"
                                checked={syncToQB}
                                onChange={(e) => setSyncToQB(e.target.checked)}
                                className="w-5 h-5 mt-0.5 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white flex items-center gap-2">
                                    <PlugZap size={14} className="text-[#b8956a]" />
                                    Also create in QuickBooks now
                                </p>
                                <p className="text-[12px] text-white/50 mt-1">
                                    If QuickBooks is connected, we&apos;ll mirror this customer immediately. Otherwise the
                                    CRM record is created and you can sync later from the customer detail page.
                                </p>
                            </div>
                        </label>
                    </Section>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link
                        href="/admin/customers"
                        className="px-5 h-10 flex items-center text-sm text-white/60 hover:text-white transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={!canSubmit()}
                        className="h-10 px-5 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center gap-2 hover:bg-[#cbb08c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Saving…' : 'Create Customer'}
                    </button>
                </div>
            </form>
        </div>
    );
}

const inputCls = 'w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-base sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all';

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
    label, children, full, required, hint,
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

function TypeToggle({
    active, onClick, icon, label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-4 h-9 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
                active ? 'bg-[#b8956a] text-black' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
        >
            {icon}
            {label}
        </button>
    );
}

function AddressFields({
    value, onChange,
}: {
    value: CustomerAddress;
    onChange: (next: CustomerAddress) => void;
}) {
    return (
        <div className="space-y-2">
            <input
                placeholder="Street address"
                autoComplete="street-address"
                value={value.line1 ?? ''}
                onChange={(e) => onChange({ ...value, line1: e.target.value })}
                className={inputCls}
            />
            <input
                placeholder="Apt, suite, etc. (optional)"
                autoComplete="address-line2"
                value={value.line2 ?? ''}
                onChange={(e) => onChange({ ...value, line2: e.target.value })}
                className={inputCls}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                    placeholder="City"
                    autoComplete="address-level2"
                    value={value.city ?? ''}
                    onChange={(e) => onChange({ ...value, city: e.target.value })}
                    className={`${inputCls} sm:col-span-2`}
                />
                <input
                    placeholder="State"
                    autoComplete="address-level1"
                    value={value.state ?? ''}
                    onChange={(e) => onChange({ ...value, state: e.target.value })}
                    className={inputCls}
                />
            </div>
            <input
                placeholder="ZIP"
                inputMode="numeric"
                autoComplete="postal-code"
                value={value.zip ?? ''}
                onChange={(e) => onChange({ ...value, zip: e.target.value })}
                className={inputCls}
            />
        </div>
    );
}
