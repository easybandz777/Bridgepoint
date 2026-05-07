/**
 * Vendor entity — CRM-side mirror of QuickBooks Vendor.
 *
 * Distinct from `subcontractors` (which carry trade/compliance fields and
 * crew-portal access). A subcontractor optionally links to a vendor row
 * via `subcontractors.vendor_id`.
 */

import type { CustomerAddress } from './customers';

export type VendorSource = 'crm' | 'qb_import' | 'qb_webhook';

export interface Vendor {
    id: string;
    displayName: string;
    companyName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    billAddress: CustomerAddress;
    notes: string;
    tags: string[];
    active: boolean;
    balance: number;
    is1099: boolean;
    taxIdentifier: string | null;
    accountNumber: string | null;
    subcontractorId: string | null;
    source: VendorSource;
    qbId: string | null;
    qbSyncToken: string | null;
    qbSyncedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface VendorRow {
    id: string;
    display_name: string;
    company_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    bill_address: unknown;
    notes: string;
    tags: unknown;
    active: boolean;
    balance: string | number;
    is_1099: boolean;
    tax_identifier: string | null;
    account_number: string | null;
    subcontractor_id: string | null;
    source: string;
    qb_id: string | null;
    qb_sync_token: string | null;
    qb_synced_at: string | null;
    created_at: string;
    updated_at: string;
}

function asAddress(v: unknown): CustomerAddress {
    if (!v || typeof v !== 'object') return {};
    return v as CustomerAddress;
}

function asTags(v: unknown): string[] {
    return Array.isArray(v) ? (v as string[]) : [];
}

export function rowToVendor(r: VendorRow): Vendor {
    return {
        id: r.id,
        displayName: r.display_name,
        companyName: r.company_name,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        phone: r.phone,
        mobile: r.mobile,
        billAddress: asAddress(r.bill_address),
        notes: r.notes ?? '',
        tags: asTags(r.tags),
        active: Boolean(r.active),
        balance: Number(r.balance ?? 0),
        is1099: Boolean(r.is_1099),
        taxIdentifier: r.tax_identifier,
        accountNumber: r.account_number,
        subcontractorId: r.subcontractor_id,
        source: (r.source as VendorSource) ?? 'qb_import',
        qbId: r.qb_id,
        qbSyncToken: r.qb_sync_token,
        qbSyncedAt: r.qb_synced_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}
