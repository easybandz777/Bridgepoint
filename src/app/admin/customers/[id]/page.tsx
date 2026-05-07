'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Pencil,
    Save,
    X,
    Trash2,
    Mail,
    Phone,
    Smartphone,
    Printer,
    Globe,
    MapPin,
    DollarSign,
    Briefcase,
    FileText,
    PlugZap,
    Loader2,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { StatusBadge } from '@/components/admin/status-badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import {
    CustomerDetailPane,
    type LinkedProject,
    type LinkedInvoice,
    type LinkedEstimate,
    type SyncLogEntry,
} from '@/components/admin/customer-detail-pane';
import type {
    Customer,
    CustomerAddress,
    CustomerType,
} from '@/lib/customers';

interface DetailResponse {
    customer: Customer;
    projects: LinkedProject[];
    invoices: LinkedInvoice[];
    estimates: LinkedEstimate[];
}

const PAYMENT_TERMS_OPTIONS = ['Net 15', 'Net 30', 'Net 60', 'Due on Receipt', 'Custom'];
const PAYMENT_METHODS = ['Check', 'ACH', 'Card', 'Cash'];

function fmtMoney(n: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(n);
}

function fmtAddressOneLine(a: CustomerAddress): string {
    const line1 = [a.line1, a.line2].filter(Boolean).join(', ');
    const cityRow = [a.city, a.state].filter(Boolean).join(', ');
    return [line1, cityRow, a.zip].filter(Boolean).join(' · ');
}

function isAddressEmpty(a: CustomerAddress): boolean {
    return !a.line1 && !a.line2 && !a.city && !a.state && !a.zip;
}

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = (params?.id as string) ?? '';

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [projects, setProjects] = useState<LinkedProject[]>([]);
    const [invoices, setInvoices] = useState<LinkedInvoice[]>([]);
    const [estimates, setEstimates] = useState<LinkedEstimate[]>([]);
    const [syncLog, setSyncLog] = useState<SyncLogEntry[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notFoundFlag, setNotFoundFlag] = useState(false);

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [confirmDeactivate, setConfirmDeactivate] = useState(false);

    // Editable fields
    const [editDisplayName, setEditDisplayName] = useState('');
    const [editCustomerType, setEditCustomerType] = useState<CustomerType>('Individual');
    const [editCompanyName, setEditCompanyName] = useState('');
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editMobile, setEditMobile] = useState('');
    const [editFax, setEditFax] = useState('');
    const [editWebsite, setEditWebsite] = useState('');
    const [editBill, setEditBill] = useState<CustomerAddress>({});
    const [editShip, setEditShip] = useState<CustomerAddress>({});
    const [editPaymentTerms, setEditPaymentTerms] = useState('');
    const [editPaymentMethod, setEditPaymentMethod] = useState('');
    const [editTaxExempt, setEditTaxExempt] = useState(false);

    // QB sync state (stub — see comment in handler)
    const [syncBusy, setSyncBusy] = useState(false);
    const [syncMsg, setSyncMsg] = useState<string | null>(null);
    const [syncOk, setSyncOk] = useState<boolean | null>(null);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/customers/${id}`, { cache: 'no-store' });
            if (res.status === 404) {
                setNotFoundFlag(true);
                setLoading(false);
                return;
            }
            if (!res.ok) {
                const body = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(body.error ?? `HTTP ${res.status}`);
            }
            const data = (await res.json()) as DetailResponse;
            const c = data.customer;
            setCustomer(c);
            setProjects(Array.isArray(data.projects) ? data.projects : []);
            setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
            setEstimates(Array.isArray(data.estimates) ? data.estimates : []);

            // Hydrate edit-form state
            setEditDisplayName(c.displayName);
            setEditCustomerType(c.customerType);
            setEditCompanyName(c.companyName ?? '');
            setEditFirstName(c.firstName ?? '');
            setEditLastName(c.lastName ?? '');
            setEditEmail(c.email ?? '');
            setEditPhone(c.phone ?? '');
            setEditMobile(c.mobile ?? '');
            setEditFax(c.fax ?? '');
            setEditWebsite(c.website ?? '');
            setEditBill(c.billAddress ?? {});
            setEditShip(c.shipAddress ?? {});
            setEditPaymentTerms(c.paymentTerms ?? '');
            setEditPaymentMethod(c.paymentMethod ?? '');
            setEditTaxExempt(c.taxExempt);

            // Pull QB activity for this customer (filter client-side; sync-log API
            // doesn't currently support entityId filter, so we narrow ourselves).
            try {
                const logRes = await fetch(`/api/quickbooks/sync-log?entityType=customer&limit=200`, { cache: 'no-store' });
                if (logRes.ok) {
                    const logData = (await logRes.json()) as { rows?: SyncLogEntry[] };
                    const filtered = (logData.rows ?? []).filter(
                        (row) => row.entityId === id || row.qbEntityId === c.qbId,
                    );
                    setSyncLog(filtered);
                } else {
                    setSyncLog(null);
                }
            } catch {
                setSyncLog(null);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { void load(); }, [load]);

    async function saveEdits() {
        if (!customer) return;
        setSaving(true);
        try {
            const body = {
                displayName: editDisplayName,
                customerType: editCustomerType,
                companyName: editCompanyName || null,
                firstName: editFirstName || null,
                lastName: editLastName || null,
                email: editEmail || null,
                phone: editPhone || null,
                mobile: editMobile || null,
                fax: editFax || null,
                website: editWebsite || null,
                billAddress: editBill,
                shipAddress: editShip,
                paymentTerms: editPaymentTerms || null,
                paymentMethod: editPaymentMethod || null,
                taxExempt: editTaxExempt,
            };
            const res = await fetch(`/api/customers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const e = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(e.error ?? `HTTP ${res.status}`);
            }
            setEditing(false);
            await load();
        } catch (e) {
            alert(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setSaving(false);
        }
    }

    async function saveNotes(next: string) {
        if (!customer) return;
        const res = await fetch(`/api/customers/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: next }),
        });
        if (!res.ok) {
            const e = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(e.error ?? `HTTP ${res.status}`);
        }
        setCustomer({ ...customer, notes: next });
    }

    async function deactivate() {
        try {
            const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            router.push('/admin/customers');
        } catch (e) {
            alert(`Deactivate failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    /**
     * Direct customer→QB sync isn't built yet (the existing endpoint expects a
     * projectId). Leave a stub that POSTs to a placeholder route so another
     * agent can wire it up; surface a helpful error in the meantime.
     */
    async function syncToQuickBooks() {
        if (!customer) return;
        setSyncBusy(true);
        setSyncMsg(null);
        setSyncOk(null);
        try {
            const res = await fetch(`/api/quickbooks/customers/${customer.id}/sync`, { method: 'POST' });
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            if (!res.ok) throw new Error(body.error ?? `Sync failed (HTTP ${res.status})`);
            setSyncMsg('Synced');
            setSyncOk(true);
            await load();
        } catch (e) {
            setSyncMsg(e instanceof Error ? e.message : 'TODO: customer sync endpoint');
            setSyncOk(false);
        } finally {
            setSyncBusy(false);
        }
    }

    const lifetimeValue = useMemo(() => {
        return invoices.reduce((sum, iv) => sum + Number(iv.amount_paid ?? 0), 0);
    }, [invoices]);

    const activeProjectsCount = useMemo(
        () => projects.filter((p) => p.status?.toLowerCase() !== 'completed' && p.status?.toLowerCase() !== 'cancelled').length,
        [projects],
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
            </div>
        );
    }

    if (notFoundFlag || !customer) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-white/30">
                <p className="text-lg font-serif font-bold text-white mb-2">Customer Not Found</p>
                <p className="text-sm">{error ?? 'This record may have been deleted.'}</p>
                <Link href="/admin/customers" className="mt-6 text-[#b8956a] hover:text-[#cbb08c] text-sm font-semibold">
                    ← Back to customers
                </Link>
            </div>
        );
    }

    const subtitleParts = [
        customer.companyName,
        customer.email,
        customer.phone,
    ].filter(Boolean) as string[];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Back link */}
            <Link
                href="/admin/customers"
                className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors mb-4"
            >
                <ArrowLeft size={14} /> Customers
            </Link>

            {/* Header */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#b8956a]/5 to-transparent rounded-bl-[100px] pointer-events-none" />

                <div className="flex flex-col lg:flex-row justify-between gap-6 relative z-10">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <StatusBadge
                                status={customer.active ? 'Active' : 'Inactive'}
                                category={customer.active ? 'success' : 'neutral'}
                            />
                            <StatusBadge
                                status={customer.source === 'crm' ? 'CRM' : 'QuickBooks'}
                                category={customer.source === 'crm' ? 'brand' : 'info'}
                            />
                            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                {customer.customerType}
                            </span>
                        </div>
                        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-2 break-words">
                            {customer.displayName}
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/50">
                            {subtitleParts.map((p, i) => (
                                <span key={i}>{p}</span>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-start gap-2 shrink-0">
                        <div className="inline-flex items-center gap-3">
                            <button
                                onClick={syncToQuickBooks}
                                disabled={syncBusy}
                                className="h-10 px-4 rounded-xl bg-[#b8956a] text-black text-sm font-semibold hover:bg-[#cbb08c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                            >
                                {syncBusy ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <PlugZap size={14} />
                                )}
                                {syncBusy ? 'Syncing…' : 'Sync to QuickBooks'}
                            </button>
                            {syncMsg && (
                                <span
                                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${syncOk ? 'text-[#34d399]' : 'text-red-400'}`}
                                >
                                    {syncOk ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                    {syncMsg}
                                </span>
                            )}
                        </div>

                        {!editing ? (
                            <button
                                onClick={() => setEditing(true)}
                                className="h-10 px-4 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                                <Pencil size={14} /> Edit
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setEditing(false)}
                                    className="h-10 px-4 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2"
                                >
                                    <X size={14} /> Cancel
                                </button>
                                <button
                                    onClick={saveEdits}
                                    disabled={saving}
                                    className="h-10 px-4 bg-[#b8956a] text-black text-sm font-semibold rounded-xl hover:bg-[#cbb08c] transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        )}

                        {customer.active && (
                            <button
                                onClick={() => setConfirmDeactivate(true)}
                                className="h-10 px-4 bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-semibold rounded-xl hover:bg-red-500/20 transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Deactivate
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Identity edit (only visible in edit mode) */}
            {editing && (
                <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 sm:p-6 mb-6">
                    <h2 className="text-sm font-semibold text-white mb-4">Identity</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Customer type">
                            <select value={editCustomerType} onChange={(e) => setEditCustomerType(e.target.value as CustomerType)} className={inputCls}>
                                <option>Individual</option>
                                <option>Company</option>
                            </select>
                        </Field>
                        <Field label="Display name">
                            <input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Company name">
                            <input value={editCompanyName} onChange={(e) => setEditCompanyName(e.target.value)} className={inputCls} />
                        </Field>
                        <div />
                        <Field label="First name">
                            <input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Last name">
                            <input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className={inputCls} />
                        </Field>
                    </div>
                </div>
            )}

            {/* 3-column body */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Contact info */}
                <Card title="Contact">
                    <ContactRow icon={<Mail size={12} />} label="Email" editing={editing} display={customer.email ?? '—'}>
                        <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={inputCls} />
                    </ContactRow>
                    <ContactRow icon={<Phone size={12} />} label="Phone" editing={editing} display={customer.phone ?? '—'}>
                        <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className={inputCls} />
                    </ContactRow>
                    <ContactRow icon={<Smartphone size={12} />} label="Mobile" editing={editing} display={customer.mobile ?? '—'}>
                        <input value={editMobile} onChange={(e) => setEditMobile(e.target.value)} className={inputCls} />
                    </ContactRow>
                    <ContactRow icon={<Printer size={12} />} label="Fax" editing={editing} display={customer.fax ?? '—'}>
                        <input value={editFax} onChange={(e) => setEditFax(e.target.value)} className={inputCls} />
                    </ContactRow>
                    <ContactRow icon={<Globe size={12} />} label="Website" editing={editing} display={customer.website ?? '—'}>
                        <input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} className={inputCls} />
                    </ContactRow>

                    {editing && (
                        <div className="pt-4 mt-4 border-t border-white/6 space-y-3">
                            <Field label="Payment terms">
                                <select value={editPaymentTerms} onChange={(e) => setEditPaymentTerms(e.target.value)} className={inputCls}>
                                    <option value="">—</option>
                                    {PAYMENT_TERMS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                                </select>
                            </Field>
                            <Field label="Payment method">
                                <select value={editPaymentMethod} onChange={(e) => setEditPaymentMethod(e.target.value)} className={inputCls}>
                                    <option value="">—</option>
                                    {PAYMENT_METHODS.map((o) => <option key={o}>{o}</option>)}
                                </select>
                            </Field>
                            <label className="flex items-center gap-3 text-sm text-white/70 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editTaxExempt}
                                    onChange={(e) => setEditTaxExempt(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/20 bg-black/50 text-[#b8956a] focus:ring-[#b8956a] focus:ring-offset-0"
                                />
                                Tax exempt
                            </label>
                        </div>
                    )}

                    {!editing && (customer.paymentTerms || customer.paymentMethod || customer.taxExempt) && (
                        <div className="pt-4 mt-4 border-t border-white/6 space-y-2 text-sm">
                            {customer.paymentTerms && (
                                <div className="flex justify-between">
                                    <span className="text-white/40">Terms</span>
                                    <span className="text-white">{customer.paymentTerms}</span>
                                </div>
                            )}
                            {customer.paymentMethod && (
                                <div className="flex justify-between">
                                    <span className="text-white/40">Method</span>
                                    <span className="text-white">{customer.paymentMethod}</span>
                                </div>
                            )}
                            {customer.taxExempt && (
                                <div className="flex justify-between">
                                    <span className="text-white/40">Tax</span>
                                    <span className="text-[#b8956a] font-semibold">Exempt</span>
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                {/* Addresses */}
                <Card title="Addresses">
                    <div className="space-y-5">
                        <AddressBlock
                            label="Billing"
                            address={customer.billAddress}
                            editing={editing}
                            edit={editBill}
                            setEdit={setEditBill}
                        />
                        <AddressBlock
                            label="Shipping"
                            address={customer.shipAddress}
                            editing={editing}
                            edit={editShip}
                            setEdit={setEditShip}
                        />
                    </div>
                </Card>

                {/* Stats */}
                <Card title="Stats">
                    <div className="space-y-4">
                        <Stat
                            icon={<DollarSign size={14} />}
                            label="Outstanding balance"
                            value={fmtMoney(customer.balance)}
                            valueClassName={customer.balance > 0 ? 'text-red-400' : 'text-white'}
                        />
                        <Stat
                            icon={<DollarSign size={14} />}
                            label="Lifetime value"
                            value={fmtMoney(lifetimeValue)}
                            valueClassName="text-[#34d399]"
                        />
                        <Stat
                            icon={<Briefcase size={14} />}
                            label="Active projects"
                            value={`${activeProjectsCount}`}
                            valueClassName="text-white"
                        />
                        <Stat
                            icon={<FileText size={14} />}
                            label="Invoices on file"
                            value={`${invoices.length}`}
                            valueClassName="text-white"
                        />
                    </div>

                    {customer.qbId && (
                        <div className="mt-5 pt-4 border-t border-white/6">
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">QuickBooks</p>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-white/60">QB ID</span>
                                <span className="text-white font-mono text-xs">{customer.qbId}</span>
                            </div>
                            {customer.qbSyncedAt && (
                                <div className="flex items-center justify-between text-sm mt-1">
                                    <span className="text-white/60">Last synced</span>
                                    <span className="text-white/70 text-xs">
                                        {new Date(customer.qbSyncedAt).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>

            <CustomerDetailPane
                notes={customer.notes}
                onNotesSave={saveNotes}
                projects={projects}
                invoices={invoices}
                estimates={estimates}
                syncLogEntries={syncLog}
            />

            <ConfirmDialog
                isOpen={confirmDeactivate}
                onClose={() => setConfirmDeactivate(false)}
                onConfirm={deactivate}
                title="Deactivate customer?"
                message="This will hide the customer from active lists. You can re-activate later. Linked projects and invoices remain untouched."
                confirmText="Deactivate"
                destructive
            />
        </div>
    );
}

const inputCls = 'w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-white mb-4">{title}</h2>
            {children}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-widest text-white/50">{label}</span>
            {children}
        </label>
    );
}

function ContactRow({
    icon, label, display, editing, children,
}: {
    icon: React.ReactNode;
    label: string;
    display: string;
    editing: boolean;
    children: React.ReactNode;
}) {
    if (editing) {
        return (
            <div className="mb-3">
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5 flex items-center gap-1.5">
                    <span className="text-white/30">{icon}</span> {label}
                </p>
                {children}
            </div>
        );
    }
    return (
        <div className="flex items-start justify-between gap-3 text-sm py-2 border-b border-white/5 last:border-b-0">
            <span className="text-white/40 flex items-center gap-1.5 shrink-0">
                <span className="text-white/30">{icon}</span> {label}
            </span>
            <span className="text-white text-right break-all">{display}</span>
        </div>
    );
}

function AddressBlock({
    label, address, editing, edit, setEdit,
}: {
    label: string;
    address: CustomerAddress;
    editing: boolean;
    edit: CustomerAddress;
    setEdit: (next: CustomerAddress) => void;
}) {
    if (editing) {
        return (
            <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
                    <MapPin size={12} className="text-white/30" /> {label}
                </p>
                <div className="space-y-2">
                    <input
                        placeholder="Street address"
                        value={edit.line1 ?? ''}
                        onChange={(e) => setEdit({ ...edit, line1: e.target.value })}
                        className={inputCls}
                    />
                    <input
                        placeholder="Apt, suite, etc. (optional)"
                        value={edit.line2 ?? ''}
                        onChange={(e) => setEdit({ ...edit, line2: e.target.value })}
                        className={inputCls}
                    />
                    <div className="grid grid-cols-3 gap-2">
                        <input
                            placeholder="City"
                            value={edit.city ?? ''}
                            onChange={(e) => setEdit({ ...edit, city: e.target.value })}
                            className={`${inputCls} col-span-2`}
                        />
                        <input
                            placeholder="State"
                            value={edit.state ?? ''}
                            onChange={(e) => setEdit({ ...edit, state: e.target.value })}
                            className={inputCls}
                        />
                    </div>
                    <input
                        placeholder="ZIP"
                        value={edit.zip ?? ''}
                        onChange={(e) => setEdit({ ...edit, zip: e.target.value })}
                        className={inputCls}
                    />
                </div>
            </div>
        );
    }

    if (isAddressEmpty(address)) {
        return (
            <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
                    <MapPin size={12} className="text-white/30" /> {label}
                </p>
                <p className="text-sm text-white/30 italic">No address on file.</p>
            </div>
        );
    }

    return (
        <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
                <MapPin size={12} className="text-white/30" /> {label}
            </p>
            <p className="text-sm text-white leading-relaxed">{fmtAddressOneLine(address)}</p>
        </div>
    );
}

function Stat({
    icon, label, value, valueClassName,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-white/50 flex items-center gap-2">
                <span className="text-white/30">{icon}</span> {label}
            </span>
            <span className={`font-mono font-bold ${valueClassName ?? 'text-white'}`}>{value}</span>
        </div>
    );
}
