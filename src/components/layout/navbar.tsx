'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NAV_LINKS, SITE_CONFIG } from '@/lib/constants';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled
          ? 'bg-warm-white/97 backdrop-blur-lg shadow-sm border-b border-warm-white-dark/60'
          : 'bg-transparent'
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">

        {/* Logo */}
        <Link href="/" className="relative z-10 shrink-0">
          <img
            src="/images/logo.png"
            alt={SITE_CONFIG.name}
            style={{ height: '80px', width: 'auto', objectFit: 'contain' }}
            className={!scrolled && !mobileOpen ? 'drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]' : ''}
          />
        </Link>


        {/* Desktop Nav */}
        <ul className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  'relative font-sans text-xs font-semibold uppercase tracking-[0.15em]',
                  'transition-colors duration-300',
                  scrolled ? 'text-slate hover:text-gold' : 'text-white/75 hover:text-white',
                  pathname === link.href && (scrolled ? 'text-gold' : 'text-white')
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-px bg-gold"
                    transition={{ duration: 0.3 }}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTA (phone + admin) */}
        <div className="hidden lg:flex items-center gap-4">
          <a
            href={`tel:${SITE_CONFIG.phone}`}
            className={cn(
              'flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-300',
              scrolled ? 'text-gold hover:text-gold-dark' : 'text-white/70 hover:text-white'
            )}
          >
            <Phone size={13} />
            {SITE_CONFIG.phone}
          </a>
          <Link
            href="/admin"
            title="Admin Portal"
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 opacity-35 hover:opacity-100',
              scrolled ? 'text-slate' : 'text-white'
            )}
          >
            <Lock size={13} />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={cn(
            'relative z-10 lg:hidden transition-colors duration-300 cursor-pointer p-1',
            scrolled || mobileOpen ? 'text-charcoal' : 'text-white'
          )}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-x-0 top-0 bg-warm-white pt-20 pb-10 shadow-xl border-b border-warm-white-dark/60 lg:hidden"
          >
            <ul className="flex flex-col items-center gap-5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'font-sans text-sm font-semibold uppercase tracking-[0.2em]',
                      'text-slate transition-colors hover:text-gold',
                      pathname === link.href && 'text-gold'
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Phone in mobile menu */}
            <div className="mt-8 flex justify-center">
              <a
                href={`tel:${SITE_CONFIG.phone}`}
                className="inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-widest text-gold"
              >
                <Phone size={13} />
                {SITE_CONFIG.phone}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
