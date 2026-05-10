'use client';

/**
 * <AccountPicker /> — search-as-you-type autocomplete over the chart of
 * accounts. Designed to be embedded in bill, expense and item creation forms
 * where the user must pick a target account ("which expense account does this
 * bill go against", "which income account does this item credit").
 *
 * The picker queries `GET /api/accounts?classification=Expense&q=...` and
 * shows results grouped by `account_type` within the dropdown.
 *
 * The component is uncontrolled internally (it owns the dropdown open/closed
 * state and the search query) but the `value` prop is fully controlled —
 * parent owns the picked account id and reacts to onChange.
 */

import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Search, X, Loader2, ChevronDown, Wallet } from 'lucide-react';
import type { Account, AccountClassification } from '@/lib/accounts';

export interface PickedAccount {
    id: string;
    name: string;
    fullName: string | null;
    accountType: string;
    classification: string | null;
    qbId: string | null;
}

export interface AccountPickerProps {
    value: string | null;
    onChange: (accountId: string | null, account: PickedAccount | null) => void;
    placeholder?: string;
    /** Restrict to a specific classification — common cases: 'Expense' for bills, 'Revenue' for income items. */
    classification?: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
    /** Restrict to specific account types (overrides classification if set). */
    types?: string[];
    name?: string;
    required?: boolean;
    disabled?: boolean;
}

const DEBOUNCE_MS = 250;
const RESULT_LIMIT = 50;

interface AccountListResponse {
    rows: Account[];
    total: number;
}

function toPickedAccount(a: Account): PickedAccount {
    return {
        id: a.id,
        name: a.name,
        fullName: a.fullName,
        accountType: a.accountType,
        classification: a.classification,
        qbId: a.qbId,
    };
}

async function fetchAccounts(opts: {
    classification?: AccountClassification;
    type?: string;
    signal?: AbortSignal;
}): Promise<AccountListResponse> {
    const params = new URLSearchParams();
    if (opts.classification) params.set('classification', opts.classification);
    if (opts.type) params.set('type', opts.type);
    params.set('active', 'true');
    params.set('limit', String(RESULT_LIMIT * 4));

    const res = await fetch(`/api/accounts?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: opts.signal,
    });
    if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
            const j = (await res.json()) as { error?: string };
            if (j?.error) msg = j.error;
        } catch {
            // ignore
        }
        throw new Error(msg);
    }
    return (await res.json()) as AccountListResponse;
}

async function fetchAccountById(id: string, signal?: AbortSignal): Promise<Account | null> {
    const res = await fetch(`/api/accounts/${encodeURIComponent(id)}`, {
        method: 'GET',
        cache: 'no-store',
        signal,
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return (await res.json()) as Account;
}

export function AccountPicker({
    value,
    onChange,
    placeholder = 'Select account...',
    classification,
    types,
    name,
    required = false,
    disabled = false,
}: AccountPickerProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Account[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [highlight, setHighlight] = useState(0);

    const [picked, setPicked] = useState<PickedAccount | null>(null);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const listboxId = useId();

    // ─── Hydrate `picked` whenever `value` changes ───────────────────────────
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
                const a = await fetchAccountById(value, ac.signal);
                if (cancelled || ac.signal.aborted) return;
                if (a) setPicked(toPickedAccount(a));
                else setPicked(null);
            } catch {
                if (!cancelled) setPicked(null);
            }
        })();
        return () => {
            cancelled = true;
            ac.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // ─── Fetch accounts whenever the dropdown is open ────────────────────────
    // We pull a wide page (active accounts matching classification/types) and
    // filter client-side by query. Chart of accounts is small (typically <500
    // rows) so this is cheap and gives us instant feedback.
    useEffect(() => {
        if (!open) return;

        const ac = new AbortController();
        const t = window.setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                if (types && types.length > 0) {
                    // If types are passed, fetch each and merge — the API takes
                    // a single `type` param.
                    const lists = await Promise.all(
                        types.map(t =>
                            fetchAccounts({ type: t, signal: ac.signal }),
                        ),
                    );
                    if (ac.signal.aborted) return;
                    const merged: Account[] = [];
                    const seen = new Set<string>();
                    for (const l of lists) {
                        for (const r of l.rows) {
                            if (!seen.has(r.id)) {
                                seen.add(r.id);
                                merged.push(r);
                            }
                        }
                    }
                    setResults(merged);
                } else {
                    const { rows } = await fetchAccounts({
                        classification,
                        signal: ac.signal,
                    });
                    if (ac.signal.aborted) return;
                    setResults(rows);
                }
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
    }, [open, classification, types]);

    // ─── Outside click / Esc to close ────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        function onPointerDown(e: MouseEvent | TouchEvent) {
            if (!containerRef.current) return;
            if (containerRef.current.contains(e.target as Node)) return;
            setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
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
        if (el) el.scrollIntoView({ block: 'nearest' });
    }, [highlight]);

    // ─── Filter + group results by account_type ──────────────────────────────
    const trimmed = query.trim().toLowerCase();
    const filteredFlat = useMemo(() => {
        if (!trimmed) return results;
        return results.filter(a => {
            return (
                a.name.toLowerCase().includes(trimmed) ||
                (a.fullName ?? '').toLowerCase().includes(trimmed) ||
                a.accountType.toLowerCase().includes(trimmed)
            );
        });
    }, [results, trimmed]);

    const grouped = useMemo(() => {
        const m = new Map<string, Account[]>();
        for (const a of filteredFlat) {
            const k = a.accountType || 'Other';
            const arr = m.get(k);
            if (arr) arr.push(a);
            else m.set(k, [a]);
        }
        // Stable order: alphabetical group, accounts already sorted by API
        return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [filteredFlat]);

    const totalRows = filteredFlat.length;
    // Index map: position in filteredFlat → row index (used for keyboard nav).
    const flatRows = useMemo(
        () => grouped.flatMap(([, rows]) => rows),
        [grouped],
    );

    const openDropdown = useCallback(() => {
        if (disabled) return;
        setOpen(true);
        setQuery('');
        setHighlight(0);
        setError(null);
    }, [disabled]);

    const selectAccount = useCallback(
        (a: Account | PickedAccount) => {
            const proj: PickedAccount =
                'createdAt' in a ? toPickedAccount(a as Account) : (a as PickedAccount);
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
            setHighlight(h => (h + 1) % totalRows);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (totalRows === 0) return;
            setHighlight(h => (h - 1 + totalRows) % totalRows);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const target = flatRows[highlight];
            if (target) selectAccount(target);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
        }
    }

    const displayLabel = picked?.fullName ?? picked?.name ?? '';

    return (
        <div ref={containerRef} className="relative w-full">
            {name && (
                <input
                    type="hidden"
                    name={name}
                    value={value ?? ''}
                    required={required}
                    readOnly
                />
            )}

            {/* ─── Trigger button ─────────────────────────────────────────── */}
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
                <Wallet size={14} className="text-white/30 shrink-0" />
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

            {/* ─── Dropdown ────────────────────────────────────────────── */}
            {open && (
                <>
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] sm:hidden"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        className="
                            fixed inset-x-0 top-0 bottom-0 z-[95] flex flex-col bg-[#1a1a1a] border border-white/10 shadow-2xl
                            sm:absolute sm:inset-auto sm:top-[calc(100%+6px)] sm:left-0 sm:right-0 sm:bottom-auto sm:max-h-96 sm:rounded-2xl
                        "
                    >
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
                                placeholder="Search accounts..."
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
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="sm:hidden w-11 h-11 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                aria-label="Close"
                            >
                                <X size={14} />
                            </button>
                        </div>

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

                            {!error && totalRows === 0 && !loading && (
                                <div className="px-4 py-6 text-xs text-white/30">
                                    {trimmed
                                        ? `No accounts match "${query.trim()}".`
                                        : 'No accounts found.'}
                                </div>
                            )}

                            {grouped.map(([groupName, rows]) => {
                                return (
                                    <div key={groupName}>
                                        <div className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b8956a] sticky top-0 bg-[#1a1a1a]">
                                            {groupName}
                                        </div>
                                        {rows.map((a) => {
                                            const flatIdx = flatRows.findIndex(r => r.id === a.id);
                                            const isHighlighted = flatIdx === highlight;
                                            const isSelected = picked?.id === a.id;
                                            return (
                                                <button
                                                    key={a.id}
                                                    type="button"
                                                    data-row-index={flatIdx}
                                                    role="option"
                                                    aria-selected={isSelected}
                                                    onMouseEnter={() => setHighlight(flatIdx)}
                                                    onClick={() => selectAccount(a)}
                                                    className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                                                        isHighlighted
                                                            ? 'bg-white/8'
                                                            : 'hover:bg-white/5'
                                                    }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-white text-sm truncate">
                                                                {a.name}
                                                            </span>
                                                            {isSelected && (
                                                                <span
                                                                    aria-hidden="true"
                                                                    className="text-[#b8956a] text-sm leading-none"
                                                                >
                                                                    {'✓'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {a.fullName && a.fullName !== a.name && (
                                                            <div className="text-[11px] text-white/40 truncate mt-0.5">
                                                                {a.fullName}
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
