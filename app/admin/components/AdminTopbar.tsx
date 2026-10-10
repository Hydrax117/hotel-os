'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

type AdminTopbarProps = {
  onMenuToggle: () => void;
};

function getPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1] ?? 'admin';
  const map: Record<string, string> = {
    admin: 'Overview',
    overview: 'Overview',
    hotels: 'Hotels',
    verification: 'Hotel Verification',
    bookings: 'Bookings',
    users: 'Users',
    subscriptions: 'Subscriptions',
    payments: 'Payments',
    payouts: 'Payouts',
    reviews: 'Reviews',
    cities: 'Cities',
    reports: 'Reports',
    audit: 'Audit Logs',
    system: 'System',
  };
  return map[last] ?? last.charAt(0).toUpperCase() + last.slice(1);
}

export function AdminTopbar({ onMenuToggle }: AdminTopbarProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header
      className="flex shrink-0 items-center gap-3 border-b px-4 lg:px-6"
      style={{
        height: 'var(--ad-topbar-h)',
        background: 'var(--ad-surface)',
        borderColor: 'var(--ad-border)',
      }}
    >
      {/* Hamburger */}
      <button
        type="button"
        onClick={onMenuToggle}
        className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--ad-muted)] lg:hidden"
        aria-label="Open navigation menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Page title */}
      <h1 className="flex-1 text-base font-semibold" style={{ color: 'var(--ad-primary)' }}>
        {pageTitle}
      </h1>

      {/* Notification bell */}
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--ad-muted)]"
        aria-label="View notifications"
        style={{ color: 'var(--ad-secondary)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      {/* Super Admin avatar */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ background: 'var(--ad-accent)' }}
        title="Super Admin"
        aria-label="Super Admin avatar"
      >
        SA
      </div>
    </header>
  );
}
