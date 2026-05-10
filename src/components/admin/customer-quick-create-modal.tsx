'use client';

/**
 * Inline quick-create form used by <CustomerPicker /> when the operator can't
 * find a matching customer in the search dropdown. Posts to /api/customers
 * and returns the freshly created customer to the parent picker.
 *
 * The form lives inside <QuickCreateForm/>, which is only mounted while the
 * modal is open. That gives us a fresh, clean state on every open without
 * needing a reset-effect — initial values flow through useState's lazy form.
 */

import { useMemo, useState } from 'react';
import { Loader2, User, Building2 } from 'lucide-react';
import { Modal } from './modal';
import {
    createCustomer,
    getCustomer,
    toPickedCustomer,
    type PickedCustomer,
    type CustomerType,
} from '@/lib/customers-client';

interface QuickCreateDefaults {
    displayName?: string;
    email?: string;
    phone?: string;
}

interface CustomerQuickCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called with the new customer once the POST succeeds. */
    onCreated: (customer: PickedCustomer) => void;
    /** Pre-fill values (e.g. the picker's current query as displayName). */
    defaults?: QuickCreateDefaults;
}

const inp =
    'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-base sm:text-sm placeholder-white/25 focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 transition-all';
const lbl = 'block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5';

export function CustomerQuickCreateModal({
    isOpen,
    onClose,
    onCreated,
    defaults,
}: CustomerQuickCreateModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Customer" className="max-w-lg">
            {isOpen && (
                <QuickCreateForm
                    defaults={defaults}
                    onCancel={onClose}
                    onCreated={onCreated}
                />
            )}
        </Modal>
    );
}

interface QuickCreateFormProps {
    defaults?: QuickCreateDefaults;
    onCancel: () => void;
    onCreated: (customer: PickedCustomer) => void;
}

function QuickCreateForm({ defaults, onCancel, onCreated }: QuickCreateFormProps) {
    const [customerType, setCustomerType] = useState<CustomerType>('Individual');
    const [displayName, setDisplayName] = useState(() => defaults?.displayName ?? '');
    const [email, setEmail] = useState(() => defaults?.email ?? '');
    const [phone, setPhone] = useState(() => defaults?.phone ?? '');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const trimmedName = displayName.trim();
    const canSave = useMemo(() => trimmedName.length > 0 && !saving, [trimmedName, saving]);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!canSave) return;
        setSaving(true);
        setError(null);

        try {
            const isCompany = customerType === 'Company';
            const created = await createCustomer({
                displayName: trimmedName,
                customerType,
                companyName: isCompany ? trimmedName : null,
                email: email.trim() ? email.trim() : null,
                phone: phone.trim() ? phone.trim() : null,
                notes: notes.trim() ? notes.trim() : null,
            });

            // Re-fetch to get the canonical record (qbId, etc.) — falls back to
            // a minimal projection if the lookup fails for any reason.
            try {
                const full = await getCustomer(created.id);
                if (full) {
                    onCreated(toPickedCustomer(full));
                    return;
                }
            } catch {
                // fall through to the minimal projection below
            }

            onCreated({
                id: created.id,
                displayName: created.displayName,
                email: email.trim() || null,
                phone: phone.trim() || null,
                companyName: isCompany ? trimmedName : null,
                qbId: null,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create customer');
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSave} className="space-y-5">
            {/* Customer type toggle */}
            <div>
                <label className={lbl}>Customer Type</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setCustomerType('Individual')}
                        className={`flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-medium transition-all ${
                            customerType === 'Individual'
                                ? 'bg-[#b8956a]/15 border-[#b8956a]/50 text-white'
                                : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/8'
                        }`}
                    >
                        <User size={14} /> Individual
                    </button>
                    <button
                        type="button"
                        onClick={() => setCustomerType('Company')}
                        className={`flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-medium transition-all ${
                            customerType === 'Company'
                                ? 'bg-[#b8956a]/15 border-[#b8956a]/50 text-white'
                                : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/8'
                        }`}
                    >
                        <Building2 size={14} /> Company
                    </button>
                </div>
            </div>

            <div>
                <label className={lbl} htmlFor="qcc-display-name">
                    Display Name <span className="text-[#b8956a]">*</span>
                </label>
                <input
                    id="qcc-display-name"
                    type="text"
                    className={inp}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={
                        customerType === 'Company' ? 'Acme Renovations LLC' : 'Jane Doe'
                    }
                    required
                    autoFocus
                    disabled={saving}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={lbl} htmlFor="qcc-email">
                        Email
                    </label>
                    <input
                        id="qcc-email"
                        type="email"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        autoComplete="email"
                        inputMode="email"
                        className={inp}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        disabled={saving}
                    />
                </div>
                <div>
                    <label className={lbl} htmlFor="qcc-phone">
                        Phone
                    </label>
                    <input
                        id="qcc-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        className={inp}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        disabled={saving}
                    />
                </div>
            </div>

            <div>
                <label className={lbl} htmlFor="qcc-notes">
                    Notes
                </label>
                <textarea
                    id="qcc-notes"
                    rows={3}
                    className={`${inp} resize-none`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional internal notes about this customer."
                    disabled={saving}
                />
            </div>

            {error && (
                <p className="text-xs text-red-400 flex items-center gap-2">
                    <span className="inline-block w-1 h-1 rounded-full bg-red-400" />
                    {error}
                </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/6">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="h-10 px-5 rounded-full text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!canSave}
                    className="h-10 px-5 rounded-full text-sm font-semibold text-white transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                        background:
                            'linear-gradient(135deg, #b8956a 0%, #9a7a54 100%)',
                    }}
                >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {saving ? 'Saving...' : 'Save Customer'}
                </button>
            </div>
        </form>
    );
}
