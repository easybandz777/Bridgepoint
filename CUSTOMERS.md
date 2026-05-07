# Customer Database

Operations and architecture guide for the Bridgepointe CRM `customers`
entity. Audience: the company owner running the system day-to-day, and
the next engineer who has to extend it.

This document is a runbook, not a tutorial. It assumes the QuickBooks
Online integration is already configured per
[`QUICKBOOKS.md`](./QUICKBOOKS.md).

---

## Why it exists

For most of the CRM's life, "customer" was a free-form bag of strings
sprinkled across `projects`, `invoices`, and `estimates` — a `client`
JSONB column here, a `client_name` and `client_email` pair there, and
absolutely no canonical row tying them together. That was fine when
QuickBooks Online was the system of record for accounting and the CRM
only had to push project data into it.

The mid-term plan is the opposite: the CRM becomes the system of
record (QuickBooks gets demoted to a destination, and eventually
replaced entirely once the payments foundation lands — see
[`PAYMENTS.md`](./PAYMENTS.md)). To get there, the customer needs to
be a real first-class entity:

- One row per customer in a dedicated `customers` table
- Stable id used everywhere a project / invoice / estimate would
  otherwise have copied a name and email
- Dedup logic so we don't end up with three "Jane Smith" rows that
  point at the same human
- Bidirectional sync with QB so the books stay coherent during the
  transition

The migration is additive: existing `projects.client_name`,
`projects.client_email`, and the `client` / `project` JSONB blobs on
invoices and estimates still work. New rows can link to a `customer_id`
*and* keep a denormalized name/email copy for backwards compatibility.

---

## Schema map

The `customers` table is defined in [`src/lib/db.ts`](./src/lib/db.ts)
inside `initDB()`. Every column:

| Column                       | Type           | Description                                                                                  |
| ---------------------------- | -------------- | -------------------------------------------------------------------------------------------- |
| `id`                         | `TEXT` PK      | CRM-internal id (`cust-<timestamp>-<rand>` from `genId('cust')`).                             |
| `display_name`               | `TEXT`         | Required. Matches QB `DisplayName`. Must be unique on the QB side.                           |
| `customer_type`              | `TEXT`         | `Individual` or `Business`. Drives whether `company_name` or `first_name`/`last_name` is primary. |
| `company_name`               | `TEXT`         | Used for `customer_type='Business'`.                                                         |
| `first_name` / `last_name`   | `TEXT`         | Used for `customer_type='Individual'` and to populate QB `GivenName` / `FamilyName`.         |
| `email`                      | `TEXT`         | Primary email. Indexed lower-cased for case-insensitive dedup.                               |
| `phone` / `mobile` / `fax`   | `TEXT`         | Free-form contact numbers.                                                                   |
| `website`                    | `TEXT`         | Optional homepage.                                                                           |
| `bill_address`               | `JSONB`        | `{line1, line2, city, state, zip, country}`. Maps to QB `BillAddr`.                          |
| `ship_address`               | `JSONB`        | Same shape. Maps to QB `ShipAddr`.                                                           |
| `notes`                      | `TEXT`         | Internal-only freeform text.                                                                 |
| `tags`                       | `JSONB` array  | Array of strings for filtering / segmentation.                                               |
| `active`                     | `BOOLEAN`      | Soft-delete flag. `false` hides from pickers but preserves history.                          |
| `balance`                    | `NUMERIC`      | Outstanding receivable. Mirrored from QB; recalculated locally as payments land.              |
| `payment_method`             | `TEXT`         | Default method (Card / ACH / Check).                                                         |
| `payment_terms`              | `TEXT`         | Default terms (Net 30, Due on receipt, etc.).                                                |
| `preferred_delivery_method`  | `TEXT`         | Email / Print / None.                                                                        |
| `tax_exempt`                 | `BOOLEAN`      | Marks the customer as exempt from sales tax.                                                 |
| `parent_customer_id`         | `TEXT`         | Self-FK. Supports parent/child (job-of-customer) hierarchy mirroring QB.                     |
| `is_job`                     | `BOOLEAN`      | True when this row is a "job" under a parent customer (QB jobs/sub-customers).               |
| `source`                     | `TEXT`         | `crm` / `qb_import` / `auto_resolve`. Useful for filtering in admin.                         |
| `qb_id`                      | `TEXT`         | QuickBooks Customer id once synced.                                                          |
| `qb_sync_token`              | `TEXT`         | QB optimistic-concurrency token. Required on update pushes.                                  |
| `qb_synced_at`               | `TIMESTAMPTZ`  | Last successful sync timestamp.                                                              |
| `created_at` / `updated_at`  | `TIMESTAMPTZ`  | Standard audit columns. Default `NOW()`.                                                     |

Indexes:

- `idx_customers_qb_id` on `(qb_id)` — fast lookup during webhook handling.
- `idx_customers_email` on `(LOWER(email))` — case-insensitive email dedup.
- `idx_customers_display` on `(display_name)` — DisplayName dedup.
- `idx_customers_active` on `(active)` — keeps active-only listings cheap.

Linkage on existing entities (additive, nullable):

- `projects.customer_id`
- `invoices.customer_id`
- `estimates.customer_id`

These are added by `initDB()` and indexed individually. Existing rows
have them as `NULL`; the backfill described below populates them.

---

## Where customers come from

There are three ingest paths, and every row records which one created
it via the `source` column:

- **CRM-native** (`source = 'crm'`) — admin clicks **New Customer** at
  `/admin/customers/new` and fills in the form. The row is created
  before any QB push; subsequent **Sync to QuickBooks** mints the
  `qb_id`.
- **QuickBooks import** (`source = 'qb_import'`) — populated either by
  the one-time bulk import (`/admin/integrations/quickbooks/import`)
  or by webhook deltas thereafter. Rows already have `qb_id` populated
  on creation.
- **Auto-resolved** (`source = 'auto_resolve'`) — when an invoice or
  estimate is pushed to QB and no `customer_id` is set, the resolve
  flow looks up or creates the customer in QB by email/DisplayName,
  mirrors the result back into the `customers` table, and stamps both
  `customer_id` and `qb_customer_id` on the source record.

---

## Initial setup runbook

Do these in order. Steps 1–2 cover the QuickBooks side; the rest are
specific to the customer database.

1. **Connect QuickBooks** at `/admin/integrations/quickbooks` per the
   runbook in [`QUICKBOOKS.md`](./QUICKBOOKS.md).
2. **Visit the import page** at
   `/admin/integrations/quickbooks/import`. This page is where every
   first-class entity (customers, vendors, items, accounts) is pulled
   in bulk from QB into the CRM.
3. **Click "Pull All from QB"**. The import walks every QB Customer,
   maps fields per the schema map above, and inserts into `customers`
   with `source='qb_import'`. Existing rows are upserted by `qb_id`.
4. **Review counts** shown on the page after the import completes.
   Compare against the customer count in QB Online → **Sales →
   Customers**.
5. **Visit `/admin/customers`** and verify the expected customers are
   there with the right names, emails, and balances.

---

## Daily operations

| What you want to do                       | Where / how                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| Browse all customers                      | `/admin/customers` — paginated, filterable by `source` / `active` / tags.                |
| Create a new customer                     | `/admin/customers/new` — form. Save creates with `source='crm'`.                         |
| Edit a customer                           | `/admin/customers/[id]` → click **Edit**.                                                |
| Push to QuickBooks                        | Customer detail page → **Sync to QuickBooks** button.                                    |
| Pull updates from QuickBooks              | Webhooks handle automatically. Manual sweep: `/admin/integrations/quickbooks/import`.    |
| See pending invoices for a customer       | Customer detail page → **Invoices** tab.                                                 |
| See QB activity filtered to one customer  | Customer detail page → **QuickBooks Activity** tab.                                      |
| Disable a customer                        | Customer detail page → **Deactivate**. Soft delete — `active=false`. History preserved.  |

---

## Backfill for existing data

The schema migration adds nullable `customer_id` columns to
`projects`, `invoices`, and `estimates`. Every existing row starts
with `NULL` because they predate the customer entity.

The **Backfill** tool, exposed on the integrations admin page (the
`<BackfillCard>` component on `/admin/integrations/quickbooks` or
`/admin/integrations/quickbooks/import`), walks every existing row,
finds or creates a matching customer, and stamps `customer_id`. It
is idempotent — re-running it skips rows that already have a
`customer_id`. Safe to run multiple times during the rollout.

Resolution order matches the dedup logic below: try `qb_customer_id`
first if the row already had one (from the legacy QB sync), then
email, then `client_name`. New rows inserted by the backfill use
`source='auto_resolve'`.

---

## Architecture notes

### Customer dedup

When the CRM has to find or create a customer (during
auto-resolve, backfill, or QB import), the lookup walks in this order:

1. `qb_id` exact match (only meaningful on QB-sourced inputs).
2. `LOWER(email)` exact match — uses `idx_customers_email`.
3. `display_name` exact match.
4. Otherwise create.

The same order applies on the QB side when pushing a new customer:
QB is searched by email, then DisplayName, before a `Create` is sent.

### DisplayName uniqueness

QuickBooks enforces uniqueness on `Customer.DisplayName` per realm. If
a CRM push collides with an existing-but-unlinked QB row, the API
returns HTTP 409 with a clear error, the failure is logged to
`qb_sync_log`, and the admin UI surfaces it on the detail page.
Resolution: edit the CRM `display_name` to disambiguate, or open the
QB row and link it via `qb_id`.

### Address mapping

CRM uses a flat shape:

```
{ line1, line2, city, state, zip, country }
```

QuickBooks uses its own field names:

```
{ Line1, Line2, City, CountrySubDivisionCode, PostalCode, Country }
```

The mapper in `src/lib/quickbooks/customers.ts` converts in both
directions. State/`CountrySubDivisionCode` is sent as the two-letter
code; ZIP/`PostalCode` is sent verbatim.

### Source field

Every customer row records its origin in `source`. Useful filters in
admin:

- `source='crm'` — created locally; check whether each has been pushed
  to QB.
- `source='qb_import'` — pulled in bulk; safe to assume already in QB.
- `source='auto_resolve'` — created mid-flight by a sync. Worth a
  human review pass to confirm the dedup picked the right row.

---

## Common operations

- **Find a customer's pending invoices** — open the detail page and
  click the **Invoices** tab. Filtered to that `customer_id` only.
- **See QB activity for one customer** — detail page → **QuickBooks
  Activity** tab. Shows every `qb_sync_log` row whose `entity_id`
  matches this customer.
- **Disable a customer** — detail page → **Deactivate**. Sets
  `active=false`. Historical projects/invoices/estimates remain
  intact and continue to render the customer's name. New pickers
  hide deactivated rows.
- **Merge two customers (manual)** — there is no merge UI yet. The
  workaround is to deactivate the duplicate, then run a SQL update to
  point its dependent rows at the canonical id. Track this in the
  future-work list.

---

## Related docs

- [`QUICKBOOKS.md`](./QUICKBOOKS.md) — the QB integration runbook.
  Covers OAuth, webhook handling, sync semantics, and per-entity
  field maps including the customer push flow.
- [`PAYMENTS.md`](./PAYMENTS.md) — forward-looking payments
  foundation. Customers are the parent entity for incoming payments
  once Stripe Connect is wired up.
- [`PORTAL.md`](./PORTAL.md) — crew-side portal. Does not currently
  read or write customer rows; mentioned only because admins managing
  customers will recognize the same `/admin` shell.
