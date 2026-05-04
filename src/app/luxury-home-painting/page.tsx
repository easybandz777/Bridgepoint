import type { Metadata } from 'next';
import Link from 'next/link';
import { breadcrumbSchema, faqSchema, serviceSchema, jsonLd } from '@/lib/seo';

const BASE = 'https://bridgepointepainting.com';
const HERO = '/images/gallery/painting/14.jpg';

export const metadata: Metadata = {
  title: 'Luxury Home Painting Atlanta, GA | High-End Interior & Exterior',
  description:
    'White-glove luxury home painting across Buckhead, Alpharetta, Roswell, Sandy Springs, and Milton. Conversion-varnish cabinet finishes, custom trim packages, geometric feature walls, and exterior repaints. 18+ years.',
  keywords: [
    'luxury home painting Atlanta', 'high end painters Atlanta', 'luxury painting contractor Atlanta GA',
    'estate painting Atlanta', 'luxury home painters Buckhead', 'high end painting Alpharetta',
    'luxury painting Sandy Springs', 'luxury painting Milton GA', 'premium painting Atlanta',
    'fine finish painters Atlanta', 'white glove painting service Atlanta',
  ],
  openGraph: {
    title: 'Luxury Home Painting Atlanta, GA | Bridgepointe',
    description:
      'White-glove luxury painting and finish carpentry across Metro Atlanta. Conversion-varnish cabinets, custom trim, dark trim packages, exterior repaints.',
    url: `${BASE}/luxury-home-painting`,
    images: [{ url: HERO, width: 1200, height: 630, alt: 'Luxury home painting — coffered ceiling kitchen' }],
  },
  alternates: { canonical: `${BASE}/luxury-home-painting` },
};

const faq = [
  {
    question: 'What makes Bridgepointe a luxury painting contractor?',
    answer:
      'Three things: a single dedicated crew on every job (not subcontracted finishers), spray-applied conversion-varnish on cabinetry, and prep that runs 60–70% of project hours. We treat every surface like the finish coat will be inspected at six inches.',
  },
  {
    question: 'Which Atlanta neighborhoods do you primarily work in?',
    answer:
      'Most of our luxury work is in Buckhead, Tuxedo Park, Brookhaven, Sandy Springs, Alpharetta, Milton, Roswell, Marietta\'s East Cobb, and Vinings. We also take projects in Suwanee, Kennesaw, and the broader Cobb and Fulton county areas.',
  },
  {
    question: 'Do you handle interior, exterior, and cabinets all in-house?',
    answer:
      'Yes. The same crew that does your interior repaint handles cabinet refinishing, exterior, trim, and feature walls. No handoffs to other companies, no inconsistent finish quality between project phases.',
  },
  {
    question: 'What is the typical investment for a luxury whole-home repaint?',
    answer:
      'Whole-home interior repaints in Metro Atlanta typically run $18,000–$40,000+ depending on square footage, ceiling height, trim complexity, and whether cabinetry is included. Estimates are free, on-site, and itemized.',
  },
  {
    question: 'Do you carry insurance and warranty your work?',
    answer:
      'Yes — fully insured, and every job carries a two-year labor warranty. We come back and fix anything that fails within that window, no questions asked.',
  },
];

const breadcrumbs = breadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Luxury Home Painting', url: '/luxury-home-painting' },
]);

const service = serviceSchema({
  name: 'Luxury Home Painting',
  description:
    'White-glove painting and finish carpentry for luxury homes across Metro Atlanta. Conversion-varnish cabinet finishes, custom trim packages, exterior repaints, and feature walls.',
  serviceType: 'Painting Contractor',
  priceRange: '$$$',
  image: HERO,
});

const fap = faqSchema(faq);

const pillars = [
  { stat: 'One Crew', label: 'Same team start to finish — no subcontracted finishers' },
  { stat: '60–70%', label: 'Of project hours spent on prep, not paint' },
  { stat: '2 Years', label: 'Labor warranty on every job, period' },
  { stat: '18+ Yrs', label: 'Of high-end painting in Metro Atlanta' },
];

const services = [
  { title: 'Whole-Home Interior Repaints', body: 'Walls, ceilings, trim, doors, and built-ins coordinated as one project. Color consultation included.', href: '/interior-painting-atlanta' },
  { title: 'Cabinet Refinishing', body: 'Doors removed, sprayed off-site in conversion varnish. Boxes masked and sprayed in place. Two-tone combinations a specialty.', href: '/cabinet-painting-atlanta' },
  { title: 'Exterior Repaints', body: 'Pressure wash, scrape, wood-rot repair, prime, and finish with coatings spec\'d for Atlanta UV and humidity.', href: '/exterior-painting-atlanta' },
  { title: 'Trim & Feature Walls', body: 'Custom slat walls, geometric paneling, board-and-batten, dark trim packages, picture-frame moulding. Built and finished on-site.', href: '/painting' },
];

export default function LuxuryHomePainting() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbs)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(service)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(fap)} />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end pb-20 pt-36 overflow-hidden bg-[#0f0f0f]">
        <div className="absolute inset-0">
          <img src={HERO} alt="Luxury Atlanta home — open kitchen with coffered ceiling, painted millwork, navy island" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-[#0f0f0f]/40" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b8956a] mb-4">Luxury Home Painting · Metro Atlanta</p>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight max-w-4xl">
            High-End Painting<br />
            <span className="text-[#b8956a]">For Atlanta&apos;s Finest Homes</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/70 leading-relaxed">
            One dedicated crew. Conversion-varnish cabinetry. Prep that runs 60–70% of the job. Bridgepointe is the painting contractor luxury Atlanta builders, designers, and homeowners call when the finish coat actually has to be perfect.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/contact" className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #b8956a, #9a7a54)', color: 'white' }}>
              Request a Consultation
            </Link>
            <Link href="/portfolio" className="px-8 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider border border-white/15 text-white hover:border-[#b8956a]/50 transition-colors">
              View Recent Work
            </Link>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 bg-[#111] border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {pillars.map(p => (
              <div key={p.label} className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-7 text-center">
                <p className="font-serif text-3xl font-bold text-[#b8956a] mb-2">{p.stat}</p>
                <p className="text-sm text-white/45 leading-relaxed">{p.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-[#0f0f0f] border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="font-serif text-4xl font-bold text-white mb-4">What Our Luxury Clients Hire Us For</h2>
          <p className="text-white/40 max-w-2xl mb-12 leading-relaxed">
            Four core service lines, all executed by the same crew. No coordination problems, no inconsistent finish quality between the cabinets and the walls.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {services.map(s => (
              <Link key={s.title} href={s.href} className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-7 hover:border-[#b8956a]/30 transition-all group">
                <h3 className="font-serif text-xl font-bold text-white mb-3 group-hover:text-[#b8956a] transition-colors">{s.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{s.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Neighborhood signal */}
      <section className="py-20 bg-[#111] border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-bold text-white mb-3">Where We Work</h2>
          <p className="text-white/40 max-w-2xl mb-10 leading-relaxed">
            Most of our luxury portfolio sits inside the perimeter and across Atlanta&apos;s northern crescent.
          </p>
          <div className="flex flex-wrap gap-3">
            {['buckhead', 'sandy-springs', 'alpharetta', 'milton', 'roswell', 'marietta', 'kennesaw', 'suwanee', 'cobb'].map(slug => {
              const labels: Record<string, string> = {
                buckhead: 'Buckhead', 'sandy-springs': 'Sandy Springs', alpharetta: 'Alpharetta',
                milton: 'Milton', roswell: 'Roswell', marietta: 'Marietta', kennesaw: 'Kennesaw',
                suwanee: 'Suwanee', cobb: 'Cobb County',
              };
              return (
                <Link key={slug} href={`/${slug}`} className="text-sm px-4 py-2 rounded-lg bg-[#1a1a1a] border border-white/6 text-white/55 hover:text-[#b8956a] hover:border-[#b8956a]/30 transition-colors">
                  {labels[slug]}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-[#0f0f0f] border-t border-white/5">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-bold text-white mb-12">Luxury Painting FAQs — Atlanta, GA</h2>
          <div className="space-y-5">
            {faq.map(q => (
              <div key={q.question} className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-7">
                <h3 className="font-semibold text-white mb-3">{q.question}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{q.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#111] border-t border-white/5 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-serif text-4xl font-bold text-white mb-4">Ready to Talk About Your Project?</h2>
          <p className="text-white/40 mb-10">On-site consultations are free and itemized. We measure, photograph, and walk every surface before quoting.</p>
          <Link href="/contact" className="inline-flex px-10 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #b8956a, #9a7a54)', color: 'white' }}>
            Schedule a Consultation
          </Link>
        </div>
      </section>
    </>
  );
}
