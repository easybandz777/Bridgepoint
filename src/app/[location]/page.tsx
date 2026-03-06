import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AnimatedSection } from '@/components/shared/animated-section';
import { SERVICE_LOCATIONS, getLocationName } from '@/lib/locations';
import { LocationHero } from '@/components/home/location-hero';
import { CTABanner } from '@/components/home/cta-banner';

export async function generateStaticParams() {
  return SERVICE_LOCATIONS.map(loc => ({ location: loc.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ location: string }> }): Promise<Metadata> {
  const { location } = await params;
  const name = getLocationName(location);
  if (!name) return {};

  const fullName = `${name}, GA`;
  const BASE = 'https://bridgepointepainting.com';

  return {
    title: `Painting Contractor ${fullName} | Interior & Exterior Painting | Bridgepointe`,
    description: `Top-rated painting contractor in ${fullName}. Premium interior painting, exterior painting, cabinet refinishing & luxury home remodeling. Meticulous craftsmanship, Benjamin Moore certified, free estimates. 18+ years serving ${name} and Metro Atlanta.`,
    keywords: [
      `painting contractor ${name} GA`,
      `house painters ${name} Georgia`,
      `interior painting ${name}`,
      `exterior painting ${name}`,
      `painting company ${fullName}`,
      `residential painting ${name} GA`,
      `luxury painting ${name}`,
      `professional painters ${name}`,
      `cabinet painting ${name}`,
      `home painters near me ${name}`,
      `best painting company ${fullName}`,
      `${name} painting contractor`,
    ],
    openGraph: {
      title: `Painting Contractor in ${fullName} | Bridgepointe`,
      description: `Premium interior & exterior painting in ${fullName}. Meticulous prep, Benjamin Moore paints, 2-year warranty. Free estimates.`,
      url: `${BASE}/${location}`,
    },
    alternates: { canonical: `${BASE}/${location}` },
  };
}

export default async function LocationPage({ params }: { params: Promise<{ location: string }> }) {
  const { location } = await params;
  const name = getLocationName(location);
  if (!name) notFound();

  const locationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Painting Services in ${name}, GA`,
    provider: { '@type': 'LocalBusiness', name: 'Bridgepointe', url: 'https://bridgepointepainting.com' },
    areaServed: { '@type': 'City', name, addressRegion: 'GA' },
    description: `Premium interior painting, exterior painting, cabinet refinishing and home remodeling services in ${name}, Georgia.`,
    serviceType: 'Painting Contractor',
  };

  const nearby = SERVICE_LOCATIONS.filter(l => l.id !== location).slice(0, 5);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(locationSchema) }} />
      <LocationHero locationName={name} />

      {/* Services Section */}
      <section className="py-24 bg-[#111] border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <AnimatedSection>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b8956a] mb-3">Services in {name}, GA</p>
            <h2 className="font-serif text-4xl font-bold text-white mb-4">
              Professional Painting & Remodeling<br />in {name}, Georgia
            </h2>
            <p className="text-white/40 max-w-2xl leading-relaxed mb-12">
              Bridgepointe brings 18+ years of premium craftsmanship directly to {name} homeowners. Every project includes meticulous surface preparation, premium Benjamin Moore paints, and a full two-year labor warranty.
            </p>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: '🖌️', title: 'Interior Painting', href: '/interior-painting-atlanta', body: `Full interior painting for ${name} homes — walls, ceilings, trim, doors, and cabinetry.` },
              { icon: '🏠', title: 'Exterior Painting', href: '/exterior-painting-atlanta', body: `Pressure wash, prep, prime, and premium two-coat exterior finish for ${name} properties.` },
              { icon: '🔲', title: 'Cabinet Painting', href: '/cabinet-painting-atlanta', body: `Spray-applied enamel cabinet refinishing — factory-smooth finish at a fraction of replacement cost.` },
              { icon: '🛁', title: 'Bathroom Remodeling', href: '/select-services', body: 'Full bathroom renovations with tile, waterproofing, vanity, and licensed subcontractors.' },
              { icon: '🪵', title: 'Flooring', href: '/select-services', body: 'Hardwood, tile, LVP, and carpet installation by Bridgepointe craftsmen.' },
              { icon: '🏗️', title: 'Full Remodeling', href: '/select-services', body: 'Whole-home renovations managed from permits to punchlist.' },
            ].map(s => (
              <Link key={s.title} href={s.href}
                className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-7 hover:border-[#b8956a]/30 transition-all group">
                <span className="text-2xl mb-4 block">{s.icon}</span>
                <h3 className="font-serif text-lg font-bold text-white mb-2 group-hover:text-[#b8956a] transition-colors">{s.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{s.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Bridgepointe in this city */}
      <section className="py-24 bg-[#0f0f0f] border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <AnimatedSection>
            <h2 className="font-serif text-3xl font-bold text-white mb-10">
              Why {name} Homeowners Choose Bridgepointe
            </h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { stat: '18+', label: 'Years serving Metro Atlanta' },
              { stat: '240+', label: 'Projects completed' },
              { stat: '100%', label: 'Client satisfaction rate' },
              { stat: '2 Year', label: 'Labor warranty on all work' },
            ].map(s => (
              <div key={s.label} className="bg-[#1a1a1a] border border-white/6 rounded-2xl p-6 text-center">
                <p className="font-serif text-4xl font-bold text-[#b8956a] mb-2">{s.stat}</p>
                <p className="text-sm text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby locations for internal linking */}
      <section className="py-16 bg-[#111] border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-wider text-white/20 mb-4">Also Serving</p>
          <div className="flex flex-wrap gap-3">
            {nearby.map(loc => (
              <Link key={loc.id} href={`/${loc.id}`}
                className="text-sm text-white/40 hover:text-[#b8956a] transition-colors underline underline-offset-4 decoration-white/10 hover:decoration-[#b8956a]/40">
                Painting Contractor {loc.name}, GA
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
