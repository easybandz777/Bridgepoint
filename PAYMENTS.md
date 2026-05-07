# Payment Processing

Forward-looking architecture doc for the Bridgepointe CRM payments
foundation. Audience: the next engineer who lights this up.

> **Status: SCHEMA STUB ONLY.** Nothing in this document is wired to a
> live payment processor today. The `payments` table ships in
> `initDB()` so future iterations don't have to do an awkward migration
> against existing data, and so adjacent code can reference the table
> at compile time. There is no Stripe account connected, no API
> credentials in the env, no admin UI, and no webhook receiver. Treat
> every "will" in this doc as planned, not implemented.

---

## Why now (and why only the schema)

The mid-term plan is to replace QuickBooks Online for payments. QB
stays as the bookkeeping destination during the transition (per
[`QUICKBOOKS.md`](./QUICKBOOKS.md)), but the CRM becomes the place
where charges, refunds, ACH transfers, and check entries live. To
get there cleanly we need:

- A table that can record any payment — incoming or outgoing, any
  method, any processor.
- Foreign keys so a payment can reference exactly one invoice (when
  incoming) or one bill (when outgoing).
- Processor-agnostic columns so a Stripe charge, a manual check
  entry, and a recorded ACH credit all live in the same shape.

Shipping the schema now means future feature work can `JOIN` against
`payments` without first having to negotiate a migration and a code
deploy in the same PR. Nothing else ships in this pass: no admin
page, no CRUD endpoint, no Stripe SDK, no webhook receiver. Those
land iteration by iteration.

---

## Planned architecture

### Pilot: Stripe Connect for cards

Card processing will use Stripe Connect (Standard accounts) so
Bridgepointe can accept payments under its own merchant identity
without owning the PCI compliance burden. Customer-facing invoices
will gain a "Pay online" link backed by a Stripe Checkout session;
on success the resulting `Charge` object lands in the `payments`
table via webhook.

### Bank ACH

Bank ACH credits (one-off transfers from customer to Bridgepointe)
will use Stripe Financial Connections to attach a bank account, then
ACH credit transfers to debit it. Same `payments` row shape; the
`method` column flips from `card` to `ach` and `processor_fee` is
typically lower.

### Manual entries

Checks and cash will be entered by hand from
`/admin/payments/new` (planned). These rows have `processor='manual'`
and no `processor_charge_id`. They behave identically to processor
rows for reconciliation purposes.

### Outgoing payments (bills)

When the CRM eventually pays subcontractor bills (`project_bills`)
directly, those land as `direction='outgoing'` rows pointing at a
`bill_id` instead of an `invoice_id`. Method will typically be
`ach` or `check`.

---

## Reconciliation model

The `payments` table is the truth. `invoices.amount_paid` is a
denormalized cache, recomputed as:

```
invoices.amount_paid = SUM(payments.amount)
                       WHERE payments.invoice_id = invoice.id
                         AND payments.status = 'succeeded'
                         AND payments.direction = 'incoming'
                       MINUS refunds.
```

`invoices.status` (Paid / Partial / Outstanding) is derived from
`amount_paid` vs `total`. The recompute step runs whenever a
payment row mutates — initially via a server action, eventually via
a Postgres trigger if performance demands it.

This mirrors how the QB integration already derives Paid status from
`Balance` vs `TotalAmt`, just with the source of truth flipped to
the CRM.

---

## Webhook plan

Stripe will POST to `/api/payments/webhook` (planned). The receiver
will:

1. Verify the `Stripe-Signature` header against `STRIPE_WEBHOOK_SECRET`.
2. Persist the raw envelope to a `payments_webhook_events` table
   keyed by `(event_id)` for idempotency.
3. Return `200 ok` immediately. A separate cron (`*/5 * * * *`,
   matching the QB pattern) will drain the queue and update the
   `payments` row by `processor_charge_id`.

Mirroring the QB receiver/processor split keeps Vercel function
timeouts safe and makes failure handling consistent.

---

## Schema (shipping now, unused)

The `payments` table is created at the very end of `initDB()` in
[`src/lib/db.ts`](./src/lib/db.ts) and tagged with a "PLANNED — Phase 3"
comment. Columns:

| Column                | Type           | Description                                                     |
| --------------------- | -------------- | --------------------------------------------------------------- |
| `id`                  | `TEXT` PK      | CRM-internal id (`pay-<timestamp>-<rand>`).                     |
| `payment_number`      | `TEXT`         | Optional human-friendly number for receipts.                    |
| `direction`           | `TEXT`         | `incoming` (default) or `outgoing`.                             |
| `amount`              | `NUMERIC`      | Always positive. Refunds are separate rows with negative-net effect via `status`. |
| `currency`            | `TEXT`         | Default `USD`.                                                  |
| `method`              | `TEXT`         | `card` (default) / `ach` / `check` / `cash` / `other`.          |
| `status`              | `TEXT`         | `pending` / `succeeded` / `failed` / `refunded` / `disputed`.   |
| `customer_id`         | `TEXT`         | FK to `customers`. Nullable for outgoing rows.                  |
| `vendor_id`           | `TEXT`         | FK to `vendors`. Used when `direction='outgoing'`.              |
| `invoice_id`          | `TEXT`         | FK to `invoices`. One incoming payment → one invoice.           |
| `bill_id`             | `TEXT`         | FK to `project_bills`. One outgoing payment → one bill.         |
| `received_date`       | `TEXT`         | When funds arrived (or were initiated for ACH).                 |
| `deposited_date`      | `TEXT`         | When the deposit cleared the bank.                              |
| `processor`           | `TEXT`         | `stripe` / `manual` / `qb`.                                     |
| `processor_charge_id` | `TEXT`         | The processor's id (`ch_...`, `pi_...`, etc.). Used for webhook lookup. |
| `processor_fee`       | `NUMERIC`      | Default 0. The fee the processor took out of the gross.         |
| `notes`               | `TEXT`         | Internal-only freeform.                                         |
| `metadata`            | `JSONB`        | Catch-all for processor payload bits we want to keep.            |
| `qb_id`               | `TEXT`         | If/when we push payments back into QB.                          |
| `qb_sync_token`       | `TEXT`         | QB optimistic-concurrency token.                                |
| `qb_synced_at`        | `TIMESTAMPTZ`  | Last successful QB push.                                        |
| `created_at`          | `TIMESTAMPTZ`  | Default `NOW()`.                                                |
| `updated_at`          | `TIMESTAMPTZ`  | Default `NOW()`.                                                |

Indexes (also shipped now):

- `idx_payments_invoice` on `(invoice_id)` — for the recompute query.
- `idx_payments_customer` on `(customer_id)` — for the customer
  detail page's payments tab when it lights up.
- `idx_payments_status` on `(status)` — for filtering "needs
  attention" lists.
- `idx_payments_created` on `(created_at DESC)` — default sort.

The table is created with `CREATE TABLE IF NOT EXISTS`, so a re-run of
`initDB()` against an environment that already has it is a no-op.

---

## What is **not** in this pass

To be explicit:

- No Stripe SDK / dependency.
- No env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_CONNECT_CLIENT_ID`).
- No admin pages under `/admin/payments`.
- No public-facing `/pay/[invoiceId]` flow.
- No `/api/payments/*` endpoints.
- No webhook receiver.
- No reconciliation cron.
- No invoice-level "Pay online" link.
- No QB push for CRM-recorded payments (still read-only from QB).

The next iteration that touches this should pick exactly one of those
gaps to close and land it in isolation.

---

## Related docs

- [`QUICKBOOKS.md`](./QUICKBOOKS.md) — how payments flow today (read-only
  pull from QB).
- [`CUSTOMERS.md`](./CUSTOMERS.md) — the customer entity that incoming
  payments will reference.
