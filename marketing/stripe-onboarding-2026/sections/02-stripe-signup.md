# Section II — What to Sign Up For at Stripe

This section walks you through creating a Stripe account for Bridgepointe Painting from scratch. Follow it in order. If something on the screen doesn't quite match what's written here, that's fine — Stripe occasionally tweaks button wording, but the order and the information they ask for stays the same. When in doubt, look for the button that does what the step says it should do.

Plan to set aside 30 to 45 uninterrupted minutes. Have your stepson or your friend on speakerphone if you want a second set of eyes, but you can absolutely do this alone.

## Before you start (gather these documents)

Get all of this in front of you BEFORE you click anything. The activation form is one long flow, and if you have to stop halfway through to dig up your EIN letter, you'll lose your place.

- **Business legal name** — exactly as it appears on your LLC paperwork (probably "Bridgepointe Painting LLC" or similar). Punctuation matters. If there's a comma, include it.
- **Federal EIN** — your 9-digit IRS tax ID. You'll find it on the LLC's articles of organization, on any past IRS letter, or on last year's tax return.
- **Business address** — the address registered with the IRS for the LLC, not necessarily your home. This must match IRS records exactly.
- **Phone number** — the business line, or your personal mobile if that's what customers use.
- **Personal SSN of the principal owner** — yes, your own Social Security Number. Stripe is required by federal law to verify a real human is behind every business account, even an LLC. This is called KYC (Know Your Customer) and is non-negotiable.
- **Personal date of birth and home address** — yours, the owner's.
- **Business bank account routing number and account number** — the routing number is 9 digits, on the bottom-left of a check. The account number is the longer number to the right of it. This is where Stripe will deposit your money.
- **A driver's license or passport** — Stripe sometimes asks for a photo ID upload. Usually they don't, but if your EIN doesn't match IRS records cleanly, they will.
- **Estimated annual revenue** — a rough number for the past year. You can ballpark it; nobody's going to audit you.

> **Tip:** Make a folder on your laptop called "Stripe Signup" and drop in PDFs of your EIN letter, articles of organization, and a voided check. If Stripe asks for these later, you'll have them ready in 30 seconds.

## Step 1 — Create the account

1. Open a browser tab and go to **stripe.com**.
2. Click the **Start now** button in the top-right corner of the page. Depending on which version of the homepage Stripe is showing, the button may say **Sign up** or **Get started** instead — they all go to the same place.
3. You'll see a signup form. Fill in:
   - **Email** — use a business email if you have one (something like billing@bridgepointepainting.com). Avoid a personal Gmail if you can help it.
   - **Full name** — your full legal name, as it appears on your driver's license.
   - **Country** — United States.
   - **Password** — make it strong. If you don't already use a password manager, this is a great moment to start. Recommend 1Password or Bitwarden. Do not reuse a password you use anywhere else.
4. Check the box agreeing to the Stripe Services Agreement.
5. Click **Create account**.
6. Stripe will send a verification email. Open your inbox, find the email from Stripe, and click the **Verify email** button inside it.
7. After verification, you'll land in the Stripe Dashboard at `dashboard.stripe.com`. **Bookmark this page now.** This is where you'll go forever afterward to check on payments, look up customers, and pull reports.

> **Tip:** If the verification email doesn't show up in 2 minutes, check your spam folder, then click the "Resend verification email" link in the Dashboard.

## Step 2 — Activate your account (the longer form)

After you log in for the first time, you'll see a panel near the top of the Dashboard that says something like **"Continue your activation"** or **"Activate your account."** Click into it.

This is the part that takes 20 to 30 minutes. It's one connected form across about 8 screens. Stripe needs all of this to comply with banking regulations — they can't deposit money into your account without verifying who you are and what your business does. You can save and come back, but try to do it in one sitting.

### Business details

- **Type of business**: choose **Company**, then on the next screen pick **LLC** (or the entity type your LLC is registered as).
- **Industry**: choose **Construction services**, **Building and trade services**, or **Home services** — whichever appears in their dropdown. **Important: do not pick "Other."** Stripe gets nervous when businesses pick "Other" and will ask follow-up questions.
- **Business website**: enter `bridgepointepainting.com`. If your site isn't live yet, a Facebook business page URL works temporarily, but a real website is much better.
- **Product description**: one clear sentence: "Residential painting and home remodeling services in Atlanta, GA."

### Tax info

- **EIN**: your 9-digit number, no dashes.
- **Legal business name**: must match the IRS letter exactly, character for character. If your LLC is "Bridgepointe Painting, LLC" with a comma, include the comma.
- **Business address**: street, city, state, ZIP — must match what the IRS has on file.

### Personal verification (the principal owner)

Stripe legally has to verify a real human is behind the account. This is required for every Stripe account in the United States.

- **Full legal name** — yours.
- **Date of birth**.
- **Home address** — your actual residence, not the business address.
- **Last 4 digits of SSN** — Stripe asks for this. If verification fails, they'll come back and ask for the full 9 digits, which is normal.
- **Title at the company** — Owner, Member, or President. Pick whichever matches your LLC paperwork.
- **Ownership percentage** — if you're the sole owner, enter 100%.

### Bank account

- **Routing number**: 9 digits, on the bottom-left of a paper check.
- **Account number**: the longer number to the right of the routing number.
- **Account type**: **Checking**.
- **Use the business checking account, not your personal account.** This keeps your books clean and makes life much easier at tax time.

### Customer support

This is the contact information customers see if they have questions about a charge.

- **Support email**: your business email, or a dedicated one like `billing@bridgepointepainting.com`.
- **Support phone**: your existing business number.
- **Statement descriptor**: 22 characters maximum, this is what shows up on your customer's credit card statement. Recommend `BRIDGEPOINTE PAINT` or `BRIDGEPOINTE ATL`. A clear descriptor prevents customers from disputing charges they don't recognize.
- **Shortened descriptor**: 5 to 22 characters. `BRIDGEPOINTE` works fine.

### Two-factor authentication

Stripe will require two-factor authentication (2FA). Don't skip this; don't pick the easy option.

> **Warning:** Use an **authenticator app** — Google Authenticator, Authy, or 1Password's built-in TOTP feature. **Do not use SMS text messages.** SMS-based 2FA can be defeated by SIM swap attacks, where a criminal calls your phone carrier, pretends to be you, and ports your number to their phone. Once they have your number, they can drain your Stripe account. App-based 2FA is far safer.

When Stripe shows the QR code, scan it with your authenticator app and enter the 6-digit code. Stripe will then give you **backup codes** — a list of 8 to 10 one-time-use codes. **Save these in your password manager immediately.** If you ever lose your phone, those codes are the only way back into your account.

## Step 3 — Submit for review

At the end of the activation flow, click **Submit application** (or **Activate account** — same button, sometimes labeled differently).

Stripe runs verification in the background. Most US small businesses with clean paperwork are approved within a few minutes. If Stripe needs more, they'll email you. Common requests:

- A copy of your EIN letter (IRS Form SS-4 or CP 575)
- Your articles of organization
- A voided check
- A photo of your driver's license

If you have those PDFs in the "Stripe Signup" folder we mentioned at the start, you can upload in 60 seconds. Most cases that need extra documents are resolved within 1 to 2 business days.

## Step 4 — Enable the right payment methods

Once approved, look at the left sidebar of the Dashboard. Click **Settings**, then **Payment methods**. Toggle these on:

- **Cards** — Visa, Mastercard, American Express, Discover. These are on by default; just verify they're enabled.
- **Apple Pay** and **Google Pay** — turn these on. They boost checkout completion by 10 to 15% because customers don't have to type in card numbers.
- **ACH Direct Debit** — US bank transfers. **Turn this on.** This is critical. ACH transactions cost roughly 0.8% capped at $5, versus around 2.9% + 30¢ for cards. For larger invoices, this is the single biggest fee saver in the whole setup.
- **Link by Stripe** — Stripe's saved-payment-methods feature. Turn it on.
- **Skip**: Alipay, WeChat Pay, and other international wallets, unless you suddenly start getting customers from China.

## Step 5 — Enable Invoicing

In the left sidebar, click **Products**, then **Invoicing**, then **Activate**.

This turns on Stripe's hosted invoice pages, which is what your CRM will use to send professional invoices. There's no extra cost on top of the standard processing fees. Free to activate.

## Step 6 — Enable Stripe Tax (optional but recommended)

In the left sidebar, click **Products**, then **Tax**, then **Get started**.

Stripe Tax adds 0.5% per transaction. In return, Stripe automatically calculates and collects the correct sales tax on every invoice based on the customer's billing address.

For Georgia residential painting, sales tax rules are quirky — labor is typically exempt, but materials are taxable, and the rules differ if the work is considered a capital improvement. Having Stripe handle it for 0.5% is almost always worth it. Talk to your CPA to confirm.

## Step 7 — Stripe Connect (skip for now)

A note. **Stripe Connect** is a separate product designed for marketplaces — companies like Uber that pay out to drivers. For Bridgepointe v1, **you do not need Connect.** Your business receives all payments directly into your business bank account.

If, down the road, you add a feature where customers pay subcontractors directly through your CRM, we'd enable Connect at that point. For now, leave it alone — it adds complexity you don't need.

## Step 8 — Save the API keys (this is what your stepson needs)

In the left sidebar, click **Developers**, then **API keys**. You'll see two values:

- **Publishable key** — starts with `pk_live_...` (or `pk_test_...` in test mode). Safe to share. Used in the front-end of your CRM.
- **Secret key** — starts with `sk_live_...` (or `sk_test_...`). **NEVER share in plain text.** Treat it like a password. If it leaks, anyone who has it can refund payments and pull customer data.

There are two complete sets of keys: **Test mode** (toggle at the top of the Dashboard) and **Live mode**. Use Test mode keys while your stepson is setting up the CRM. Switch to Live mode keys only when you're ready to take real money.

> **Warning:** Send the Live mode Secret key to your stepson via a password manager (1Password shared vault is ideal) or an encrypted message — **never plain email or text message.** A leaked secret key is an emergency.

He'll plug both keys into the CRM's environment variables on Vercel.

## Step 9 — Set up the webhook

A "webhook" is the mechanism Stripe uses to notify your CRM the instant a payment happens. Without it, your CRM wouldn't know an invoice got paid until you logged in and refreshed.

In the left sidebar, click **Developers**, then **Webhooks**, then **Add an endpoint**.

- **Endpoint URL**: `https://bridgepointepainting.com/api/stripe/webhook`
- **Events to send**: select **All events**. The CRM will filter on its own side.
- Click **Add endpoint**.
- After it's created, you'll see a value labeled **Signing secret**, starting with `whsec_...`. Click to reveal and copy it.

Send the signing secret to your stepson the same secure way you sent the API keys.

## What to expect after signing up

- **First payouts are delayed.** Stripe holds your first few transactions for about 7 days as a fraud-prevention buffer. After that, deposits arrive on a 2-business-day rolling schedule.
- **Test mode is free forever.** Run as many fake payments as you want at zero cost. Use this to verify the CRM is working end-to-end before flipping to Live mode.
- **Monthly fee statements arrive by email.** Save these. Your CPA will want them at year-end.
- **Disputes happen.** Occasionally a customer will dispute a charge with their bank. Stripe will email you and give you a chance to respond with documentation (the signed contract, photos of completed work). Respond promptly.

## Common gotchas

- **The address on Stripe MUST match the IRS exactly.** Even tiny differences — "Street" vs "St", "Suite 200" vs "Ste 200", an extra comma — can fail Stripe's automated verification. Copy the address character-for-character from your most recent IRS letter.
- **The bank account name must match the legal business name.** If your LLC is registered as "Bridgepointe Painting, LLC" but your bank has the account under "Bridgepointe Painting LLC" without the comma, Stripe's automated check may fail. Fix it by either updating the bank's record or asking the bank to issue a short letter confirming both names refer to the same entity.
- **Stripe sometimes asks for additional documents.** Articles of organization, EIN letter (IRS Form CP 575 or SS-4), a voided check. Have these ready as PDFs.
- **Don't lose your authenticator app.** If you switch phones or your phone breaks and you didn't save the backup codes, you'll be locked out of Stripe and recovery takes days. Save the backup codes in 1Password the moment Stripe gives them to you.
- **Don't skip the bookmark.** `dashboard.stripe.com` is your home base.
