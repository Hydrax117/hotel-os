import React from 'react';

export function Footer() {
  return (
    <footer aria-label="Footer" style={{ background: '#111110' }}>
      <div className="mx-auto max-w-7xl px-6 py-16">
        {/* 4-column grid */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Column 1: Brand */}
          <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
            <span className="text-xl font-bold text-white">
              Hotel<span style={{ color: 'var(--tp-accent)' }}>OS</span>
            </span>
            <p className="text-sm leading-relaxed" style={{ color: '#a8a29e' }}>
              Connecting travelers with verified hotels across Nigeria.
            </p>
            {/* Social icons (placeholder SVG circles) */}
            <div className="flex gap-3">
              {[0, 1, 2].map(i => (
                <a
                  key={i}
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:border-white/40"
                  style={{ borderColor: 'rgba(255,255,255,0.15)' }}
                  aria-label={`Social link ${i + 1}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ color: '#a8a29e' }}>
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: For Hotels */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-white">For Hotels</h4>
            <ul className="flex flex-col gap-3">
              {['List hotel', 'Dashboard', 'Pricing'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm transition-colors hover:text-white" style={{ color: '#a8a29e' }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: For Travelers */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-white">For Travelers</h4>
            <ul className="flex flex-col gap-3">
              {['Search hotels', 'How it works', 'Support'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm transition-colors hover:text-white" style={{ color: '#a8a29e' }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-white">Company</h4>
            <ul className="flex flex-col gap-3">
              {['About', 'Blog', 'Careers', 'Contact'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm transition-colors hover:text-white" style={{ color: '#a8a29e' }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-xs md:flex-row"
          style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#a8a29e' }}
        >
          <span>© 2025 Hotel OS. All rights reserved.</span>
          <span>Built for Nigerian hospitality.</span>
        </div>
      </div>
    </footer>
  );
}
