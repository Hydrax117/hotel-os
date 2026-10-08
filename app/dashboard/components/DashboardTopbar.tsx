'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MOCK_HOTEL } from '../mock/data';

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

  // Derive initials from the hotel name for the user avatar
  const initials = MOCK_HOTEL.name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('');

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

      {/* Hotel name chip */}
      <span
        className="hidden items-center rounded-full border px-3 py-1 text-xs font-medium sm:flex"
        style={{
          borderColor: 'var(--db-border)',
          color: 'var(--db-secondary)',
          background: 'var(--db-muted)',
        }}
      >
        {MOCK_HOTEL.name}
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
        title={MOCK_HOTEL.name}
        aria-label={`User avatar: ${initials}`}
      >
        {initials}
      </div>
    </header>
  );
}
