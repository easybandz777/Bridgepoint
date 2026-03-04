'use client';

import { useState, useRef } from 'react';
import { AnimatedSection } from '@/components/shared/animated-section';

interface BeforeAfterProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfter({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: BeforeAfterProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percent);
  };

  return (
    <AnimatedSection>
      <div
        ref={containerRef}
        className="relative cursor-ew-resize select-none overflow-hidden"
        onMouseMove={(e) => {
          if (e.buttons === 1) handleMove(e.clientX);
        }}
        onTouchMove={(e) => {
          handleMove(e.touches[0].clientX);
        }}
        role="slider"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Before and after comparison slider"
        tabIndex={0}
      >
        {/* After Image (full width, underneath) - fresh walls */}
        <img
          src={afterImage}
          alt={afterLabel}
          className="h-80 w-full object-cover md:h-[28rem]"
        />

        {/* Before side: same image + overlay only on wall area (top ~65%) so only walls look dated */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${position}%` }}
        >
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="h-80 w-full object-cover object-left-top md:h-[28rem]"
            style={{ minWidth: containerRef.current?.offsetWidth }}
          />
          {beforeImage === afterImage && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(190,175,155,0.45) 0%, rgba(195,180,160,0.25) 45%, rgba(200,188,170,0.08) 65%, transparent 72%)',
              }}
              aria-hidden
            />
          )}
        </div>

        {/* Divider Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
          style={{ left: `${position}%` }}
        >
          <div className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 10L2 10M2 10L5 7M2 10L5 13" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 10L18 10M18 10L15 7M18 10L15 13" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <span className="absolute top-4 left-4 bg-charcoal/70 px-3 py-1 font-sans text-xs font-semibold uppercase tracking-widest text-white">
          {beforeLabel}
        </span>
        <span className="absolute top-4 right-4 bg-charcoal/70 px-3 py-1 font-sans text-xs font-semibold uppercase tracking-widest text-white">
          {afterLabel}
        </span>
      </div>
    </AnimatedSection>
  );
}
