'use client';

import { useEffect, useState } from 'react';
import type { Subcontractor } from '@/lib/subcontractors';

export type LoadState =
    | { phase: 'loading'; sub: null; error: null }
    | { phase: 'notfound'; sub: null; error: null }
    | { phase: 'error'; sub: null; error: string }
    | { phase: 'ready'; sub: Subcontractor; error: null };

/** Fetch a single sub from the API and track loading/error/notfound state. */
export function useSub(id: string | undefined): LoadState {
    const [state, setState] = useState<LoadState>({ phase: 'loading', sub: null, error: null });

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/subcontractors/${id}`, { cache: 'no-store' });
                if (cancelled) return;
                if (res.status === 404) {
                    setState({ phase: 'notfound', sub: null, error: null });
                    return;
                }
                if (!res.ok) {
                    const body = (await res.json().catch(() => ({}))) as { error?: string };
                    throw new Error(body.error ?? `HTTP ${res.status}`);
                }
                const data = (await res.json()) as Subcontractor;
                setState({ phase: 'ready', sub: data, error: null });
            } catch (e) {
                if (cancelled) return;
                setState({ phase: 'error', sub: null, error: e instanceof Error ? e.message : 'Failed to load' });
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    return state;
}
