# QuickBooks disconnect runbook

This runbook covers the **clean shutdown** and **rollback** procedures for the
QuickBooks Online (QBO) integration. As of the most recent decision, the CRM
itself plus Stripe is the system of record for customers, invoices, estimates,
vendors, bills, and payments. QuickBooks is being retired but the integration
code is kept in place behind a feature flag so a rollback is one env-flip away.

> **TL;DR** — Flip `QB_DISABLED=true` (server) and `NEXT_PUBLIC_QB_DISABLED=true`
> (client) in Vercel env, redeploy, optionally revoke the OAuth grant in Intuit.
> Flip both back to `false` and redeploy to roll back. No DB migration runs in
> either direction.

---

## What the flag does

| Surface | When `QB_DISABLED=true` |
| --- | --- |
| `GET/POST /api/quickbooks/connect`, `callback`, `disconnect`, `refresh` | `410 Gone` |
| `POST /api/quickbooks/webhook`, `webhook/process`, `GET webhook/events` | `410 Gone` |
| `GET/POST` for customers / vendors / items / accounts / invoices / estimates / bills / payments under `/api/quickbooks/**` | `410 Gone` |
| `POST /api/quickbooks/auto-sync/run`, `GET /api/quickbooks/auto-sync/status` | `410 Gone` |
| `GET /api/quickbooks/health`, `sync-log`, `refs` | `410 Gone` |
| `GET /api/quickbooks/status` | **200** with `{ disabled: true, message: "..." }` so the admin UI can render its disabled state |
| `POST /api/quickbooks/import-all` | **Still live** by design — admin can run one last reconciling pull while disabled |
| Non-namespaced sync endpoints: `/api/customers/:id/sync-to-qb`, `/api/projects/:id/sync-to-qb`, `/api/projects/:id/bills/:billId/sync-to-qb`, `/api/subcontractors/:id/sync-to-qb` | `410 Gone` |
| `src/lib/quickbooks/auto-sync.ts` (`autoSyncInvoiceIfEnabled`, `autoSyncEstimateIfEnabled`, `autoSyncCustomerForProjectIfEnabled`, `autoSyncSubcontractorIfEnabled`, `autoSyncBillIfEnabled`) | All return immediately — no QB API traffic, no `qb_sync_log` writes |
| Vercel Cron | The hourly/daily QB auto-sync cron is **removed from `vercel.json`**. The only cron left is `/api/payments/cron` every 5 minutes (Stripe payment-state drain). |
| Admin UI integrations page (`/admin/integrations/quickbooks`) | Shows a top banner explaining the new state + a "How do I re-enable?" dialog. Status, stats, import, defaults, actions, and sync-log sub-cards are hidden. |
| Admin sidebar | The "QuickBooks" link **stays visible**. Clicking it lands on the disabled-state page (intentional, per spec — simpler than fanning out env vars to every layout). |
| Admin record pages (customers, vendors, items, accounts) | "Pull from QuickBooks", "Sync to QB", "Refresh from QuickBooks", and the new-customer "Also create in QuickBooks now" toggle are hidden when `NEXT_PUBLIC_QB_DISABLED=true`. |
| `QbSyncButton` component | Renders `null` when `NEXT_PUBLIC_QB_DISABLED=true`, so every invoice / estimate / bill sync entry point silently disappears. |

What is **not** changed:

- The DB schema. `customers.qb_id`, `vendors.qb_id`, `items.qb_id`,
  `accounts.qb_id`, `invoices.qb_id`, `estimates.qb_id`, `project_bills.qb_id`,
  `projects.qb_id`, `subcontractors.qb_id` all stay populated. The
  `qb_connections`, `qb_oauth_states`, `qb_webhook_events`, and `qb_sync_log`
  tables are untouched.
- The `/api/quickbooks/import-all` route — see above.
- Stripe (`/api/payments/**`, `/api/pay/**`, `/admin/payments/**`,
  `src/lib/stripe/**`, `record-payment-dialog.tsx`, `invoice-payments-card.tsx`).
- The marketing navbar.

---

## Order of operations — shutdown

1. **Snapshot QB one last time.** From `/admin/integrations/quickbooks/import`
   (or by hitting `POST /api/quickbooks/import-all` directly with an admin
   actor), run a full pull. This catches any QB-side stragglers from after the
   cutover decision was made. Wait for the response to confirm every entity
   (`accounts`, `customers`, `vendors`, `items`) reports `imported / updated /
   failed` counts without an `error` field.

2. **Flip both flags in Vercel project env (production AND preview):**
   - `QB_DISABLED=true`
   - `NEXT_PUBLIC_QB_DISABLED=true`

   And in your local `.env.local` if you ever run the dev server locally.

3. **Redeploy** so the new env values take effect. Use the working
   `npx vercel build --prod && npx vercel deploy --prebuilt --prod` flow from
   the user's universal rules (auto-deploy is currently shadowbanned —
   ticket #4379984). Confirm the returned JSON shows `target: "production"`
   and `readyState: "READY"`.

4. **Verify the disabled state.** Visit `/admin/integrations/quickbooks` —
   you should see:
   - The amber-on-bronze "QuickBooks is disabled" banner at the top.
   - The "How do I re-enable?" dialog opens correctly.
   - The `QbStatusCard` renders its archived state (Archive icon, message,
     no Connect / Disconnect / Test buttons).
   - The status, stats, import, defaults, actions, and sync-log cards are
     gone.
   - No "Sync to QB" / "Pull from QB" / "Refresh from QB" buttons appear on
     `/admin/customers/[id]`, `/admin/vendors/[id]`, `/admin/vendors`,
     `/admin/items`, `/admin/accounts`, or `/admin/accounts/[id]`.
   - Sanity-check the gated routes return 410:
     - `curl -i https://<host>/api/quickbooks/refresh -X POST` → 410
     - `curl -i https://<host>/api/quickbooks/auto-sync/run -X POST` → 410
   - And the status route returns the new shape:
     - `curl https://<host>/api/quickbooks/status` →
       `{ "disabled": true, "connected": false, ..., "message": "..." }`

5. **(Optional) Revoke the OAuth grant on Intuit's side.** In the Intuit
   developer dashboard, find the `bridge pointe crm` app (workspace:
   bridgepointe CRM) and disconnect / revoke the production grant. This stops
   QBO from delivering webhooks. The CRM is already 410'ing the webhook
   endpoint, so this is belt-and-suspenders cleanup. Note: revoking the
   developer-side grant **does not** delete `qb_connections` rows — those
   stay for historical reference.

---

## Order of operations — rollback (re-enable)

1. In Vercel env (and `.env.local`), set both:
   - `QB_DISABLED=false`
   - `NEXT_PUBLIC_QB_DISABLED=false`

2. Redeploy.

3. If you revoked the Intuit-side grant in step 5 of shutdown, go to
   `/admin/integrations/quickbooks` and click **Connect to QuickBooks** to
   re-authorize. The existing realm will be re-bound; existing rows with
   `qb_id` set will resume syncing.

4. (Optional) Re-add the QB auto-sync cron entry to `vercel.json`. The
   shutdown removed it; the current file only schedules
   `/api/payments/cron */5 * * * *`.

No DB migration runs in either direction. Nothing is destroyed.

---

## What data is preserved (everything)

- All `qb_id` foreign keys on `customers`, `vendors`, `items`, `accounts`,
  `invoices`, `estimates`, `project_bills`, `projects`, `subcontractors`.
- `qb_sync_log` (every push and pull we've ever recorded).
- `qb_webhook_events` (every webhook delivery, processed and unprocessed).
- `qb_connections` and `qb_oauth_states` rows.
- The cached `qb_default_refs` row.

The rollback is reversible because nothing was deleted, only gated.

---

## Implementation reference

The flag is read by `isQbDisabled()` in `src/lib/feature-flags.ts`. Every
gated server route imports that helper. Client components read
`process.env.NEXT_PUBLIC_QB_DISABLED === 'true'` directly — keep the two env
vars synchronized so server and client agree.

The single combined gate in `src/lib/quickbooks/auto-sync.ts`
(`shouldSkipAutoSync`) short-circuits every fire-and-forget mutation hook —
so any new mutation route that wires up another `autoSync*IfEnabled` helper
inherits the disabled behavior automatically.
