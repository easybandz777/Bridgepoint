import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Bridgepointe',
  description:
    'Terms governing the use of the Bridgepointe website and CRM, including the QuickBooks Online integration.',
  alternates: { canonical: 'https://bridgepointepainting.com/terms' },
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = 'May 7, 2026';

export default function TermsPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto max-w-3xl px-6 py-24 lg:px-8 lg:py-32">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
          Terms of Service
        </p>
        <h1 className="mt-4 font-serif text-4xl font-bold text-charcoal md:text-5xl">
          The rules of the road.
        </h1>
        <p className="mt-4 text-sm text-slate">Effective {EFFECTIVE_DATE}</p>

        <div className="mt-12 max-w-none space-y-8 font-sans text-base leading-relaxed text-slate [&_a]:text-gold [&_a]:underline hover:[&_a]:text-charcoal [&_h2]:mt-10 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-charcoal [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_strong]:font-semibold [&_strong]:text-charcoal">
          <h2>1. Who these terms apply to</h2>
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to
            and use of the Bridgepointe website at{' '}
            <a href="https://bridgepointepainting.com">bridgepointepainting.com</a>,{' '}
            our internal customer relationship management (CRM) system, and
            our QuickBooks Online integration (collectively, the
            &quot;Service&quot;). By using the Service you agree to these
            Terms.
          </p>

          <h2>2. The Service</h2>
          <p>
            Bridgepointe is a painting and remodeling business operating in
            the Atlanta metro area. The Service includes our public website
            (where prospects can request quotes and learn about our work),
            our internal CRM (which our staff and crew use to run projects,
            issue estimates, track time, and bill), and a QuickBooks Online
            integration that keeps our books in sync with the CRM.
          </p>
          <p>
            The Service is operated by Bridgepointe and is intended primarily
            for our own internal business use, our customers, and our crew.
            It is not a multi-tenant SaaS product; we do not connect to other
            businesses&apos; QuickBooks files.
          </p>

          <h2>3. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>
              Access the Service without authorization, attempt to bypass
              authentication, or interfere with how it operates.
            </li>
            <li>
              Use the Service to send spam, harass others, or distribute
              malware.
            </li>
            <li>
              Reverse-engineer, scrape, or copy the Service except as
              expressly permitted.
            </li>
            <li>
              Upload content that infringes anyone&apos;s rights or violates
              applicable law.
            </li>
            <li>
              Use the Service in a way that puts other users&apos; data or
              the integrity of the QuickBooks integration at risk.
            </li>
          </ul>

          <h2>4. Accounts and credentials</h2>
          <p>
            Some parts of the Service require an account or PIN — for
            example, our admin CRM and the crew portal. You are responsible
            for keeping your credentials confidential and for activity that
            occurs under your account. Notify us promptly if you believe
            your credentials have been compromised.
          </p>

          <h2>5. QuickBooks integration</h2>
          <p>
            Our CRM connects to a single QuickBooks Online company file
            owned by Bridgepointe. By authorizing the connection, an
            authorized Bridgepointe administrator agrees that the CRM may
            read accounting data (customers, vendors, items, accounts,
            estimates, invoices, bills, payment status) and write
            corresponding records back to QuickBooks. The connection can be
            revoked at any time from the CRM admin or from the Intuit
            App Store.
          </p>

          <h2>6. Customer engagements</h2>
          <p>
            These Terms govern the Service itself. Any painting,
            remodeling, or other physical-world work we do for a customer
            is governed by the separate written estimate, contract, and/or
            change orders specific to that engagement. If those documents
            conflict with these Terms about the engagement scope, the
            engagement-specific document controls.
          </p>

          <h2>7. Intellectual property</h2>
          <p>
            The Service — including software, copy, photographs, video,
            logos, and design — is owned by Bridgepointe or licensed to us
            and is protected by copyright, trademark, and other laws. You
            may use the public portions of our website for personal,
            non-commercial purposes. Anything else (republishing,
            redistributing, or using our content in your own work) requires
            our written permission.
          </p>
          <p>
            Photos and other content you submit to us in connection with a
            project remain yours; you grant us a non-exclusive license to
            use them as needed to deliver the Service and, where you allow
            it, in our portfolio.
          </p>

          <h2>8. Disclaimer of warranties</h2>
          <p>
            The Service is provided <strong>&quot;as is&quot;</strong> and{' '}
            <strong>&quot;as available.&quot;</strong> We don&apos;t
            guarantee the Service will be error-free, uninterrupted, or
            free from security vulnerabilities. To the maximum extent
            permitted by law, we disclaim all warranties, express or
            implied, including warranties of merchantability, fitness for
            a particular purpose, and non-infringement.
          </p>

          <h2>9. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, Bridgepointe will not
            be liable for any indirect, incidental, special, consequential,
            or punitive damages arising out of or related to the Service,
            including lost profits, lost data, or business interruption,
            even if we&apos;ve been advised of the possibility. Our total
            liability for any claim arising out of the Service is limited
            to the greater of (a) the amount you&apos;ve paid us for the
            Service in the 12 months before the claim arose, or (b) one
            hundred dollars (US$100). Nothing in these Terms limits
            liability that cannot be limited by law.
          </p>

          <h2>10. Indemnification</h2>
          <p>
            You agree to defend and indemnify Bridgepointe against
            third-party claims arising from your misuse of the Service, your
            violation of these Terms, or your infringement of another
            party&apos;s rights through the Service.
          </p>

          <h2>11. Termination</h2>
          <p>
            We may suspend or terminate access to the Service if you violate
            these Terms or if we need to discontinue the Service. You may
            stop using the Service at any time. Provisions that by their
            nature should survive termination (intellectual property,
            disclaimers, limitation of liability, governing law) will
            survive.
          </p>

          <h2>12. Governing law</h2>
          <p>
            These Terms are governed by the laws of the State of Georgia,
            United States, without regard to conflict-of-laws principles.
            The exclusive venue for any dispute is the state and federal
            courts located in Fulton County, Georgia.
          </p>

          <h2>13. Changes</h2>
          <p>
            We may update these Terms as the business evolves. The
            effective date at the top reflects the most recent change.
            Material changes will be communicated through this page or
            directly to active users where practical.
          </p>

          <h2>14. Contact</h2>
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
