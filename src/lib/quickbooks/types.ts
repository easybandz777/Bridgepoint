/**
 * Type contracts for the Bridgepointe ↔ QuickBooks Online integration.
 *
 * The QB Online REST API (v3) returns deeply nested JSON. We define narrow
 * types only for the fields we read or write — anything else is `unknown`.
 *
 * Reference: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities
 */

export type QbEnvironment = 'sandbox' | 'production';

export interface QbConnectionRow {
    id: string;
    realm_id: string;
    company_name: string | null;
    access_token: string;
    refresh_token: string;
    token_type: string;
    access_expires_at: string;
    refresh_expires_at: string;
    environment: QbEnvironment;
    scopes: string;
    status: 'active' | 'disconnected' | 'expired' | 'error';
    connected_by: string | null;
    connected_at: string;
    last_refreshed_at: string | null;
    disconnected_at: string | null;
    metadata: Record<string, unknown>;
}

export interface QbActiveConnection {
    id: string;
    realmId: string;
    companyName: string | null;
    environment: QbEnvironment;
    accessToken: string;
    refreshToken: string;
    accessExpiresAt: Date;
    refreshExpiresAt: Date;
}

export interface QbTokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;            // seconds
    x_refresh_token_expires_in: number;
    scope?: string;
}

export interface QbCompanyInfo {
    Id: string;
    CompanyName: string;
    LegalName?: string;
    Country?: string;
    Email?: { Address?: string };
    PrimaryPhone?: { FreeFormNumber?: string };
    SyncToken?: string;
}

// ─── Customer ───────────────────────────────────────────────────────────────

export interface QbCustomer {
    Id?: string;
    SyncToken?: string;
    DisplayName: string;
    CompanyName?: string;
    GivenName?: string;
    FamilyName?: string;
    PrimaryEmailAddr?: { Address: string };
    PrimaryPhone?: { FreeFormNumber: string };
    BillAddr?: QbAddress;
    ShipAddr?: QbAddress;
    Notes?: string;
    Active?: boolean;
}

// ─── Vendor (a subcontractor in QB land) ────────────────────────────────────

export interface QbVendor {
    Id?: string;
    SyncToken?: string;
    DisplayName: string;
    CompanyName?: string;
    GivenName?: string;
    FamilyName?: string;
    PrimaryEmailAddr?: { Address: string };
    PrimaryPhone?: { FreeFormNumber: string };
    BillAddr?: QbAddress;
    Notes?: string;
    Active?: boolean;
    Vendor1099?: boolean;
    TaxIdentifier?: string;
    AcctNum?: string;
}

// ─── Item (line-item products/services) ─────────────────────────────────────

export interface QbItem {
    Id?: string;
    SyncToken?: string;
    Name: string;
    Description?: string;
    Type: 'Service' | 'Inventory' | 'NonInventory';
    IncomeAccountRef?: QbRef;
    ExpenseAccountRef?: QbRef;
    UnitPrice?: number;
    Active?: boolean;
}

// ─── Invoice ────────────────────────────────────────────────────────────────

export interface QbInvoiceLine {
    Id?: string;
    LineNum?: number;
    Description?: string;
    Amount: number;
    DetailType: 'SalesItemLineDetail' | 'SubTotalLineDetail' | 'DescriptionOnly' | 'DiscountLineDetail';
    SalesItemLineDetail?: {
        ItemRef: QbRef;
        Qty?: number;
        UnitPrice?: number;
        TaxCodeRef?: QbRef;
    };
    SubTotalLineDetail?: Record<string, unknown>;
    DescriptionLineDetail?: { ServiceDate?: string };
    DiscountLineDetail?: {
        PercentBased: boolean;
        DiscountPercent?: number;
        DiscountAccountRef?: QbRef;
    };
}

export interface QbInvoice {
    Id?: string;
    SyncToken?: string;
    DocNumber?: string;
    TxnDate?: string;          // YYYY-MM-DD
    DueDate?: string;
    CustomerRef: QbRef;
    BillEmail?: { Address: string };
    Line: QbInvoiceLine[];
    PrivateNote?: string;
    CustomerMemo?: { value: string };
    EmailStatus?: 'NeedToSend' | 'NotSet' | 'EmailSent';
    TotalAmt?: number;
    Balance?: number;
    TxnTaxDetail?: {
        TotalTax?: number;
        TaxLine?: unknown[];
    };
}

// ─── Estimate ───────────────────────────────────────────────────────────────

export interface QbEstimate {
    Id?: string;
    SyncToken?: string;
    DocNumber?: string;
    TxnDate?: string;
    ExpirationDate?: string;
    CustomerRef: QbRef;
    Line: QbInvoiceLine[];     // same line shape as invoice
    PrivateNote?: string;
    CustomerMemo?: { value: string };
    TotalAmt?: number;
    TxnStatus?: 'Pending' | 'Accepted' | 'Closed' | 'Rejected';
    TxnTaxDetail?: {
        TotalTax?: number;
        TaxLine?: unknown[];
    };
}

// ─── Bill (vendor bills — subcontractor invoices to us) ────────────────────

export interface QbBillLine {
    Id?: string;
    Description?: string;
    Amount: number;
    DetailType: 'AccountBasedExpenseLineDetail' | 'ItemBasedExpenseLineDetail';
    AccountBasedExpenseLineDetail?: {
        AccountRef: QbRef;
        BillableStatus?: 'NotBillable' | 'Billable' | 'HasBeenBilled';
        CustomerRef?: QbRef;
    };
    ItemBasedExpenseLineDetail?: {
        ItemRef: QbRef;
        Qty?: number;
        UnitPrice?: number;
    };
}

export interface QbBill {
    Id?: string;
    SyncToken?: string;
    DocNumber?: string;
    TxnDate?: string;
    DueDate?: string;
    VendorRef: QbRef;
    Line: QbBillLine[];
    PrivateNote?: string;
    TotalAmt?: number;
    Balance?: number;
}

// ─── Payment (customer paying us) ───────────────────────────────────────────

export interface QbPayment {
    Id?: string;
    SyncToken?: string;
    TxnDate?: string;
    CustomerRef: QbRef;
    TotalAmt: number;
    Line?: {
        Amount: number;
        LinkedTxn?: { TxnId: string; TxnType: 'Invoice' }[];
    }[];
    PrivateNote?: string;
}

// ─── Address + ref shapes ──────────────────────────────────────────────────

export interface QbAddress {
    Line1?: string;
    Line2?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
    Country?: string;
}

export interface QbRef {
    value: string;
    name?: string;
}

// ─── Webhook payload ────────────────────────────────────────────────────────

export interface QbWebhookEnvelope {
    eventNotifications: Array<{
        realmId: string;
        dataChangeEvent: {
            entities: Array<{
                name: string;
                id: string;
                operation: 'Create' | 'Update' | 'Delete' | 'Merge' | 'Void' | 'Emailed';
                lastUpdated: string;
                deletedId?: string;
            }>;
        };
    }>;
}

// ─── Sync log row shape ─────────────────────────────────────────────────────

export type SyncDirection = 'push' | 'pull' | 'auth';
export type SyncStatus = 'success' | 'error' | 'skipped' | 'queued';

export interface QbSyncLogRow {
    id: string;
    connection_id: string | null;
    entity_type: string;
    entity_id: string | null;
    qb_entity_id: string | null;
    direction: SyncDirection;
    action: string;
    status: SyncStatus;
    error: string | null;
    request: unknown;
    response: unknown;
    duration_ms: number | null;
    actor: string;
    created_at: string;
}
