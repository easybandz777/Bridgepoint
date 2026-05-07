'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Award, Flame, Mail, Phone, ShieldCheck, Users } from 'lucide-react';

type ServiceInterest =
    | 'House wash'
    | 'Driveway'
    | 'Whole exterior'
    | 'Commercial — recurring'
    | 'Not sure yet';

type LeadFormState = {
    name: string;
    phone: string;
    address: string;
    service: ServiceInterest;
    notes: string;
};

const INITIAL_FORM: LeadFormState = {
    name: '',
    phone: '',
    address: '',
    service: 'House wash',
    notes: '',
};

const BADGES = [
    {
        Icon: ShieldCheck,
        label: 'Fully Insured',
        sub: 'GL + Workers’ Comp · COI on request',
    },
    {
        Icon: Award,
        label: '2-Year Warranty',
        sub: 'On every workmanship line',
    },
    {
        Icon: Flame,
        label: 'Hot-Water Rig',
        sub: '200°F+ kills mildew at the root',
    },
    {
        Icon: Users,
        label: 'Same Crew',
        sub: 'In-house, never subcontracted',
    },
] as const;

const SERVICE_OPTIONS: ServiceInterest[] = [
    'House wash',
    'Driveway',
    'Whole exterior',
    'Commercial — recurring',
    'Not sure yet',
];

export function TrustCTA() {
    const [form, setForm] = useState<LeadFormState>(INITIAL_FORM);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const subject = `Estimate request — ${form.service}${form.name ? ` — ${form.name}` : ''}`;
        const bodyLines = [
            `Name: ${form.name}`,
            `Phone: ${form.phone}`,
            `Address: ${form.address}`,
            `Service interest: ${form.service}`,
            '',
            'Notes:',
            form.notes,
        ];
        const mailto = `mailto:Bridgepointefloors@gmail.com?subject=${encodeURIComponent(
            subject,
        )}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
        if (typeof window !== 'undefined') {
            window.location.href = mailto;
        }
    };

    return (
        <section
            className="relative bg-gradient-to-br from-[#0f0f0f] via-[#0a0a0a] to-[#000] py-28"
            aria-label="Why Atlanta trusts Bridgepointe and free estimate request"
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* ─────────────────  SUB-SECTION 1: TRUST  ───────────────── */}
                <div className="max-w-3xl">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#b8956a]">
                        WHY ATLANTA TRUSTS BRIDGEPOINTE
                    </p>
                    <h2 className="mt-4 font-serif text-3xl text-white md:text-4xl lg:text-5xl">
                        Eighteen years. One crew. Zero shortcuts.
                    </h2>
                </div>

                {/* Trust badges */}
                <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {BADGES.map(({ Icon, label, sub }) => (
                        <div
                            key={label}
                            className="rounded-2xl border border-white/8 bg-[#161616] p-6"
                        >
                            <Icon size={28} className="text-[#b8956a]" aria-hidden="true" />
                            <div className="mt-4 font-serif text-base font-bold text-white">
                                {label}
                            </div>
                            <div className="mt-1 text-xs leading-relaxed text-white/40">
                                {sub}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Stats line */}
                <p className="mt-10 text-center text-sm text-white/40">
                    240+ projects completed
                    <span className="mx-3 text-white/25">·</span>
                    18+ years in Metro Atlanta
                    <span className="mx-3 text-white/25">·</span>
                    Same-day estimates
                </p>

                {/* ─────────────────  SUB-SECTION 2: BIG CTA  ───────────────── */}
                <div
                    className="mx-auto mt-20 max-w-5xl rounded-3xl bg-gradient-to-br from-[#b8956a] via-[#a37e54] to-[#8a653f] p-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),0_10px_30px_-10px_rgba(184,149,106,0.4)] md:p-16"
                >
                    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                        {/* LEFT: copy + contact */}
                        <div>
                            <p className="text-xs uppercase tracking-widest text-black/60">
                                FREE ON-SITE ESTIMATE · NO PRESSURE
                            </p>
                            <h3 className="mt-4 font-serif text-4xl font-bold leading-tight text-black md:text-5xl">
                                Get a real number for your house.
                            </h3>
                            <p className="mt-5 max-w-md text-base leading-relaxed text-black/75">
                                We come out, walk every surface, photograph what we see, and
                                quote in writing. If we&apos;re not the right fit, we&apos;ll
                                tell you. No high-pressure tactics. No bait pricing.
                            </p>

                            <div className="mt-10 space-y-4">
                                <a
                                    href="tel:8624218973"
                                    className="group flex items-center gap-4"
                                    aria-label="Call Bridgepointe at (862) 421-8973"
                                >
                                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/10 transition-colors group-hover:bg-black/20">
                                        <Phone
                                            size={22}
                                            className="text-black"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <span className="font-mono text-3xl font-bold text-black">
                                        (862) 421-8973
                                    </span>
                                </a>
                                <a
                                    href="mailto:Bridgepointefloors@gmail.com"
                                    className="flex items-center gap-3 text-base text-black/70 hover:text-black"
                                >
                                    <Mail size={16} aria-hidden="true" />
                                    Bridgepointefloors@gmail.com
                                </a>
                            </div>
                        </div>

                        {/* RIGHT: form */}
                        <form onSubmit={handleSubmit} noValidate>
                            <div className="space-y-5">
                                <div>
                                    <label
                                        htmlFor="trust-cta-name"
                                        className="mb-2 block text-xs uppercase tracking-widest text-black/60"
                                    >
                                        Name
                                    </label>
                                    <input
                                        id="trust-cta-name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        className="h-12 w-full rounded-lg border-0 bg-white/95 px-4 text-black focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="trust-cta-phone"
                                        className="mb-2 block text-xs uppercase tracking-widest text-black/60"
                                    >
                                        Phone
                                    </label>
                                    <input
                                        id="trust-cta-phone"
                                        name="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        value={form.phone}
                                        onChange={handleChange}
                                        className="h-12 w-full rounded-lg border-0 bg-white/95 px-4 text-black focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="trust-cta-address"
                                        className="mb-2 block text-xs uppercase tracking-widest text-black/60"
                                    >
                                        Address
                                    </label>
                                    <input
                                        id="trust-cta-address"
                                        name="address"
                                        type="text"
                                        autoComplete="street-address"
                                        value={form.address}
                                        onChange={handleChange}
                                        className="h-12 w-full rounded-lg border-0 bg-white/95 px-4 text-black focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="trust-cta-service"
                                        className="mb-2 block text-xs uppercase tracking-widest text-black/60"
                                    >
                                        Service interest
                                    </label>
                                    <select
                                        id="trust-cta-service"
                                        name="service"
                                        value={form.service}
                                        onChange={handleChange}
                                        className="h-12 w-full rounded-lg border-0 bg-white/95 px-4 text-black focus:outline-none focus:ring-2 focus:ring-black"
                                    >
                                        {SERVICE_OPTIONS.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="trust-cta-notes"
                                        className="mb-2 block text-xs uppercase tracking-widest text-black/60"
                                    >
                                        Notes
                                    </label>
                                    <textarea
                                        id="trust-cta-notes"
                                        name="notes"
                                        rows={3}
                                        value={form.notes}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border-0 bg-white/95 px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="mt-6 h-14 w-full rounded-lg bg-black text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-black/90"
                            >
                                Request my free estimate &rarr;
                            </button>

                            <p className="mt-4 text-xs text-black/55">
                                We typically respond within 24 hours · No spam · No
                                high-pressure follow-up calls
                            </p>
                        </form>
                    </div>
                </div>

                {/* ─────────────────  FOOTER LINE  ───────────────── */}
                <div className="mx-auto mt-20 max-w-5xl">
                    <div className="h-px w-full bg-white/10" />
                    <div className="mt-8 text-center">
                        <p className="text-sm text-white/40">
                            Bridgepointe Flooring &amp; Painting · Metro Atlanta ·
                            Established 2007
                        </p>
                        <p className="mt-2 text-xs text-white/25">
                            We also paint, remodel, and tile. See{' '}
                            <a
                                href="/"
                                className="text-[#b8956a] hover:text-white"
                            >
                                our other services
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
