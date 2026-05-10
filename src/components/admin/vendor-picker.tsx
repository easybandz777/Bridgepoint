'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Plus, Building2, Check, X, ChevronDown } from 'lucide-react';
import type { Vendor } from '@/lib/vendors';

interface VendorListResponse {
    rows: Vendor[];
    total: number;
}

interface VendorPickerProps {
    value: string | null;
    onChange: (vendorId: string | null, vendor?: Vendor | null) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    /** Only show vendors that match this filter on the active flag */
    activeOnly?: boolean;
}

export function VendorPicker({
    value,
    onChange,
    placeholder = 'Select vendor...',
    disabled,
    className,
    activeOnly = true,
}: VendorPickerProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [rows, setRows] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Vendor | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const wrapRef = useRef<HTMLDivElement | null>(null);

    // Fetch list when open / query changes
    useEffect(() => {
        if (!open) return;
        const ctrl = new AbortController();
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const url = new URL('/api/vendors', window.location.origin);
                if (query) url.searchParams.set('q', query);
                url.searchParams.set('limit', '20');
                if (activeOnly) url.searchParams.set('active', 'true');
                const res = await fetch(url.toString(), { signal: ctrl.signal, cache: 'no-store' });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const body = (await res.json()) as VendorListResponse;
                setRows(Array.isArray(body.rows) ? body.rows : []);
            } catch (e) {
                if ((e as { name?: string }).name !== 'AbortError') setRows([]);
            } finally {
                setLoading(false);
            }
        }, 150);
        return () => { clearTimeout(t); ctrl.abort(); };
    }, [open, query, activeOnly]);

    // Hydrate selected when controlled value changes
    useEffect(() => {
        if (!value) { setSelected(null); return; }
        if (selected?.id === value) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/vendors/${value}`, { cache: 'no-store' });
                if (!res.ok) return;
                const v = (await res.json()) as Vendor;
                if (!cancelled) setSelected(v);
            } catch { /* ignore */ }
        })();
        return () => { cancelled = true; };
    }, [value, selected?.id]);

    // Outside click to close
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const select = useCallback((v: Vendor) => {
        setSelected(v);
        onChange(v.id, v);
        setOpen(false);
        setQuery('');
    }, [onChange]);

    const clear = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setSelected(null);
        onChange(null, null);
    }, [onChange]);

    const buttonLabel = useMemo(() => {
        if (!selected) return placeholder;
        return selected.displayName;
    }, [selected, placeholder]);

    const handleCreated = (created: Vendor) => {
        setShowCreate(false);
        select(created);
    };

    return (
        <div ref={wrapRef} className={`relative ${className ?? ''}`}>
            <button
                type="button"
                onClick={() => !disabled && setOpen((p) => !p)}
                disabled={disabled}
                className={`w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl text-sm flex items-center justify-between gap-2 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 hover:border-white/15'} ${selected ? 'text-white' : 'text-white/40'}`}
            >
                <span className="flex items-center gap-2 min-w-0">
                    <Building2 size={14} className="text-white/30 shrink-0" />
                    <span className="truncate">{buttonLabel}</span>
                </span>
                <span className="flex items-center gap-1 shrink-0">
                    {selected && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={clear}
                            className="w-6 h-6 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10"
                            aria-label="Clear"
                        >
                            <X size={12} />
                        </span>
                    )}
                    <ChevronDown size={14} className="text-white/30" />
                </span>
            </button>

            {open && (
                <div className="absolute z-50 mt-1 left-0 right-0 bg-[#131313] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-white/6 flex items-center gap-2">
                        <Search size={14} className="text-white/30 shrink-0 ml-1" />
                        <input
                            autoFocus
                            type="search"
                            inputMode="search"
                            autoComplete="off"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search vendors..."
                            className="flex-1 bg-transparent outline-none text-base sm:text-sm text-white placeholder-white/30"
                        />
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                        {loading ? (
                            <div className="py-6 text-center text-white/40 text-xs">Loading...</div>
                        ) : rows.length === 0 ? (
                            <div className="py-6 text-center text-white/40 text-xs">
                                {query ? 'No vendors match.' : 'No vendors yet.'}
                            </div>
                        ) : (
                            <ul>
                                {rows.map((v) => {
                                    const isSelected = selected?.id === v.id;
                                    return (
                                        <li key={v.id}>
                                            <button
                                                type="button"
                                                onClick={() => select(v)}
                                                className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors ${isSelected ? 'bg-white/5' : ''}`}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-white truncate">{v.displayName}</p>
                                                    <p className="text-[11px] text-white/40 truncate">
                                                        {v.companyName || v.email || 'No contact info'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {v.is1099 && (
                                                        <span className="px-1.5 py-0.5 bg-[#b8956a]/10 text-[#b8956a] text-[10px] rounded font-semibold uppercase tracking-wider">1099</span>
                                                    )}
                                                    {isSelected && <Check size={14} className="text-[#b8956a]" />}
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                    <div className="border-t border-white/6 p-1">
                        <button
                            type="button"
                            onClick={() => setShowCreate(true)}
                            className="w-full text-left px-3 py-2 flex items-center gap-2 text-sm text-[#b8956a] hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <Plus size={14} /> Create vendor
                        </button>
                    </div>
                </div>
            )}

            {showCreate && (
                <QuickCreateVendor
                    onClose={() => setShowCreate(false)}
                    onCreated={handleCreated}
                    initialQuery={query}
                />
            )}
        </div>
    );
}

interface QuickCreateProps {
    onClose: () => void;
    onCreated: (vendor: Vendor) => void;
    initialQuery: string;
}

function QuickCreateVendor({ onClose, onCreated, initialQuery }: QuickCreateProps) {
    const [displayName, setDisplayName] = useState(initialQuery);
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim()) {
            setError('Display name is required.');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/vendors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName: displayName.trim(),
                    companyName: companyName.trim() || null,
                    email: email.trim() || null,
                    phone: phone.trim() || null,
                    source: 'crm',
                }),
            });
            const body = (await res.json()) as { id?: string; error?: string };
            if (!res.ok || !body.id) throw new Error(body.error ?? 'Failed to create');
            const detail = await fetch(`/api/vendors/${body.id}`, { cache: 'no-store' });
            const vend = (await detail.json()) as Vendor;
            onCreated(vend);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-[#131313] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
                    <h2 className="font-serif text-lg font-bold text-white">New Vendor</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-11 h-11 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Display Name *</label>
                        <input
                            autoFocus
                            required
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Company Name</label>
                        <input
                            type="text"
                            autoComplete="organization"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Email</label>
                            <input
                                type="email"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                autoComplete="email"
                                inputMode="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2 font-semibold">Phone</label>
                            <input
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50 focus:bg-white/10 transition-colors"
                            />
                        </div>
                    </div>
                    {error && <p className="text-xs text-red-300">{error}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 px-5 rounded-full text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !displayName.trim()}
                            className="h-10 px-5 bg-[#b8956a] text-black rounded-full text-sm font-bold flex items-center gap-2 hover:bg-[#cbb08c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Saving...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
