'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

  // Lock body scroll + handle Escape while mobile menu open
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

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
          <Image
            src="/images/logo.png"
            alt={SITE_CONFIG.name}
            width={200}
            height={80}
            priority
            className={!scrolled && !mobileOpen ? 'drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]' : ''}
            style={{ height: '80px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>


        {/* Desktop Nav */}
        <ul className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
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
            <Phone size={13} aria-hidden="true" />
            {SITE_CONFIG.phone}
          </a>
          <Link
            href="/admin"
            aria-label="Admin Portal"
            className={cn(
              'flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 opacity-35 hover:opacity-100',
              scrolled ? 'text-slate' : 'text-white'
            )}
          >
            <Lock size={13} aria-hidden="true" />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="relative z-30 lg:hidden p-3 rounded-full bg-gold text-white transition-all duration-300 cursor-pointer"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
        >
          {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop — tap outside to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-10 bg-black/40 lg:hidden"
              aria-hidden="true"
            />
            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-x-0 top-0 z-20 bg-warm-white pt-24 pb-12 shadow-xl border-b border-warm-white-dark/60 lg:hidden"
            >
              <ul className="flex flex-col items-center gap-6 px-6">
                {NAV_LINKS.map((link) => (
                  <li key={link.href} className="w-full text-center">
                    <Link
                      href={link.href}
                      aria-current={pathname === link.href ? 'page' : undefined}
                      className={cn(
                        'block py-3 font-sans text-base font-semibold uppercase tracking-[0.2em]',
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
              <div className="mt-10 flex justify-center">
                <a
                  href={`tel:${SITE_CONFIG.phone}`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gold text-white font-sans text-sm font-semibold uppercase tracking-widest transition-colors hover:bg-gold-dark"
                >
                  <Phone size={14} aria-hidden="true" />
                  {SITE_CONFIG.phone}
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
