import type { Metadata } from 'next';
import { Hero } from '@/components/home/hero';
import { ServicesPreview } from '@/components/home/services-preview';
import { FeaturedWork } from '@/components/home/featured-work';
import { CredibilityStrip } from '@/components/home/credibility-strip';
import { CTABanner } from '@/components/home/cta-banner';

export const metadata: Metadata = {
  title: 'Bridgepointe | #1 Luxury Painting Contractor in Atlanta, GA',
  description: 'Atlanta\'s premier high-end painting and remodeling contractor. Interior painting, exterior painting, cabinet refinishing & luxury home renovations in Buckhead, Alpharetta, Roswell, Marietta & Metro Atlanta. Free estimates. 18 years of excellence.',
  openGraph: {
    title: 'Bridgepointe | #1 Luxury Painting Contractor in Atlanta, GA',
    description: 'Premium interior, exterior & cabinet painting across Metro Atlanta. Meticulous craftsmanship. 240+ projects completed. 100% satisfaction rate.',
    url: 'https://bridgepointepainting.com',
  },
  alternates: { canonical: 'https://bridgepointepainting.com' },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What areas in Metro Atlanta does Bridgepointe serve?',
      acceptedAnswer: { '@type': 'Answer', text: 'Bridgepointe serves the entire Metro Atlanta area including Buckhead, Alpharetta, Roswell, Marietta, Sandy Springs, Milton, Kennesaw, Suwanee, Cobb County, and the greater Atlanta area.' },
    },
    {
      '@type': 'Question',
      name: 'How much does interior painting cost in Atlanta?',
      acceptedAnswer: { '@type': 'Answer', text: 'Interior painting costs in Atlanta range from $2–$4 per square foot for standard work to $4–$8 per square foot for premium finishes with full preparation. Bridgepointe provides free, detailed estimates for all projects.' },
    },
    {
      '@type': 'Question',
      name: 'What paint brands does Bridgepointe use?',
      acceptedAnswer: { '@type': 'Answer', text: 'Bridgepointe exclusively uses premium paints including Benjamin Moore Aura, Sherwin-Williams Emerald, and other top-tier brands. We believe the quality of the paint and primer is as important as the application.' },
    },
    {
      '@type': 'Question',
      name: 'Does Bridgepointe handle cabinet painting in Atlanta?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. Cabinet painting and refinishing is one of our signature services. We strip, sand, prime, and apply two topcoats of a spray-applied enamel finish for a factory-quality result on kitchen and bathroom cabinetry.' },
    },
    {
      '@type': 'Question',
      name: 'How long does exterior painting take for a house in Atlanta?',
      acceptedAnswer: { '@type': 'Answer', text: 'Exterior painting for a typical Atlanta home takes 5–10 business days, depending on size and scope. This includes pressure washing, scraping, caulking, priming, and two finish coats.' },
    },
    {
      '@type': 'Question',
      name: 'Does Bridgepointe offer a warranty on painting work?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. All Bridgepointe labor is warranted for two years from project completion. Paint materials carry the manufacturer\'s warranty (typically 15–25 years for premium lines like Benjamin Moore Aura).' },
    },
    {
      '@type': 'Question',
      name: 'Is Bridgepointe licensed and insured in Georgia?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. Bridgepointe is fully licensed, bonded, and carries $2 million in general liability insurance. Certificates of insurance are provided upon request.' },
    },
    {
      '@type': 'Question',
      name: 'What makes Bridgepointe different from other Atlanta painting companies?',
      acceptedAnswer: { '@type': 'Answer', text: 'Bridgepointe specializes in high-end residential projects where preparation and detail are paramount. We use premium zero-VOC paints, professional spray equipment for cabinetry, and senior craftsmen on every project — not subcontracted day labor.' },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Hero />
      <ServicesPreview />
      <FeaturedWork />
      <CredibilityStrip />
      <CTABanner />
    </>
  );
}
