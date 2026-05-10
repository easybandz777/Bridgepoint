'use client';

/**
 * <CustomerPicker /> — search-as-you-type autocomplete with optional inline
 * "create new" flow. Designed to be embedded in new-project / new-invoice /
 * new-estimate forms.
 *
 * The component is uncontrolled internally (it owns the dropdown open/closed
 * state, the query string, and the result list) but the `value` prop is fully
 * controlled — parent owns the picked customer id and reacts to onChange.
 */

import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Search, X, Loader2, Plus, ChevronDown, User } from 'lucide-react';
import {
    searchCustomers,
    getCustomer,
    toPickedCustomer,
    type Customer,
    type PickedCustomer,
} from '@/lib/customers-client';
import { CustomerQuickCreateModal } from './customer-quick-create-modal';

interface CustomerPickerProps {
    /** Currently selected customer id, or null. */
    value: string | null;
    /** Called with the picked customer id (or null when cleared). */
    onChange: (
        customerId: string | null,
        customer: PickedCustomer | null,
    ) => void;
    /** Placeholder when nothing is selected. */
    placeholder?: string;
    /** If true, "+ New Customer" link in dropdown opens the quick-create modal. */
    allowCreate?: boolean;
    /** Pre-fills the quick-create modal with these defaults. */
    createDefaults?: { displayName?: string; email?: string; phone?: string };
    /** Standard form props */
    name?: string;
    required?: boolean;
    disabled?: boolean;
}

const DEBOUNCE_MS = 250;
const RESULT_LIMIT = 20;

export function CustomerPicker({
    value,
    onChange,
    placeholder = 'Select customer...',
    allowCreate = true,
    createDefaults,
    name,
    required = false,
    disabled = false,
}: CustomerPickerProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [highlight, setHighlight] = useState(0);
    const [createOpen, setCreateOpen] = useState(false);

    /** The currently picked customer's display projection, cached locally. */
    const [picked, setPicked] = useState<PickedCustomer | null>(null);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const listboxId = useId();

    // ─── Hydrate `picked` whenever `value` changes ───────────────────────────
    // If we already have it cached (from a recent search/select), no fetch
    // needed. Otherwise fetch /api/customers/:id once.
    useEffect(() => {
        let cancelled = false;
        if (value == null) {
            setPicked(null);
            return;
        }
        if (picked && picked.id === value) return;

        const ac = new AbortController();
        (async () => {
            try {
                const c = await getCustomer(value, ac.signal);
                if (cancelled || ac.signal.aborted) return;
                if (c) setPicked(toPickedCustomer(c));
                else setPicked(null);
            } catch {
                if (!cancelled) setPicked(null);
            }
        })();
        return () => {
            cancelled = true;
            ac.abort();
        };
        // We only want this to react to `value` changes. `picked` is checked
        // inline but should not retrigger.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // ─── Debounced search ────────────────────────────────────────────────────
    useEffect(() => {
        if (!open) return;

        const ac = new AbortController();
        const t = window.setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const { rows } = await searchCustomers(query.trim(), {
                    limit: RESULT_LIMIT,
                    signal: ac.signal,
                });
                if (ac.signal.aborted) return;
                setResults(rows);
                setHighlight(0);
            } catch (err) {
                if (ac.signal.aborted) return;
                if (err instanceof Error && err.name === 'AbortError') return;
                setError(err instanceof Error ? err.message : 'Search failed');
                setResults([]);
            } finally {
                if (!ac.signal.aborted) setLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => {
            window.clearTimeout(t);
            ac.abort();
        };
    }, [query, open]);

    // ─── Outside click / Esc to close ────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        function onPointerDown(e: MouseEvent | TouchEvent) {
            if (!containerRef.current) return;
            if (containerRef.current.contains(e.target as Node)) return;
            setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    // ─── Focus the input each time we open ───────────────────────────────────
    useEffect(() => {
        if (open) {
            // Defer to next paint so the input has rendered.
            const id = window.requestAnimationFrame(() => {
                inputRef.current?.focus();
            });
            return () => window.cancelAnimationFrame(id);
        }
    }, [open]);

    // ─── Keep highlighted row scrolled into view ─────────────────────────────
    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const el = list.querySelector<HTMLElement>(`[data-row-index="${highlight}"]`);
        if (el) {
            el.scrollIntoView({ block: 'nearest' });
        }
    }, [highlight]);

    const trimmed = query.trim();
    const showCreateRow =
        allowCreate && trimmed.length > 0 && !loading && results.length === 0;
    const totalRows = results.length + (showCreateRow ? 1 : 0);

    const openDropdown = useCallback(() => {
        if (disabled) return;
        setOpen(true);
        setQuery('');
        setResults([]);
        setHighlight(0);
        setError(null);
    }, [disabled]);

    const selectCustomer = useCallback(
        (c: Customer | PickedCustomer) => {
            const proj: PickedCustomer =
                'customerType' in c ? toPickedCustomer(c as Customer) : (c as PickedCustomer);
            setPicked(proj);
            onChange(proj.id, proj);
            setOpen(false);
            setQuery('');
        },
        [onChange],
    );

    const clearSelection = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            setPicked(null);
            onChange(null, null);
        },
        [onChange],
    );

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (totalRows === 0) return;
            setHighlight((h) => (h + 1) % totalRows);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (totalRows === 0) return;
            setHighlight((h) => (h - 1 + totalRows) % totalRows);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (showCreateRow && highlight === results.length) {
                setCreateOpen(true);
                return;
            }
            const target = results[highlight];
            if (target) selectCustomer(target);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
        }
    }

    function handleCreated(c: PickedCustomer) {
        setCreateOpen(false);
        selectCustomer(c);
    }

    // Pre-fill the create modal: explicit defaults from parent take precedence,
    // otherwise fall back to the user's current query.
    const modalDefaults = useMemo(
        () => ({
            displayName: createDefaults?.displayName ?? trimmed,
            email: createDefaults?.email,
            phone: createDefaults?.phone,
        }),
        [createDefaults?.displayName, createDefaults?.email, createDefaults?.phone, trimmed],
    );

    const displayLabel = picked?.displayName ?? '';

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Hidden input so the picker plays nicely with native form submission. */}
            {name && (
                <input
                    type="hidden"
                    name={name}
                    value={value ?? ''}
                    required={required}
                    readOnly
                />
            )}

            {/* ─── Trigger button (closed state) ─────────────────────────── */}
            <button
                type="button"
                onClick={openDropdown}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={`group w-full flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left text-sm transition-all hover:bg-white/8 hover:border-white/15 focus:outline-none focus:border-[#b8956a]/60 focus:bg-white/8 ${
                    disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
            >
                <User size={14} className="text-white/30 shrink-0" />
                <span
                    className={`flex-1 truncate ${
                        picked ? 'text-white' : 'text-white/25'
                    }`}
                >
                    {picked ? displayLabel : placeholder}
                </span>

                {picked && !disabled ? (
                    <span
                        role="button"
                        tabIndex={-1}
                        aria-label="Clear selection"
                        onClick={clearSelection}
                        className="shrink-0 w-6 h-6 -mr-1 flex items-center justify-center rounded-md text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={13} />
                    </span>
                ) : (
                    <ChevronDown
                        size={14}
                        className="text-white/30 shrink-0 group-hover:text-white/50 transition-colors"
                    />
                )}
            </button>

            {/* ─── Dropdown / mobile overlay ────────────────────────────── */}
            {open && (
                <>
                    {/* Mobile backdrop (sm and below). Hidden on >=sm. */}
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] sm:hidden"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        className="
                            fixed inset-x-0 top-0 bottom-0 z-[95] flex flex-col bg-[#1a1a1a] border border-white/10 shadow-2xl
                            sm:absolute sm:inset-auto sm:top-[calc(100%+6px)] sm:left-0 sm:right-0 sm:bottom-auto sm:max-h-80 sm:rounded-2xl
                        "
                    >
                        {/* Search header */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 shrink-0">
                            <Search size={14} className="text-white/30 shrink-0" />
                            <input
                                ref={inputRef}
                                type="search"
                                inputMode="search"
                                autoComplete="off"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search customers..."
                                className="flex-1 bg-transparent text-white text-base sm:text-sm placeholder-white/25 focus:outline-none"
                                role="combobox"
                                aria-expanded={open}
                                aria-controls={listboxId}
                                aria-autocomplete="list"
                            />
                            {loading && (
                                <Loader2
                                    size={14}
                                    className="text-white/40 shrink-0 animate-spin"
                                />
                            )}
                            {/* Mobile-only close button */}
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="sm:hidden w-11 h-11 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                aria-label="Close"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Results list */}
                        <div
                            ref={listRef}
                            id={listboxId}
                            role="listbox"
                            className="flex-1 overflow-y-auto scrollbar-hide"
                        >
                            {error && (
                                <div className="px-4 py-6 text-xs text-red-400">
                                    {error}
                                </div>
                            )}

                            {!error && results.length === 0 && !loading && trimmed === '' && (
                                <div className="px-4 py-6 text-xs text-white/30">
                                    Start typing to search customers.
                                </div>
                            )}

                            {!error && results.length === 0 && !loading && trimmed !== '' && !allowCreate && (
                                <div className="px-4 py-6 text-xs text-white/30">
                                    No customers match &ldquo;{trimmed}&rdquo;.
                                </div>
                            )}

                            {results.map((c, idx) => {
                                const isHighlighted = idx === highlight;
                                const isSelected = picked?.id === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        data-row-index={idx}
                                        role="option"
                                        aria-selected={isSelected}
                                        onMouseEnter={() => setHighlight(idx)}
                                        onClick={() => selectCustomer(c)}
                                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                                            isHighlighted
                                                ? 'bg-white/8'
                                                : 'hover:bg-white/5'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-white text-sm truncate">
                                                    {c.displayName}
                                                </span>
                                                {isSelected && (
                                                    <span
                                                        aria-hidden="true"
                                                        className="text-[#b8956a] text-sm leading-none"
                                                    >
                                                        ✓
                                                    </span>
                                                )}
                                            </div>
                                            {c.companyName && c.companyName !== c.displayName && (
                                                <div className="text-xs text-white/60 truncate mt-0.5">
                                                    {c.companyName}
                                                </div>
                                            )}
                                            {(c.email || c.phone) && (
                                                <div className="text-[11px] text-white/40 truncate mt-0.5">
                                                    {[c.email, c.phone].filter(Boolean).join(' · ')}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}

                            {showCreateRow && (
                                <button
                                    type="button"
                                    data-row-index={results.length}
                                    role="option"
                                    aria-selected={highlight === results.length}
                                    onMouseEnter={() => setHighlight(results.length)}
                                    onClick={() => setCreateOpen(true)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left border-t border-white/6 transition-colors ${
                                        highlight === results.length
                                            ? 'bg-[#b8956a]/12'
                                            : 'hover:bg-[#b8956a]/8'
                                    }`}
                                >
                                    <span className="w-7 h-7 rounded-full bg-[#b8956a]/20 flex items-center justify-center text-[#b8956a] shrink-0">
                                        <Plus size={14} />
                                    </span>
                                    <span className="text-sm text-white truncate">
                                        Create &ldquo;
                                        <span className="font-semibold">{trimmed}</span>
                                        &rdquo;
                                    </span>
                                </button>
                            )}

                            {/* Persistent "+ New Customer" footer — visible whenever we
                                already have results but the user might still want to add
                                a new one. */}
                            {allowCreate && results.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setCreateOpen(true)}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-left border-t border-white/6 text-xs font-semibold uppercase tracking-wider text-[#b8956a] hover:bg-[#b8956a]/10 transition-colors"
                                >
                                    <Plus size={13} />
                                    New Customer
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

            {allowCreate && (
                <CustomerQuickCreateModal
                    isOpen={createOpen}
                    onClose={() => setCreateOpen(false)}
                    onCreated={handleCreated}
                    defaults={modalDefaults}
                />
            )}
        </div>
    );
}
