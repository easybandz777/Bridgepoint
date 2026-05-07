/**
 * CRM ↔ QuickBooks shape mappers.
 *
 * Each sync module (customer, invoice, vendor, bill, estimate) imports the
 * helpers from here so we don't duplicate address/email parsing logic.
 */

import type { QbAddress } from './types';

/** Strip non-printable chars. QB rejects control characters in many fields. */
export function clean(s: string | null | undefined): string {
    return (s ?? '').replace(/[\x00-\x1f\x7f]/g, '').trim();
}

/** Truncate to QB's column limit (most string fields are 100-1000 chars). */
export function trunc(s: string, max: number): string {
    return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

/** Build a QB Address from CRM address fields. Returns undefined if all empty. */
export function buildAddress(parts: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
}): QbAddress | undefined {
    const Line1 = clean(parts.line1);
    const Line2 = clean(parts.line2);
    const City = clean(parts.city);
    const Region = clean(parts.state);
    const Postal = clean(parts.zip);
    const Country = clean(parts.country) || 'US';
    if (!Line1 && !Line2 && !City && !Region && !Postal) return undefined;
    return {
        Line1: Line1 || undefined,
        Line2: Line2 || undefined,
        City: City || undefined,
        CountrySubDivisionCode: Region || undefined,
        PostalCode: Postal || undefined,
        Country,
    };
}

/** Parse a single-string CRM address ("123 Main St, Atlanta, GA 30309") into parts. */
export function parseFreeFormAddress(addr: string | null | undefined): {
    line1?: string;
    city?: string;
    state?: string;
    zip?: string;
} {
    const a = clean(addr);
    if (!a) return {};
    // Try "Street, City, State Zip" or "Street, City, State, Zip"
    const parts = a.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
        const line1 = parts[0];
        const city = parts[1];
        const tail = parts.slice(2).join(', ').trim();
        const m = tail.match(/^([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
        if (m) return { line1, city, state: m[1], zip: m[2] };
        const m2 = tail.match(/^([A-Za-z]{2}),?\s*(\d{5}(?:-\d{4})?)?$/);
        if (m2) return { line1, city, state: m2[1], zip: m2[2] };
        return { line1, city };
    }
    return { line1: a };
}

/** Validate basic email format — empty string returns undefined. */
export function emailField(email: string | null | undefined): { Address: string } | undefined {
    const e = clean(email);
    if (!e || !e.includes('@')) return undefined;
    return { Address: trunc(e, 100) };
}

export function phoneField(phone: string | null | undefined): { FreeFormNumber: string } | undefined {
    const p = clean(phone);
    if (!p) return undefined;
    return { FreeFormNumber: trunc(p, 21) };
}

/** Standard YYYY-MM-DD output for QB Txn dates. */
export function ymd(input: Date | string | null | undefined): string | undefined {
    if (!input) return undefined;
    const d = typeof input === 'string' ? new Date(input) : input;
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString().slice(0, 10);
}

export function moneyRound(n: number | string | null | undefined): number {
    const v = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
    if (!Number.isFinite(v)) return 0;
    return Math.round(v * 100) / 100;
}
