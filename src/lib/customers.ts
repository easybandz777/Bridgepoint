/**
 * Customer entity — CRM-side mirror of QuickBooks Customer, evolving into
 * the system of record as the business migrates off QB.
 *
 * Schema lives in db.ts. This file holds the TypeScript shape, row mappers,
 * and small helpers used by API routes + sync code.
 */

export type CustomerType = 'Individual' | 'Company';
export type CustomerSource = 'crm' | 'qb_import' | 'qb_webhook';

export interface CustomerAddress {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
}

export interface Customer {
    id: string;
    displayName: string;
    customerType: CustomerType;
    companyName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    fax: string | null;
    website: string | null;
    billAddress: CustomerAddress;
    shipAddress: CustomerAddress;
    notes: string;
    tags: string[];
    active: boolean;
    balance: number;
    paymentMethod: string | null;
    paymentTerms: string | null;
    preferredDeliveryMethod: string | null;
    taxExempt: boolean;
    parentCustomerId: string | null;
    isJob: boolean;
    source: CustomerSource;
    qbId: string | null;
    qbSyncToken: string | null;
    qbSyncedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CustomerRow {
    id: string;
    display_name: string;
    customer_type: string;
    company_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    fax: string | null;
    website: string | null;
    bill_address: unknown;
    ship_address: unknown;
    notes: string;
    tags: unknown;
    active: boolean;
    balance: string | number;
    payment_method: string | null;
    payment_terms: string | null;
    preferred_delivery_method: string | null;
    tax_exempt: boolean;
    parent_customer_id: string | null;
    is_job: boolean;
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

export function rowToCustomer(r: CustomerRow): Customer {
    return {
        id: r.id,
        displayName: r.display_name,
        customerType: (r.customer_type as CustomerType) ?? 'Individual',
        companyName: r.company_name,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        phone: r.phone,
        mobile: r.mobile,
        fax: r.fax,
        website: r.website,
        billAddress: asAddress(r.bill_address),
        shipAddress: asAddress(r.ship_address),
        notes: r.notes ?? '',
        tags: asTags(r.tags),
        active: Boolean(r.active),
        balance: Number(r.balance ?? 0),
        paymentMethod: r.payment_method,
        paymentTerms: r.payment_terms,
        preferredDeliveryMethod: r.preferred_delivery_method,
        taxExempt: Boolean(r.tax_exempt),
        parentCustomerId: r.parent_customer_id,
        isJob: Boolean(r.is_job),
        source: (r.source as CustomerSource) ?? 'crm',
        qbId: r.qb_id,
        qbSyncToken: r.qb_sync_token,
        qbSyncedAt: r.qb_synced_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}

export function deriveDisplayName(input: {
    displayName?: string | null;
    companyName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
}): string {
    const dn = (input.displayName ?? '').trim();
    if (dn) return dn;
    const cn = (input.companyName ?? '').trim();
    if (cn) return cn;
    const fn = (input.firstName ?? '').trim();
    const ln = (input.lastName ?? '').trim();
    if (fn || ln) return `${fn} ${ln}`.trim();
    const em = (input.email ?? '').trim();
    if (em) return em.split('@')[0] || 'Customer';
    return 'Customer';
}

export function fmtCustomerLine(c: Pick<Customer, 'displayName' | 'email' | 'phone'>): string {
    const parts = [c.displayName];
    if (c.email) parts.push(c.email);
    if (c.phone) parts.push(c.phone);
    return parts.join(' · ');
}
