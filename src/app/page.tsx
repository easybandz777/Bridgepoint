import { Hero } from '@/components/home/hero';
import { ServicesPreview } from '@/components/home/services-preview';
import { FeaturedWork } from '@/components/home/featured-work';
import { CredibilityStrip } from '@/components/home/credibility-strip';
import { CTABanner } from '@/components/home/cta-banner';

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesPreview />
      <FeaturedWork />
      <CredibilityStrip />
      <CTABanner />
    </>
  );
}
