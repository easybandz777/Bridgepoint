/**
 * Bulk-import QuickBooks Customers into the CRM `customers` table.
 *
 * Pulls every Customer from QB (paginated, 1000/page) and upserts by `qb_id`.
 * Existing rows are updated in place — display_name, email, phone, addresses,
 * balance, and sync metadata are refreshed. Missing rows are inserted with
 * `source = 'qb_import'`.
 */

import sql, { initDB, genId, logActivity } from '@/lib/db';
import { qbQuery } from './client';
import { getActiveConnection } from './connection';
import { clean } from './mappers';
import type { QbAddress, QbCustomer } from './types';
import type { CustomerAddress, CustomerSource } from '@/lib/customers';

const QB_LOG_ENTITY = 'quickbooks_customer';
const PAGE_SIZE = 1000;

interface CustomerQueryResponse {
    QueryResponse: { Customer?: QbCustomerExtended[] };
}

/**
 * Extends the canonical QbCustomer with response-only fields the brief asks
 * us to mirror into the CRM. The narrow shared type in `./types` covers only
 * the fields we write back to QB; on reads we get more.
 */
interface QbCustomerExtended extends QbCustomer {
    Balance?: number | string;
    Job?: boolean;
}

interface ExistingCustomerRow {
    id: string;
    qb_sync_token: string | null;
}

function qbAddrToCrm(a: QbAddress | undefined): CustomerAddress {
    if (!a) return {};
    const out: CustomerAddress = {};
    const line1 = clean(a.Line1);
    const line2 = clean(a.Line2);
    const city = clean(a.City);
    const state = clean(a.CountrySubDivisionCode);
    const zip = clean(a.PostalCode);
    const country = clean(a.Country);
    if (line1) out.line1 = line1;
    if (line2) out.line2 = line2;
    if (city) out.city = city;
    if (state) out.state = state;
    if (zip) out.zip = zip;
    if (country) out.country = country;
    return out;
}

function balanceOf(c: QbCustomerExtended): number {
    const v = c.Balance;
    if (v == null) return 0;
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return Number.isFinite(n) ? n : 0;
}

export async function upsertCustomerFromQb(
    qbCustomer: QbCustomer,
    source: 'qb_import' | 'qb_webhook',
): Promise<{ id: string; created: boolean }> {
    await initDB();
    const c = qbCustomer as QbCustomerExtended;
    if (!c.Id) throw new Error('QB Customer missing Id');

    const displayName = clean(c.DisplayName) || clean(c.CompanyName) || `Customer ${c.Id}`;
    const companyName = clean(c.CompanyName) || null;
    const firstName = clean(c.GivenName) || null;
    const lastName = clean(c.FamilyName) || null;
    const email = clean(c.PrimaryEmailAddr?.Address) || null;
    const phone = clean(c.PrimaryPhone?.FreeFormNumber) || null;
    const billAddress = qbAddrToCrm(c.BillAddr);
    const shipAddress = qbAddrToCrm(c.ShipAddr);
    const notes = clean(c.Notes) || '';
    const active = c.Active !== false;
    const balance = balanceOf(c);
    const customerType = companyName ? 'Company' : 'Individual';
    const isJob = Boolean(c.Job ?? false);
    const syncToken = c.SyncToken ?? null;

    const existing = (await sql`
        SELECT id, qb_sync_token FROM customers WHERE qb_id = ${c.Id} LIMIT 1
    `) as unknown as ExistingCustomerRow[];

    if (existing.length > 0) {
        const id = existing[0].id;
        await sql`
            UPDATE customers SET
                display_name   = ${displayName},
                customer_type  = ${customerType},
                company_name   = ${companyName},
                first_name     = ${firstName},
                last_name      = ${lastName},
                email          = ${email},
                phone          = ${phone},
                bill_address   = ${JSON.stringify(billAddress)}::jsonb,
                ship_address   = ${JSON.stringify(shipAddress)}::jsonb,
                notes          = ${notes},
                active         = ${active},
                balance        = ${balance},
                is_job         = ${isJob},
                qb_sync_token  = ${syncToken},
                qb_synced_at   = NOW(),
                updated_at     = NOW()
            WHERE id = ${id}
        `;
        return { id, created: false };
    }

    const id = genId('cust');
    const sourceValue: CustomerSource = source;
    await sql`
        INSERT INTO customers (
            id, display_name, customer_type, company_name, first_name, last_name,
            email, phone, bill_address, ship_address, notes,
            active, balance, is_job, source,
            qb_id, qb_sync_token, qb_synced_at
        ) VALUES (
            ${id},
            ${displayName},
            ${customerType},
            ${companyName},
            ${firstName},
            ${lastName},
            ${email},
            ${phone},
            ${JSON.stringify(billAddress)}::jsonb,
            ${JSON.stringify(shipAddress)}::jsonb,
            ${notes},
            ${active},
            ${balance},
            ${isJob},
            ${sourceValue},
            ${c.Id},
            ${syncToken},
            NOW()
        )
    `;
    return { id, created: true };
}

export async function importAllCustomersFromQb(
    opts?: { actor?: string },
): Promise<{ imported: number; updated: number; failed: number }> {
    await initDB();
    const conn = await getActiveConnection();
    if (!conn) throw new Error('QuickBooks is not connected');

    const actor = opts?.actor ?? 'admin';
    let imported = 0;
    let updated = 0;
    let failed = 0;
    let startPosition = 1;

    while (true) {
        const query = `select * from Customer startposition ${startPosition} maxresults ${PAGE_SIZE}`;
        const r = await qbQuery<CustomerQueryResponse>(query, {
            entityType: QB_LOG_ENTITY,
            action: 'bulk_import_page',
            direction: 'pull',
            actor,
        });
        const list = r.QueryResponse?.Customer ?? [];
        if (list.length === 0) break;

        for (const c of list) {
            try {
                const res = await upsertCustomerFromQb(c, 'qb_import');
                if (res.created) imported++;
                else updated++;
            } catch (e) {
                failed++;
                await logActivity(
                    QB_LOG_ENTITY,
                    c.Id ?? 'unknown',
                    'import_failed',
                    `Failed to upsert QB Customer ${c.DisplayName ?? ''}: ${String(e)}`,
                    actor,
                    { qbId: c.Id ?? null },
                );
            }
        }

        if (list.length < PAGE_SIZE) break;
        startPosition += list.length;
    }

    await logActivity(
        QB_LOG_ENTITY,
        'bulk',
        'import_completed',
        `Bulk-imported QB Customers: ${imported} new, ${updated} updated, ${failed} failed`,
        actor,
        { imported, updated, failed },
    );

    return { imported, updated, failed };
}
