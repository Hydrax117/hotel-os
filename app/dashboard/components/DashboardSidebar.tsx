'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MOCK_HOTEL } from '../mock/data';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

// ── Inline SVG icons (24×24 viewBox, stroke-based) ───────────────────────────

const IconOverview = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const IconReservations = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="14" x2="8" y2="14" strokeWidth="3" strokeLinecap="round" />
    <line x1="12" y1="14" x2="12" y2="14" strokeWidth="3" strokeLinecap="round" />
    <line x1="16" y1="14" x2="16" y2="14" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const IconRooms = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12L12 3L21 12V20H15V14H9V20H3V12Z" />
  </svg>
);

const IconGuests = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="7" r="4" />
    <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
    <path d="M19 8v6M22 11h-6" />
  </svg>
);

const IconAnalytics = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

const IconProfile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconStaff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="7" r="4" />
    <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
    <circle cx="19" cy="7" r="2" />
    <path d="M22 21v-1a2 2 0 0 0-2-2h-2" />
  </svg>
);

const IconSubscription = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const IconPayouts = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v1m0 8v1M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5M12 16h.01" />
  </svg>
);

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview',      href: '/dashboard/overview',      icon: <IconOverview /> },
  { label: 'Reservations',  href: '/dashboard/reservations',  icon: <IconReservations /> },
  { label: 'Calendar',      href: '/dashboard/inventory',     icon: <IconCalendar /> },
  { label: 'Rooms',         href: '/dashboard/rooms',         icon: <IconRooms /> },
  { label: 'Guests',        href: '/dashboard/guests',        icon: <IconGuests /> },
  { label: 'Analytics',     href: '/dashboard/analytics',     icon: <IconAnalytics /> },
  { label: 'Hotel Profile', href: '/dashboard/profile',       icon: <IconProfile /> },
  { label: 'Staff',         href: '/dashboard/staff',         icon: <IconStaff /> },
  { label: 'Subscription',  href: '/dashboard/subscription',  icon: <IconSubscription /> },
  { label: 'Payouts',       href: '/dashboard/payouts',       icon: <IconPayouts /> },
];

// ── Component ─────────────────────────────────────────────────────────────────

type DashboardSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

export function DashboardSidebar({ mobileOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 flex flex-col',
          'transition-transform duration-200 ease-in-out',
          'lg:static lg:translate-x-0 lg:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{
          width: 'var(--db-sidebar-w)',
          background: 'var(--db-sidebar-bg)',
        }}
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center px-5">
          <span className="text-lg font-bold tracking-tight text-white">
            Hotel<span style={{ color: 'var(--db-accent)' }}>OS</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="flex flex-col gap-0.5" role="list">
            {NAV_ITEMS.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={[
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'hover:bg-white/5',
                    ].join(' ')}
                    style={{
                      color: isActive
                        ? 'var(--db-sidebar-active)'
                        : 'var(--db-sidebar-text)',
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Hotel name footer */}
        <div
          className="shrink-0 border-t px-4 py-4"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <p className="truncate text-xs font-medium" style={{ color: 'var(--db-sidebar-text)' }}>
            {MOCK_HOTEL.name}
          </p>
          <p className="text-xs" style={{ color: 'rgba(168,162,158,0.6)' }}>
            {MOCK_HOTEL.city}, {MOCK_HOTEL.state}
          </p>
        </div>
      </aside>
    </>
  );
}
