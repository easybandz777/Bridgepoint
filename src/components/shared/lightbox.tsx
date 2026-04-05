'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface LightboxImage {
  src: string;
  alt: string;
}

interface LightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  const goTo = useCallback(
    (next: number, dir: number) => {
      setDirection(dir);
      setCurrentIndex(((next % images.length) + images.length) % images.length);
    },
    [images.length],
  );

  const prev = useCallback(() => goTo(currentIndex - 1, -1), [currentIndex, goTo]);
  const next = useCallback(() => goTo(currentIndex + 1, 1), [currentIndex, goTo]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, prev, next]);

  // Preload adjacent images
  useEffect(() => {
    const preload = (idx: number) => {
      const wrapped = ((idx % images.length) + images.length) % images.length;
      const img = new Image();
      img.src = images[wrapped].src;
    };
    preload(currentIndex + 1);
    preload(currentIndex - 1);
  }, [currentIndex, images]);

  // Reset natural size when image changes so we recalculate
  useEffect(() => {
    setNaturalSize(null);
  }, [currentIndex]);

  const current = images[currentIndex];

  // Compute display size: scale up to 2x natural (stays sharp) but cap at viewport
  const getImageStyle = (): React.CSSProperties => {
    if (!naturalSize) return { maxHeight: '85vh', maxWidth: '90vw' };
    const maxW = window.innerWidth * 0.9;
    const maxH = window.innerHeight * 0.85;
    // Allow up to 2.5x natural size, but don't exceed viewport
    const targetW = Math.min(naturalSize.w * 2.5, maxW);
    const targetH = Math.min(naturalSize.h * 2.5, maxH);
    // Maintain aspect ratio
    const ratio = naturalSize.w / naturalSize.h;
    let finalW = targetW;
    let finalH = targetW / ratio;
    if (finalH > targetH) {
      finalH = targetH;
      finalW = targetH * ratio;
    }
    return { width: finalW, height: finalH };
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
          aria-label="Close lightbox"
        >
          <X size={20} />
        </button>

        {/* Previous arrow */}
        {images.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Image */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="relative z-[1] flex items-center justify-center"
          >
            <img
              src={current.src}
              alt={current.alt}
              className="rounded-lg shadow-2xl object-contain"
              style={getImageStyle()}
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Next arrow */}
        {images.length > 1 && (
          <button
            onClick={next}
            className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
        )}

        {/* Counter */}
        {images.length > 1 && (
          <span className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 font-sans text-sm text-white/80">
            {currentIndex + 1} / {images.length}
          </span>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
