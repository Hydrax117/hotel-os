import React from 'react';
import Link from 'next/link';

// Pure Server Component — no event handlers, hover via CSS only.

const NAV_COLS = [
  {
    heading: 'For Travelers',
    links: [
      { label: 'Explore hotels',  href: '/search' },
      { label: 'My bookings',     href: '/bookings' },
      { label: 'Sign in',         href: '/auth/signin' },
      { label: 'Create account',  href: '/auth/signup' },
    ],
  },
  {
    heading: 'For Hotels',
    links: [
      { label: 'List your hotel',  href: 'http://hotel.localhost:3000' },
      { label: 'Hotel dashboard',  href: 'http://hotel.localhost:3000/dashboard/overview' },
      { label: 'Hotel sign in',    href: 'http://hotel.localhost:3000/auth/signin' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About us',  href: '#' },
      { label: 'Contact',   href: '#' },
      { label: 'Privacy',   href: '#' },
      { label: 'Terms',     href: '#' },
    ],
  },
] as const;

export function Footer() {
  return (
    <>
      <style>{`
        .footer-link:hover { color: rgba(255,255,255,0.9) !important; }
        .footer-social:hover { border-color: rgba(255,255,255,0.35) !important; color: rgba(255,255,255,0.9) !important; }
      `}</style>

      <footer aria-label="Site footer" style={{ background: 'var(--primitive-ink-900)' }}>
        <div className="mx-auto max-w-7xl px-5 pt-14 pb-8 lg:px-8">

          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-10">

            {/* Brand column */}
            <div className="col-span-2 flex flex-col gap-4 lg:col-span-1">
              <Link href="/" className="flex items-baseline gap-0.5 w-fit" aria-label="Lodgen home">
                <span
                  className="text-xl tracking-tight text-white"
                  style={{ fontFamily: 'var(--font-serif)', fontWeight: 500 }}
                >
                  Lod
                </span>
                <span className="text-xl font-bold" style={{ color: 'var(--color-brand-secondary)' }}>
                  gen
                </span>
              </Link>

              <p className="max-w-[220px] text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Hospitality infrastructure connecting hotels and travelers across Africa.
              </p>

              <div className="flex gap-3 mt-1">
                {(['T', 'I', 'L'] as const).map((initial, i) => (
                  <a
                    key={i}
                    href="#"
                    className="footer-social flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                    style={{
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.4)',
                    }}
                    aria-label={['Twitter', 'Instagram', 'LinkedIn'][i]}
                  >
                    <span className="text-[10px] font-bold select-none">{initial}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Nav columns */}
            {NAV_COLS.map(col => (
              <div key={col.heading} className="flex flex-col gap-4">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-white">
                  {col.heading}
                </h4>
                <ul className="flex flex-col gap-2.5" role="list">
                  {col.links.map(link => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="footer-link text-sm transition-colors"
                        style={{ color: 'rgba(255,255,255,0.45)' }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div
            className="mt-10 flex flex-col items-start justify-between gap-3 border-t pt-6 sm:flex-row sm:items-center"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              © 2025 Lodgen. All rights reserved.
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Built for African hospitality.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
