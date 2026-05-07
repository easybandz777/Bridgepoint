/**
 * QuickBooks Online Vendor sync.
 *
 * Vendors in QB ≈ Subcontractors in our CRM. DisplayName is the unique
 * identifier QB enforces, so when pushing a sub for the first time we:
 *   1. Reuse an existing Vendor that matches by email (exact).
 *   2. Reuse an existing Vendor that matches by DisplayName (exact).
 *   3. Otherwise create a new Vendor.
 *
 * On subsequent pushes we use the stored qb_id + qb_sync_token for a full
 * update.
 */

import sql, { initDB, logActivity } from '@/lib/db';
import { qbCreate, qbQuery, qbUpdate, QbApiError } from './client';
import { getActiveConnection } from './connection';
import {
    buildAddress,
    clean,
    emailField,
    parseFreeFormAddress,
    phoneField,
    trunc,
} from './mappers';
import type { QbVendor } from './types';

const QB_LOG_ENTITY = 'quickbooks_vendor';

export interface DbSubRow {
    id: string;
    company_name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string | null;
    status: string;
    notes: string | null;
    qb_id: string | null;
    qb_sync_token: string | null;
    qb_synced_at: string | null;
}

interface VendorEnvelope {
    Vendor: QbVendor;
}

interface VendorQueryResponse {
    QueryResponse: { Vendor?: QbVendor[] };
}

async function loadSub(subcontractorId: string): Promise<DbSubRow | null> {
    const rows = (await sql`
        SELECT id, company_name, contact_person, phone, email, address,
               status, notes, qb_id, qb_sync_token, qb_synced_at
        FROM subcontractors WHERE id = ${subcontractorId}
    `) as unknown as DbSubRow[];
    return rows[0] ?? null;
}

function escapeQbString(s: string): string {
    return s.replace(/'/g, "''");
}

export async function mapSubToVendor(sub: DbSubRow): Promise<QbVendor> {
    const company = trunc(clean(sub.company_name), 100);
    const contact = clean(sub.contact_person);
    const tokens = contact ? contact.split(/\s+/) : [];
    const givenName = tokens[0] || undefined;
    const familyName = tokens.slice(1).join(' ') || undefined;
    const billAddr = buildAddress(parseFreeFormAddress(sub.address));
    const notes = clean(sub.notes ?? '') || undefined;

    const out: QbVendor = {
        Id: sub.qb_id ?? undefined,
        SyncToken: sub.qb_sync_token ?? undefined,
        DisplayName: company,
        CompanyName: company,
        GivenName: givenName,
        FamilyName: familyName,
        PrimaryEmailAddr: emailField(sub.email),
        PrimaryPhone: phoneField(sub.phone),
        BillAddr: billAddr,
        Notes: notes,
        Active: sub.status !== 'Blacklisted' && sub.status !== 'Inactive',
        Vendor1099: true,
    };
    return out;
}

export async function findVendorByEmail(email: string): Promise<QbVendor | null> {
    const e = clean(email);
    if (!e || !e.includes('@')) return null;
    const r = await qbQuery<VendorQueryResponse>(
        `select * from Vendor where PrimaryEmailAddr = '${escapeQbString(e)}' maxresults 5`,
        { entityType: QB_LOG_ENTITY, action: 'search_by_email', direction: 'pull' },
    );
    const list = r.QueryResponse?.Vendor ?? [];
    const lower = e.toLowerCase();
    return list.find(v => clean(v.PrimaryEmailAddr?.Address).toLowerCase() === lower) ?? null;
}

export async function findVendorByName(displayName: string): Promise<QbVendor | null> {
    const n = clean(displayName);
    if (!n) return null;
    const r = await qbQuery<VendorQueryResponse>(
        `select * from Vendor where DisplayName = '${escapeQbString(n)}' maxresults 5`,
        { entityType: QB_LOG_ENTITY, action: 'search_by_name', direction: 'pull' },
    );
    const list = r.QueryResponse?.Vendor ?? [];
    const lower = n.toLowerCase();
    return list.find(v => clean(v.DisplayName).toLowerCase() === lower) ?? null;
}

async function ensureConnected(): Promise<void> {
    const conn = await getActiveConnection();
    if (!conn) throw new Error('QuickBooks is not connected');
}

async function stampSubQbId(subId: string, vendor: QbVendor): Promise<void> {
    if (!vendor.Id) return;
    await sql`
        UPDATE subcontractors
        SET qb_id = ${vendor.Id},
            qb_sync_token = ${vendor.SyncToken ?? null},
            qb_synced_at = NOW(),
            updated_at = NOW()
        WHERE id = ${subId}
    `;
}

export async function pushVendor(
    subcontractorId: string,
    actor: string = 'admin',
): Promise<{ qbId: string }> {
    await initDB();
    await ensureConnected();

    const sub = await loadSub(subcontractorId);
    if (!sub) throw new Error(`Subcontractor ${subcontractorId} not found`);

    const body = await mapSubToVendor(sub);

    if (sub.qb_id) {
        try {
            const updated = await qbUpdate<VendorEnvelope>('vendor', body, {
                entityType: QB_LOG_ENTITY,
                entityId: sub.id,
                qbEntityId: sub.qb_id,
                action: 'update',
                actor,
            });
            const vendor = updated.Vendor;
            if (!vendor?.Id) throw new Error('QB update returned no Vendor');
            await stampSubQbId(sub.id, vendor);
            await logActivity(QB_LOG_ENTITY, vendor.Id, 'updated',
                `Pushed updated CRM data to QB Vendor ${vendor.DisplayName}`, actor,
                { subcontractorId: sub.id });
            return { qbId: vendor.Id };
        } catch (e) {
            if (!(e instanceof QbApiError) || (e.status !== 404 && e.status !== 400)) throw e;
            await sql`UPDATE subcontractors SET qb_id = NULL, qb_sync_token = NULL WHERE id = ${sub.id}`;
        }
    }

    const displayName = trunc(clean(sub.company_name), 100);

    const email = clean(sub.email);
    if (email) {
        const byEmail = await findVendorByEmail(email);
        if (byEmail?.Id) {
            const remap: QbVendor = { ...body, Id: byEmail.Id, SyncToken: byEmail.SyncToken };
            const updated = await qbUpdate<VendorEnvelope>('vendor', remap, {
                entityType: QB_LOG_ENTITY,
                entityId: sub.id,
                qbEntityId: byEmail.Id,
                action: 'reuse_by_email',
                actor,
            });
            const vendor = updated.Vendor ?? byEmail;
            if (!vendor?.Id) throw new Error('QB reuse-by-email returned no Vendor');
            await stampSubQbId(sub.id, vendor);
            await logActivity(QB_LOG_ENTITY, vendor.Id, 'resolved_by_email',
                `Matched existing QB Vendor ${vendor.DisplayName} via email`, actor,
                { subcontractorId: sub.id, email });
            return { qbId: vendor.Id };
        }
    }

    const byName = await findVendorByName(displayName);
    if (byName?.Id) {
        const remap: QbVendor = { ...body, Id: byName.Id, SyncToken: byName.SyncToken };
        const updated = await qbUpdate<VendorEnvelope>('vendor', remap, {
            entityType: QB_LOG_ENTITY,
            entityId: sub.id,
            qbEntityId: byName.Id,
            action: 'reuse_by_name',
            actor,
        });
        const vendor = updated.Vendor ?? byName;
        if (!vendor?.Id) throw new Error('QB reuse-by-name returned no Vendor');
        await stampSubQbId(sub.id, vendor);
        await logActivity(QB_LOG_ENTITY, vendor.Id, 'resolved_by_name',
            `Matched existing QB Vendor ${vendor.DisplayName} via DisplayName`, actor,
            { subcontractorId: sub.id, displayName });
        return { qbId: vendor.Id };
    }

    const createBody: QbVendor = { ...body };
    delete createBody.Id;
    delete createBody.SyncToken;
    const created = await qbCreate<VendorEnvelope>('vendor', createBody, {
        entityType: QB_LOG_ENTITY,
        entityId: sub.id,
        action: 'create',
        actor,
    });
    const vendor = created.Vendor;
    if (!vendor?.Id) throw new Error('QB create returned no Vendor');
    await stampSubQbId(sub.id, vendor);
    await logActivity(QB_LOG_ENTITY, vendor.Id, 'created',
        `Created QB Vendor ${vendor.DisplayName}`, actor,
        { subcontractorId: sub.id });
    return { qbId: vendor.Id };
}
