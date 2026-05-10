'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Plus, Check, ChevronDown, Wrench, Boxes, Box, X } from 'lucide-react';
import type { Item, ItemType } from '@/lib/items';

export interface PickedItem {
    id: string;
    name: string;
    description: string;
    type: ItemType;
    unitPrice: number | null;
    qbId: string | null;
}

export interface ItemPickerProps {
    value: string | null;
    onChange: (itemId: string | null, item: PickedItem | null) => void;
    placeholder?: string;
    typeFilter?: ItemType;
    allowCreate?: boolean;
}

const TYPE_LABEL: Record<ItemType, string> = {
    Service: 'Service',
    Inventory: 'Inventory',
    NonInventory: 'Non-Inventory',
};

function toPicked(item: Item): PickedItem {
    return {
        id: item.id,
        name: item.name,
        description: item.description,
        type: item.type,
        unitPrice: item.unitPrice,
        qbId: item.qbId,
    };
}

function TypeIcon({ type }: { type: ItemType }) {
    if (type === 'Service') return <Wrench size={11} className="text-[#b8956a]" />;
    if (type === 'Inventory') return <Boxes size={11} className="text-blue-300" />;
    return <Box size={11} className="text-white/50" />;
}

export function ItemPicker({
    value,
    onChange,
    placeholder = 'Search items…',
    typeFilter,
    allowCreate = true,
}: ItemPickerProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Item[]>([]);
    const [selected, setSelected] = useState<PickedItem | null>(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Hydrate selected when `value` changes from outside.
    useEffect(() => {
        if (!value) {
            setSelected(null);
            return;
        }
        if (selected?.id === value) return;
        let cancelled = false;
        fetch(`/api/items/${value}`)
            .then(r => r.ok ? r.json() : null)
            .then((d) => {
                if (cancelled || !d || d.error) return;
                setSelected({
                    id: d.id,
                    name: d.name,
                    description: d.description ?? '',
                    type: d.type as ItemType,
                    unitPrice: d.unitPrice ?? null,
                    qbId: d.qbId ?? null,
                });
            })
            .catch(() => { /* ignore */ });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // Debounced search.
    useEffect(() => {
        if (!open) return;
        const handle = setTimeout(async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.set('limit', '20');
                if (query.trim()) params.set('q', query.trim());
                if (typeFilter) params.set('type', typeFilter);
                params.set('active', 'true');
                const res = await fetch(`/api/items?${params.toString()}`);
                const data = await res.json();
                setResults(Array.isArray(data?.rows) ? data.rows : []);
            } catch {
                setResults([]);
            }
            setLoading(false);
        }, 250);
        return () => clearTimeout(handle);
    }, [query, open, typeFilter]);

    // Close dropdown on outside click.
    useEffect(() => {
        function onDown(e: MouseEvent) {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, []);

    function pick(item: Item) {
        const picked = toPicked(item);
        setSelected(picked);
        onChange(picked.id, picked);
        setOpen(false);
        setQuery('');
    }

    function clear(e: React.MouseEvent) {
        e.stopPropagation();
        setSelected(null);
        onChange(null, null);
        setQuery('');
        setResults([]);
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => {
                    setOpen(o => !o);
                    setTimeout(() => inputRef.current?.focus(), 0);
                }}
                className="w-full h-10 pl-3 pr-9 bg-white/5 border border-white/10 rounded-xl text-sm text-left text-white hover:border-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-colors flex items-center gap-2"
            >
                {selected ? (
                    <>
                        <TypeIcon type={selected.type} />
                        <span className="flex-1 truncate">{selected.name}</span>
                        {selected.unitPrice != null && (
                            <span className="text-white/40 font-mono text-xs">
                                ${selected.unitPrice.toFixed(2)}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={clear}
                            title="Clear"
                            className="-mr-1 w-6 h-6 flex items-center justify-center rounded-md text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X size={12} />
                        </button>
                    </>
                ) : (
                    <>
                        <Search size={14} className="text-white/30" />
                        <span className="flex-1 text-white/40">{placeholder}</span>
                    </>
                )}
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </button>

            {open && (
                <div className="absolute z-30 left-0 right-0 mt-2 bg-[#131313] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-white/6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                            <input
                                ref={inputRef}
                                type="search"
                                inputMode="search"
                                autoComplete="off"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={typeFilter ? `Search ${TYPE_LABEL[typeFilter]} items…` : placeholder}
                                className="w-full h-9 pl-9 pr-3 bg-white/5 border border-white/10 rounded-lg text-base sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#b8956a]/50 transition-all"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                        {loading ? (
                            <div className="py-6 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full border-2 border-[#b8956a]/30 border-t-[#b8956a] animate-spin" />
                            </div>
                        ) : results.length === 0 ? (
                            <p className="px-4 py-6 text-center text-xs text-white/40">
                                {query ? 'No items match.' : 'Start typing to search.'}
                            </p>
                        ) : (
                            <ul className="py-1">
                                {results.map(it => {
                                    const isActive = selected?.id === it.id;
                                    return (
                                        <li key={it.id}>
                                            <button
                                                type="button"
                                                onClick={() => pick(it)}
                                                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 transition-colors ${isActive ? 'bg-[#b8956a]/8' : ''}`}
                                            >
                                                <TypeIcon type={it.type} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-white truncate">{it.name}</span>
                                                        {it.sku && (
                                                            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{it.sku}</span>
                                                        )}
                                                    </div>
                                                    {it.description && (
                                                        <p className="text-xs text-white/40 truncate">{it.description}</p>
                                                    )}
                                                </div>
                                                {it.unitPrice != null && (
                                                    <span className="text-xs font-mono text-white/60 shrink-0">
                                                        ${it.unitPrice.toFixed(2)}
                                                    </span>
                                                )}
                                                {isActive && <Check size={14} className="text-[#b8956a] shrink-0" />}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {allowCreate && (
                        <div className="border-t border-white/6 bg-white/[0.02]">
                            <button
                                type="button"
                                onClick={() => setCreateOpen(true)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#b8956a] hover:text-[#cbb08c] hover:bg-white/5 transition-colors"
                            >
                                <Plus size={12} /> Create new item{query.trim() ? ` "${query.trim()}"` : ''}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {createOpen && (
                <CreateItemModal
                    initialName={query.trim()}
                    initialType={typeFilter ?? 'Service'}
                    typeFilter={typeFilter}
                    onCancel={() => setCreateOpen(false)}
                    onCreated={(picked) => {
                        setSelected(picked);
                        onChange(picked.id, picked);
                        setCreateOpen(false);
                        setOpen(false);
                        setQuery('');
                    }}
                />
            )}
        </div>
    );
}

function CreateItemModal({
    initialName,
    initialType,
    typeFilter,
    onCancel,
    onCreated,
}: {
    initialName: string;
    initialType: ItemType;
    typeFilter?: ItemType;
    onCancel: () => void;
    onCreated: (item: PickedItem) => void;
}) {
    const [name, setName] = useState(initialName);
    const [type, setType] = useState<ItemType>(initialType);
    const [unitPrice, setUnitPrice] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const body = {
                name: name.trim(),
                type,
                unitPrice: unitPrice === '' ? null : Number(unitPrice),
                source: 'crm',
            };
            const res = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
            onCreated({
                id: data.id,
                name: name.trim(),
                description: '',
                type,
                unitPrice: unitPrice === '' ? null : Number(unitPrice),
                qbId: null,
            });
        } catch (err) {
            setError(String(err));
        }
        setSaving(false);
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-md bg-[#131313] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
                    <h3 className="font-serif text-lg font-bold text-white">Quick Create Item</h3>
                    <button onClick={onCancel} className="w-11 h-11 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                        <X size={14} />
                    </button>
                </div>
                <form onSubmit={submit} className="p-5 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-200">{error}</div>
                    )}
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase tracking-widest text-white/50">Name <span className="text-[#b8956a]">*</span></span>
                        <input value={name} onChange={e => setName(e.target.value)} required autoFocus
                            className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-base sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase tracking-widest text-white/50">Type</span>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value as ItemType)}
                            disabled={Boolean(typeFilter)}
                            className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-base sm:text-sm text-white focus:outline-none focus:border-[#b8956a]/50 transition-all disabled:opacity-60"
                        >
                            <option value="Service">Service</option>
                            <option value="Inventory">Inventory</option>
                            <option value="NonInventory">Non-Inventory</option>
                        </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase tracking-widest text-white/50">Unit price ($)</span>
                        <input type="number" inputMode="decimal" step="0.01" min="0" value={unitPrice} onChange={e => setUnitPrice(e.target.value)}
                            className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-base sm:text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#b8956a]/50 transition-all" />
                    </label>
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button type="button" onClick={onCancel} className="h-9 px-4 text-white/60 hover:text-white text-xs font-semibold rounded-full transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving || !name.trim()} className="h-9 px-4 bg-[#b8956a] text-black text-xs font-semibold rounded-full flex items-center gap-1.5 hover:bg-[#cbb08c] transition-colors disabled:opacity-50">
                            {saving ? 'Creating…' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
