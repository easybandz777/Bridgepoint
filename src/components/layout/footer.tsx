import Link from 'next/link';
import { Instagram, Facebook, Phone, Mail, MapPin } from 'lucide-react';
import { SITE_CONFIG, NAV_LINKS } from '@/lib/constants';
import { SERVICE_LOCATIONS } from '@/lib/locations';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-charcoal text-warm-white/65">
      {/* Top gold accent */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-4 lg:gap-16">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/">
              <span className="font-serif text-2xl font-bold text-warm-white tracking-tight">
                {SITE_CONFIG.name}
              </span>
            </Link>
            <div className="mt-4 h-px w-10 bg-gold/40" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed">
              Premium painting and exclusive remodeling services.
              Every detail considered, every surface perfected.
            </p>

            {/* Social */}
            <div className="mt-7 flex items-center gap-4">
              <a
                href={SITE_CONFIG.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center border border-warm-white/10 text-warm-white/40 transition-all duration-300 hover:border-gold/40 hover:text-gold"
              >
                <Instagram size={16} />
              </a>
              <a
                href={SITE_CONFIG.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center border border-warm-white/10 text-warm-white/40 transition-all duration-300 hover:border-gold/40 hover:text-gold"
              >
                <Facebook size={16} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              Navigation
            </h4>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-300 hover:text-warm-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Areas */}
          <div>
            <h4 className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              Service Areas
            </h4>
            <ul className="space-y-3">
              {SERVICE_LOCATIONS.map((loc) => (
                <li key={loc.id}>
                  <Link
                    href={`/${loc.id}`}
                    className="text-sm transition-colors duration-300 hover:text-warm-white"
                  >
                    {loc.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              Contact
            </h4>
            <address className="space-y-4 text-sm not-italic">
              <a
                href={`tel:${SITE_CONFIG.phone}`}
                className="flex items-center gap-3 transition-colors duration-300 hover:text-warm-white"
              >
                <Phone size={14} className="shrink-0 text-gold/60" />
                {SITE_CONFIG.phone}
              </a>
              <a
                href={`mailto:${SITE_CONFIG.email}`}
                className="flex items-center gap-3 transition-colors duration-300 hover:text-warm-white"
              >
                <Mail size={14} className="shrink-0 text-gold/60" />
                {SITE_CONFIG.email}
              </a>
              <div className="flex items-start gap-3">
                <MapPin size={14} className="shrink-0 mt-0.5 text-gold/60" />
                <div>
                  <p>{SITE_CONFIG.address.street}</p>
                  <p>
                    {SITE_CONFIG.address.city}, {SITE_CONFIG.address.state}{' '}
                    {SITE_CONFIG.address.zip && SITE_CONFIG.address.zip}
                  </p>
                </div>
              </div>
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-warm-white/8 pt-8 md:flex-row">
          <p className="text-xs text-warm-white/40">
            &copy; {currentYear} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <p className="text-xs text-warm-white/25 tracking-wider">
            Crafted with intention.
          </p>
        </div>
      </div>
    </footer>
  );
}
