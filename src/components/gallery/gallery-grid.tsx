'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatedSection } from '@/components/shared/animated-section';
import { Lightbox, type LightboxImage } from '@/components/shared/lightbox';

interface GalleryGridProps {
  images: string[];
  label: string;
}

export function GalleryGrid({ images, label }: GalleryGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const lightboxImages: LightboxImage[] = images.map((src, i) => ({
    src,
    alt: `${label} project ${i + 1}`,
  }));

  return (
    <>
      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {images.map((src, i) => (
          <li key={src} className="overflow-hidden">
            <AnimatedSection delay={i * 0.03}>
              <button
                type="button"
                className="relative block w-full cursor-pointer overflow-hidden"
                onClick={() => setLightboxIndex(i)}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-charcoal/5">
                  <Image
                    src={src}
                    alt={`${label} project ${i + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
              </button>
            </AnimatedSection>
          </li>
        ))}
      </ul>

      {lightboxIndex !== null && (
        <Lightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
