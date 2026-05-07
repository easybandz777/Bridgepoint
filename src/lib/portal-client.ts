/**
 * Client-side helpers for the crew portal.
 *
 * All /api/portal/* responses use these wrappers. Always send
 * credentials so the cookie is included.
 */

export interface PortalSessionInfo {
    userType: 'employee' | 'subcontractor';
    userId: string;
    displayName: string;
    role: string;
    mustChangePin: boolean;
    expiresAt: string;
}

export interface PortalEmployeeProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    role: string;
    employment_type: string;
    status: string;
    hire_date: string | null;
    hourly_rate: string | number;
    overtime_rate: string | number | null;
    salary: string | number | null;
    address: string;
    emergency_contact: Record<string, unknown>;
    certifications: string[];
    skills: string[];
    avatar_url: string | null;
    metrics: Record<string, unknown>;
}

export interface PortalSubcontractorProfile {
    id: string;
    company_name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
    trades: string[];
    status: string;
    rating: string | number;
    payment_terms: string;
    default_rate: string | null;
    insurance_expiry: string | null;
    documents: unknown[];
}

export interface PortalMeResponse {
    session: PortalSessionInfo;
    employee?: PortalEmployeeProfile;
    subcontractor?: PortalSubcontractorProfile;
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let msg = `${res.status}`;
        try {
            const j = await res.json();
            if (j?.error) msg = j.error;
        } catch {}
        throw new Error(msg);
    }
    return res.json() as Promise<T>;
}

export async function portalLogin(email: string, pin: string) {
    return jsonOrThrow<{ ok: true; user: { userType: string; userId: string; displayName: string } }>(
        await fetch('/api/portal/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, pin }),
            credentials: 'include',
        }),
    );
}

export async function portalLogout() {
    await fetch('/api/portal/auth/logout', { method: 'POST', credentials: 'include' });
}

export async function fetchMe(): Promise<PortalMeResponse | null> {
    const r = await fetch('/api/portal/me', { credentials: 'include', cache: 'no-store' });
    if (r.status === 401) return null;
    if (!r.ok) throw new Error(`fetchMe failed: ${r.status}`);
    return r.json();
}

export async function updateMe(body: Record<string, unknown>) {
    return jsonOrThrow<{ ok: true }>(
        await fetch('/api/portal/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            credentials: 'include',
        }),
    );
}

export async function changePin(currentPin: string, newPin: string) {
    return jsonOrThrow<{ ok: true }>(
        await fetch('/api/portal/me/change-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPin, newPin }),
            credentials: 'include',
        }),
    );
}

// ─── Generic portal fetch ───────────────────────────────────────────────────

export async function portalFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(path, {
        ...init,
        credentials: 'include',
        cache: 'no-store',
        headers: {
            ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
            ...(init.headers ?? {}),
        },
    });
    return jsonOrThrow<T>(res);
}

// ─── Formatting helpers used across portal pages ────────────────────────────

export function fmtMoney(n: number | string | null | undefined): string {
    const v = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
    const safe = Number.isFinite(v) ? v : 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(safe);
}

export function fmtMoneyCents(n: number | string | null | undefined): string {
    const v = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
    const safe = Number.isFinite(v) ? v : 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(safe);
}

export function fmtHours(h: number | string | null | undefined): string {
    const v = typeof h === 'string' ? parseFloat(h) : (h ?? 0);
    return `${(Math.round((v || 0) * 10) / 10).toFixed(1)}h`;
}

export function fmtShortDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return '—'; }
}

export function fmtDateTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
            ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch { return '—'; }
}

export function timeAgo(iso: string | null | undefined): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return '';
    const sec = Math.floor((Date.now() - then) / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
