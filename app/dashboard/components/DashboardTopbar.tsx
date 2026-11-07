'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { logout } from '../../lib/api/auth';

type Props = { onMenuToggle: () => void };

// ── Page title from pathname ──────────────────────────────────────────────────

const TITLE_MAP: Record<string, string> = {
  overview: 'Overview', reservations: 'Reservations', inventory: 'Calendar',
  rooms: 'Rooms', rates: 'Rates', promotions: 'Promotions', guests: 'Guests',
  analytics: 'Analytics', profile: 'Hotel Profile', 'listing-preview': 'Listing Preview',
  staff: 'Staff', complaints: 'Complaints', reviews: 'Reviews',
  subscription: 'Subscription', payouts: 'Payouts', integrations: 'Integrations',
  settings: 'Settings', 'check-in': 'Check In', 'check-out': 'Check Out',
};

function pageTitle(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  const last = parts[parts.length - 1] ?? '';
  return TITLE_MAP[last] ?? (last.charAt(0).toUpperCase() + last.slice(1));
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function Breadcrumb({ pathname }: { pathname: string }) {
  const parts = pathname.split('/').filter(Boolean).slice(1); // drop 'dashboard'
  if (parts.length <= 1) return null;
  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
      <Link href="/dashboard/overview" className="transition-opacity hover:opacity-70">Dashboard</Link>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <span aria-hidden="true">/</span>
          <span style={{ color: i === parts.length - 1 ? 'var(--color-text-primary)' : undefined }}>
            {TITLE_MAP[part] ?? (part.charAt(0).toUpperCase() + part.slice(1))}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardTopbar({ onMenuToggle }: Props) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = user ? (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '') : 'HO';

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try { await logout(); } catch { /* ignore */ }
    signOut();
    window.location.href = '/auth/signin';
  }

  const title = pageTitle(pathname);

  return (
    <header
      className="flex shrink-0 items-center gap-4 border-b px-4 lg:px-6"
      style={{
        height: 'var(--topbar-h)',
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuToggle}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors lg:hidden"
        style={{ color: 'var(--color-text-secondary)' }}
        aria-label="Open navigation"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Page title + breadcrumb */}
      <div className="flex flex-1 min-w-0 flex-col gap-0.5">
        <h1 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h1>
        <Breadcrumb pathname={pathname} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Listing preview link */}
        <Link
          href="/dashboard/listing-preview"
          className="hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-stone-50"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          Preview listing
        </Link>

        {/* Notification bell */}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-stone-50"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Notifications"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>

        {/* User avatar / dropdown */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white transition-opacity hover:opacity-85"
            style={{ background: 'var(--color-brand)' }}
            aria-label="Account menu"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            {initials}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-52 rounded-xl border py-1 animate-fade-in"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-lg)', zIndex: 200 }}
            >
              <div className="border-b px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{user?.email}</p>
              </div>
              {[
                { label: 'Dashboard', href: '/dashboard/overview' },
                { label: 'Hotel profile', href: '/dashboard/profile' },
                { label: 'Settings', href: '/dashboard/settings' },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm transition-colors hover:bg-stone-50"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-1 border-t" style={{ borderColor: 'var(--color-border)' }} />
              <button
                type="button"
                role="menuitem"
                onClick={() => { setMenuOpen(false); void handleSignOut(); }}
                disabled={signingOut}
                className="block w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-stone-50 disabled:opacity-50"
                style={{ color: 'var(--color-danger-text)', background: 'none', border: 'none', cursor: signingOut ? 'not-allowed' : 'pointer' }}
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
