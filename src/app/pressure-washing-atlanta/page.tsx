import type { Metadata } from 'next';
import { breadcrumbSchema, jsonLd } from '@/lib/seo';
import { PWHero } from '@/components/pressure-washing/hero';
import { HotWaterDifference } from '@/components/pressure-washing/hot-water-difference';
import { ServicesGrid } from '@/components/pressure-washing/services-grid';
import { Process } from '@/components/pressure-washing/process';
import { VsTypical } from '@/components/pressure-washing/vs-typical';
import { ServiceArea } from '@/components/pressure-washing/service-area';
import { Transformations } from '@/components/pressure-washing/transformations';
import { PWFaq } from '@/components/pressure-washing/faq';
import { TrustCTA } from '@/components/pressure-washing/trust-cta';

const BASE = 'https://bridgepointepainting.com';
const URL = `${BASE}/pressure-washing-atlanta`;
const HERO = '/images/gallery/painting/52.jpg';

export const metadata: Metadata = {
  title: 'Hot Water Pressure Washing Atlanta, GA | 200°F Mold Killer | Bridgepointe',
  description:
    'Hot-water pressure washing across Metro Atlanta. 200°F kills mildew at the root, dissolves grease, halves cleaning time. House wash, soft wash, driveway, roof, deck, and commercial. 2-year guarantee.',
  keywords: [
    'hot water pressure washing Atlanta',
    'soft wash Atlanta',
    'driveway cleaning Atlanta',
    'house washing Atlanta',
    'commercial pressure washing Atlanta GA',
    'pressure washing Atlanta',
    'pressure washing contractor Atlanta',
    'roof soft wash Atlanta',
    'roof cleaning Atlanta',
    'deck cleaning Atlanta',
    'concrete cleaning Atlanta',
    'mildew removal Atlanta',
    'algae removal Atlanta',
    'restaurant pressure washing Atlanta',
    'dumpster pad cleaning Atlanta',
    'pressure washing Buckhead',
    'pressure washing Sandy Springs',
    'pressure washing Roswell',
    'pressure washing Alpharetta',
    'pressure washing Marietta',
    'pressure washing East Cobb',
    'pressure washing Milton',
    'pressure washing Dunwoody',
    'pressure washing Brookhaven',
    'pressure washing Johns Creek',
    '200 degree pressure washing Atlanta',
    'mold removal pressure washing Atlanta',
  ],
  openGraph: {
    title: 'Hot-Water Pressure Washing Atlanta, GA | 200°F Mold Killer | Bridgepointe',
    description:
      '200°F kills mildew at the root. House wash, soft wash, driveway, roof, deck, and commercial. Two-year guarantee. Free on-site estimates.',
    url: URL,
    images: [
      {
        url: HERO,
        width: 1200,
        height: 630,
        alt: 'Bridgepointe hot-water pressure washing — Metro Atlanta',
      },
    ],
  },
  alternates: { canonical: URL },
};

// ---------- JSON-LD ----------

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Hot-Water Pressure Washing',
  description:
    'Hot-water pressure washing across Metro Atlanta. 200°F kills mildew at the root, dissolves grease, and cuts cleaning time in half. House wash, soft wash, driveway, roof, deck, and commercial accounts. Two-year guarantee on exterior cleaning.',
  serviceType: 'Pressure Washing Contractor',
  provider: {
    '@type': 'LocalBusiness',
    name: 'Bridgepointe',
    url: BASE,
    telephone: '+1-862-421-8973',
    image: `${BASE}${HERO}`,
    areaServed: { '@type': 'State', name: 'Metro Atlanta, Georgia' },
  },
  areaServed: { '@type': 'State', name: 'Metro Atlanta, Georgia' },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '125',
    highPrice: '8000',
  },
};

const faqs = [
  {
    question: 'Is hot-water pressure washing actually different from cold-water?',
    answer:
      'Yes. Hot water at 200°F sterilizes the spore — it kills mildew, mold, and algae at the root rather than just rinsing the surface. Cold-water rigs can clean what you can see today, but the same streaks return in 60–90 days because the biological organism is still alive in the substrate. Heat is also a degreaser: a single pass on a restaurant pad with 200°F water does what three passes with cold water cannot. That is why Bridgepointe can offer a two-year guarantee.',
  },
  {
    question: 'Why does the mold and algae always come back so fast?',
    answer:
      'Atlanta humidity, hardwood canopy shade, and heavy pollen seasons are perfect breeding conditions for mildew. Cold-water washes only rinse the top layer; the spore stays alive inside the surface and re-blooms in weeks. Hot water at 200°F plus the right soft-wash chemistry sterilizes the spore. Combined with a written two-year guarantee, that is why Bridgepointe customers see clean siding eighteen-plus months later instead of three.',
  },
  {
    question: 'What is the difference between soft wash and pressure wash?',
    answer:
      'Soft wash uses low pressure (under 500 PSI), high heat, and a cleaning solution matched to the surface — vinyl, brick, painted wood, stucco, or roof shingles. The chemistry does the cleaning; the water carries it. Pressure wash uses high PSI through a surface cleaner and is reserved for concrete and masonry. Bridgepointe soft-washes anything that paint touches and only brings the high-PSI surface cleaner out for the driveway and patio.',
  },
  {
    question: 'How much does pressure washing cost in Atlanta?',
    answer:
      'Whole-house soft wash starts at $250. Driveway cleaning starts at $125. House + driveway bundle is $325. Roof soft wash starts at $400. Deck cleaning starts at $250. A full exterior bundle (house + driveway + roof) is $700. Commercial accounts run $125–$8,000+ depending on scope — restaurant exhaust pads from $250 per visit, dumpster pads from $125 per visit. Every quote is written, itemized, and on-site at no charge.',
  },
  {
    question: 'How often should I have my house pressure washed in Atlanta?',
    answer:
      'House siding every 18 months. Roof every 24 months. Driveway annually. Deck annually with a fresh seal every 2–3 years. Atlanta humidity, tree canopy, and pollen season cycle make this market faster to re-soil than most. Bridgepointe will calendar the next visit so you do not have to track it — and the two-year guarantee covers anything that comes back early.',
  },
  {
    question: 'What surfaces can you safely clean?',
    answer:
      'Vinyl siding, painted wood, brick, stucco, fiber-cement (Hardie), composite and natural-wood decks, asphalt and architectural roof shingles, concrete driveways and walkways, paver patios, retaining walls, fences, gutters (exterior face and brightening), pool decks, and commercial concrete. We pre-wet every plant on the property, mask outlets and HVAC vents, and inspect for soft mortar or chalking paint before any cleaning solution is applied.',
  },
  {
    question: 'Do you handle commercial pressure washing accounts?',
    answer:
      'Yes — restaurants, retail centers, HOAs, multifamily, medical, and light industrial. Hot water is non-negotiable on commercial because grease, food residue, and gum require heat to lift cleanly. Recurring schedules (weekly, monthly, quarterly) are standard. Restaurant exhaust pads and dumpster pads run before opening or after close so we never interrupt operations. Certificate of insurance available on request.',
  },
  {
    question: 'Do you offer a real guarantee on pressure washing?',
    answer:
      'Yes. Two-year written guarantee on every exterior cleaning. If mildew or algae returns inside 24 months, Bridgepointe re-treats the affected area free of charge — no fine print, no second invoice. The guarantee is printed on the receipt the day we finish the job. The reason we can offer it: 200°F hot water sterilizes the spore, not just the surface.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

const breadcrumbs = breadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Painting', url: '/painting' },
  { name: 'Pressure Washing Atlanta', url: '/pressure-washing-atlanta' },
]);

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Bridgepointe Hot-Water Pressure Washing Process',
  description:
    'Six-step Bridgepointe pressure-washing process — assessment through walkthrough — engineered for a clean that holds for two years.',
  totalTime: 'PT4H',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Assessment',
      text: 'Walk the property with the homeowner. Mark fragile plants, locate outlets and HVAC vents, check for loose siding, soft mortar, or chalking paint before any water touches the structure.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Surface Prep',
      text: 'Pre-wet every plant on the property with fresh water. Mask outlets, exterior fixtures, and HVAC intakes. Boxwoods stay alive — that is the test.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Hot Water + Degreaser Application',
      text: 'Apply soft-wash chemistry or surface degreaser matched to the substrate. Vinyl, brick, stucco, painted wood, roof shingles, and concrete each get a different solution. Hot water carries the chemistry into the surface.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Soft Wash on Delicate Surfaces',
      text: 'Roof, painted wood, vinyl siding, and stucco are cleaned at low pressure (under 500 PSI) with 200°F water. The heat and chemistry do the work — never the pressure.',
    },
    {
      '@type': 'HowToStep',
      position: 5,
      name: 'Final Rinse',
      text: 'Rinse top-down with neutralizer to protect plants, finishes, and adjacent hardscape. Concrete dry-time is noted on the invoice for resealing recommendations.',
    },
    {
      '@type': 'HowToStep',
      position: 6,
      name: 'Walkthrough',
      text: 'The same crew member who started the job walks every washed surface with the homeowner before the trailer leaves. Two-year written guarantee handed over on a signed receipt.',
    },
  ],
};

export default function PressureWashingAtlanta() {
  return (
    <main className="bg-[#0a0a0a] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbs)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

      <PWHero />
      <HotWaterDifference />
      <ServicesGrid />
      <Process />
      <VsTypical />
      <Transformations />
      <ServiceArea />
      <PWFaq />
      <TrustCTA />
    </main>
  );
}
