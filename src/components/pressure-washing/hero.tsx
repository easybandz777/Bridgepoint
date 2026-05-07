'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Phone } from 'lucide-react';

const STATS = [
    { value: '200°F+', label: 'Water temperature' },
    { value: '12+ months', label: 'Mildew-free guarantee' },
    { value: '2-year', label: 'Workmanship warranty' },
    { value: 'Same crew', label: 'That painted your house' },
] as const;

const STEAM_PUFFS = [
    { left: '8%', size: 220, delay: '0s', duration: '11s', tint: 'rgba(255,255,255,0.18)' },
    { left: '22%', size: 160, delay: '2.5s', duration: '9s', tint: 'rgba(186,230,253,0.22)' },
    { left: '38%', size: 280, delay: '4s', duration: '12s', tint: 'rgba(255,255,255,0.14)' },
    { left: '54%', size: 200, delay: '1.2s', duration: '10s', tint: 'rgba(125,211,252,0.18)' },
    { left: '68%', size: 240, delay: '5.5s', duration: '11.5s', tint: 'rgba(255,255,255,0.16)' },
    { left: '82%', size: 180, delay: '3s', duration: '9.5s', tint: 'rgba(186,230,253,0.20)' },
    { left: '92%', size: 150, delay: '6.5s', duration: '8s', tint: 'rgba(255,255,255,0.15)' },
] as const;

export function PWHero() {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Honor prefers-reduced-motion: pause the video and rely on the poster.
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const apply = () => {
            if (mq.matches) v.pause();
            else v.play().catch(() => {});
        };
        apply();
        mq.addEventListener?.('change', apply);
        return () => mq.removeEventListener?.('change', apply);
    }, []);

    return (
        <section
            className="relative min-h-[90vh] flex items-end pb-20 pt-36 overflow-hidden bg-[#0a0a0a]"
            aria-label="Bridgepointe Pressure Washing — hot water exterior cleaning, Metro Atlanta"
        >
            {/* Layer 1 — Cinematic hot-water video loop */}
            <div className="absolute inset-0 z-0">
                <video
                    ref={videoRef}
                    src="/video/pressure-washing-hero.mp4"
                    poster="/video/pressure-washing-hero-poster.jpg"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                    className="h-full w-full object-cover opacity-55"
                />
            </div>

            {/* Layer 2 — Cyan radial gradient (water glow) */}
            <div
                className="absolute inset-0 z-[1] pointer-events-none"
                style={{
                    background:
                        'radial-gradient(ellipse 80% 60% at 15% 95%, rgba(56,189,248,0.15), transparent 65%)',
                }}
            />

            {/* Layer 3 — Steam puffs */}
            <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
                {STEAM_PUFFS.map((puff, i) => (
                    <span
                        key={i}
                        className="absolute block rounded-full pw-steam"
                        style={{
                            left: puff.left,
                            bottom: '-10%',
                            width: `${puff.size}px`,
                            height: `${puff.size}px`,
                            background: `radial-gradient(circle, ${puff.tint} 0%, transparent 70%)`,
                            filter: 'blur(28px)',
                            animationDelay: puff.delay,
                            animationDuration: puff.duration,
                        }}
                    />
                ))}
            </div>

            {/* Layer 4 — Final dark overlay */}
            <div className="absolute inset-0 z-[3] pointer-events-none bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/30" />

            {/* Content */}
            <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-8">
                {/* Kicker pill */}
                <div className="inline-flex items-center gap-2 rounded-full border border-[#f87171]/35 bg-[#f87171]/[0.06] px-4 py-1.5 backdrop-blur-sm">
                    <span aria-hidden className="text-[#f87171]">🔥</span>
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-[#f87171]">
                        200°F+ Hot Water · Metro Atlanta
                    </span>
                </div>

                {/* Eyebrow */}
                <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-[#b8956a]">
                    Hot Water Pressure Washing
                </p>

                {/* Headline */}
                <h1 className="mt-4 font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.95] tracking-tight">
                    <span className="block">Hot water</span>
                    <span className="block text-[#f87171]">kills mold</span>
                    <span className="block">at the root.</span>
                </h1>

                {/* Subhead */}
                <p className="mt-8 max-w-2xl text-lg md:text-xl text-white/70 leading-relaxed">
                    Most Atlanta pressure washing companies use cold water. We brought a full hot-water rig to Metro Atlanta —
                    water hits the surface at 200°F+, dissolves grease and oil, and stops mildew regrowth for 12+ months.
                </p>

                {/* CTAs */}
                <div className="mt-12 flex flex-wrap gap-4">
                    <Link
                        href="/contact"
                        className="group inline-flex h-12 items-center gap-2 rounded-xl px-8 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-[#b8956a]/20 transition-all hover:shadow-[#b8956a]/40 hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg, #d4b07f, #b8956a 50%, #9a7a54)' }}
                    >
                        <Phone className="h-4 w-4" aria-hidden />
                        <span>Get a Free Estimate</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </Link>
                    <Link
                        href="#difference"
                        className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/[0.03] px-8 text-sm font-semibold uppercase tracking-wider text-white backdrop-blur-sm transition-all hover:border-[#b8956a]/60 hover:bg-white/[0.06]"
                    >
                        <span>See the Difference</span>
                        <ChevronDown className="h-4 w-4" aria-hidden />
                    </Link>
                </div>

                {/* Stats strip */}
                <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl">
                    {STATS.map((stat) => (
                        <div
                            key={stat.label}
                            className="border-l border-[#b8956a]/30 pl-4 md:pl-5"
                        >
                            <p className="font-serif text-3xl md:text-4xl font-bold text-[#b8956a] leading-none">
                                {stat.value}
                            </p>
                            <p className="mt-2 text-[10px] md:text-xs text-white/40 uppercase tracking-widest leading-snug">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/35">Scroll</span>
                <ChevronDown className="h-5 w-5 text-white/45 pw-bounce" aria-hidden />
            </div>

            {/* Keyframes */}
            <style jsx>{`
                @keyframes ken-burns {
                    0% {
                        transform: scale(1.05) translate3d(0, 0, 0);
                    }
                    100% {
                        transform: scale(1.15) translate3d(-1%, -1%, 0);
                    }
                }

                @keyframes steam-rise {
                    0% {
                        transform: translateY(0) scale(0.8);
                        opacity: 0;
                    }
                    15% {
                        opacity: 0.4;
                    }
                    60% {
                        opacity: 0.3;
                    }
                    100% {
                        transform: translateY(-200px) scale(1.6);
                        opacity: 0;
                    }
                }

                @keyframes bounce-slow {
                    0% {
                        transform: translateY(0);
                    }
                    100% {
                        transform: translateY(8px);
                    }
                }

                .pw-ken-burns {
                    animation: ken-burns 20s ease-in-out infinite alternate;
                    will-change: transform;
                }

                .pw-steam {
                    animation-name: steam-rise;
                    animation-timing-function: ease-out;
                    animation-iteration-count: infinite;
                    will-change: transform, opacity;
                }

                .pw-bounce {
                    animation: bounce-slow 2s ease-in-out infinite alternate;
                    will-change: transform;
                }

                @media (prefers-reduced-motion: reduce) {
                    .pw-ken-burns,
                    .pw-steam,
                    .pw-bounce {
                        animation: none;
                    }
                }
            `}</style>
        </section>
    );
}
