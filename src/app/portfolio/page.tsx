import type { Metadata } from 'next';
import { Section } from '@/components/ui/section';
import { AnimatedSection } from '@/components/shared/animated-section';
import { ProjectGrid } from '@/components/portfolio/project-grid';
import { getGalleryCollections } from '@/lib/gallery';
import { IMAGES } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Portfolio',
  description:
    'Explore our portfolio of premium painting, remodeling, and custom carpentry projects. Each project reflects meticulous craftsmanship and attention to detail.',
};

export default function PortfolioPage() {
  const collections = getGalleryCollections();
  const galleryImages: Record<string, string[]> = {};
  for (const col of collections) {
    // Bathroom photos are imported as duplicate pairs — show only every other one
    if (col.id === 'bathrooms') {
      galleryImages[col.id] = col.images.filter((_, i) => i % 2 === 0);
    } else {
      galleryImages[col.id] = col.images;
    }
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

