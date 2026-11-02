'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { logout } from '../../lib/api/auth';

type DashboardTopbarProps = {
  onMenuToggle: () => void;
};

/** Derive a human-readable page title from the current pathname. */
function getPageTitle(pathname: string): string {
  const segment = pathname.split('/').filter(Boolean).pop() ?? 'dashboard';
  const map: Record<string, string> = {
    overview: 'Overview',
    reservations: 'Reservations',
    inventory: 'Calendar',
    rooms: 'Rooms',
    guests: 'Guests',
    analytics: 'Analytics',
    profile: 'Hotel Profile',
    staff: 'Staff',
    subscription: 'Subscription',
    payouts: 'Payouts',
    dashboard: 'Dashboard',
  };
  return map[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function DashboardTopbar({ onMenuToggle }: DashboardTopbarProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const { user, setUser } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const initials = user
    ? (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')
    : 'HO';

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Hotel OS';

  async function handleSignOut() {
    setSigningOut(true);
    await logout();
    setUser(null);
    // Hard-navigate so the entire React tree is unmounted immediately.
    // router.replace() is async and leaves the dashboard briefly visible
    // while the navigation is in flight.
    window.location.href = '/auth/signin';
  }

  return (
    <header
      className="flex shrink-0 items-center gap-3 border-b px-4 lg:px-6"
      style={{
        height: 'var(--db-topbar-h)',
        background: 'var(--db-surface)',
        borderColor: 'var(--db-border)',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        type="button"
        onClick={onMenuToggle}
        className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--db-muted)] lg:hidden"
        aria-label="Open navigation menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Page title */}
      <h1
        className="flex-1 text-base font-semibold"
        style={{ color: 'var(--db-primary)' }}
      >
        {pageTitle}
      </h1>

      {/* User name chip */}
      <span
        className="hidden items-center rounded-full border px-3 py-1 text-xs font-medium sm:flex"
        style={{
          borderColor: 'var(--db-border)',
          color: 'var(--db-secondary)',
          background: 'var(--db-muted)',
        }}
      >
        {displayName}
      </span>

      {/* Notification bell */}
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--db-muted)]"
        aria-label="View notifications"
        style={{ color: 'var(--db-secondary)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      {/* User avatar */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ background: 'var(--db-accent)' }}
        title={user?.firstName ?? 'User'}
        aria-label={`User avatar: ${initials}`}
      >
        {initials}
      </div>

      {/* Sign out */}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="hidden items-center rounded-md border px-3 py-1 text-xs font-medium transition-colors hover:bg-[var(--db-muted)] sm:flex"
        style={{
          borderColor: 'var(--db-border)',
          color: 'var(--db-secondary)',
          cursor: signingOut ? 'not-allowed' : 'pointer',
          opacity: signingOut ? 0.6 : 1,
          background: 'transparent',
        }}
        aria-label="Sign out"
      >
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </header>
  );
}
