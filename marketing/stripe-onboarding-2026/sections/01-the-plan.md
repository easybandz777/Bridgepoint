# Section I — The Plan

## The plan in one paragraph

We are moving Bridgepointe Painting off QuickBooks Online. Going forward, your customers will pay their invoices by clicking a "Pay" button in the email you send them, instead of mailing you a paper check or calling Brenda for your address. The money lands in your business checking account in **2 business days**. Everything you do today inside QuickBooks — sending invoices, marking them paid, tracking who owes you what, pulling a customer statement — will happen inside your CRM at admin/, the same system that already runs your projects, customers, employees, and estimates. To actually move the money from the customer's card or bank into yours, the CRM uses Stripe. Stripe is the gold standard for online payments in the United States — almost every modern web business you have heard of (Amazon, Lyft, Shopify stores, virtually every contractor invoicing app on the market) runs on it. You will not log into Stripe day-to-day. You will log into the CRM the same way you do now.

## Why this is a good move for you

- **Lower processing fees on big jobs.** QuickBooks Payments charges **2.9% + 25¢** on every credit card payment and **1%** on every ACH bank transfer. Stripe charges **2.9% + 30¢** on cards (basically the same) but only **0.8% capped at $5** on ACH. On a $20,000 invoice paid by bank transfer that is the difference between **$200** in QB fees and **$5** in Stripe fees. You save **$195 on that single payment.** With your average project at $145,000 and a meaningful share of homeowners willing to pay by ACH when offered, the math gets serious fast.
- **Faster deposits.** Stripe is **2 business days** standard. QuickBooks is typically **3 to 5 days**. Send an invoice on Tuesday, get paid Tuesday night, money in your account Thursday.
- **Cancel the QuickBooks Online subscription.** Depending on your tier (Plus or Advanced), you are paying somewhere between **$90 and $235 per month** for QBO right now. That is **$1,080 to $2,820 per year** that goes away. QuickBooks Payments fees go away too — replaced by Stripe's lower rates.
- **One system, not two.** Right now, every invoice gets sent from QB and then either you or Brenda re-keys the project, the customer, and the line items into the CRM (or vice versa). After the switch, it is **one click in the CRM.** The invoice goes out, the payment comes in, the books update — all in one place. Brenda gets back several hours a week.
- **The customer experience is dramatically better.** Today, a homeowner in Brookhaven gets a paper invoice or a QB email, then has to dig out their checkbook, write the check, find a stamp, and mail it. After the switch, they click **"Pay $14,500"** in their inbox, see a clean payment page with your logo on it, and pay with **Apple Pay, Google Pay, credit card, or a bank transfer** in under 60 seconds. No more "the check is in the mail" calls.
- **Your data stays yours.** The CRM owns the customer records, the invoices, the project history, the photos, the estimates. Stripe is a payment pipe — nothing more. If you ever want to switch payment processors down the road (PayPal, Square, your bank's merchant services), you can. Your customer history doesn't live on Stripe's servers — it lives on yours.
- **Tax season gets simpler.** Stripe issues you a **1099-K** every January summarizing every dollar that came through it. The CRM tracks all your income and expenses next to each other, project by project. Your CPA can pull a clean CSV export of every transaction in seconds, instead of importing a tangled QB file.

## How a payment will work, end to end

Here is exactly what happens, start to finish, on a typical job.

1. **Tuesday afternoon — you finish the Buckhead repaint.** Marcus and Patrick walk the job with the homeowner, get the sign-off, load the truck. You open the CRM on your phone in the driveway and mark the project complete.
2. **You send the invoice.** Inside the CRM, you click **"Send Invoice"** on the project. The system pulls the line items straight from the estimate (interior walls, trim, two coats, ceiling repair on the dining room) and emails Mr. Smith a branded PDF invoice. Right at the top of that email is a big button that says **"Pay $14,500"**.
3. **Mr. Smith clicks the button.** It opens a Stripe-hosted payment page in his browser. He sees the invoice line items, the total, the property address, your company logo at the top. He has three ways to pay:
    - Credit card — Visa, Mastercard, Amex, Discover
    - Bank transfer (ACH) — he picks his bank from a list, logs into his bank for a moment to authorize, and the transfer is set up
    - Apple Pay or Google Pay if he is on his phone
4. **He pays.** Stripe runs the charge. He gets an instant email receipt with a PDF attached.
5. **Your CRM updates within seconds.** Stripe automatically pings the CRM (this notification is called a "webhook" — it just means Stripe tells the CRM the moment a payment lands). The invoice flips from **"Outstanding"** to **"Paid".** Brenda sees it green-checked in the morning. Nothing for her to do.
6. **The money lands in your bank.** Stripe deposits the funds into your business checking account **2 business days later** (Thursday). On your bank statement it shows up as a single deposit labeled **"STRIPE TRANSFER"** with the date.
7. **Done.** No follow-up calls. No "did you get my check?" No re-keying anything into QB. No reconciliation drama at month-end.

## What replaces what

| What you used QuickBooks for | What replaces it |
|---|---|
| Sending invoices | The CRM (admin/invoices/) |
| Tracking customers and their balances | The CRM (admin/customers/) |
| Tracking subcontractors and vendors | The CRM (admin/vendors/) |
| Recording payments | Automatic — Stripe tells the CRM the instant money arrives |
| Customer statements | The CRM (auto-generated, one click to email or PDF) |
| Estimates and proposals | The CRM (admin/estimates/) |
| Bills (subcontractor invoices coming in to you) | The CRM (admin/projects/{id}/bills/) |
| Chart of accounts | The CRM (admin/accounts/) — currently mirrored from QB; will become standalone |
| Payroll | **Still needs a separate tool.** We recommend Gusto — about **$40/month + $6/employee**. With ~10 employees that's roughly **$100/month**. QB Payroll can be cancelled. |
| Sales tax filing | Stripe Tax — built in, **$0 base + 0.5% per transaction** |
| Year-end 1099 generation | Stripe issues 1099-K to you automatically; CRM exports 1099-NEC for your subs |
| Bank reconciliation | Stripe dashboard plus your bank statement directly. Simpler than QB's three-way match. |
| Profit and loss reports | Coming in CRM Phase 4 (~30 days from go-live) |

## The honest tradeoffs

**What you give up.** QuickBooks has had 30 years to add features for small contractors. There are some niche things — handwritten estimates printed on custom paper sizes, integrations with specific local Atlanta software, a particular report format your old bookkeeper used — that won't have a one-click replacement on day one. We will build the things you actually use. If you tell me there is a QB feature you cannot live without, we will plan it. The good news is, after watching you work for the last six months, the list of things you genuinely use in QB is much shorter than the list of things QB advertises.

**What changes about your CPA relationship.** Your CPA is probably used to importing a QuickBooks company file at year-end. Tell them now, in May, that we are switching by fall — that gives them six months of runway. They will adapt. Any decent CPA in 2026 already works with several Stripe-based businesses; this is not exotic. The CRM exports a CSV of every transaction (date, customer, project, amount, fees, net deposit), which is what your CPA actually needs for a Schedule C and a sales tax return. If your CPA pushes back hard, that is a sign they are not investing in modern bookkeeping tools, and you may want to find a CPA who has already worked with Stripe-native contractors. Most have.

## Timeline

The doc you are holding is dated for the start of May 2026. Here is how the rollout looks from here.

- **This week (May 6 onward):** You sign up at stripe.com and complete identity verification. Section II walks through every screen, every box, every button click. Allow 30–45 minutes.
- **Within 1 week of approval:** Your stepson wires your approved Stripe account into the CRM. This is a one-time technical setup on his end — a few hours of work — and you don't have to do anything for it.
- **Mid-May to early June (parallel run):** Keep using QuickBooks for the older invoices that are already out the door. Send any **new** invoices through the CRM. Pick a friendly customer for the first one — somebody patient who will tell you if anything looks weird on their end. By the second or third invoice it will feel routine.
- **June through July:** Once you are comfortable, stop creating new invoices in QB entirely. Existing QB invoices finish through QB so you don't disrupt customers mid-stream.
- **~60 days from your Stripe sign-up (early July):** Cancel the QuickBooks Online subscription. Cancel QuickBooks Payments. Done.

## What this section covers vs the rest

This section is the big-picture plan. The rest of the document fills in the details. **Section II** is the step-by-step walkthrough of signing up at Stripe — exactly what to type into each box, what documents to have ready, what to expect in your inbox afterward. **Section III** is the day-to-day operations runbook — how you and Brenda will actually use the CRM to send invoices, look up payments, refund a customer, and run a monthly close, with screenshots from the live system. **Section IV** is the money: full cost breakdown, side-by-side comparison with what you pay today, frequently asked questions, and what to do if something goes wrong (a card gets declined, a customer disputes a charge, a deposit looks off). Read Sections II–IV in order when you are ready to act.
