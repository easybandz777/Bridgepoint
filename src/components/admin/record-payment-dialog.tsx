'use client';

/**
 * Modal admins open from an invoice detail page to record a manual (offline)
 * payment — check, cash, or other. POSTs to /api/payments/manual which calls
 * the shared `recordPayment` helper and auto-reconciles the invoice.
 */

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from './modal';
import { formatCurrency } from '@/lib/estimates';

type ManualMethod = 'check' | 'cash' | 'other';

interface RecordPaymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onRecorded?: () => void;
    invoiceId: string;
    invoiceNumber: string;
    /** Pre-fills the amount input. */
    amountDue: number;
}

const inp =
    'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-base sm:text-sm placeholder-white/25 focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 transition-all';
const lbl = 'block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5';

function todayLocalIso(): string {
    const now = new Date();
    const off = now.getTimezoneOffset();
    return new Date(now.getTime() - off * 60_000).toISOString().slice(0, 10);
}

export function RecordPaymentDialog({
    isOpen,
    onClose,
    onRecorded,
    invoiceId,
    invoiceNumber,
    amountDue,
}: RecordPaymentDialogProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Record payment — Invoice ${invoiceNumber}`}
            className="max-w-lg"
        >
            {isOpen && (
                <RecordPaymentForm
                    invoiceId={invoiceId}
                    amountDue={amountDue}
                    onCancel={onClose}
                    onRecorded={() => {
                        onRecorded?.();
                        onClose();
                    }}
                />
            )}
        </Modal>
    );
}

interface RecordPaymentFormProps {
    invoiceId: string;
    amountDue: number;
    onCancel: () => void;
    onRecorded: () => void;
}

function RecordPaymentForm({
    invoiceId,
    amountDue,
    onCancel,
    onRecorded,
}: RecordPaymentFormProps) {
    const [amount, setAmount] = useState<string>(() =>
        amountDue > 0 ? amountDue.toFixed(2) : '',
    );
    const [method, setMethod] = useState<ManualMethod>('check');
    const [checkNumber, setCheckNumber] = useState('');
    const [receivedDate, setReceivedDate] = useState<string>(() => todayLocalIso());
    const [depositedDate, setDepositedDate] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Clear the check-number entry whenever the operator switches off check —
    // avoids accidentally sending a stale value if they flip back to Check.
    useEffect(() => {
        if (method !== 'check' && checkNumber !== '') {
            setCheckNumber('');
        }
    }, [method, checkNumber]);

    const amountNumber = Number(amount);
    const amountValid = Number.isFinite(amountNumber) && amountNumber > 0;
    const canSave = useMemo(() => amountValid && !saving, [amountValid, saving]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSave) return;
        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/payments/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId,
                    amount: amountNumber,
                    method,
                    checkNumber:
                        method === 'check' && checkNumber.trim()
                            ? checkNumber.trim()
                            : undefined,
                    receivedDate: receivedDate || undefined,
                    depositedDate: depositedDate || undefined,
                    notes: notes.trim() || undefined,
                }),
            });

            if (!res.ok) {
                let message = `Request failed (${res.status})`;
                try {
                    const data = (await res.json()) as { error?: string };
                    if (data?.error) message = data.error;
                } catch {
                    // swallow — fall through to generic message
                }
                throw new Error(message);
            }

            onRecorded();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to record payment');
            setSaving(false);
        }
    }

    const methodOption = (value: ManualMethod, label: string) => {
        const active = method === value;
        return (
            <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setMethod(value)}
                disabled={saving}
                className={`h-11 rounded-xl border text-sm font-medium transition-all ${
                    active
                        ? 'bg-[#b8956a]/15 border-[#b8956a]/50 text-white'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/8'
                } disabled:opacity-40`}
            >
                {label}
            </button>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount */}
            <div>
                <label className={lbl} htmlFor="rpd-amount">
                    Amount <span className="text-[#b8956a]">*</span>
                </label>
                <input
                    id="rpd-amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    className={inp}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    autoFocus
                    disabled={saving}
                />
                <p className="mt-1.5 text-[11px] text-white/55">
                    Amount due on invoice: {formatCurrency(amountDue)}
                </p>
            </div>

            {/* Method */}
            <div>
                <label className={lbl}>Method</label>
                <div className="grid grid-cols-3 gap-2">
                    {methodOption('check', 'Check')}
                    {methodOption('cash', 'Cash')}
                    {methodOption('other', 'Other')}
                </div>
            </div>

            {/* Check number — only when method === check */}
            {method === 'check' && (
                <div>
                    <label className={lbl} htmlFor="rpd-check-number">
                        Check number
                    </label>
                    <input
                        id="rpd-check-number"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        className={inp}
                        value={checkNumber}
                        onChange={(e) => setCheckNumber(e.target.value)}
                        placeholder="1234"
                        disabled={saving}
                    />
                </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={lbl} htmlFor="rpd-received-date">
                        Received date
                    </label>
                    <input
                        id="rpd-received-date"
                        type="date"
                        className={inp}
                        value={receivedDate}
                        onChange={(e) => setReceivedDate(e.target.value)}
                        disabled={saving}
                    />
                </div>
                <div>
                    <label className={lbl} htmlFor="rpd-deposited-date">
                        Deposited date
                    </label>
                    <input
                        id="rpd-deposited-date"
                        type="date"
                        className={inp}
                        value={depositedDate}
                        onChange={(e) => setDepositedDate(e.target.value)}
                        disabled={saving}
                    />
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className={lbl} htmlFor="rpd-notes">
                    Notes
                </label>
                <textarea
                    id="rpd-notes"
                    rows={2}
                    className={`${inp} resize-none`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional"
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
                    {saving ? 'Saving...' : 'Save Payment'}
                </button>
            </div>
        </form>
    );
}
