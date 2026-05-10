'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Mail, Phone, MapPin, Building2, AlertCircle,
    Edit, Save, X, RefreshCcw, Cloud, Receipt, Link2, Hash,
} from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';
import type { Vendor } from '@/lib/vendors';
import type { CustomerAddress } from '@/lib/customers';

interface BillRow {
    id: string;
    project_id: string;
    bill_number: string | null;
    amount: string | number;
    status: string;
    received_date: string | null;
    due_date: string | null;
    paid_date: string | null;
    description: string;
    qb_id: string | null;
}

interface LinkedSub {
    id: string;
    companyName?: string;
    contactPerson?: string;
}

function fmtMoney(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(n);
}

function joinAddress(a: CustomerAddress): string {
    const line2 = [a.city, a.state].filter(Boolean).join(', ');
    const tail = [line2, a.zip].filter(Boolean).join(' ');
    return [a.line1, a.line2, tail, a.country && a.country !== 'US' ? a.country : null]
        .filter(Boolean).join('\n');
}

interface EditableState {
    displayName: string;
    companyName: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    mobile: string;
    notes: string;
    is1099: boolean;
    taxIdentifier: string;
    accountNumber: string;
    active: boolean;
    bill: CustomerAddress;
}

function vendorToEditable(v: Vendor): EditableState {
    return {
        displayName: v.displayName,
        companyName: v.companyName ?? '',
        firstName: v.firstName ?? '',
        lastName: v.lastName ?? '',
        email: v.email ?? '',
        phone: v.phone ?? '',
        mobile: v.mobile ?? '',
        notes: v.notes ?? '',
        is1099: v.is1099,
        taxIdentifier: v.taxIdentifier ?? '',
        accountNumber: v.accountNumber ?? '',
        active: v.active,
        bill: { ...(v.billAddress ?? {}) },
    };
}

export default function VendorDetailPage() {
    const params = useParams<{ id: string }>();
    const vendorId = params?.id;

    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false);

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<EditableState | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [bills, setBills] = useState<BillRow[]>([]);
    const [billPage, setBillPage] = useState(0);
    const [linkedSub, setLinkedSub] = useState<LinkedSub | null>(null);

    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        if (!vendorId) return;
        setLoading(true);
        setError(null);
        setNotFound(false);
        try {
            const res = await fetch(`/api/vendors/${vendorId}`, { cache: 'no-store' });
            if (res.status === 404) {
                setNotFound(true);
                setVendor(null);
                return;
            }
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(body.error ?? `HTTP ${res.status}`);
            }
            const v = (await res.json()) as Vendor;
            setVendor(v);
            setDraft(vendorToEditable(v));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [vendorId]);

    useEffect(() => { void load(); }, [load]);

    // Linked subcontractor
    useEffect(() => {
        if (!vendor?.subcontractorId) { setLinkedSub(null); return; }
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/subcontractors/${vendor.subcontractorId}`, { cache: 'no-store' });
                if (!res.ok) return;
                const sub = (await res.json()) as { id?: string; companyName?: string; contactPerson?: string };
                if (!cancelled && sub?.id) {
                    setLinkedSub({ id: sub.id, companyName: sub.companyName, contactPerson: sub.contactPerson });
                }
            } catch { /* ignore */ }
        })();
        return () => { cancelled = true; };
    }, [vendor?.subcontractorId]);

    // Bills via subcontractor link
    useEffect(() => {
        if (!vendor) { setBills([]); return; }
        let cancelled = false;
        (async () => {
            try {
                const url = new URL('/api/admin/vendors/bills', window.location.origin);
                url.searchParams.set('vendorId', vendor.id);
                const res = await fetch(url.toString(), { cache: 'no-store' });
                if (!res.ok) return;
                const body = (await res.json()) as { rows?: BillRow[] };
                if (!cancelled) setBills(Array.isArray(body.rows) ? body.rows : []);
            } catch { /* ignore */ }
        })();
        return () => { cancelled = true; };
    }, [vendor]);

    const startEdit = () => {
        if (!vendor) return;
        setDraft(vendorToEditable(vendor));
        setEditing(true);
        setSaveError(null);
    };

    const cancelEdit = () => {
        if (vendor) setDraft(vendorToEditable(vendor));
        setEditing(false);
        setSaveError(null);
    };

    const save = async () => {
        if (!vendor || !draft) return;
        setSaving(true);
        setSaveError(null);
        try {
            const res = await fetch(`/api/vendors/${vendor.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName: draft.displayName.trim() || vendor.displayName,
                    companyName: draft.companyName.trim() || null,
                    firstName: draft.firstName.trim() || null,
                    lastName: draft.lastName.trim() || null,
                    email: draft.email.trim() || null,
                    phone: draft.phone.trim() || null,
                    mobile: draft.mobile.trim() || null,
                    notes: draft.notes,
                    is1099: draft.is1099,
                    taxIdentifier: draft.taxIdentifier.trim() || null,
                    accountNumber: draft.accountNumber.trim() || null,
                    active: draft.active,
                    billAddress: draft.bill,
                }),
            });
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(body.error ?? `HTTP ${res.status}`);
            }
            await load();
            setEditing(false);
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const syncToQb = async () => {
        if (!vendor?.subcontractorId) return;
        setSyncing(true);
        setSyncMessage(null);
        try {
            const res = await fetch(`/api/quickbooks/vendors/${vendor.subcontractorId}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const body = (await res.json()) as { qbId?: string; error?: string };
            if (!res.ok) throw new Error(body.error ?? 'Sync failed');
            setSyncMessage(`Synced to QuickBooks (qb id ${body.qbId ?? 'unknown'}).`);
            await load();
        } catch (e) {
            setSyncMessage(e instanceof Error ? e.message : 'Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    const refreshFromQb = async () => {
        if (!vendor?.qbId) return;
        setRefreshing(true);
        setSyncMessage(null);
        try {
            const res = await fetch(`/api/quickbooks/vendors/${vendor.id}/sync-from-qb`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const body = (await res.json()) as { ok?: boolean; error?: string };
            if (!res.ok) throw new Error(body.error ?? 'Refresh failed');
            setSyncMessage('Refreshed from QuickBooks.');
            await load();
        } catch (e) {
            setSyncMessage(e instanceof Error ? e.message : 'Refresh failed');
        } finally {
            setRefreshing(false);
        }
    };

    const visibleBills = useMemo(() => {
        const start = billPage * 10;
        return bills.slice(start, start + 10);
    }, [bills, billPage]);
    const totalPages = Math.max(1, Math.ceil(bills.length / 10));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
            </div>
        );
    }

    if (notFound || !vendor) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-white/30">
                <p className="text-lg font-serif font-bold text-white mb-2">Vendor Not Found</p>
                <p className="text-sm">This record may have been deleted.</p>
                <Link href="/admin/vendors" className="mt-4 text-[#b8956a] hover:text-[#cbb08c] text-sm font-semibold">
                    Back to Vendors
                </Link>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-300 flex items-start gap-3 max-w-xl mx-auto mt-12">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold mb-1">Failed to load vendor</p>
                    <p className="text-xs text-red-300/80">{error}</p>
                </div>
            </div>
        );
    }

    const billAddrText = joinAddress(vendor.billAddress);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/admin/vendors"
                    className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-[#b8956a] hover:text-[#cbb08c] transition-colors"
                >
                    <ArrowLeft size={14} className="mr-2" /> Back to Vendors
                </Link>
            </div>

            <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#b8956a]/5 to-transparent rounded-bl-[100px] pointer-events-none" />
                <div className="flex flex-col lg:flex-row justify-between gap-6 relative z-10">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <StatusBadge
                                status={vendor.active ? 'Active' : 'Inactive'}
                                category={vendor.active ? 'success' : 'neutral'}
                            />
                            <StatusBadge
                                status={vendor.source === 'crm' ? 'CRM' : 'QuickBooks'}
                                category={vendor.source === 'crm' ? 'brand' : 'info'}
                            />
                            {vendor.is1099 && (
                                <StatusBadge status="1099" category="brand" />
                            )}
                        </div>
                        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-2 break-words">
                            {vendor.displayName}
                        </h1>
                        {vendor.companyName && (
                            <p className="text-sm text-white/60 mb-4 flex items-center gap-2">
                                <Building2 size={14} /> {vendor.companyName}
                            </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
                            {vendor.email && <span className="flex items-center gap-1.5"><Mail size={14} /> {vendor.email}</span>}
                            {vendor.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {vendor.phone}</span>}
                            {billAddrText && <span className="flex items-center gap-1.5"><MapPin size={14} /> {billAddrText.split('\n')[0]}</span>}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                        {!editing && (
                            <button
                                onClick={startEdit}
                                className="h-10 px-4 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                            >
                                <Edit size={14} /> Edit
                            </button>
                        )}
                        {vendor.subcontractorId ? (
                            <button
                                onClick={() => void syncToQb()}
                                disabled={syncing}
                                className="h-10 px-4 bg-[#b8956a] text-black text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#cbb08c] transition-colors disabled:opacity-50"
                            >
                                <Cloud size={14} /> {syncing ? 'Syncing...' : 'Sync to QB'}
                            </button>
                        ) : (
                            <button
                                disabled
                                title="Direct vendor push coming soon"
                                className="h-10 px-4 bg-white/5 border border-white/10 text-white/40 text-sm font-semibold rounded-full flex items-center justify-center gap-2 cursor-not-allowed"
                            >
                                <Cloud size={14} /> Direct push soon
                            </button>
                        )}
                        {vendor.qbId && (
                            <button
                                onClick={() => void refreshFromQb()}
                                disabled={refreshing}
                                className="h-10 px-4 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                                <RefreshCcw size={14} /> {refreshing ? 'Refreshing...' : 'Refresh from QB'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {syncMessage && (
                <div className="mb-6 p-4 rounded-2xl border border-[#b8956a]/20 bg-[#b8956a]/5 text-[#b8956a] text-sm">
                    {syncMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Section title="Identity">
                        {editing && draft ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Display Name *">
                                    <input
                                        type="text"
                                        value={draft.displayName}
                                        onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
                                        className="ven-input text-base sm:text-sm"
                                    />
                                </Field>
                                <Field label="Company Name">
                                    <input
                                        type="text"
                                        autoComplete="organization"
                                        value={draft.companyName}
                                        onChange={(e) => setDraft({ ...draft, companyName: e.target.value })}
                                        className="ven-input text-base sm:text-sm"
                                    />
                                </Field>
                                <Field label="First Name">
                                    <input
                                        type="text"
                                        autoCapitalize="words"
                                        autoComplete="given-name"
                                        value={draft.firstName}
                                        onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                                        className="ven-input text-base sm:text-sm"
                                    />
                                </Field>
                                <Field label="Last Name">
                                    <input
                                        type="text"
                                        autoCapitalize="words"
                                        autoComplete="family-name"
                                        value={draft.lastName}
                                        onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
                                        className="ven-input text-base sm:text-sm"
                                    />
                                </Field>
                                <Field label="Active" className="md:col-span-2">
                                    <label className="inline-flex items-center gap-2 text-sm text-white/70">
                                        <input
                                            type="checkbox"
                                            checked={draft.active}
                                            onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0"
                                        />
                                        Vendor is active
                                    </label>
                                </Field>
                            </div>
                        ) : (
                            <DefList items={[
                                { label: 'Display Name', value: vendor.displayName },
                                { label: 'Company', value: vendor.companyName ?? '—' },
                                { label: 'Contact Name', value: [vendor.firstName, vendor.lastName].filter(Boolean).join(' ') || '—' },
                            ]} />
                        )}
                    </Section>

                    <Section title="Contact">
                        {editing && draft ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Email">
                                    <input
                                        type="email"
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck={false}
                                        autoComplete="email"
                                        inputMode="email"
                                        value={draft.email}
                                        onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                                        className="ven-input text-base sm:text-sm"
                                    />
                                </Field>
                                <Field label="Phone">
                                    <input
                                        type="tel"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        value={draft.phone}
                                        onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                                        className="ven-input text-base sm:text-sm"
                                    />
                                </Field>
                                <Field label="Mobile" className="md:col-span-2">
                                    <input
                                        type="tel"
                                        inputMode="tel"
                                        autoComplete="tel"
                                        value={draft.mobile}
                                        onChange={(e) => setDraft({ ...draft, mobile: e.target.value })}
                                        className="ven-input text-base sm:text-sm"
                                    />
                                </Field>
                            </div>
                        ) : (
                            <DefList items={[
                                { label: 'Email', value: vendor.email ?? '—' },
                                { label: 'Phone', value: vendor.phone ?? '—' },
                                { label: 'Mobile', value: vendor.mobile ?? '—' },
                            ]} />
                        )}
                    </Section>

                    <Section title="Billing Address">
                        {editing && draft ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Line 1" className="md:col-span-2">
                                    <input
                                        type="text"
                                        autoComplete="street-address"
                                        value={draft.bill.line1 ?? ''}
                                        onChange={(e) => setDraft({ ...draft, bill: { ...draft.bill, line1: e.target.value } })}
                                        className="ven-input text-base sm:text-sm"
                                    />
                                </Field>
                                <Field label="Line 2" className="md:col-span-2">
                                    <input
                                        type="text"
                                        autoComplete="address-line2"
                                        value={draft.bill.line2 ?? ''}
                                        onChange={(e) => setDraft({ ...draft, bill: { ...draft.bill, line2: e.target.value } })}
                                        className="ven-input text-base sm:text-sm"
                                    />
                                </Field>
                                <Field label="City">
                                    <input
                                        type="text"
                                        autoComplete="address-level2"
                                        value={draft.bill.city ?? ''}
                                        onChange={(e) => setDraft({ ...draft, bill: { ...draft.bill, city: e.target.value } })}
                                        className="ven-input text-base sm:text-sm"
                                    />
                                </Field>
                                <Field label="State">
                                    <input
                                        type="text"
                                        autoComplete="address-level1"
                                        value={draft.bill.state ?? ''}
                                        onChange={(e) => setDraft({ ...draft, bill: { ...draft.bill, state: e.target.value } })}
                                        className="ven-input text-base sm:text-sm"
                                    />
                                </Field>
                                <Field label="ZIP">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="postal-code"
                                        value={draft.bill.zip ?? ''}
                                        onChange={(e) => setDraft({ ...draft, bill: { ...draft.bill, zip: e.target.value } })}
                                        className="ven-input text-base sm:text-sm"
                                    />
                                </Field>
                                <Field label="Country">
                                    <input
                                        type="text"
                                        autoComplete="country-name"
                                        value={draft.bill.country ?? ''}
                                        onChange={(e) => setDraft({ ...draft, bill: { ...draft.bill, country: e.target.value } })}
                                        className="ven-input text-base sm:text-sm"
                                    />
                                </Field>
                            </div>
                        ) : billAddrText ? (
                            <pre className="text-sm text-white/70 whitespace-pre-line font-sans">{billAddrText}</pre>
                        ) : (
                            <p className="text-sm text-white/40 italic">No billing address on file.</p>
                        )}
                    </Section>

                    <Section title="Tax Info">
                        {editing && draft ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="1099 Tracked" className="md:col-span-2">
                                    <label className="inline-flex items-center gap-2 text-sm text-white/70">
                                        <input
                                            type="checkbox"
                                            checked={draft.is1099}
                                            onChange={(e) => setDraft({ ...draft, is1099: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0"
                                        />
                                        Issue 1099 to this vendor
                                    </label>
                                </Field>
                                <Field label="Tax ID / EIN">
                                    <input
                                        type="text"
                                        value={draft.taxIdentifier}
                                        onChange={(e) => setDraft({ ...draft, taxIdentifier: e.target.value })}
                                        className="ven-input text-base sm:text-sm"
                                    />
                                </Field>
                                <Field label="Account #">
                                    <input
                                        type="text"
                                        value={draft.accountNumber}
                                        onChange={(e) => setDraft({ ...draft, accountNumber: e.target.value })}
                                        className="ven-input text-base sm:text-sm"
                                    />
                                </Field>
                            </div>
                        ) : (
                            <DefList items={[
                                { label: '1099', value: vendor.is1099 ? 'Yes' : 'No' },
                                { label: 'Tax ID', value: vendor.taxIdentifier ?? '—' },
                                { label: 'Account #', value: vendor.accountNumber ?? '—' },
                            ]} />
                        )}
                    </Section>

                    <Section title="Notes">
                        {editing && draft ? (
                            <textarea
                                value={draft.notes}
                                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors min-h-[120px]"
                            />
                        ) : vendor.notes ? (
                            <p className="text-sm text-white/70 whitespace-pre-line">{vendor.notes}</p>
                        ) : (
                            <p className="text-sm text-white/40 italic">No notes.</p>
                        )}
                    </Section>

                    {editing && (
                        <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-[#0a0a0a]/80 backdrop-blur p-3 rounded-2xl border border-white/10">
                            {saveError && <p className="text-xs text-red-300 mr-auto">{saveError}</p>}
                            <button
                                onClick={cancelEdit}
                                disabled={saving}
                                className="h-10 px-5 rounded-full text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                            >
                                <X size={14} /> Cancel
                            </button>
                            <button
                                onClick={() => void save()}
                                disabled={saving}
                                className="h-10 px-5 bg-[#b8956a] text-black rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#cbb08c] transition-colors disabled:opacity-50"
                            >
                                <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    )}

                    <Section title="Linked Bills" actions={
                        bills.length > 0 ? (
                            <span className="text-[10px] uppercase tracking-widest text-white/40">{bills.length} bill{bills.length === 1 ? '' : 's'}</span>
                        ) : null
                    }>
                        {bills.length === 0 ? (
                            <p className="text-sm text-white/40 italic">
                                {vendor.subcontractorId
                                    ? 'No bills recorded against the linked subcontractor yet.'
                                    : 'No subcontractor linked, so no bills are associated.'}
                            </p>
                        ) : (
                            <div>
                                <ul className="divide-y divide-white/6">
                                    {visibleBills.map((b) => {
                                        const amt = typeof b.amount === 'string' ? parseFloat(b.amount) : (b.amount ?? 0);
                                        return (
                                            <li key={b.id} className="py-3 flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm text-white truncate flex items-center gap-2">
                                                        <Receipt size={12} className="text-white/40" />
                                                        {b.bill_number || '(no number)'}
                                                        {b.qb_id && <span className="text-[10px] uppercase tracking-widest text-[#60a5fa] bg-[#60a5fa]/10 px-1.5 py-0.5 rounded">QB</span>}
                                                    </p>
                                                    <p className="text-[11px] text-white/40 truncate">
                                                        Project {b.project_id} &middot; {b.status}{b.due_date ? ` &middot; due ${b.due_date}` : ''}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-mono font-bold text-white">{fmtMoney(amt)}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                                {totalPages > 1 && (
                                    <div className="pt-3 mt-3 border-t border-white/6 flex items-center justify-between text-xs text-white/50">
                                        <button
                                            disabled={billPage === 0}
                                            onClick={() => setBillPage((p) => Math.max(0, p - 1))}
                                            className="px-3 py-1 rounded-full hover:bg-white/5 disabled:opacity-30"
                                        >
                                            Previous
                                        </button>
                                        <span>Page {billPage + 1} / {totalPages}</span>
                                        <button
                                            disabled={billPage >= totalPages - 1}
                                            onClick={() => setBillPage((p) => Math.min(totalPages - 1, p + 1))}
                                            className="px-3 py-1 rounded-full hover:bg-white/5 disabled:opacity-30"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </Section>
                </div>

                <div className="space-y-6">
                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">Balance</h2>
                        <p className={`text-3xl font-bold ${vendor.balance > 0 ? 'text-red-400' : 'text-white'}`}>
                            {fmtMoney(vendor.balance)}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-white/40 mt-2">
                            {vendor.balance > 0 ? 'Open balance with vendor' : 'No open balance'}
                        </p>
                    </div>

                    {linkedSub ? (
                        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Link2 size={14} className="text-[#b8956a]" /> Linked Subcontractor
                            </h2>
                            <Link
                                href={`/admin/subcontractors/${linkedSub.id}`}
                                className="block bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                            >
                                <p className="text-sm font-semibold text-white">{linkedSub.companyName ?? linkedSub.id}</p>
                                {linkedSub.contactPerson && (
                                    <p className="text-xs text-white/50 mt-1">{linkedSub.contactPerson}</p>
                                )}
                                <p className="text-[10px] uppercase tracking-widest text-[#b8956a] mt-2">View profile</p>
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                            <h2 className="text-sm font-semibold text-white mb-2">Linked Subcontractor</h2>
                            <p className="text-xs text-white/40">No subcontractor linked. Direct sync to QB will be available in a future release.</p>
                        </div>
                    )}

                    <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                        <h2 className="text-sm font-semibold text-white mb-4">QuickBooks</h2>
                        <DefList compact items={[
                            { label: 'QB Id', value: vendor.qbId ?? '—' },
                            { label: 'Sync Token', value: vendor.qbSyncToken ?? '—' },
                            { label: 'Last Synced', value: vendor.qbSyncedAt ? new Date(vendor.qbSyncedAt).toLocaleString() : '—' },
                            { label: 'Source', value: vendor.source },
                        ]} />
                    </div>

                    {vendor.tags.length > 0 && (
                        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
                            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Hash size={14} className="text-[#b8956a]" /> Tags
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {vendor.tags.map((t) => (
                                    <span key={t} className="px-2.5 py-1 bg-white/5 border border-white/10 text-white/60 text-xs rounded-lg">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                :global(.ven-input) {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 0.75rem;
                    padding: 0.75rem;
                    color: white;
                    outline: none;
                    transition: background 150ms, border-color 150ms;
                }
                :global(.ven-input:focus) {
                    border-color: rgba(184, 149, 106, 0.5);
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}

interface SectionProps {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}

function Section({ title, children, actions }: SectionProps) {
    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">{title}</h2>
                {actions}
            </div>
            {children}
        </div>
    );
}

interface FieldProps {
    label: string;
    children: React.ReactNode;
    className?: string;
}

function Field({ label, children, className }: FieldProps) {
    return (
        <div className={className}>
            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-semibold">{label}</label>
            {children}
        </div>
    );
}

interface DefListProps {
    items: { label: string; value: string }[];
    compact?: boolean;
}

function DefList({ items, compact }: DefListProps) {
    return (
        <dl className={`grid grid-cols-1 ${compact ? '' : 'md:grid-cols-2'} gap-3`}>
            {items.map((it) => (
                <div key={it.label} className="flex items-center justify-between gap-3">
                    <dt className="text-[10px] uppercase tracking-widest text-white/40">{it.label}</dt>
                    <dd className="text-sm text-white/80 truncate">{it.value}</dd>
                </div>
            ))}
        </dl>
    );
}
