'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const IconHamburger = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconClose = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export function TravelerNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <nav
        role="navigation"
        aria-label="Main"
        className="fixed left-0 right-0 top-0 z-50 transition-all duration-200"
        style={{
          height: '64px',
          background: 'var(--tp-surface)',
          borderBottom: scrolled
            ? '1px solid var(--tp-border)'
            : '1px solid transparent',
          boxShadow: scrolled ? '0 1px 8px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight"
            style={{ color: 'var(--tp-primary)' }}
          >
            Hotel<span style={{ color: 'var(--tp-accent)' }}>OS</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="#explore"
              className="text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: 'var(--tp-secondary)' }}
            >
              Explore
            </Link>
            <Link
              href="#hotels"
              className="text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: 'var(--tp-secondary)' }}
            >
              Hotels
            </Link>
            <Link
              href="#about"
              className="text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: 'var(--tp-secondary)' }}
            >
              About
            </Link>
          </div>

          {/* Desktop CTA buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/onboarding"
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{
                borderColor: 'var(--tp-border)',
                color: 'var(--tp-primary)',
                background: 'transparent',
              }}
            >
              List your hotel
            </Link>
            <Link
              href="/auth/signin"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
              style={{ background: 'var(--tp-primary)' }}
            >
              Sign in
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-gray-100 md:hidden"
            style={{ color: 'var(--tp-primary)' }}
            onClick={() => setMobileOpen(o => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <IconClose /> : <IconHamburger />}
          </button>
        </div>
      </nav>

      {/* Mobile full-screen overlay */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="fixed inset-0 z-40 flex flex-col md:hidden"
          style={{ background: 'var(--tp-surface)', paddingTop: '64px' }}
        >
          <nav className="flex flex-col gap-1 px-6 py-6">
            {[
              { label: 'Explore', href: '#explore' },
              { label: 'Hotels', href: '#hotels' },
              { label: 'About', href: '#about' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-lg font-medium transition-colors hover:bg-gray-50"
                style={{ color: 'var(--tp-primary)' }}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/onboarding"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border px-4 py-3 text-center text-sm font-medium transition-colors"
                style={{
                  borderColor: 'var(--tp-border)',
                  color: 'var(--tp-primary)',
                }}
              >
                List your hotel
              </Link>
              <Link
                href="/auth/signin"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-center text-sm font-medium text-white"
                style={{ background: 'var(--tp-primary)' }}
              >
                Sign in
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
