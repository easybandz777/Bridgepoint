'use client';

import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { useT } from '@/lib/portal-i18n';
import { usePortalUser } from '@/lib/portal-context';
import { updateMe } from '@/lib/portal-client';

interface EmergencyContactForm {
    name: string;
    relationship: string;
    phone: string;
}

export function ProfileForm() {
    const t = useT();
    const { user, employee, subcontractor, refresh } = usePortalUser();
    const isEmployee = user.userType === 'employee';

    const initialEmergency: EmergencyContactForm = (() => {
        if (!isEmployee || !employee) return { name: '', relationship: '', phone: '' };
        const ec = (employee.emergency_contact ?? {}) as Record<string, unknown>;
        return {
            name: String(ec.name ?? ''),
            relationship: String(ec.relationship ?? ''),
            phone: String(ec.phone ?? ''),
        };
    })();

    const [phone, setPhone] = useState(
        isEmployee ? String(employee?.phone ?? '') : String(subcontractor?.phone ?? ''),
    );
    const [address, setAddress] = useState(
        isEmployee ? String(employee?.address ?? '') : String(subcontractor?.address ?? ''),
    );
    const [contactPerson, setContactPerson] = useState(String(subcontractor?.contact_person ?? ''));
    const [emergency, setEmergency] = useState<EmergencyContactForm>(initialEmergency);

    const [submitting, setSubmitting] = useState(false);
    const [savedAt, setSavedAt] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSavedAt(null);
        try {
            const body: Record<string, unknown> = { phone, address };
            if (isEmployee) {
                body.emergencyContact = emergency;
            } else {
                body.contactPerson = contactPerson;
            }
            await updateMe(body);
            await refresh();
            setSavedAt(Date.now());
        } catch (err) {
            setError(err instanceof Error ? err.message : t('profile.saveError'));
        } finally {
            setSubmitting(false);
        }
    }

    const certifications = isEmployee && Array.isArray(employee?.certifications)
        ? (employee!.certifications as string[]) : [];
    const skills = isEmployee && Array.isArray(employee?.skills)
        ? (employee!.skills as string[]) : [];
    const trades = !isEmployee && Array.isArray(subcontractor?.trades)
        ? (subcontractor!.trades as string[]) : [];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Section title={t('profile.basicInfo')} subtitle={t('profile.readOnly')}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isEmployee ? (
                        <>
                            <ReadOnly label={t('profile.firstName')} value={String(employee?.first_name ?? '')} />
                            <ReadOnly label={t('profile.lastName')} value={String(employee?.last_name ?? '')} />
                            <ReadOnly label={t('profile.email')} value={String(employee?.email ?? '')} />
                            <ReadOnly label={t('profile.role')} value={String(employee?.role ?? '')} />
                        </>
                    ) : (
                        <>
                            <ReadOnly label={t('profile.companyName')} value={String(subcontractor?.company_name ?? '')} />
                            <ReadOnly label={t('profile.email')} value={String(subcontractor?.email ?? '')} />
                            <ReadOnly label={t('profile.role')} value={String(user.role ?? '')} />
                            <ReadOnly label={t('common.status')} value={String(subcontractor?.status ?? '')} />
                        </>
                    )}
                </div>
            </Section>

            <Section title={t('profile.contactInfo')}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {!isEmployee && (
                        <Field
                            label={t('profile.contactPerson')}
                            value={contactPerson}
                            onChange={setContactPerson}
                            className="sm:col-span-2"
                        />
                    )}
                    <Field
                        label={t('profile.phone')}
                        value={phone}
                        onChange={setPhone}
                        type="tel"
                    />
                    <Field
                        label={t('profile.address')}
                        value={address}
                        onChange={setAddress}
                        className="sm:col-span-2"
                    />
                </div>
            </Section>

            {isEmployee && (
                <Section title={t('profile.emergencyContact')}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field
                            label={t('profile.emergencyName')}
                            value={emergency.name}
                            onChange={(v) => setEmergency(s => ({ ...s, name: v }))}
                        />
                        <Field
                            label={t('profile.emergencyRelationship')}
                            value={emergency.relationship}
                            onChange={(v) => setEmergency(s => ({ ...s, relationship: v }))}
                        />
                        <Field
                            label={t('profile.emergencyPhone')}
                            value={emergency.phone}
                            onChange={(v) => setEmergency(s => ({ ...s, phone: v }))}
                            type="tel"
                        />
                    </div>
                </Section>
            )}

            {isEmployee ? (
                <>
                    <Section title={t('profile.certifications')} subtitle={t('profile.readOnly')}>
                        <ChipList items={certifications} emptyKey={t('profile.noCertifications')} />
                    </Section>
                    <Section title={t('profile.skills')} subtitle={t('profile.readOnly')}>
                        <ChipList items={skills} emptyKey={t('profile.noSkills')} />
                    </Section>
                </>
            ) : (
                <Section title={t('profile.trades')} subtitle={t('profile.readOnly')}>
                    <ChipList items={trades} emptyKey={t('profile.noTrades')} />
                </Section>
            )}

            <div className="flex items-center justify-between gap-4 pt-2">
                <div className="text-xs">
                    {error && <span className="text-red-400">{error}</span>}
                    {savedAt && !error && (
                        <span className="text-[#34d399] flex items-center gap-1.5">
                            <Check size={12} />
                            {t('profile.saved')}
                        </span>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 rounded-xl text-sm font-semibold uppercase tracking-[0.12em] text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)' }}
                >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    {submitting ? t('common.saving') : t('common.save')}
                </button>
            </div>
        </form>
    );
}

function Section({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <section
            className="rounded-2xl border p-5 sm:p-6"
            style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}
        >
            <div className="mb-4">
                <h2 className="font-serif text-lg font-semibold text-white tracking-tight">{title}</h2>
                {subtitle && (
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/30 mt-1">{subtitle}</p>
                )}
            </div>
            {children}
        </section>
    );
}

function Field({
    label,
    value,
    onChange,
    type = 'text',
    className = '',
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    className?: string;
}) {
    return (
        <label className={`flex flex-col gap-1.5 ${className}`}>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                {label}
            </span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 transition-all"
            />
        </label>
    );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                {label}
            </span>
            <div className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-white/70">
                {value || '—'}
            </div>
        </div>
    );
}

function ChipList({ items, emptyKey }: { items: string[]; emptyKey: string }) {
    if (items.length === 0) {
        return <p className="text-xs text-white/40">{emptyKey}</p>;
    }
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((c) => (
                <span
                    key={c}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs text-white/75 border border-[#b8956a]/25 bg-[#b8956a]/8"
                >
                    {c}
                </span>
            ))}
        </div>
    );
}
