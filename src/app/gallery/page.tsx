import type { Metadata } from 'next';
import { Section } from '@/components/ui/section';
import { AnimatedSection } from '@/components/shared/animated-section';
import { GalleryGrid } from '@/components/gallery/gallery-grid';
import { getGalleryCollections } from '@/lib/gallery';
import { IMAGES } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Gallery',
  description:
    'Photo gallery of our bathroom, kitchen, painting, and remodeling work. Real projects, real craftsmanship.',
};

export default async function GalleryPage() {
  const collections = getGalleryCollections();

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[50vh] items-end overflow-hidden pb-16 pt-32">
        <div className="absolute inset-0">
          <img
            src={IMAGES.portfolioHero}
            alt="Gallery"
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
              Gallery
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              A structured look at our projects by category. Add your own
              photos to the folders in the project to see them here.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Collections */}
      {collections.length === 0 ? (
        <Section variant="default" spacious>
          <AnimatedSection className="text-center">
            <p className="font-sans text-sm text-slate">
              No gallery photos yet. Add image files to{' '}
              <code className="rounded bg-charcoal/10 px-1.5 py-0.5 font-mono text-xs">
                public/images/gallery/
              </code>{' '}
              in folders like <strong>bathrooms</strong>, <strong>kitchens</strong>, or{' '}
              <strong>painting</strong>. See the README in that folder for steps.
            </p>
          </AnimatedSection>
        </Section>
      ) : (
        collections.map((collection, index) => (
          <Section
            key={collection.id}
            variant={index % 2 === 0 ? 'default' : 'alternate'}
            spacious
          >
            <AnimatedSection>
              <h2 className="font-serif text-3xl font-bold text-charcoal md:text-4xl">
                {collection.label}
              </h2>
              <p className="mt-2 font-sans text-sm text-slate">
                {collection.images.length} photo
                {collection.images.length !== 1 ? 's' : ''}
              </p>
            </AnimatedSection>

            <GalleryGrid images={collection.images} label={collection.label} />
          </Section>
        ))
      )}
    </>
  );
}
