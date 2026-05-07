/**
 * Push CRM Customer rows to QuickBooks Online.
 *
 * Creates a new QB Customer when the CRM row has no `qb_id`, otherwise issues
 * a full update against the stored Id + SyncToken. After a successful call we
 * stamp `qb_id`, `qb_sync_token`, and `qb_synced_at` on the CRM row so the
 * next push re-uses the same QB Customer.
 *
 * DisplayName is unique in QB. If QB returns a duplicate-name fault, we throw
 * an error containing "DisplayName already exists" so the API layer can surface
 * a useful message.
 */

import sql, { initDB, logActivity } from '@/lib/db';
import { qbCreate, qbUpdate, QbApiError } from './client';
import { getActiveConnection } from './connection';
import { buildAddress, clean, emailField, phoneField, trunc } from './mappers';
import { rowToCustomer, type Customer, type CustomerRow } from '@/lib/customers';
import type { QbAddress, QbCustomer } from './types';

const QB_LOG_ENTITY = 'quickbooks_customer';

interface CustomerEnvelope {
    Customer: QbCustomer;
}

function crmAddrToQb(a: Customer['billAddress']): QbAddress | undefined {
    return buildAddress({
        line1: a?.line1,
        line2: a?.line2,
        city: a?.city,
        state: a?.state,
        zip: a?.zip,
        country: a?.country,
    });
}

export function mapCustomerToQbBody(c: Customer): QbCustomer {
    const out: QbCustomer = {
        DisplayName: trunc(clean(c.displayName) || c.id, 100),
    };

    const company = clean(c.companyName ?? '');
    if (company) out.CompanyName = trunc(company, 100);
    const first = clean(c.firstName ?? '');
    if (first) out.GivenName = trunc(first, 25);
    const last = clean(c.lastName ?? '');
    if (last) out.FamilyName = trunc(last, 25);

    const email = emailField(c.email);
    if (email) out.PrimaryEmailAddr = email;
    const phone = phoneField(c.phone);
    if (phone) out.PrimaryPhone = phone;

    const bill = crmAddrToQb(c.billAddress);
    if (bill) out.BillAddr = bill;
    const ship = crmAddrToQb(c.shipAddress);
    if (ship) out.ShipAddr = ship;

    const notes = clean(c.notes ?? '');
    if (notes) out.Notes = trunc(notes, 2000);

    out.Active = Boolean(c.active);

    if (c.qbId) {
        out.Id = c.qbId;
        if (c.qbSyncToken != null) out.SyncToken = c.qbSyncToken;
    }

    return out;
}

async function ensureConnected(): Promise<void> {
    const conn = await getActiveConnection();
    if (!conn) throw new Error('QuickBooks is not connected');
}

async function loadCustomer(id: string): Promise<Customer | null> {
    const rows = (await sql`SELECT * FROM customers WHERE id = ${id}`) as unknown as CustomerRow[];
    return rows[0] ? rowToCustomer(rows[0]) : null;
}

function isDuplicateNameError(e: unknown): boolean {
    if (!(e instanceof QbApiError)) return false;
    const body = e.body as { Fault?: { Error?: { Message?: string; Detail?: string; code?: string }[] } } | null;
    const err = body?.Fault?.Error?.[0];
    const msg = `${err?.Message ?? ''} ${err?.Detail ?? ''}`.toLowerCase();
    return msg.includes('duplicate name') || msg.includes('another customer');
}

export async function pushCustomerToQb(
    customerId: string,
    actor: string = 'admin',
): Promise<{ qbId: string }> {
    await initDB();
    await ensureConnected();

    const c = await loadCustomer(customerId);
    if (!c) throw new Error(`Customer ${customerId} not found`);

    const body = mapCustomerToQbBody(c);
    const isUpdate = Boolean(c.qbId);

    let envelope: CustomerEnvelope;
    try {
        if (isUpdate) {
            envelope = await qbUpdate<CustomerEnvelope>('customer', body, {
                entityType: QB_LOG_ENTITY,
                entityId: customerId,
                qbEntityId: c.qbId,
                action: 'update',
                actor,
            });
        } else {
            envelope = await qbCreate<CustomerEnvelope>('customer', body, {
                entityType: QB_LOG_ENTITY,
                entityId: customerId,
                action: 'create',
                actor,
            });
        }
    } catch (e) {
        if (isDuplicateNameError(e)) {
            throw new Error(
                `QuickBooks rejected DisplayName "${body.DisplayName}" — another QB Customer already uses this name. Rename the CRM customer or import the existing QB record first.`,
            );
        }
        throw e;
    }

    const out = envelope.Customer;
    if (!out?.Id) throw new Error('QuickBooks returned a Customer without an Id');

    await sql`
        UPDATE customers SET
            qb_id         = ${out.Id},
            qb_sync_token = ${out.SyncToken ?? null},
            qb_synced_at  = NOW(),
            updated_at    = NOW()
        WHERE id = ${customerId}
    `;

    await logActivity(
        QB_LOG_ENTITY,
        customerId,
        'pushed',
        `Pushed CRM customer ${c.displayName} to QuickBooks (${isUpdate ? 'update' : 'create'})`,
        actor,
        { qbId: out.Id, mode: isUpdate ? 'update' : 'create' },
    );

    return { qbId: out.Id };
}
