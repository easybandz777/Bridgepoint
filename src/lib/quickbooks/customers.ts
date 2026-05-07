/**
 * QuickBooks Online Customer sync.
 *
 * One QB Customer per unique (lower(email) OR lower(client_name)) across the
 * CRM. Projects, invoices, and estimates can all share a single human client;
 * we resolve to one Customer Id and stamp it on every related row.
 *
 * Resolution policy when a project does not yet have qb_customer_id:
 *   1. Search QB by PrimaryEmailAddr (if email present) — exact match wins.
 *   2. Search QB by DisplayName — exact match wins.
 *   3. Otherwise create a new Customer.
 */

import sql, { initDB, logActivity } from '@/lib/db';
import { qbCreate, qbGet, qbQuery, qbSparseUpdate, QbApiError } from './client';
import { getActiveConnection } from './connection';
import {
    buildAddress,
    clean,
    emailField,
    parseFreeFormAddress,
    phoneField,
    trunc,
} from './mappers';
import type { QbCustomer } from './types';
import { upsertCustomerFromQb } from './customers-import';

const QB_LOG_ENTITY = 'quickbooks_customer';

interface ProjectRow {
    id: string;
    project_number: string | null;
    client_name: string | null;
    client_email: string | null;
    client_phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    qb_id: string | null;
    qb_sync_token: string | null;
    qb_customer_id: string | null;
}

interface CustomerQueryResponse {
    QueryResponse: { Customer?: QbCustomer[] };
}

interface CustomerEnvelope {
    Customer: QbCustomer;
}

async function loadProject(projectId: string): Promise<ProjectRow | null> {
    const rows = (await sql`
        SELECT id, project_number, client_name, client_email, client_phone,
               address, city, state, zip,
               qb_id, qb_sync_token, qb_customer_id
        FROM projects WHERE id = ${projectId}
    `) as unknown as ProjectRow[];
    return rows[0] ?? null;
}

function deriveDisplayName(p: Pick<ProjectRow, 'id' | 'client_name' | 'client_email' | 'project_number'>): string {
    const name = clean(p.client_name);
    if (name) return trunc(name, 100);
    const email = clean(p.client_email);
    if (email && email.includes('@')) return trunc(email.split('@')[0], 100);
    const num = clean(p.project_number);
    if (num) return trunc(`Project ${num}`, 100);
    return trunc(`Project ${p.id}`, 100);
}

/**
 * Build a QB Customer payload (without Id/SyncToken) from a project row.
 * The same shape is used for both create and sparse-update calls.
 */
export function mapProjectToCustomer(project: ProjectRow): QbCustomer {
    const displayName = deriveDisplayName(project);

    // Prefer structured columns, fall back to parsing the freeform `address`.
    const hasStructured = clean(project.city) || clean(project.state) || clean(project.zip);
    const parsed = hasStructured ? {} : parseFreeFormAddress(project.address);
    const billAddr = buildAddress({
        line1: hasStructured ? project.address : (parsed.line1 ?? project.address),
        city: hasStructured ? project.city : parsed.city,
        state: hasStructured ? project.state : parsed.state,
        zip: hasStructured ? project.zip : parsed.zip,
    });

    const out: QbCustomer = { DisplayName: displayName };
    const email = emailField(project.client_email);
    if (email) out.PrimaryEmailAddr = email;
    const phone = phoneField(project.client_phone);
    if (phone) out.PrimaryPhone = phone;
    if (billAddr) {
        out.BillAddr = billAddr;
        out.ShipAddr = billAddr;
    }

    // Split DisplayName into Given/Family when it looks like a personal name.
    const cleanedName = clean(project.client_name);
    if (cleanedName && cleanedName.includes(' ')) {
        const tokens = cleanedName.split(/\s+/);
        out.GivenName = trunc(tokens[0], 25);
        out.FamilyName = trunc(tokens.slice(1).join(' '), 25);
    }

    return out;
}

function escapeQbString(s: string): string {
    return s.replace(/'/g, "''");
}

export async function findCustomerByEmail(email: string): Promise<QbCustomer | null> {
    const e = clean(email);
    if (!e || !e.includes('@')) return null;
    const r = await qbQuery<CustomerQueryResponse>(
        `select * from Customer where PrimaryEmailAddr = '${escapeQbString(e)}' maxresults 5`,
        { entityType: QB_LOG_ENTITY, action: 'search_by_email' },
    );
    const list = r.QueryResponse?.Customer ?? [];
    const lower = e.toLowerCase();
    return list.find(c => clean(c.PrimaryEmailAddr?.Address).toLowerCase() === lower) ?? null;
}

export async function findCustomerByName(displayName: string): Promise<QbCustomer | null> {
    const n = clean(displayName);
    if (!n) return null;
    const r = await qbQuery<CustomerQueryResponse>(
        `select * from Customer where DisplayName = '${escapeQbString(n)}' maxresults 5`,
        { entityType: QB_LOG_ENTITY, action: 'search_by_name' },
    );
    const list = r.QueryResponse?.Customer ?? [];
    const lower = n.toLowerCase();
    return list.find(c => clean(c.DisplayName).toLowerCase() === lower) ?? null;
}

async function readQbCustomer(qbId: string): Promise<QbCustomer | null> {
    try {
        const r = await qbGet<CustomerEnvelope>(`/customer/${encodeURIComponent(qbId)}`, {
            logAs: { entityType: QB_LOG_ENTITY, qbEntityId: qbId, action: 'read', direction: 'pull' },
        });
        return r.Customer ?? null;
    } catch (e) {
        if (e instanceof QbApiError && (e.status === 404 || e.status === 400)) return null;
        throw e;
    }
}

/**
 * Stamp the resolved QB Customer Id onto the project row plus any invoices /
 * estimates that share the same client_name (case-insensitive). The brief
 * stores client_name in `projects.client_name` directly but inside the
 * `client` JSONB on invoices/estimates.
 */
async function stampQbCustomerId(project: ProjectRow, qbCustomerId: string): Promise<void> {
    await sql`
        UPDATE projects
        SET qb_customer_id = ${qbCustomerId}, updated_at = NOW()
        WHERE id = ${project.id}
    `;

    const name = clean(project.client_name);
    if (!name) return;

    await sql`
        UPDATE invoices
        SET qb_customer_id = ${qbCustomerId}, updated_at = NOW()
        WHERE qb_customer_id IS NULL
          AND lower(COALESCE(client->>'name', '')) = ${name.toLowerCase()}
    `;
    await sql`
        UPDATE estimates
        SET qb_customer_id = ${qbCustomerId}, updated_at = NOW()
        WHERE qb_customer_id IS NULL
          AND lower(COALESCE(client->>'name', '')) = ${name.toLowerCase()}
    `;
}

async function stampProjectQbId(project: ProjectRow, customer: QbCustomer): Promise<void> {
    if (!customer.Id) return;
    await sql`
        UPDATE projects
        SET qb_id = ${customer.Id},
            qb_sync_token = ${customer.SyncToken ?? null},
            qb_synced_at = NOW(),
            updated_at = NOW()
        WHERE id = ${project.id}
    `;
}

async function ensureConnected(): Promise<void> {
    const conn = await getActiveConnection();
    if (!conn) throw new Error('QuickBooks is not connected');
}

export interface ResolveResult {
    qbCustomerId: string;
    customer: QbCustomer;
}

export async function resolveOrCreateCustomerForProject(
    projectId: string,
    actor: string = 'admin',
): Promise<ResolveResult> {
    await initDB();
    await ensureConnected();

    const project = await loadProject(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    // 1. Already resolved? Confirm the QB record still exists, then return.
    if (project.qb_customer_id) {
        const existing = await readQbCustomer(project.qb_customer_id);
        if (existing) {
            await stampProjectQbId(project, existing);
            await mirrorCustomerIntoCrm(existing);
            return { qbCustomerId: project.qb_customer_id, customer: existing };
        }
        // Stale id — fall through to re-resolve.
        await sql`UPDATE projects SET qb_customer_id = NULL WHERE id = ${project.id}`;
    }

    // 2. Email exact match.
    const email = clean(project.client_email);
    if (email) {
        const byEmail = await findCustomerByEmail(email);
        if (byEmail?.Id) {
            await stampQbCustomerId(project, byEmail.Id);
            await stampProjectQbId(project, byEmail);
            await logActivity(QB_LOG_ENTITY, byEmail.Id, 'resolved_by_email',
                `Matched existing QB Customer ${byEmail.DisplayName} via email`, actor,
                { projectId: project.id, email });
            await mirrorCustomerIntoCrm(byEmail);
            return { qbCustomerId: byEmail.Id, customer: byEmail };
        }
    }

    // 3. Name exact match.
    const displayName = deriveDisplayName(project);
    const byName = await findCustomerByName(displayName);
    if (byName?.Id) {
        await stampQbCustomerId(project, byName.Id);
        await stampProjectQbId(project, byName);
        await logActivity(QB_LOG_ENTITY, byName.Id, 'resolved_by_name',
            `Matched existing QB Customer ${byName.DisplayName} via DisplayName`, actor,
            { projectId: project.id, displayName });
        await mirrorCustomerIntoCrm(byName);
        return { qbCustomerId: byName.Id, customer: byName };
    }

    // 4. Create.
    const body = mapProjectToCustomer(project);
    const created = await qbCreate<CustomerEnvelope>('customer', body, {
        entityType: QB_LOG_ENTITY,
        entityId: project.id,
        action: 'create',
        actor,
    });
    const customer = created.Customer;
    if (!customer?.Id) throw new Error('QB returned a Customer without an Id');

    await stampQbCustomerId(project, customer.Id);
    await stampProjectQbId(project, customer);
    await logActivity(QB_LOG_ENTITY, customer.Id, 'created',
        `Created QB Customer ${customer.DisplayName}`, actor,
        { projectId: project.id });
    await mirrorCustomerIntoCrm(customer);

    return { qbCustomerId: customer.Id, customer };
}

/**
 * Mirror the resolved QB Customer into the CRM `customers` table so the
 * customer-level UI can find it. Failures are non-fatal — the project-level
 * resolve has already succeeded and we don't want to roll that back if the
 * mirror upsert hits a transient DB error.
 */
async function mirrorCustomerIntoCrm(customer: QbCustomer): Promise<void> {
    if (!customer?.Id) return;
    try {
        await upsertCustomerFromQb(customer, 'qb_import');
    } catch (e) {
        console.warn('[qb] mirror customer into CRM failed:', e);
    }
}

/**
 * Push the latest project data to QB. Sparse-updates an existing Customer
 * when the project already has qb_customer_id, otherwise creates one.
 */
export async function pushCustomerForProject(
    projectId: string,
    actor: string = 'admin',
): Promise<ResolveResult> {
    await initDB();
    await ensureConnected();

    const project = await loadProject(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const body = mapProjectToCustomer(project);

    if (project.qb_customer_id) {
        const existing = await readQbCustomer(project.qb_customer_id);
        if (existing?.Id) {
            const updated = await qbSparseUpdate<CustomerEnvelope>('customer', {
                ...body,
                Id: existing.Id,
                SyncToken: existing.SyncToken,
            }, {
                entityType: QB_LOG_ENTITY,
                entityId: project.id,
                qbEntityId: existing.Id,
                action: 'sparse_update',
                actor,
            });
            const customer = updated.Customer;
            if (!customer?.Id) throw new Error('QB sparse-update returned no Customer');
            await stampQbCustomerId(project, customer.Id);
            await stampProjectQbId(project, customer);
            await logActivity(QB_LOG_ENTITY, customer.Id, 'updated',
                `Pushed updated CRM data to QB Customer ${customer.DisplayName}`, actor,
                { projectId: project.id });
            return { qbCustomerId: customer.Id, customer };
        }
        // Stale id — clear and fall through to resolve+create.
        await sql`UPDATE projects SET qb_customer_id = NULL WHERE id = ${project.id}`;
    }

    return resolveOrCreateCustomerForProject(projectId, actor);
}

/**
 * Pull the latest QB Customer state into the CRM. Used by the webhook handler
 * when QB tells us a Customer changed. Updates only fields the CRM cares
 * about — does not overwrite project-side identity.
 */
export async function syncCustomerFromQb(qbCustomerId: string): Promise<QbCustomer | null> {
    await initDB();
    await ensureConnected();
    const customer = await readQbCustomer(qbCustomerId);
    if (!customer?.Id) return null;

    await sql`
        UPDATE projects
        SET qb_sync_token = ${customer.SyncToken ?? null},
            qb_synced_at = NOW(),
            updated_at = NOW()
        WHERE qb_customer_id = ${customer.Id}
    `;
    await logActivity(QB_LOG_ENTITY, customer.Id, 'pulled',
        `Pulled QB Customer ${customer.DisplayName} from QuickBooks`, 'webhook',
        { qbCustomerId: customer.Id });
    return customer;
}
