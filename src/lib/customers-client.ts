/**
 * Frontend-only client helpers for the customers REST endpoints.
 * No backend imports. Used by the admin <CustomerPicker /> and its
 * quick-create modal, but safe to import from any client component.
 */

import type { Customer, CustomerType } from './customers';

export type { Customer, CustomerType };

/** Subset returned by the picker's onChange callback. */
export interface PickedCustomer {
    id: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    companyName: string | null;
    qbId: string | null;
}

export interface SearchCustomersResult {
    rows: Customer[];
    total: number;
}

/** Fields accepted by POST /api/customers. */
export interface CreateCustomerInput {
    displayName?: string;
    customerType?: CustomerType;
    companyName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
}

/** Toast/error helper — surfaces server error text without throwing through fetch. */
async function readError(res: Response): Promise<string> {
    try {
        const j = (await res.json()) as { error?: string };
        if (j?.error) return j.error;
    } catch {
        // ignore
    }
    return `Request failed (${res.status})`;
}

/**
 * Search customers — debounced calls live in the picker; this helper just
 * does the fetch. Pass `signal` to cancel in-flight requests on next keystroke.
 */
export async function searchCustomers(
    q: string,
    opts: { limit?: number; signal?: AbortSignal } = {},
): Promise<SearchCustomersResult> {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('limit', String(opts.limit ?? 20));
    params.set('active', 'true');

    const res = await fetch(`/api/customers?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: opts.signal,
    });
    if (!res.ok) throw new Error(await readError(res));
    return (await res.json()) as SearchCustomersResult;
}

/** Fetch a single customer by id (used to hydrate the picker on mount). */
export async function getCustomer(id: string, signal?: AbortSignal): Promise<Customer | null> {
    const res = await fetch(`/api/customers/${encodeURIComponent(id)}`, {
        method: 'GET',
        cache: 'no-store',
        signal,
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(await readError(res));
    const j = (await res.json()) as { customer: Customer };
    return j.customer;
}

/** Create a customer; returns the new id + display name from the server. */
export async function createCustomer(
    input: CreateCustomerInput,
): Promise<{ id: string; displayName: string }> {
    const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await readError(res));
    return (await res.json()) as { id: string; displayName: string };
}

/** Project a Customer down to the small shape passed to the picker's onChange. */
export function toPickedCustomer(c: Customer): PickedCustomer {
    return {
        id: c.id,
        displayName: c.displayName,
        email: c.email,
        phone: c.phone,
        companyName: c.companyName,
        qbId: c.qbId,
    };
}
