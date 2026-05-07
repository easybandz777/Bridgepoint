import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { SERVICE_LOCATIONS } from '@/lib/locations';
import { NEIGHBORHOODS } from '@/lib/neighborhoods';

const CITY_SUBTITLES: Record<string, string> = {
    cobb: 'Cobb County',
    roswell: 'North Fulton',
    alpharetta: 'North Fulton',
    'sandy-springs': 'North Fulton',
    kennesaw: 'Cobb County',
    buckhead: 'Atlanta',
    milton: 'North Fulton',
    suwanee: 'Forsyth / Gwinnett',
    marietta: 'East Cobb',
};

export function ServiceArea() {
    return (
        <section className="py-24 bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Header */}
                <div className="mb-16">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#b8956a]">
                        SERVICE AREA · METRO ATLANTA
                    </p>
                    <h2 className="font-serif text-4xl md:text-5xl text-white mt-3">
                        We pull up where you are.
                    </h2>
                    <p className="max-w-2xl mt-4 text-white/55">
                        Booking residential and commercial pressure washing across all 9
                        of our service-area cities and 6 neighborhood pockets. If
                        you&apos;re inside the perimeter or anywhere on Atlanta&apos;s
                        northern crescent, we&apos;re there.
                    </p>
                </div>

                {/* Two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left column — cities + neighborhoods */}
                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {SERVICE_LOCATIONS.map((loc) => (
                                <Link
                                    key={loc.id}
                                    href={`/${loc.id}`}
                                    className="group relative bg-[#101418] border border-white/8 rounded-xl p-5 hover:border-[#b8956a]/40 hover:bg-[#161616] transition-all"
                                >
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest">
                                        PAINTING + PRESSURE WASHING
                                    </p>
                                    <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#b8956a] transition-colors mt-1">
                                        {loc.name}
                                    </h3>
                                    <p className="text-xs text-white/45 mt-1">
                                        {CITY_SUBTITLES[loc.id] ?? 'Metro Atlanta'}
                                    </p>
                                    <ArrowUpRight
                                        className="absolute bottom-4 right-4 text-white/30 group-hover:text-[#b8956a] transition-colors"
                                        size={16}
                                    />
                                </Link>
                            ))}
                        </div>

                        <p className="text-xs uppercase tracking-widest text-white/30 mt-8 mb-3">
                            Plus these neighborhoods —
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {NEIGHBORHOODS.map((n) => (
                                <Link
                                    key={n.slug}
                                    href={`/painting-contractor-${n.slug}`}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-white/8 text-white/55 hover:text-[#b8956a] hover:border-[#b8956a]/30 transition-colors"
                                >
                                    {n.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right column — trust panel */}
                    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0c0c0c] border border-white/8 rounded-2xl p-8">
                        <MapPin size={28} className="text-[#b8956a]" />
                        <h3 className="font-serif text-xl font-bold text-white mt-4">
                            Local Means Local
                        </h3>
                        <p className="text-white/60 text-sm mt-3 leading-relaxed">
                            Bridgepointe lives and works in Metro Atlanta. The same crew
                            that paints your neighbor&apos;s kitchen on Tuesday is the
                            crew pressure-washing your driveway on Friday.
                        </p>
                        <p className="text-white/60 text-sm mt-3 leading-relaxed">
                            If your address is in our service area, we don&apos;t add a
                            travel fee. Period.
                        </p>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div>
                                <p className="font-serif text-2xl text-[#b8956a] font-bold">
                                    18+
                                </p>
                                <p className="text-[11px] text-white/45 mt-1 leading-tight">
                                    years in Metro Atlanta
                                </p>
                            </div>
                            <div>
                                <p className="font-serif text-2xl text-[#b8956a] font-bold">
                                    240+
                                </p>
                                <p className="text-[11px] text-white/45 mt-1 leading-tight">
                                    projects completed
                                </p>
                            </div>
                            <div>
                                <p className="font-serif text-2xl text-[#b8956a] font-bold">
                                    0
                                </p>
                                <p className="text-[11px] text-white/45 mt-1 leading-tight">
                                    subcontracted crews
                                </p>
                            </div>
                            <div>
                                <p className="font-serif text-2xl text-[#b8956a] font-bold">
                                    Same day
                                </p>
                                <p className="text-[11px] text-white/45 mt-1 leading-tight">
                                    estimate response
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/contact"
                            className="mt-8 inline-flex items-center justify-center w-full text-sm text-white border border-[#b8956a]/40 hover:border-[#b8956a] hover:bg-[#b8956a]/10 rounded-lg px-4 py-3 transition-colors"
                        >
                            Confirm we cover your address →
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
