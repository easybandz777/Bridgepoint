# QuickBooks Online Integration

Operations and deployment guide for the Bridgepointe CRM ↔ QuickBooks Online
integration. Audience: the company owner running the system day-to-day, plus
the next engineer who has to debug or extend it.

This document is a runbook, not a tutorial. It assumes you already have a
deployed CRM and an Intuit Developer account.

---

## Overview

The CRM is the system of record for jobs, clients, subcontractors, estimates,
invoices, and bills. QuickBooks Online (QBO) is the system of record for
accounting and bookkeeping. The integration keeps a one-way push
(CRM → QB) for new records plus a webhook-driven pull
(QB → CRM) for state that changes inside QB (mostly: payments).

What gets synced:

- **Customers** — every CRM project's client becomes a QB Customer. Resolution
  is dedup-by-email, then dedup-by-DisplayName, then create.
- **Invoices** — CRM invoices push as QB Invoices. Payment state pulls back.
- **Estimates** — CRM estimates push as QB Estimates. Status pulls back.
- **Vendors** — CRM subcontractors push as QB Vendors (with `Vendor1099 = true`).
- **Bills** — CRM `project_bills` (subcontractor invoices to a project) push
  as QB Bills. Vendor must be synced first.
- **Payments** — read-only from QB. The CRM polls invoice balances to derive
  Paid / Partial / Outstanding status.

Three trigger paths:

1. **Manual** — admin clicks `<QbSyncButton>` on a record.
2. **Auto** — fire-and-forget hook in CRM mutation routes
   (e.g. when an invoice flips to `Sent`, the `auto-sync` library queues
   a push).
3. **Cron sweep** — `/api/quickbooks/auto-sync/run` walks every CRM record
   that *should* be in QB but isn't and pushes it.

Webhooks from Intuit are the safety net for changes made in QB (a payment
recorded in QB, an estimate accepted in QB, etc.). They are received,
verified, persisted to `qb_webhook_events`, and drained on a separate cron.

Every API call is recorded to `qb_sync_log` with status, duration, request
body, response body, and any error. That log is the audit trail and the
primary debugging surface.

---

## Multi-entity sync

The CRM is moving toward becoming the system of record for the entities
that QuickBooks has historically owned. Four are now first-class CRM
tables, populated by bulk import from QB and kept in sync via webhooks
plus per-entity push:

- **Customers** — `customers` table. CRM-side dedup, bidirectional sync.
  See [`CUSTOMERS.md`](./CUSTOMERS.md) for schema, ingest paths, and
  the backfill tool.
- **Vendors** — `vendors` table. Broader than `subcontractors` (anyone
  we pay), with optional linkage from a `subcontractors.vendor_id`.
- **Items** — `items` table. The chart of services and products used
  on invoice / estimate lines. Imported from QB; pushable back.
- **Accounts** — `accounts` table. The chart of accounts (income,
  expense, COGS, etc.). Imported from QB; read-only on the CRM side
  for now.

All four are pulled in bulk on first connection and kept fresh by the
QB webhook processor. The bulk import lives at
`/admin/integrations/quickbooks/import`. Every imported row stamps
`source = 'qb_import'`, every CRM-native row stamps `source = 'crm'`,
and rows created mid-flight by a resolve flow stamp
`source = 'auto_resolve'`.

Customers have a dedicated runbook because they are the system of
record after migration and have backfill considerations for existing
projects / invoices / estimates. Vendors / items / accounts follow the
same import + sync pattern but have no per-entity doc yet.

---

## Architecture diagram

```
                   ┌────────────────────────────────────┐
                   │      Intuit OAuth + QB Cloud       │
                   │  (sandbox or production realm)     │
                   └───────────┬────────────────────────┘
                               │
            OAuth /            │            REST API           Webhook POST
            consent            │            /v3/company/...    (HMAC signed)
                               │
                ┌──────────────┼─────────────────────────────────────────┐
                │              │                                         │
                │    ┌─────────▼──────────┐    ┌─────────────────────┐   │
                │    │ /api/quickbooks/   │    │  /api/quickbooks/   │   │
                │    │   connect          │    │    webhook          │   │
                │    │   callback         │    │  (verify, persist)  │   │
                │    │   refresh          │    │                     │   │
                │    │   disconnect       │    │ qb_webhook_events   │   │
                │    └─────────┬──────────┘    └──────────┬──────────┘   │
                │              │                          │              │
                │              │           Vercel Cron    │              │
                │              │           every 5 min    │              │
                │              │                          ▼              │
                │              │           ┌──────────────────────────┐  │
                │              │           │ /api/quickbooks/         │  │
                │              │           │   webhook/process        │  │
                │              │           │   (drain unprocessed)    │  │
                │              │           └──────────┬───────────────┘  │
                │              │                      │                  │
                │              ▼                      ▼                  │
                │  ┌──────────────────────────────────────────────────┐  │
                │  │  src/lib/quickbooks/  (push / pull libraries)    │  │
                │  │   customers · invoices · estimates · vendors ·   │  │
                │  │   bills · payments · refs · client · oauth       │  │
                │  └────────────────────────┬─────────────────────────┘  │
                │                           │                            │
                │  manual push              │     auto-sync trigger      │
                │  (button click)           │     (mutation route hook)  │
                │                           ▼                            │
                │  ┌──────────────────────────────────────────────────┐  │
                │  │             Postgres (Neon)                      │  │
                │  │   projects · invoices · estimates ·              │  │
                │  │   subcontractors · project_bills                 │  │
                │  │   qb_connections · qb_sync_log ·                 │  │
                │  │   qb_webhook_events · qb_oauth_states            │  │
                │  └──────────────────────────────────────────────────┘  │
                │                           ▲                            │
                │                           │                            │
                │    ┌──────────────────────┴───────────────────────┐    │
                │    │  Vercel Cron — /api/quickbooks/auto-sync/run │    │
                │    │  every 6h: push unsynced invoices /          │    │
                │    │  estimates / vendors / bills, sweep payments │    │
                │    └──────────────────────────────────────────────┘    │
                │                                                        │
                │       CRM (Next.js on Vercel + Postgres on Neon)       │
                └────────────────────────────────────────────────────────┘
```

---

## Required environment variables

Set these in Vercel project settings (Production + Preview where appropriate)
and in `.env.local` for development. None of them are exposed to the browser
unless prefixed `NEXT_PUBLIC_`.

| Variable                            | Required          | Description                                                                 | Example                                                  |
| ----------------------------------- | ----------------- | --------------------------------------------------------------------------- | -------------------------------------------------------- |
| `QUICKBOOKS_CLIENT_ID`              | yes               | OAuth client id from the Intuit Developer dashboard.                        | `ABh2x...`                                               |
| `QUICKBOOKS_CLIENT_SECRET`          | yes               | OAuth client secret from the Intuit Developer dashboard.                    | `AZSx...`                                                |
| `QUICKBOOKS_REDIRECT_URI`           | yes               | OAuth callback URL. Must match Intuit dashboard exactly (incl. protocol).   | `https://bridgepointepainting.com/api/quickbooks/callback` |
| `QUICKBOOKS_ENVIRONMENT`            | yes               | `sandbox` or `production`. Decides which Intuit API base URL is used.       | `sandbox`                                                |
| `QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN` | recommended       | HMAC verifier token from Intuit's Webhooks tab. Required in production.     | `e3ad...`                                                |
| `ADMIN_CRON_SECRET`                 | optional          | Shared secret. If set, `/auto-sync/run` requires `X-Admin-Key: <value>`.    | `32-char random string`                                  |
| `NEXT_PUBLIC_SITE_URL` *or* `SITE_URL` *or* `VERCEL_URL` | one of | Base URL used to build absolute redirect URLs from the OAuth callback. Vercel sets `VERCEL_URL` automatically. | `https://bridgepointepainting.com`                       |
| `DATABASE_URL`                      | yes               | Neon Postgres connection string. Already required by the rest of the CRM.   | `postgres://...`                                         |

Notes:

- In **development** with no `QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN` set, the
  webhook receiver accepts all requests so local testing isn't blocked.
  In **production** it refuses every webhook until the verifier is set.
- `QUICKBOOKS_REDIRECT_URI` is sent in the OAuth flow and must match the
  redirect URI configured in the Intuit dashboard *byte for byte*. Trailing
  slashes matter. `localhost` URIs need to be added to the **Development**
  tab on the Intuit side; production URIs need to be added to the
  **Production** tab.

---

## Initial setup runbook

Do these in order. Steps 1–9 work against sandbox. Steps 10–12 light up
webhooks once the URL is publicly reachable.

1. Add every required environment variable in **Vercel → Settings → Environment Variables**.
2. **Deploy** (or redeploy) so the new env vars are picked up.
3. As an admin, visit `/admin/integrations/quickbooks`.
4. Click **Connect to QuickBooks**.
5. On Intuit's hosted consent screen, pick the company and click **Connect**.
6. You'll be redirected back to `/admin/integrations/quickbooks?qb_connected=1`.
   Confirm the status card flipped to **Connected** with a company name.
7. Click **Resolve defaults** in the Defaults card. (Optional — the first sync
   will resolve them automatically. Doing it now surfaces "no Service item
   found" errors before you push real data.)
8. Pick any invoice with status `Sent` and click **Sync to QuickBooks** on its
   detail page.
9. Open QB Online → **Sales → Invoices** and verify the invoice is there with
   the correct customer, line items, and totals.
10. In Intuit Developer dashboard → **Webhooks**, set the Notification URL to
    `https://YOUR_DOMAIN/api/quickbooks/webhook` and select event types for
    Invoice, Customer, Estimate, Vendor, Bill, Payment.
11. Copy the verifier token Intuit shows you and set
    `QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN` in Vercel. Redeploy.
12. From QB, change the status of an invoice (or record a payment). Within
    ~5 minutes (next webhook-process cron run), the CRM should reflect the
    change. Confirm via `/admin/integrations/quickbooks/sync-log`.

---

## Vercel Cron setup

Create or edit `vercel.json` at the project root and include both crons:

```json
{
  "crons": [
    { "path": "/api/quickbooks/auto-sync/run", "schedule": "0 */6 * * *" },
    { "path": "/api/quickbooks/webhook/process", "schedule": "*/5 * * * *" }
  ]
}
```

What each one does:

- `/auto-sync/run` (every 6 hours, heavy) — walks invoices, estimates,
  vendors, bills, and runs the payment sweep. Anything that should be in QB
  but isn't gets pushed. Failures land in the response `errors[]` and the
  sync log; the next run retries.
- `/webhook/process` (every 5 minutes, light) — drains the
  `qb_webhook_events` queue. Each event triggers a re-pull of the affected
  entity (Invoice, Customer, etc.) and writes the new state into the CRM.
  Vercel kills fire-and-forget Promises after a request completes, which is
  why the webhook receiver only persists; this cron does the work.

If `ADMIN_CRON_SECRET` is set, the cron POST must include
`X-Admin-Key: <value>`. Vercel Cron supports custom headers; configure them
in the Vercel project settings.

---

## Daily operations

| What you want to do                       | Where / how                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| Check connection status                   | `/admin/integrations/quickbooks` — top status card.                                      |
| Inspect raw connection / stats            | `GET /api/quickbooks/status` (returns connection, lifetime sync stats, recent rows).     |
| See pending push counts                   | `GET /api/quickbooks/auto-sync/status` (returns counts of records that need pushing).    |
| Push a single invoice / estimate / sub    | Use the `<QbSyncButton>` on the record's detail page.                                    |
| Force a connection token refresh          | `POST /api/quickbooks/refresh` (also exposed by the admin **Test connection** button).   |
| See every sync attempt                    | `/admin/integrations/quickbooks/sync-log` — paginated, filterable.                       |
| Re-resolve default Item / Account refs    | Defaults card → **Resolve defaults**, or `POST /api/quickbooks/refs`.                    |
| Refresh a single invoice's paid status    | Invoice page → **Refresh from QB**, or `POST /api/quickbooks/invoices/:id/refresh-payment`. |
| Sweep all paid statuses now               | **Sweep payments** button, or `POST /api/quickbooks/payments/sync-all`.                  |
| Fire the full auto-sync sweep manually    | **Run auto-sync** button, or `POST /api/quickbooks/auto-sync/run`.                       |
| See queued webhook events                 | `GET /api/quickbooks/webhook/events` (last 100 envelopes, processed flag included).      |
| Disconnect QuickBooks                     | `/admin/integrations/quickbooks` → **Disconnect**, or `POST /api/quickbooks/disconnect`. |

There is no separate `/api/quickbooks/health` endpoint. `GET /api/quickbooks/status`
is the machine-readable health check; `GET /api/quickbooks/auto-sync/status`
returns pending-work counts that double as a freshness indicator.

---

## Routes inventory

All paths under `/api/quickbooks/` plus the `<thing>/sync-to-qb` shortcuts on
the main resource paths.

| Method | Path                                                  | Purpose                                                            | Auth        | Cron-friendly? |
| ------ | ----------------------------------------------------- | ------------------------------------------------------------------ | ----------- | -------------- |
| GET    | `/api/quickbooks/connect`                             | Redirect to Intuit OAuth consent screen.                           | Admin       | No             |
| GET    | `/api/quickbooks/callback`                            | OAuth callback. Exchanges code for tokens, saves connection.       | Public      | No             |
| GET    | `/api/quickbooks/status`                              | Connection state + lifetime sync stats + last 10 sync rows.        | Admin       | Yes (read)     |
| POST   | `/api/quickbooks/refresh`                             | Force refresh-token exchange. Used by admin **Test connection**.   | Admin       | Yes            |
| POST   | `/api/quickbooks/disconnect`                          | Revoke token at Intuit, mark connection disconnected.              | Admin       | No             |
| GET    | `/api/quickbooks/refs`                                | Return cached default Item / Expense / Income refs.                | Admin       | Yes (read)     |
| POST   | `/api/quickbooks/refs`                                | Force re-resolve and write defaults to connection metadata.        | Admin       | Yes            |
| GET    | `/api/quickbooks/sync-log`                            | Paginated sync log with filters (status / entityType / direction). | Admin       | Yes (read)     |
| GET    | `/api/quickbooks/auto-sync/status`                    | Counts of records that need to be pushed.                          | Admin       | Yes (read)     |
| POST   | `/api/quickbooks/auto-sync/run`                       | Sweep: push all pending invoices, estimates, vendors, bills.       | `ADMIN_CRON_SECRET` (optional) | **Yes**        |
| GET    | `/api/quickbooks/customers`                           | Paginated QB Customer list (`?q=`, `?startPosition=`).             | Admin       | Yes (read)     |
| GET    | `/api/quickbooks/customers/:qbId`                     | Read a single QB Customer.                                         | Admin       | Yes (read)     |
| POST   | `/api/quickbooks/customers/sync`                      | Resolve-or-create a QB Customer for a CRM project.                 | Admin       | Yes            |
| GET    | `/api/quickbooks/invoices`                            | Paginated QB Invoice list (passthrough).                           | Admin       | Yes (read)     |
| POST   | `/api/quickbooks/invoices/:id/sync`                   | Push CRM invoice to QB.                                            | Admin       | Yes            |
| POST   | `/api/quickbooks/invoices/:id/refresh`                | Pull invoice status from QB into CRM.                              | Admin       | Yes            |
| POST   | `/api/quickbooks/invoices/:id/refresh-payment`        | Pull invoice balance + recompute Paid/Partial/Outstanding.         | Admin       | Yes            |
| GET    | `/api/quickbooks/estimates`                           | Paginated QB Estimate list (passthrough).                          | Admin       | Yes (read)     |
| POST   | `/api/quickbooks/estimates/:id/sync`                  | Push CRM estimate to QB.                                           | Admin       | Yes            |
| GET    | `/api/quickbooks/vendors`                             | Paginated QB Vendor list (`?q=`).                                  | Admin       | Yes (read)     |
| POST   | `/api/quickbooks/vendors/:id/sync`                    | Push CRM subcontractor to QB as a Vendor.                          | Admin       | Yes            |
| POST   | `/api/quickbooks/bills/:id/sync`                      | Push CRM project_bill to QB as a Bill.                             | Admin       | Yes            |
| GET    | `/api/quickbooks/payments`                            | Recent QB Payments (read-only passthrough).                        | Admin       | Yes (read)     |
| POST   | `/api/quickbooks/payments/sync-all`                   | Sweep: refresh paid status on every synced, non-paid invoice.      | Admin       | Yes            |
| POST   | `/api/quickbooks/webhook`                             | Webhook receiver. Verifies HMAC, persists, returns 200.            | HMAC (Intuit) | Receiver only  |
| POST   | `/api/quickbooks/webhook/process`                     | Drain queued webhook events into CRM state.                        | Public (idempotent) | **Yes**        |
| GET    | `/api/quickbooks/webhook/events`                      | Last 100 webhook events with processed flag and any error.         | Admin       | Yes (read)     |
| POST   | `/api/projects/:id/sync-to-qb`                        | Convenience for project page: resolve-or-create QB Customer.       | Admin       | Yes            |
| POST   | `/api/invoices/:id/sync-to-qb`                        | Convenience for invoice page: push invoice (alias of `/quickbooks/invoices/:id/sync`). | Admin | Yes |
| POST   | `/api/estimates/:id/sync-to-qb`                       | Convenience for estimate page: push estimate.                      | Admin       | Yes            |
| POST   | `/api/subcontractors/:id/sync-to-qb`                  | Convenience for sub page: push vendor.                             | Admin       | Yes            |
| POST   | `/api/projects/:id/bills/:billId/sync-to-qb`          | Convenience for project bills UI: push bill.                       | Admin       | Yes            |

"Admin" auth in the table means the route lives behind the existing admin
session check on the page side. The internal QB routes themselves do not
re-check session; treat them as gated by network position (Vercel deployment
+ admin-only entrypoints in the UI). The one exception is `/auto-sync/run`,
which can be locked behind `ADMIN_CRON_SECRET` for cron safety.

---

## Sync semantics

For each entity, what fields map, what triggers a push, how dedup works,
and what can break.

### Customer (CRM project ↔ QB Customer)

- **Source row:** `projects` table.
- **Field map** (CRM → QB):

  | CRM column                                  | QB field                                |
  | ------------------------------------------- | --------------------------------------- |
  | `client_name` (or `client_email` local part, or `Project <number>`) | `DisplayName` |
  | `client_email`                              | `PrimaryEmailAddr.Address`              |
  | `client_phone`                              | `PrimaryPhone.FreeFormNumber`           |
  | `address` / `city` / `state` / `zip`        | `BillAddr` and `ShipAddr`               |
  | `client_name` split on whitespace           | `GivenName` / `FamilyName` (when 2+ tokens) |

- **Triggers:** manual via project page, manual via
  `POST /api/quickbooks/customers/sync`, auto via
  `autoSyncCustomerForProjectIfEnabled` from CRM mutation routes,
  cron via `/auto-sync/run` (only as a side-effect of invoice / estimate
  pushes that need a customer).
- **Dedup:**
  1. If `projects.qb_customer_id` is set and the QB row still exists,
     reuse it.
  2. Otherwise, search QB by `PrimaryEmailAddr` exact match.
  3. Otherwise, search QB by `DisplayName` exact match.
  4. Otherwise, create.
- **Failure modes:**
  - Stale `qb_customer_id` (customer deleted in QB) — automatically
    cleared and re-resolved.
  - DisplayName collision in QB but with a different email — currently
    the CRM will reuse by name. Edit the CRM client name to disambiguate
    if that's wrong.

### Invoice

- **Source row:** `invoices` table.
- **Field map** (CRM → QB):

  | CRM column                                  | QB field                                |
  | ------------------------------------------- | --------------------------------------- |
  | `qb_customer_id` (lookup if missing)        | `CustomerRef.value`                     |
  | `invoice_number`                            | `DocNumber`                             |
  | `issued_date`                               | `TxnDate`                               |
  | `due_date`                                  | `DueDate`                               |
  | `client.email`                              | `BillEmail`                             |
  | `notes`                                     | `PrivateNote` + `CustomerMemo.value`    |
  | `line_items[]`                              | `Line[]` with `SalesItemLineDetail`     |
  | resolved default Item ref                   | `Line[].SalesItemLineDetail.ItemRef`    |
  | `tax_amount` (when > 0)                     | `TxnTaxDetail.TotalTax`                 |

- **Triggers:** manual button, `<QbSyncButton entityType="invoice">`,
  `autoSyncInvoiceIfEnabled` from invoice mutation routes, cron via
  `/auto-sync/run` (status `Sent` AND `qb_id IS NULL`).
- **Dedup:** `invoices.qb_id` + `qb_sync_token`. Update on subsequent
  pushes; create on first push.
- **Failure modes:**
  - Customer not yet synced — error `"Customer not yet synced — sync project to QB first"` (HTTP 412). Sync the project first.
  - Default Item not resolved and no Service Item exists in QB — error from `/refs` resolver.
  - QB rejects update because `SyncToken` is stale — re-pull (refresh) the invoice and retry.

### Estimate

- **Source row:** `estimates` table.
- **Field map:** same shape as Invoice plus `ExpirationDate` from
  `valid_until` and `TxnStatus` derived from CRM `status`
  (`Accepted` → `Accepted`, `Declined` → `Rejected`, `Expired` → `Closed`).
- **Triggers:** manual, auto on status change to `Sent` / `Accepted`,
  cron via `/auto-sync/run`.
- **Dedup:** `estimates.qb_id` + `qb_sync_token`.
- **Failure modes:** same as Invoice (customer-not-yet-synced is the
  most common).

### Vendor (CRM subcontractor ↔ QB Vendor)

- **Source row:** `subcontractors` table.
- **Field map:**

  | CRM column                                  | QB field                                |
  | ------------------------------------------- | --------------------------------------- |
  | `company_name`                              | `DisplayName` and `CompanyName`         |
  | `contact_person` split on whitespace        | `GivenName` / `FamilyName`              |
  | `email`                                     | `PrimaryEmailAddr.Address`              |
  | `phone`                                     | `PrimaryPhone.FreeFormNumber`           |
  | `address` (free-form parsed)                | `BillAddr`                              |
  | `notes`                                     | `Notes`                                 |
  | `status` (Blacklisted/Inactive → false)     | `Active`                                |
  | always `true`                               | `Vendor1099`                            |

- **Triggers:** manual, auto on subcontractor create/update,
  cron via `/auto-sync/run` (subs referenced by any bill where the sub
  has `qb_id IS NULL`).
- **Dedup:**
  1. `subcontractors.qb_id` if set.
  2. Email exact match.
  3. DisplayName exact match.
  4. Create.
- **Failure modes:**
  - Stale `qb_id` (Vendor deleted in QB) — cleared and re-resolved.

### Bill (CRM project_bill ↔ QB Bill)

- **Source row:** `project_bills` table.
- **Field map:**

  | CRM column                                  | QB field                                |
  | ------------------------------------------- | --------------------------------------- |
  | linked `subcontractors.qb_id`               | `VendorRef.value`                       |
  | `bill_number`                               | `DocNumber`                             |
  | `received_date`                             | `TxnDate`                               |
  | `due_date`                                  | `DueDate`                               |
  | `description`                               | `PrivateNote`, line `Description`       |
  | `amount`                                    | single `Line.Amount`                    |
  | resolved default Expense Account            | `AccountBasedExpenseLineDetail.AccountRef` |

- **Triggers:** manual, auto on bill create/update, cron via
  `/auto-sync/run` (bills with `qb_id IS NULL` whose vendor has a `qb_id`).
- **Dedup:** `project_bills.qb_id` + `qb_sync_token`.
- **Failure modes:**
  - `Vendor not synced — sync subcontractor to QB first` (HTTP 412).
  - No Cost-of-Goods-Sold or Expense account in QB — sync fails until
    one exists.

### Payment

- **Direction:** **read-only from QB.** The CRM does not push payments.
- **Behavior:** for every CRM invoice with `qb_id IS NOT NULL` and status
  not `Paid` / `Cancelled` / `Voided`, re-read the QB Invoice's
  `TotalAmt` and `Balance`, and derive:
  - `Paid` when `Balance == 0` and `TotalAmt > 0`
  - `Partial` when `amountPaid > 0`
  - `Outstanding` otherwise
  When the status flips, also stamp `paid_date` (today if none).
- **Triggers:** manual via per-invoice **Refresh from QB**,
  manual via **Sweep payments** (`POST /api/quickbooks/payments/sync-all`),
  webhook (a Payment event linked to the invoice triggers a per-invoice
  pull), cron via `/auto-sync/run`'s payment sweep step.
- **Failure modes:** invoice's `qb_sync_token` drift triggers a 400 from
  QB on the next push. The next refresh-payment fixes it.

---

## Webhook handling

There are **two** routes:

### 1. Receiver — `POST /api/quickbooks/webhook`

What it does:

- Reads the raw body (signature is computed over the unmodified bytes).
- Verifies the `intuit-signature` header against an HMAC-SHA256 of the body
  using `QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN` as the key. Comparison is
  timing-safe.
- In production with no verifier token, **rejects every request** with 401.
  In dev with no verifier, accepts everything (so you can curl-test).
- Validates the envelope shape (`eventNotifications[]` is an array).
- For each entity inside, dedup-inserts a row into `qb_webhook_events`
  keyed by `(realm_id, entity_name, entity_id, last_updated)` so retries
  are idempotent.
- Returns `200 ok` immediately. **Does not** process events inline —
  Vercel kills any unawaited Promise once the response is sent.

### 2. Processor — `POST /api/quickbooks/webhook/process`

What it does:

- Pulls up to 200 unprocessed events (`processed_at IS NULL`) ordered by
  `received_at`.
- For each event, dispatches based on `entity_name`:

  | Entity     | Operation        | Effect                                                                |
  | ---------- | ---------------- | --------------------------------------------------------------------- |
  | `Invoice`  | Update / Create  | Re-pull QB invoice, recompute status from `Balance` vs `TotalAmt`, write back. |
  | `Invoice`  | Delete           | Clear `invoices.qb_id` for the matching CRM invoice; log.             |
  | `Customer` | Update / Create  | Log the upstream change. CRM identity is not overwritten.             |
  | `Customer` | Delete           | Log only.                                                             |
  | `Estimate` | Update / Create  | Re-pull, map `TxnStatus` to CRM status, update totals.                |
  | `Estimate` | Delete           | Clear `estimates.qb_id`.                                              |
  | `Vendor`   | Update / Create  | Refresh `qb_sync_token` on the matching subcontractor row.            |
  | `Vendor`   | Delete           | Clear `subcontractors.qb_id`.                                         |
  | `Bill`     | Update / Create  | Re-pull, derive Paid status from `Balance`, update `qb_sync_token`.   |
  | `Bill`     | Delete           | Clear `project_bills.qb_id`.                                          |
  | `Payment`  | Any              | Pull the QB Payment, list its `LinkedTxn[]` of type `Invoice`, and re-run the Invoice handler for each affected invoice. |

- Marks the event `processed_at = NOW()` on success, or stamps
  `processed_at` and `error` on failure (so a permanently broken event
  doesn't block the queue).
- Returns `{ ok: true, processed, errors }`.

Cron should drive the processor every 5 minutes. Failures are recorded but
do not block subsequent events.

---

## Common errors and recovery

| Error message                                                  | What it means                                                | How to fix                                                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `QuickBooks is not connected` (HTTP 412)                       | No active row in `qb_connections`.                           | `/admin/integrations/quickbooks` → **Connect to QuickBooks**.                                       |
| `Customer not yet synced — sync project to QB first` (HTTP 412) | An invoice or estimate references a CRM project whose `qb_customer_id` is not set yet. | Open the project page → **Sync to QuickBooks** → retry the invoice/estimate push. |
| `Vendor not synced — sync subcontractor to QB first` (HTTP 412) | A bill references a subcontractor with `qb_id IS NULL`.      | Open the subcontractor → **Sync to QuickBooks** → retry the bill push.                              |
| `QuickBooks refresh token expired — admin must reconnect`      | Refresh token aged past 100 days.                            | Click **Disconnect**, then **Connect to QuickBooks** to mint a new pair.                            |
| `No QuickBooks Items found — create a Service item ...`        | Defaults resolver couldn't find any active Item.             | In QB Online: **Sales → Products and services → New → Service**, save, then **Resolve defaults**.   |
| `No QuickBooks Expense accounts found ...`                     | Bills can't be pushed without an expense account.            | In QB: create a **Cost of Goods Sold** or **Expense** account, then **Resolve defaults**.           |
| `No QuickBooks Income accounts found ...`                      | Invoice / estimate pushes can't pick a default income ref.   | In QB: create an **Income** account, then **Resolve defaults**.                                     |
| `invalid signature` from `/api/quickbooks/webhook`             | HMAC verify failed (or no `intuit-signature` header).        | Confirm `QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN` matches the value Intuit shows in the Webhooks tab.     |
| `Token exchange failed (...)` during OAuth callback            | Intuit rejected the auth code (typically a redirect-URI mismatch). | Confirm `QUICKBOOKS_REDIRECT_URI` exactly matches the Intuit Developer dashboard.                   |
| Sync status row shows `error` in `qb_sync_log`                 | Most QB API failures land here.                              | Open the row in `/admin/integrations/quickbooks/sync-log` — the full QB error body is in `response`. |
| `unauthorized` from `/auto-sync/run`                           | `ADMIN_CRON_SECRET` is set but request is missing/wrong `X-Admin-Key`. | Update Vercel Cron header config to send the correct key.                                           |

For any other failure: open `/admin/integrations/quickbooks/sync-log`, find
the row, and read the `response` JSON. Intuit returns a structured Fault
object with a `Message` and `Detail` that usually pinpoints the issue.

---

## Production deployment checklist

After Intuit's app review approves your production keys:

- [ ] In Vercel, replace `QUICKBOOKS_CLIENT_ID` and `QUICKBOOKS_CLIENT_SECRET`
      with the values from the Intuit dashboard's **Production** tab.
- [ ] Set `QUICKBOOKS_ENVIRONMENT=production`.
- [ ] In the Intuit dashboard's **Production** → **Keys & OAuth**, set the
      redirect URI to `https://YOUR_DOMAIN/api/quickbooks/callback`.
- [ ] Update `QUICKBOOKS_REDIRECT_URI` env var to match exactly.
- [ ] In the Intuit dashboard's **Production** → **Webhooks**, set the
      notification URL to `https://YOUR_DOMAIN/api/quickbooks/webhook` and
      pick events for Invoice, Customer, Estimate, Vendor, Bill, Payment.
- [ ] Set `QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN` to the production verifier.
- [ ] Set `ADMIN_CRON_SECRET` to a random 32-char string and configure the
      Vercel Cron job for `/auto-sync/run` to send `X-Admin-Key`.
- [ ] Confirm `vercel.json` includes both crons and that they show up under
      **Vercel → Crons** after deploy.
- [ ] Redeploy and verify at `/admin/integrations/quickbooks` that the
      environment shows `production`.
- [ ] Connect to the production QB company. Push **one** test invoice and
      verify it lands in QB before bulk-syncing.
- [ ] Optionally run `POST /api/quickbooks/auto-sync/run` once to backfill
      every unsynced record.
- [ ] Trigger a state change inside QB and confirm it propagates back via
      webhook within 5 minutes.

---

## Limitations and future work

Be honest about what this integration does *not* do today:

- **Default Item ref:** all line items on every CRM invoice and estimate are
  pushed against a single resolved Item (preferring an Active Service item).
  If your QB workspace has multiple item types, the categorization in QB will
  need to be fixed per-line after push.
- **Default Expense Account:** every bill posts against a single resolved
  expense account (preferring Cost of Goods Sold). Trade- or phase-level
  expense routing is not implemented.
- **Tax handling:** only `TxnTaxDetail.TotalTax` is sent. Line-level tax
  codes, multi-jurisdiction tax, and per-customer tax exemptions are not
  mapped.
- **One-way line-item sync:** line items push CRM → QB. If you edit lines in
  QB, the CRM will not pick those changes up.
- **No payment writes:** the CRM never creates QB Payment objects. Recording
  payments happens in QB; the CRM polls / receives webhooks.
- **Single-realm:** only one active QB connection per CRM instance. Multi-
  workspace support would require schema changes.
- **No retry / DLQ for the webhook processor:** events that fail are stamped
  with `processed_at` + `error` so they don't block the queue, but they are
  not retried. Manually reset `processed_at = NULL` to retry.
- **Production-app review:** you cannot mint production tokens until Intuit
  approves the app. Until then, run against `sandbox`.
- **Auto-sync auth:** without `ADMIN_CRON_SECRET`, the `/auto-sync/run` route
  is reachable from anywhere on the public internet. Set the secret before
  going live.
- **Vercel function timeouts:** `/auto-sync/run` can be slow on large
  backlogs. If a single sweep approaches the function timeout, run it twice
  (Promise.allSettled means progress is preserved between runs) or increase
  the function `maxDuration`.