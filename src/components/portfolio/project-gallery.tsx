'use client';

import { useState } from 'react';
import { AnimatedSection } from '@/components/shared/animated-section';
import { Lightbox, type LightboxImage } from '@/components/shared/lightbox';

interface ProjectGalleryProps {
  images: string[];
  projectTitle: string;
}

export function ProjectGallery({ images, projectTitle }: ProjectGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const lightboxImages: LightboxImage[] = images.map((src, i) => ({
    src,
    alt: `${projectTitle} - Image ${i + 1}`,
  }));

  return (
    <>
      <AnimatedSection delay={0.2} className="mt-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              className="cursor-pointer overflow-hidden"
              onClick={() => setLightboxIndex(index)}
            >
              <img
                src={image}
                alt={`${projectTitle} - Image ${index + 1}`}
                className="h-64 w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </button>
          ))}
        </div>
      </AnimatedSection>

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
