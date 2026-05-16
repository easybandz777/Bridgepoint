# Payment Processing

Operational guide for the Bridgepointe CRM payments system. The CRM is now
the system of record for invoicing and payments; QuickBooks is being
decommissioned (see [`QB_DISCONNECT_RUNBOOK.md`](./QB_DISCONNECT_RUNBOOK.md)).

> **Status: LIVE (test mode).** Wired against Stripe with `sk_test_*` keys.
> To go to production: replace the three Stripe env vars in Vercel with
> their `sk_live_*` / `pk_live_*` / `whsec_*` counterparts, register the
> webhook endpoint in the Stripe dashboard, redeploy.

---

## Architecture

```
                       ┌────────────────────────────────────┐
                       │     Stripe (test or live mode)     │
                       └───────────┬────────────────────────┘
                                   │
              Checkout / ACH       │              Webhook POST
              SetupIntents         │           (signed, HMAC SHA-256)
                                   │
                ┌──────────────────┼────────────────────────────────┐
                │                  │                                │
                │     ┌────────────▼─────────────┐                  │
                │     │ POST /api/payments/      │                  │
                │     │   checkout               │                  │
                │     │   ach/setup-intent       │                  │
                │     │   ach/payment-intent     │                  │
                │     │   manual                 │                  │
                │     │   [id]/refund            │                  │
                │     └────────────┬─────────────┘                  │
                │                  │                                │
                │     ┌────────────▼─────────────┐    ┌──────────┐  │
                │     │  src/lib/stripe/         │    │ POST     │  │
                │     │   client.ts (lazy SDK)   │    │ /api/    │  │
                │     │   payments.ts            │    │ payments │  │
                │     │   webhook-drain.ts       │    │ /webhook │  │
                │     └────────────┬─────────────┘    └────┬─────┘  │
                │                  │                       │        │
                │                  ▼                       ▼        │
                │  ┌────────────────────────────────────────────┐   │
                │  │  Postgres (Neon)                           │   │
                │  │   payments                                 │   │
                │  │   payments_webhook_events  (idempotency)   │   │
                │  │   customers.stripe_customer_id             │   │
                │  │   invoices.amount_paid / status            │   │
                │  └────────────────────────────────────────────┘   │
                │                  ▲                                │
                │                  │ */5 * * * *                    │
                │      ┌───────────┴───────────┐                    │
                │      │ /api/payments/cron    │ (Vercel cron)      │
                │      │ drains webhook queue  │                    │
                │      └───────────────────────┘                    │
                │                                                   │
                │   CRM (Next.js 16 on Vercel + Postgres on Neon)   │
                └───────────────────────────────────────────────────┘
```

The receiver-then-drain pattern is intentional: webhooks land, get persisted
to `payments_webhook_events` keyed by event id, and a 200 returns
immediately. A separate cron (or a manual POST) walks unprocessed rows and
applies them to `payments` + `invoices`. This matches the QB pattern that
was already battle-tested, keeps Vercel function timeouts safe, and makes
retries idempotent.

---

## Surfaces

### Customer-facing

- **`/pay/[invoiceId]`** — public payment landing page (warm theme,
  invoice summary, "Pay $X" CTA). Renders three modes: `new`,
  `success` (when Stripe redirects back with `?session_id=...`), and
  `canceled` (when Stripe redirects with `?canceled=1`).
- Click the CTA → POST `/api/payments/checkout` → Stripe Checkout
  session → customer enters card or bank → Stripe redirects back.
- After success, the page polls `GET /api/payments/checkout/[sessionId]`
  for up to 30 s to surface "Thank you / processing / error" state.

### Admin

- **`/admin/payments`** — list of all payments with status filter chips,
  responsive table/cards, deep links into payment detail.
- **`/admin/payments/[id]`** — single payment detail with refund / void
  / re-sync-invoice actions, linked invoice + customer.
- **Invoice detail page** now shows an **InvoicePaymentsCard** with:
  the public pay URL + copy button, "Record Payment" (manual entry
  dialog), "Send Pay Email" (stubbed), and the payment history table.
- **Invoice list cards** now have a small "Pay link" copy icon.

### Manual entry

- **`RecordPaymentDialog`** at `src/components/admin/record-payment-dialog.tsx`
  records cash / check / wire / other against an invoice. POSTs to
  `/api/payments/manual`, which writes the row with
  `processor='manual', status='succeeded'` and reconciles the invoice.

### Stripe ACH

- **Checkout** already accepts ACH automatically (`payment_method_types`
  includes `us_bank_account`). For most flows this is enough.
- For a **standalone bank-only flow**, hit
  `POST /api/payments/ach/payment-intent` with `{ invoiceId, amount? }`
  and confirm client-side via `src/components/portal/ach-payment-form.tsx`.
  It runs `stripe.collectBankAccountForPayment` (Financial Connections)
  then `stripe.confirmUsBankAccountPayment` against the returned
  client secret. ACH typically settles in 3–5 business days; the
  PaymentIntent webhook flips the row from `pending` to `succeeded`
  when funds clear.

---

## Endpoints

| Verb | Path                                            | Purpose                                                     |
| ---- | ----------------------------------------------- | ----------------------------------------------------------- |
| POST | `/api/payments/checkout`                        | Create a Stripe Checkout session for an invoice.            |
| GET  | `/api/payments/checkout?invoiceId=`             | Same as POST, query-string form (for direct links).         |
| GET  | `/api/payments/checkout/[sessionId]`            | Poll session status after Checkout returns.                 |
| POST | `/api/payments/ach/setup-intent`                | SetupIntent for saving a bank account against a customer.   |
| POST | `/api/payments/ach/payment-intent`              | One-off ACH debit against an invoice.                       |
| POST | `/api/payments/manual`                          | Record an offline (cash/check) payment.                     |
| GET  | `/api/payments?customerId=&invoiceId=&status=`  | List payments with optional filters.                        |
| GET  | `/api/payments/[id]`                            | Single payment.                                             |
| POST | `/api/payments/[id]/refund`                     | Refund (Stripe) or void (manual).                           |
| POST | `/api/payments/webhook`                         | Stripe webhook receiver. Verifies signature, enqueues.      |
| GET  | `/api/payments/cron`                            | Drain queued webhook events. Runs every 5 min via Vercel.   |

All routes `await initDB()` on entry, so the schema is always fresh.

---

## Environment variables

| Variable                              | Required          | Description                                                                 |
| ------------------------------------- | ----------------- | --------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`                   | Yes               | Server-side. `sk_test_...` or `sk_live_...`. NEVER prefix `NEXT_PUBLIC_`.   |
| `STRIPE_WEBHOOK_SECRET`               | Yes               | `whsec_...` from the dashboard endpoint (or `stripe listen` in dev).        |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  | Yes (browser)     | `pk_test_...` or `pk_live_...`. Used by `loadStripe()` for the ACH form.   |
| `NEXT_PUBLIC_APP_URL`                 | Yes               | Used to construct success/cancel URLs. Set per environment.                 |
| `CRON_SECRET`                         | Recommended (prod)| If set, `/api/payments/cron` requires `Authorization: Bearer <secret>`.    |
| `QB_DISABLED`, `NEXT_PUBLIC_QB_DISABLED` | No (mid-migration) | Disable QuickBooks integration when flipped to `true`.                  |

---

## Schema

The `payments` table from `initDB()` in `src/lib/db.ts`:

| Column                | Type           | Notes                                                                |
| --------------------- | -------------- | -------------------------------------------------------------------- |
| `id`                  | `TEXT` PK      | CRM id (`pay-<timestamp>-<rand>`).                                   |
| `payment_number`      | `TEXT`         | Check number or human-friendly id.                                   |
| `direction`           | `TEXT`         | `incoming` (default) or `outgoing`.                                  |
| `amount`              | `NUMERIC`      | Always positive; refunds flip `status`.                              |
| `currency`            | `TEXT`         | `USD`.                                                               |
| `method`              | `TEXT`         | `card` / `ach` / `check` / `cash` / `other`.                         |
| `status`              | `TEXT`         | `pending` / `succeeded` / `failed` / `refunded` / `disputed`.        |
| `customer_id`         | `TEXT`         | FK to `customers`. Optional for ad-hoc Checkout.                     |
| `invoice_id`          | `TEXT`         | FK to `invoices`. One incoming payment → one invoice.                |
| `bill_id`             | `TEXT`         | FK to `project_bills` for outgoing.                                  |
| `received_date`       | `TEXT`         | When funds arrived / were initiated.                                 |
| `deposited_date`      | `TEXT`         | When the deposit cleared the bank.                                   |
| `processor`           | `TEXT`         | `stripe` / `manual` / `qb`.                                          |
| `processor_charge_id` | `TEXT`         | Stripe PaymentIntent id (`pi_...`). Unique index — drives idempotency. |
| `processor_fee`       | `NUMERIC`      | Fee withheld by processor.                                           |
| `notes`               | `TEXT`         | Internal.                                                            |
| `metadata`            | `JSONB`        | Receipt URL, check_number, full Stripe envelope refs.                |

Plus `payments_webhook_events` for idempotent webhook ingest, and a new
`customers.stripe_customer_id` column populated lazily by
`ensureStripeCustomer()`.

### Reconciliation

`reconcileInvoice(invoiceId)` is called automatically after every
`recordPayment` mutation. It runs:

```sql
SELECT COALESCE(SUM(amount), 0)
FROM payments
WHERE invoice_id = $1
  AND direction  = 'incoming'
  AND status     = 'succeeded'
```

…and writes the result to `invoices.amount_paid`, then derives
`amount_due` and `status` (Paid / Partial / Outstanding).

---

## Local development

1. Install Stripe CLI: <https://docs.stripe.com/stripe-cli>.
2. `stripe login`.
3. Forward webhooks to local dev:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```
   It will print a `whsec_...` for the session — paste it into
   `STRIPE_WEBHOOK_SECRET` in `.env.local` (then restart `npm run dev`).
4. Visit `/admin/invoices`, pick an invoice, copy the "Pay link", open it
   in another tab, click "Pay $X" → use test card `4242 4242 4242 4242`
   (any CVC, any future date, any ZIP).
5. Watch the Stripe CLI tail. The `checkout.session.completed` event
   should land at `/api/payments/webhook` and the cron drain will pick
   it up within 5 minutes (or POST `/api/payments/cron` to force-drain).
6. The invoice should flip to "Paid" in admin once the drain runs.

For ACH testing, use bank `STRIPE TEST BANK` with routing `110000000`
and account `000123456789` — Stripe's deterministic test bank.

---

## Production rollout

1. Create a Stripe account (live mode), complete verification (bank,
   business identity — usually 3–7 business days).
2. From <https://dashboard.stripe.com/apikeys>, grab `sk_live_...` and
   `pk_live_...` and put them in Vercel project env (Production).
3. In <https://dashboard.stripe.com/webhooks>, add an endpoint:
   `https://bridgepointepainting.com/api/payments/webhook`
   Subscribe to these events (minimum):
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
   - `charge.dispute.created`
   Copy the signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.
4. Set `NEXT_PUBLIC_APP_URL=https://bridgepointepainting.com` in Vercel.
5. Set `CRON_SECRET` to something random.
6. Redeploy.
7. Run a $1 live test on a real invoice end-to-end; verify it lands
   in the dashboard, the row in `payments`, and the invoice flips Paid.

---

## Related docs

- [`QB_DISCONNECT_RUNBOOK.md`](./QB_DISCONNECT_RUNBOOK.md) — how to
  decommission the QuickBooks integration.
- [`QUICKBOOKS.md`](./QUICKBOOKS.md) — legacy QB integration (deprecated).
- [`CUSTOMERS.md`](./CUSTOMERS.md) — the customer entity that incoming
  payments reference.
