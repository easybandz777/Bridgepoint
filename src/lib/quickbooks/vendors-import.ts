/**
 * Bulk-import QuickBooks Vendors into the CRM `vendors` table.
 *
 * Pulls every Vendor from QB (paginated, 1000/page) and upserts by `qb_id`.
 * Existing rows are updated in place. Missing rows are inserted with
 * `source = 'qb_import'`. On update, the `source` column is left untouched
 * so a manually-created CRM vendor that later got linked to QB keeps its
 * provenance.
 */

import sql, { initDB, genId, logActivity } from '@/lib/db';
import { qbQuery } from './client';
import { getActiveConnection } from './connection';
import { clean } from './mappers';
import type { QbAddress, QbVendor } from './types';
import type { CustomerAddress } from '@/lib/customers';
import type { VendorSource } from '@/lib/vendors';

const QB_LOG_ENTITY = 'quickbooks_vendor_import';
const PAGE_SIZE = 1000;

interface VendorQueryResponse {
    QueryResponse: { Vendor?: QbVendorExtended[] };
}

interface QbVendorExtended extends QbVendor {
    Balance?: number | string;
}

interface ExistingVendorRow {
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

function balanceOf(v: QbVendorExtended): number {
    const b = v.Balance;
    if (b == null) return 0;
    const n = typeof b === 'string' ? parseFloat(b) : b;
    return Number.isFinite(n) ? n : 0;
}

export async function upsertVendorFromQb(
    qbVendor: QbVendor,
    source: 'qb_import' | 'qb_webhook',
): Promise<{ id: string; created: boolean }> {
    await initDB();
    const v = qbVendor as QbVendorExtended;
    if (!v.Id) throw new Error('QB Vendor missing Id');

    const displayName = clean(v.DisplayName) || clean(v.CompanyName) || `Vendor ${v.Id}`;
    const companyName = clean(v.CompanyName) || null;
    const firstName = clean(v.GivenName) || null;
    const lastName = clean(v.FamilyName) || null;
    const email = clean(v.PrimaryEmailAddr?.Address) || null;
    const phone = clean(v.PrimaryPhone?.FreeFormNumber) || null;
    const billAddress = qbAddrToCrm(v.BillAddr);
    const notes = clean(v.Notes) || '';
    const active = v.Active !== false;
    const balance = balanceOf(v);
    const is1099 = Boolean(v.Vendor1099 ?? false);
    const taxIdentifier = clean(v.TaxIdentifier) || null;
    const accountNumber = clean(v.AcctNum) || null;
    const syncToken = v.SyncToken ?? null;

    const existing = (await sql`
        SELECT id, qb_sync_token FROM vendors WHERE qb_id = ${v.Id} LIMIT 1
    `) as unknown as ExistingVendorRow[];

    if (existing.length > 0) {
        const id = existing[0].id;
        await sql`
            UPDATE vendors SET
                display_name    = ${displayName},
                company_name    = ${companyName},
                first_name      = ${firstName},
                last_name       = ${lastName},
                email           = ${email},
                phone           = ${phone},
                bill_address    = ${JSON.stringify(billAddress)}::jsonb,
                notes           = ${notes},
                active          = ${active},
                balance         = ${balance},
                is_1099         = ${is1099},
                tax_identifier  = ${taxIdentifier},
                account_number  = ${accountNumber},
                qb_sync_token   = ${syncToken},
                qb_synced_at    = NOW(),
                updated_at      = NOW()
            WHERE id = ${id}
        `;
        return { id, created: false };
    }

    const id = genId('vend');
    const sourceValue: VendorSource = source;
    await sql`
        INSERT INTO vendors (
            id, display_name, company_name, first_name, last_name,
            email, phone, bill_address, notes,
            active, balance, is_1099, tax_identifier, account_number,
            source, qb_id, qb_sync_token, qb_synced_at
        ) VALUES (
            ${id},
            ${displayName},
            ${companyName},
            ${firstName},
            ${lastName},
            ${email},
            ${phone},
            ${JSON.stringify(billAddress)}::jsonb,
            ${notes},
            ${active},
            ${balance},
            ${is1099},
            ${taxIdentifier},
            ${accountNumber},
            ${sourceValue},
            ${v.Id},
            ${syncToken},
            NOW()
        )
    `;
    return { id, created: true };
}

export async function importAllVendorsFromQb(
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
        const query = `select * from Vendor startposition ${startPosition} maxresults ${PAGE_SIZE}`;
        const r = await qbQuery<VendorQueryResponse>(query, {
            entityType: QB_LOG_ENTITY,
            action: 'bulk_import_page',
            direction: 'pull',
            actor,
        });
        const list = r.QueryResponse?.Vendor ?? [];
        if (list.length === 0) break;

        for (const v of list) {
            try {
                const res = await upsertVendorFromQb(v, 'qb_import');
                if (res.created) imported++;
                else updated++;
            } catch (e) {
                failed++;
                await logActivity(
                    QB_LOG_ENTITY,
                    v.Id ?? 'unknown',
                    'import_failed',
                    `Failed to upsert QB Vendor ${v.DisplayName ?? ''}: ${String(e)}`,
                    actor,
                    { qbId: v.Id ?? null },
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
        `Bulk-imported QB Vendors: ${imported} new, ${updated} updated, ${failed} failed`,
        actor,
        { imported, updated, failed },
    );

    return { imported, updated, failed };
}
