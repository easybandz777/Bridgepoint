# Section IV — Costs, FAQ, and Risk

This section is the honest money conversation. What Stripe costs. What QuickBooks costs today. What you actually save. Where the risks are. What we need from you to get this off the ground.

No spin. Real numbers.

## Cost comparison

### Stripe pricing (2026)

| Payment method | Fee | Capped? |
|---|---|---|
| Card (Visa, MC, Amex, Discover) | **2.9% + $0.30** per successful charge | No |
| Card-present (in-person) | 2.7% + $0.05 | No |
| ACH Direct Debit (bank transfer) | **0.8%** | **Yes — $5 max** |
| Apple Pay / Google Pay | Same as card (2.9% + $0.30) | No |
| International cards | +1.5% | No |
| Stripe Tax (optional) | +0.5% per transaction | No |
| Disputes (lost) | $15 fee per dispute | — |
| Refunds | Original processing fee NOT returned | — |
| Monthly fee | **$0** | — |

Two things to notice. First, the ACH cap at **$5**. That alone is the single biggest fee win for a contractor with $5K–$50K invoices. Second, there is no monthly fee. You only pay when money moves.

### QuickBooks Online + QB Payments (current)

| Item | Cost |
|---|---|
| QuickBooks Online Plus (typical for a contractor this size) | $99/month = **$1,188/year** |
| Or QuickBooks Online Advanced | $235/month = $2,820/year |
| QB Payments — Card | 2.9% + $0.25 per transaction |
| QB Payments — ACH | 1% (capped at $10) |
| QB Payroll (if used) | $50–$95/month base + $6–$12/employee |

QB card pricing is a hair cheaper per transaction ($0.25 vs $0.30 fixed fee). The difference vanishes the moment your average invoice exceeds about $200, which it always does for you. The ACH gap is wider: 1% capped at $10 vs 0.8% capped at $5. Stripe wins ACH on every invoice over $625.

### Real annual savings calculation

Here's the math in plain language. The assumptions are conservative on purpose — if anything, the real numbers will be better.

- **Annual revenue assumption**: $1.2M (240 jobs × $5K avg invoice — most jobs are split into 2–3 invoices, so the per-invoice average is much lower than the $145K per-job average)
- **Mix assumption**: 30% paid by card, 60% paid by ACH/check, 10% other
- **Card volume**: $360,000/yr → 0% change in fees (Stripe and QB are basically tied: 2.9% vs 2.9%)
- **ACH volume**: $720,000/yr
  - QB ACH: 1% capped at $10. Avg invoice $5K means the $10 cap hits on every single ACH payment → ~$1,440/yr in fees ($10 × ~144 ACH invoices)
  - Stripe ACH: 0.8% capped at $5. Same invoice flow → ~$720/yr in fees
  - **ACH savings: ~$720/yr**
- **QB subscription**: $99–$235/month canceled = **~$1,200–$2,800/yr saved**
- **Time saved by Brenda** (no manual reconciliation): conservatively 2 hours/week × $30/hr loaded = **$3,000/yr saved in office time**
- **Faster cash collection** (Stripe deposits 2 days vs QB 3–5): on $1.2M revenue, ~$10K of working capital freed up earlier = **$300/yr in financing benefit at 3% short-term cost of capital**

**Total realistic annual savings: $5,200 – $6,800**

But here's the thing. The dollar number is real but it's not the point. The bigger value is operational. Brenda doesn't chase invoice payments anymore — the system does. Customers actually pay (because it's a click in an email, not a "log in to QuickBooks customer portal" experience). The CRM becomes the single source of truth for revenue, which means at year-end you and your CPA aren't reconciling two systems that don't agree. That's worth more than the dollar savings.

## What about the QB subscription — when do I cancel?

Don't cancel QuickBooks Day 1. That would be reckless. You need to keep QB running through three milestones, in order:

1. **All invoices created in QB have been paid or written off.** Give yourself 60 days from cutover. Anything still open after 60 days is either getting paid offline (record it manually) or it's never getting paid (write it off).
2. **Year-end 1099-NEC forms have been issued for any subs paid through QB this calendar year.** This is the IRS deadline of January 31 of the following year. If you cut over in October 2026, you'll still need QB through end of January 2027 to issue the 1099s for 2026 sub payments that ran through QB.
3. **Your CPA has the QB data export they need for the prior year.** Ask the CPA what format they want before you cancel. Most want the QBO file plus PDFs of the year-end P&L and balance sheet.

Once those three are done, cancel. Save the QB exports as PDFs and CSVs in a permanent archive folder on Google Drive. If anyone ever audits 2024–2026, you have it. You don't need to keep paying QB $99/month for read-only access to data you've already exported.

## Risks and mitigations

Here's the honest list of things that could go wrong and what we do about each.

### "What if Stripe locks my account?"

It happens. Stripe has been known to freeze accounts for 30+ days when a sudden transaction pattern looks suspicious — large infrequent charges from a brand-new account is exactly the pattern that trips their fraud system. **Mitigations**:

- Tell Stripe upfront what your business does (large infrequent invoices for residential construction). There's a free-text field during sign-up for this. Stripe is fine with construction — it's their bread and butter for B2B and home services.
- Don't run a sudden burst of large card transactions in week 1. Start with smaller invoices, ramp up over the first month.
- Keep ~2 weeks of operating cash in a separate account so a payout pause doesn't cripple operations. (You should be doing this anyway, with or without Stripe.)
- **Backup processor**: open a Square account too (free, takes 10 minutes). Never use it unless Stripe has an issue. It's insurance, not a primary tool.

### "What if my CPA doesn't like this?"

Most CPAs working with construction businesses now use Stripe-native exports — Stripe is bigger than QB Payments at this point and every accounting firm has seen it. If yours hasn't:

- Show them the CSV export from the CRM. It includes every invoice, every payment, every fee, every refund — everything they need.
- If they insist on QuickBooks-format data, ask if they support the QBO export format (most CRMs can output it; we'll add it in Phase 4).
- Worst case: keep QB at the cheapest tier (~$35/month for Simple Start) for the CPA's convenience, even after you migrate operations off it. $420/year is cheap insurance against accountant friction.

### "What if the website goes down?"

The CRM runs on Vercel. Vercel has 99.99% uptime — that's about 53 minutes of downtime per year. If the CRM is down:

- Stripe payment pages still work. They're hosted by Stripe directly at stripe.com, not by us.
- Customers can still pay invoices that were already sent — the invoice email contains a Stripe-hosted link.
- The CRM catches up when it's back online. Stripe queues the webhook events and re-delivers them.

In practice you'd probably never notice an outage unless it happened during the exact minute you tried to log in.

### "What if Stripe doubles the fees overnight?"

They can. So can QB. So can any vendor. Mitigations:

- Read Stripe's monthly emails. Pricing changes get 30+ days advance notice.
- The CRM is processor-agnostic. If Stripe's pricing ever becomes uncompetitive, we can switch to Adyen, Authorize.net, or Square in 1–2 weeks of dev work. The customer experience doesn't change — they still click a link, still pay with a card or bank, still get a receipt. Only the back-end processor is different.

### "What if I don't trust putting my customers' card data in Stripe?"

Stripe is the most heavily-audited payment processor in the world. PCI Level 1 certified, SOC 2 Type II compliant, used by Amazon, Shopify, Lyft, Salesforce, and a long list of Fortune 500s. Your customers' card data is, statistically, safer at Stripe than it is in QB Payments (which is built on top of Intuit's older payment infrastructure).

The CRM never sees raw card numbers. They go directly from the customer's browser to Stripe — we get back a token that says "card ending in 4242, charged $5,000." Even if someone hacked the CRM tomorrow, there are no card numbers to steal.

## FAQ

**1. Can my customers still pay by check?** Yes. Mail a check, hand it to you on-site, whatever. You record the payment manually in the CRM. Stripe is just for the digital payments — the CRM tracks all payment methods equally.

**2. Will my customers see "Stripe" on their statement?** No. They'll see whatever you set as the statement descriptor — recommend "BRIDGEPOINTE PAINT" or similar. Familiar to your customers. Stripe never shows up on their bank statement.

**3. What if a customer pays the wrong amount?** Stripe accepts partial payments if you enable that on the invoice. Otherwise the customer can only pay the exact amount. We'll set it up to allow partial payments since construction often has progress invoicing — the customer might pay $20K of a $50K invoice as a milestone.

**4. Can I take a deposit before starting work?** Yes. Issue an invoice for the deposit (e.g., 30%), they pay through Stripe, you start work. Issue final invoice for the balance when you finish. Both invoices live under the same job in the CRM, so you can see at a glance what's been collected and what's still owed.

**5. What about international customers?** Stripe handles them automatically. The fee is +1.5% on top of the card fee. For a residential painting business in Atlanta this is rare, but if a snowbird from Ontario hires you to paint their second home, it just works.

**6. What if I need to issue a 1099 for a subcontractor?** The CRM tracks every payment to every subcontractor by name and EIN. At year-end, the CRM exports a 1099-NEC ready file. (Phase 4, ~30 days out.) For now, run 1099s through QB while you transition.

**7. What if I want a phone number to call Stripe at?** Stripe support is email + chat first, but they DO have phone support for businesses doing >$10K/month — which you qualify for several times over. The phone number's in the Dashboard under Help. They actually answer.

**8. Will my old QB customers automatically be in the new system?** Yes. We've built an import tool that pulls every QB customer into the CRM (Section IV of the QB integration document). This already works — we tested it on a sample export.

**9. What if I want to go back to QB?** Easy. The CRM exports everything in QB-compatible CSV — customers, invoices, payments, refunds. You'd lose the Stripe payment integration but the data is yours. There's no lock-in.

**10. Can I see a demo before signing up?** Yes. We can run Stripe in **test mode** indefinitely — fake card numbers (4242 4242 4242 4242 is the famous one), fake bank accounts, no real money moves. Try it, kick the tires, send yourself a fake invoice, then activate live mode when you're comfortable.

## What we need from you (action items)

- [ ] Confirm the LLC's exact legal name (must match IRS letter character-for-character)
- [ ] Get the EIN from the IRS letter or the CPA
- [ ] Confirm the business bank account (the one Stripe should deposit into) — routing and account number
- [ ] Sign up at stripe.com following Section II
- [ ] Send your stepson the API keys + webhook signing secret via 1Password (NOT email)
- [ ] Schedule a 30-minute call after sign-up to do the first test charge together
- [ ] Tell your CPA we're switching processors (so they're not surprised at year-end)
- [ ] Tell Brenda to read Section III before go-live

That's it. Eight items. Most of them take less than 5 minutes each. The Stripe sign-up itself is the longest item at 20–40 minutes.

## What we're NOT changing yet

End on the reassuring note. Things that are NOT changing:

- Your bank stays the same.
- Your customers stay the same — they don't have to do anything.
- The phone number stays the same.
- Your existing crew portal at `/portal` stays the same.
- QB stays running for ~60 days as a backup until you're comfortable.
- Your day-to-day work — quotes, jobs, crews — doesn't change at all.

The only thing changing is **how money flows in**. From "QuickBooks emails an invoice, customer logs into a portal, money lands in QB, money sweeps to bank" to "CRM emails an invoice, customer clicks a link, money lands at Stripe, money sweeps to bank." Same end result, fewer steps, lower fees, faster.

This is a controlled migration, not a leap.
