import type { Metadata } from 'next';
import { Section } from '@/components/ui/section';
import { AnimatedSection } from '@/components/shared/animated-section';
import { ProjectGrid } from '@/components/portfolio/project-grid';
import { getGalleryCollections } from '@/lib/gallery';
import { IMAGES } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Portfolio | Painting, Kitchen, Bathroom & Tile Projects | Atlanta',
  description:
    'Real Bridgepointe projects across Metro Atlanta — kitchen repaints, master bathroom remodels, custom tile installations, hardwood flooring, and luxury interior painting. Photos, scope, timeline, and investment ranges for every project.',
  keywords: [
    'Atlanta painting portfolio', 'kitchen remodel Atlanta portfolio', 'bathroom remodel Atlanta portfolio',
    'tile installation Atlanta examples', 'painting contractor portfolio Atlanta GA',
    'Bridgepointe projects', 'home remodeling portfolio Atlanta',
  ],
  openGraph: {
    title: 'Portfolio | Bridgepointe Atlanta',
    description: 'Real photos and details from recent kitchen, bathroom, tile, painting, and flooring projects across Metro Atlanta.',
    url: 'https://bridgepointepainting.com/portfolio',
    images: [{ url: '/images/gallery/kitchens/01.jpg', width: 1200, height: 630, alt: 'Bridgepointe Atlanta — kitchen remodel portfolio' }],
  },
  alternates: { canonical: 'https://bridgepointepainting.com/portfolio' },
};

export default function PortfolioPage() {
  const collections = getGalleryCollections();
  const galleryImages: Record<string, string[]> = {};
  for (const col of collections) {
    galleryImages[col.id] = col.images;
  }

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[50vh] items-end overflow-hidden pb-16 pt-32">
        <div className="absolute inset-0">
          <img
            src={IMAGES.portfolioHero}
            alt="Portfolio showcase"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-charcoal/60" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <AnimatedSection>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Our Work
            </p>
            <h1 className="mt-4 font-serif text-5xl font-bold text-white md:text-6xl lg:text-7xl">
              Portfolio
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              A curated collection of projects that showcase the quality,
              care, and craftsmanship we bring to every home.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Grid */}
      <Section variant="default" spacious>
        <ProjectGrid galleryImages={galleryImages} />
      </Section>
    </>
  );
}

