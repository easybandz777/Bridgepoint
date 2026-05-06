/**
 * Client-side helpers for talking to the /api/projects endpoints.
 * All admin/projects pages should consume DB data through these
 * helpers (or by hand-calling fetch with the same URL shape).
 */

// ─── Wire-format types (snake_case from Postgres) ────────────────────────

export interface DbProject {
    id: string;
    project_number: string;
    name: string;
    status: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    description: string;
    start_date: string | null;
    end_date: string | null;
    estimate_id: string | null;
    estimate_number: string | null;
    estimated_revenue: number | string;
    estimated_cost: number | string;
    actual_cost: number | string;
    actual_revenue: number | string;
    invoiced_amount: number | string;
    collected_amount: number | string;
    project_manager: string;
    tags: unknown[];
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;

    // Aggregates from list query (optional).
    phase_count?: number;
    avg_completion?: number | string;
    total_billed?: number | string;
    total_unpaid?: number | string;
    total_expenses?: number | string;
    approved_co_revenue?: number | string;
    approved_co_cost?: number | string;
    pending_co_revenue?: number | string;
    pending_co_cost?: number | string;
    labor_cost?: number | string;
}

export interface DbPhase {
    id: string;
    project_id: string;
    name: string;
    status: string;
    phase_order: number;
    estimated_budget: number | string;
    actual_cost: number | string;
    completion_pct: number | string;
    start_date: string | null;
    end_date: string | null;
    actual_start_date: string | null;
    actual_end_date: string | null;
    assigned_sub_ids: string[];
    notes: string;
    dependencies: string[];
    issues: string[];
}

export interface DbChangeOrder {
    id: string;
    project_id: string;
    change_number: string;
    title: string;
    description: string;
    status: string;
    amount: number | string;
    cost_impact: number | string;
    time_impact_days: number;
    requested_date: string | null;
    approved_date: string | null;
    requested_by: string | null;
    approved_by: string | null;
    line_items: unknown[];
    created_at: string;
}

export interface DbBill {
    id: string;
    project_id: string;
    phase_id: string | null;
    subcontractor_id: string | null;
    assignment_id: string | null;
    bill_number: string | null;
    amount: number | string;
    status: string;
    received_date: string | null;
    due_date: string | null;
    paid_date: string | null;
    description: string;
    file_url: string | null;
    created_at: string;
    subcontractor_name?: string | null;
    phase_name?: string | null;
}

export interface DbFile {
    id: string;
    project_id: string;
    filename: string;
    file_type: string | null;
    url: string;
    size_bytes: number | null;
    category: string;
    uploaded_by: string | null;
    description: string;
    created_at: string;
}

export interface DbExpense {
    id: string;
    project_id: string | null;
    phase_id: string | null;
    employee_id: string | null;
    category: string;
    vendor: string;
    description: string;
    amount: number | string;
    date: string;
    payment_method: string | null;
    receipt_url: string | null;
    reimbursable: boolean;
    reimbursed: boolean;
    tax_deductible: boolean;
    notes: string;
    created_at: string;
    project_name?: string | null;
    phase_name?: string | null;
}

export interface DbActivity {
    id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    actor: string;
    description: string;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface DbProjectFull extends DbProject {
    phases: DbPhase[];
    change_orders: DbChangeOrder[];
    bills: DbBill[];
    files: DbFile[];
    expenses: DbExpense[];
    activity: DbActivity[];
    labor_cost: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────

export function n(v: number | string | null | undefined): number {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    const parsed = parseFloat(v);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function calcEstGP(p: Pick<DbProject, 'estimated_revenue' | 'estimated_cost'>) {
    return n(p.estimated_revenue) - n(p.estimated_cost);
}

export function calcActGP(p: Pick<DbProject, 'actual_revenue' | 'actual_cost'>) {
    return n(p.actual_revenue) - n(p.actual_cost);
}

export function marginPct(revenue: number, gp: number) {
    if (revenue === 0) return 0;
    return (gp / revenue) * 100;
}

export function fmtCurrency(v: number | string | null | undefined): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(n(v));
}

// ─── Fetch wrappers ─────────────────────────────────────────────────────

async function jsonOrThrow<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`API ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
}

export async function listProjects(): Promise<DbProject[]> {
    return jsonOrThrow<DbProject[]>(await fetch('/api/projects', { cache: 'no-store' }));
}

export async function getProject(id: string): Promise<DbProjectFull> {
    return jsonOrThrow<DbProjectFull>(await fetch(`/api/projects/${id}`, { cache: 'no-store' }));
}

export async function createProject(body: Record<string, unknown>): Promise<{ id: string; projectNumber: string }> {
    return jsonOrThrow(await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }));
}

export async function updateProject(id: string, body: Record<string, unknown>): Promise<{ ok: true }> {
    return jsonOrThrow(await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }));
}

export async function deleteProject(id: string): Promise<{ ok: true }> {
    return jsonOrThrow(await fetch(`/api/projects/${id}`, { method: 'DELETE' }));
}

export async function createPhase(projectId: string, body: Record<string, unknown>) {
    return jsonOrThrow<{ id: string }>(await fetch(`/api/projects/${projectId}/phases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }));
}

export async function updatePhase(projectId: string, phaseId: string, body: Record<string, unknown>) {
    return jsonOrThrow(await fetch(`/api/projects/${projectId}/phases/${phaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }));
}

export async function deletePhase(projectId: string, phaseId: string) {
    return jsonOrThrow(await fetch(`/api/projects/${projectId}/phases/${phaseId}`, { method: 'DELETE' }));
}

export async function createChangeOrder(projectId: string, body: Record<string, unknown>) {
    return jsonOrThrow<{ id: string; changeNumber: string }>(await fetch(`/api/projects/${projectId}/change-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }));
}

export async function updateChangeOrder(projectId: string, coId: string, body: Record<string, unknown>) {
    return jsonOrThrow(await fetch(`/api/projects/${projectId}/change-orders/${coId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }));
}

export async function deleteChangeOrder(projectId: string, coId: string) {
    return jsonOrThrow(await fetch(`/api/projects/${projectId}/change-orders/${coId}`, { method: 'DELETE' }));
}

export async function createBill(projectId: string, body: Record<string, unknown>) {
    return jsonOrThrow<{ id: string }>(await fetch(`/api/projects/${projectId}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }));
}

export async function updateBill(projectId: string, billId: string, body: Record<string, unknown>) {
    return jsonOrThrow(await fetch(`/api/projects/${projectId}/bills/${billId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }));
}

export async function deleteBill(projectId: string, billId: string) {
    return jsonOrThrow(await fetch(`/api/projects/${projectId}/bills/${billId}`, { method: 'DELETE' }));
}

export async function createFile(projectId: string, body: Record<string, unknown>) {
    return jsonOrThrow<{ id: string }>(await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }));
}

export async function deleteFile(projectId: string, fileId: string) {
    return jsonOrThrow(await fetch(`/api/projects/${projectId}/files/${fileId}`, { method: 'DELETE' }));
}

export async function createExpense(body: Record<string, unknown>) {
    return jsonOrThrow<{ id: string }>(await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }));
}

export async function listExpenses(params?: { projectId?: string; category?: string; from?: string; to?: string }): Promise<DbExpense[]> {
    const q = new URLSearchParams();
    if (params?.projectId) q.set('projectId', params.projectId);
    if (params?.category) q.set('category', params.category);
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return jsonOrThrow<DbExpense[]>(await fetch(`/api/expenses${qs ? '?' + qs : ''}`, { cache: 'no-store' }));
}

export async function deleteExpense(id: string) {
    return jsonOrThrow(await fetch(`/api/expenses/${id}`, { method: 'DELETE' }));
}
