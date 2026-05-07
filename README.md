This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## QuickBooks Integration

The CRM syncs customers, invoices, estimates, vendors, bills, and payment
state with QuickBooks Online (sandbox + production). Connection status,
manual pushes, the sync log, and webhook event queue all live under
`/admin/integrations/quickbooks`.

Full operations docs — environment variables, OAuth + Vercel Cron setup,
routes inventory, sync semantics, common errors, and the production
go-live checklist — are in [`QUICKBOOKS.md`](./QUICKBOOKS.md).

A quick CLI smoke test is at [`scripts/qb-smoke-test.sh`](./scripts/qb-smoke-test.sh):

```bash
./scripts/qb-smoke-test.sh
BASE_URL=https://bridgepointepainting.com ./scripts/qb-smoke-test.sh
```

## Customer database

Customers, vendors, items, and accounts are now first-class CRM
entities, populated by bulk import from QuickBooks and kept fresh
via webhooks plus per-entity push. Customers in particular are
treated as the eventual system of record (replacing QuickBooks
long-term) and have their own dedup logic, source tracking, and
backfill flow.

Schema columns, ingest paths (CRM-native, QB import, auto-resolve),
the initial setup runbook, and daily operations are documented in
[`CUSTOMERS.md`](./CUSTOMERS.md). Admin UI lives at
`/admin/customers`.
