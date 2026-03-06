'use client';

import { Paintbrush, Layers, Bath, ChefHat } from 'lucide-react';

const SERVICES = [
    { id: 'painting', label: 'Painting', Icon: Paintbrush },
    { id: 'flooring', label: 'Flooring', Icon: Layers },
    { id: 'bathroom', label: 'Bathroom', Icon: Bath },
    { id: 'kitchen', label: 'Kitchen', Icon: ChefHat },
];

export function ServiceStrip() {
    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const offset = 80; // navbar height
            const top = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    return (
        <div className="sticky top-[72px] z-40 bg-warm-white/95 backdrop-blur-sm border-b border-warm-white-dark/50 shadow-sm">
            <div className="mx-auto max-w-7xl px-4">
                <div className="flex items-stretch overflow-x-auto scrollbar-hide">
                    {SERVICES.map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            onClick={() => scrollTo(id)}
                            className="
                group flex-1 min-w-[120px] flex flex-col items-center gap-1.5 py-4 px-5
                border-b-2 border-transparent
                font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-slate
                transition-all duration-250
                hover:border-gold hover:text-gold hover:bg-gold/5
                focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50
              "
                        >
                            <Icon
                                size={18}
                                strokeWidth={1.6}
                                className="transition-colors duration-250 text-slate/50 group-hover:text-gold"
                            />
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
