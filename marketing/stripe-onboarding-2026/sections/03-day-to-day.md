# Section III — How You'll Use It Day to Day

This section is the operations runbook for Bridgepointe Painting after the Stripe integration goes live. It covers the actual buttons Brenda will click and the actual decisions you (the owner) will make Monday through Friday. The CRM lives at **bridgepointepainting.com/admin**, and Brenda has admin access.

The goal of this section is simple: by the end of it, you should both feel like there is no mystery left. Every common task — sending an invoice, recording a check, refunding a customer, responding to a chargeback — has a five-step procedure you can run without thinking.

## Your daily 5-minute routine (Brenda)

The morning rhythm:

1. Open the CRM at **/admin/invoices**.
2. Look for invoices that flipped to **Paid** overnight. The payment data auto-filled itself from Stripe — there is no work to do. Just notice they came in.
3. Glance at **/admin/integrations/quickbooks/sync-log** to confirm there are no sync errors. This step stays in place during the parallel-run period only; after we cut QuickBooks loose, this step disappears.
4. If any invoices are 7 or more days past due, click **Send Reminder**. The CRM resends the original payment link, and the email subject line gets "REMINDER" added in front.

That is the entire daily routine. Five minutes. Compare that to the previous workflow — download QuickBooks transactions, hand-mark each invoice paid, reconcile against the bank statement, hope the deposits matched — and the daily time savings are significant. Brenda gets her mornings back.

## Sending an invoice (the most common task)

This is the task you will do dozens of times a month. We will walk through it with a real example: Mr. Thompson, 1842 Briarcliff Rd, full exterior repaint in Buckhead, $14,500.

1. In the CRM, go to **/admin/projects** and pick the Thompson project. (Alternatively, **/admin/invoices/new** lets you create a one-off invoice that is not tied to a project — useful for small touch-ups.)
2. On the project page, click **Create Invoice**.
3. The line items prefill from the project's signed estimate. Review them. Adjust quantities or descriptions if anything changed during the job.
4. Pick the **Customer** from the dropdown, or click **+ Create new** if Mr. Thompson is a brand-new customer record. The customer record holds his email — Stripe needs that to deliver the payment link.
5. Set the **Issue Date** (defaults to today) and the **Due Date** (defaults to Net 15, but you can change to Net 30 or "Due on receipt" per job).
6. Add **Notes** if there is something to say. For Mr. Thompson, maybe: "Thanks for your patience while we waited out the rain on the second coat."
7. Click **Save & Send**.
8. Two things happen instantly:
   - Mr. Thompson gets a branded email from "Bridgepointe Painting" with the PDF invoice attached and a large gold **Pay $14,500** button.
   - The invoice appears in **/admin/invoices** with status **Sent**.

> **Tip**: in the email, Mr. Thompson sees a "Save this card for next time" option if he pays by card. Repeat customers — and you have a lot of them, year after year — never have to re-enter their card info on the touch-up job next spring.

## Recording a non-Stripe payment (cash, check, in-person)

A meaningful chunk of your customer base — especially older homeowners — will keep handing the foreman a check at the end of the job. The CRM handles that gracefully:

1. Open the invoice in the CRM.
2. Click **Record Payment**.
3. Pick the payment method: **Check**, **Cash**, **Wire transfer**, **ACH (manual)**, or **Other**.
4. Enter the amount and the date you received the payment.
5. Add a memo if useful, like "Check #1247" or "Cash handed to foreman 5/4".
6. Save.

The invoice flips to **Paid** with the manual payment record attached. The bank deposit happens the way it always has — Brenda or the foreman walks the check to the bank. The CRM is tracking the fact that you got paid; it is not pretending Stripe processed something it did not. This keeps the books honest.

## Issuing a refund

Refunds will be rare, but they happen — color complaints, scope reduction after the job started, occasional customer disputes you decide to settle:

1. Open the invoice in the CRM.
2. Click **Refund**.
3. Enter the refund amount. You can issue a full refund or a partial refund (for example, $500 off a $14,500 job for a touch-up they did not love).
4. Add a reason if you want it in your records.
5. Click **Confirm**.

The CRM tells Stripe to issue the refund. Stripe pulls the money from your next payout. The customer sees the refund on their card or bank statement within 5 to 10 business days.

> **Warning**: refunds count against your Stripe processing volume, and the original 2.9% + 30¢ processing fee is **not** returned to you. For partial scope changes, it is usually cleaner to issue a credit memo (a feature we will add in Phase 4) than to refund and re-invoice.

## Handling a dispute (chargeback)

A dispute happens when a customer's bank reverses a charge against you. Usually the cause is one of two things: the customer did not recognize the bank-statement descriptor ("BRIDGEPOINTE PAINT"), or they are claiming the work was not completed. You have **20 days** from the dispute notice to respond with evidence.

When a dispute hits, the CRM displays a banner: **"Dispute opened on Invoice #INV-2026-0142 — respond by [date]."**

1. Click the banner. The CRM links straight through to the Stripe Dashboard's dispute response page.
2. Stripe asks for: a description of the work performed, the signed estimate, before-and-after photos (the crew portal already collected these — this is exactly why we built it), the customer's communication history, and the invoice itself.
3. The CRM has 90% of this material ready. Pull the photos from **/admin/projects/[id]/photos**, the signed estimate from **/admin/estimates/**, and the invoice PDF from the invoice record.
4. Submit through Stripe.
5. Stripe arbitrates with the bank. A decision typically arrives in 60 to 75 days.

Most disputes go in your favor when you have crew photos showing the work was done. **This is one of the biggest reasons we built the crew photo system** — it is your single best defense against frivolous chargebacks.

## Recurring customers (year-over-year)

A huge part of your business is repeat work. Mr. Thompson asks for a touch-up next spring — here is the friction:

1. Find Thompson at **/admin/customers/**.
2. Click **New Project**. The project is automatically linked to his customer record.
3. When you invoice him, his email is already filled in.
4. He gets the email, clicks Pay. If he saved his card last time via Stripe Link, the card autofills.

Roughly 30 seconds of friction for a returning customer. Compare to the old workflow — print the invoice, mail it, wait for the check, deposit the check, mark it paid in QuickBooks. That is days of float and a real chance the check gets lost or forgotten.

## Monthly close (Brenda's first-of-month routine)

The bookkeeping rhythm at the start of each month:

1. **Reconcile**: open the Stripe Dashboard, go to **Payments**, filter to the previous month. The total should match what the CRM shows under **/admin/reports/cash-flow** (coming in Phase 4).
2. **Bank deposit check**: open the business checking account online statement. Every Stripe deposit should show up as a `STRIPE TRANSFER` line. If a transfer is missing, check Stripe's **Payouts** tab for that date — sometimes a payout takes the rolling 2 business days plus a weekend.
3. **Export for the CPA**: in the CRM, go to **/admin/reports/profitability** (coming) and click **Export CSV**. Email it to your CPA.
4. **Cancel-the-old-thing check**: during the parallel-run period, note any QuickBooks invoices still open that need to be closed out manually. After 60 days, none should remain.

## When something goes wrong

A short troubleshooting guide for the things that actually happen:

- **A customer says "the link doesn't work"**: open the invoice in the CRM and click **Resend Payment Link**. If it still fails, ask which browser or device they're using. Stripe's pages work on every modern browser, but some corporate networks block the page entirely — in that case have them try from their phone on cellular.
- **A payment looks stuck on Processing**: ACH transfers take 3 to 5 business days to clear, so this is normal for ACH. Card payments are usually instant. If a card payment is showing **Processing** for more than an hour, look up the charge ID in the Stripe Dashboard and check the status there.
- **Stripe emails about a "verification request"**: Stripe occasionally asks for additional documentation — an updated EIN letter, proof of business address, an updated ID for the account owner. Respond within 7 days or the account gets paused. If you are not sure what they want, forward the email to your stepson.
- **A customer wants to pay over the phone**: do not take the card number verbally. It puts you out of PCI compliance. Instead, send the invoice email — they pay through Stripe's PCI-compliant page. If the customer truly insists, the Stripe Dashboard has a manual **Charge a card** button under **Payments → New**, and you can type the card number directly into Stripe.

## What the customer experiences (for empathy)

It helps to know what the other side of this looks like:

The customer receives an email titled "Invoice from Bridgepointe Painting — $14,500". It is branded with your logo. The subject line is something like "Invoice for the Buckhead repaint." The body has a short note from you (auto-generated but customizable per invoice), the invoice line items inline, and a single big **Pay** button.

When they click Pay:

- They land on a Stripe-hosted page at **pay.bridgepointepainting.com**. We set up a custom domain for the payment page so it reads as your brand, not stripe.com.
- They see the same line items, the total, your logo.
- They pick a payment method — card, ACH, or saved card via Stripe Link.
- They pay.
- They get an instant receipt email.
- Optionally, they save the card for next year's touch-up.

The whole thing takes about 60 seconds. No checks, no envelopes, no "the check is in the mail."

## Phase 4 features that come next (in the CRM)

A quick preview of what is on the roadmap so you know where we are headed:

- **Profit & Loss report**: live, no QuickBooks needed.
- **Balance sheet**: live.
- **Cash flow forecast**: 30, 60, and 90 day predictions based on outstanding invoices and historical pay-times.
- **1099-NEC generation**: for subcontractors at year-end. No more chasing TINs in January.
- **Tax exports**: clean CSVs for the CPA, mapped to standard tax categories.
- **Recurring invoices**: for the maintenance contracts — annual touch-ups, pressure washing memberships, deck refinish reminders.
