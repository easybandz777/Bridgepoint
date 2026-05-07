import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Bridgepointe',
  description:
    'How Bridgepointe collects, uses, stores, and protects information — including QuickBooks data accessed through our internal CRM.',
  alternates: { canonical: 'https://bridgepointepainting.com/privacy' },
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = 'May 7, 2026';

export default function PrivacyPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto max-w-3xl px-6 py-24 lg:px-8 lg:py-32">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
          Privacy Policy
        </p>
        <h1 className="mt-4 font-serif text-4xl font-bold text-charcoal md:text-5xl">
          Your privacy, in plain English.
        </h1>
        <p className="mt-4 text-sm text-slate">Effective {EFFECTIVE_DATE}</p>

        <div className="mt-12 max-w-none space-y-8 font-sans text-base leading-relaxed text-slate [&_a]:text-gold [&_a]:underline hover:[&_a]:text-charcoal [&_h2]:mt-10 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-charcoal [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_strong]:font-semibold [&_strong]:text-charcoal">
          <h2>1. Who we are</h2>
          <p>
            Bridgepointe (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) is a
            painting and remodeling business operating in the Atlanta metro
            area. This policy explains how we handle information collected
            through our website at{' '}
            <a href="https://bridgepointepainting.com">bridgepointepainting.com</a>{' '}
            and through our internal customer relationship management (CRM)
            system, including the QuickBooks Online integration that powers
            it.
          </p>

          <h2>2. Information we collect</h2>
          <p>
            <strong>From website visitors and prospects.</strong> When you
            request a quote, contact us, or interact with our site, we may
            collect your name, email address, phone number, project address,
            and any details you choose to share about the work you want done.
          </p>
          <p>
            <strong>From customers and vendors.</strong> When you become a
            customer, employee, subcontractor, or vendor, we collect business
            contact information, billing/payment details (such as invoice
            balances and payment status), insurance and license documentation
            where applicable, and project-related notes, photos, and files.
          </p>
          <p>
            <strong>From QuickBooks Online.</strong> We connect our CRM to a
            single QuickBooks Online company file (Bridgepointe&apos;s) to
            avoid double-entry between systems. Through that connection we
            access customer records, vendor records, items, accounts,
            estimates, invoices, bills, and payment status. We never connect
            to a customer&apos;s or vendor&apos;s own QuickBooks account —
            only Bridgepointe&apos;s.
          </p>
          <p>
            <strong>From employees and crew.</strong> Where applicable, we
            collect timesheet entries, employment-related documents, and
            information needed to issue secure portal credentials.
          </p>

          <h2>3. How we use information</h2>
          <ul>
            <li>To respond to inquiries and prepare estimates.</li>
            <li>
              To deliver painting and remodeling services, schedule work, and
              communicate with customers, employees, and subcontractors about
              ongoing projects.
            </li>
            <li>
              To bill, accept payment, and reconcile financial activity
              between our CRM and QuickBooks Online.
            </li>
            <li>
              To run the operational side of our business — payroll,
              compliance, vendor management, and recordkeeping.
            </li>
            <li>
              To improve our services, troubleshoot bugs, and make
              data-informed decisions about how we operate.
            </li>
          </ul>

          <h2>4. How we share information</h2>
          <p>
            We do not sell personal information. We share information only
            with parties who help us run the business, including:
          </p>
          <ul>
            <li>
              <strong>Intuit / QuickBooks Online</strong> — to sync
              accounting data between our CRM and our books.
            </li>
            <li>
              <strong>Vercel</strong> — our website and CRM are hosted on
              Vercel&apos;s infrastructure.
            </li>
            <li>
              <strong>Neon</strong> — our database provider, where CRM data
              is stored at rest.
            </li>
            <li>
              <strong>Payment processors</strong> (such as Stripe, where
              applicable) — to process electronic payments. We do not store
              full credit-card numbers on our servers.
            </li>
            <li>
              <strong>Service professionals</strong> — accountants, legal
              counsel, and similar advisors as needed.
            </li>
            <li>
              <strong>Government and regulators</strong> — when required by
              law (e.g., tax filings, lawful subpoenas).
            </li>
          </ul>

          <h2>5. How we store and protect information</h2>
          <p>
            CRM data is stored in an encrypted PostgreSQL database (Neon),
            accessed over TLS. OAuth tokens for our QuickBooks connection are
            held server-side and never exposed to the browser. Access to the
            CRM admin is restricted to authenticated Bridgepointe staff;
            crew members get scoped portal access only to their own work.
          </p>
          <p>
            No system is perfectly secure. If we ever discover a breach
            affecting personal information, we&apos;ll act promptly to
            contain it and notify affected parties as required by applicable
            law.
          </p>

          <h2>6. How long we keep information</h2>
          <p>
            We retain customer, vendor, employee, and project information
            for as long as it&apos;s needed to run the business, satisfy
            tax/accounting obligations, or resolve disputes — typically
            seven years for financial records. If you ask us to delete your
            information and we&apos;re not legally required to keep it,
            we&apos;ll delete it within 30 days.
          </p>
          <p>
            If we disconnect our CRM from QuickBooks, our access tokens are
            revoked immediately and the cached QuickBooks data is purged
            from the CRM within 30 days unless required for an open project
            or financial record.
          </p>

          <h2>7. Your rights</h2>
          <p>You can ask us to:</p>
          <ul>
            <li>See what information we have about you.</li>
            <li>Correct information that&apos;s wrong.</li>
            <li>
              Delete information we&apos;re not legally required to keep.
            </li>
            <li>Opt out of marketing communications.</li>
          </ul>
          <p>
            Email us at{' '}
            <a href="mailto:Bridgepointefloors@gmail.com">
              Bridgepointefloors@gmail.com
            </a>{' '}
            to make a request and we&apos;ll respond within a reasonable
            time.
          </p>

          <h2>8. Cookies and analytics</h2>
          <p>
            Our website uses essential cookies needed for the site to work,
            and may use privacy-respecting analytics to understand traffic
            patterns. We do not run advertising trackers, retargeting
            pixels, or fingerprinting. Your browser&apos;s &quot;Do Not
            Track&quot; signal is honored.
          </p>

          <h2>9. Children</h2>
          <p>
            Our services are not directed to children under 13, and we do
            not knowingly collect information from them.
          </p>

          <h2>10. Changes to this policy</h2>
          <p>
            We may update this policy as the business evolves. The
            effective date at the top reflects the most recent change.
            Material changes will be communicated through this page.
          </p>

          <h2>11. Contact</h2>
          <p>
            <strong>Bridgepointe</strong>
            <br />
            Atlanta Metro Area, GA
            <br />
            <a href="mailto:Bridgepointefloors@gmail.com">
              Bridgepointefloors@gmail.com
            </a>
            <br />
            (862) 421-8973
          </p>
        </div>
      </section>
    </main>
  );
}
