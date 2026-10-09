'use client';

import React, { useState } from 'react';
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

const IconFrontDesk = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="13" width="20" height="8" rx="1" />
    <path d="M6 13V9a6 6 0 0 1 12 0v4" />
    <line x1="12" y1="13" x2="12" y2="21" />
  </svg>
);

const IconComplaints = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const IconReviews = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconChevronUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="18 15 12 9 6 15" />
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
  { label: 'Complaints',    href: '/dashboard/complaints',    icon: <IconComplaints /> },
  { label: 'Reviews',       href: '/dashboard/reviews',       icon: <IconReviews /> },
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
  const [frontDeskOpen, setFrontDeskOpen] = useState(false);

  const frontDeskSubItems = [
    { label: 'Check In', href: '/dashboard/front-desk/check-in' },
    { label: 'Check Out', href: '/dashboard/front-desk/check-out' },
  ];

  const isFrontDeskActive =
    pathname === '/dashboard/front-desk' ||
    pathname.startsWith('/dashboard/front-desk/');

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

            {/* Front Desk — expandable */}
            <li>
              <button
                onClick={() => setFrontDeskOpen(o => !o)}
                className={[
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isFrontDeskActive ? 'bg-white/10' : 'hover:bg-white/5',
                ].join(' ')}
                style={{
                  color: isFrontDeskActive
                    ? 'var(--db-sidebar-active)'
                    : 'var(--db-sidebar-text)',
                }}
                aria-expanded={frontDeskOpen}
              >
                <IconFrontDesk />
                <span className="flex-1 text-left">Front Desk</span>
                {frontDeskOpen ? <IconChevronUp /> : <IconChevronDown />}
              </button>

              {frontDeskOpen && (
                <ul className="mt-0.5 flex flex-col gap-0.5" role="list">
                  {frontDeskSubItems.map(sub => {
                    const isSubActive = pathname === sub.href;
                    return (
                      <li key={sub.href}>
                        <Link
                          href={sub.href}
                          onClick={onClose}
                          className={[
                            'flex items-center rounded-lg py-2 pr-3 text-xs font-medium transition-colors pl-6',
                            isSubActive ? 'bg-white/10' : 'hover:bg-white/5',
                          ].join(' ')}
                          style={{
                            color: isSubActive
                              ? 'var(--db-sidebar-active)'
                              : 'var(--db-sidebar-text)',
                          }}
                          aria-current={isSubActive ? 'page' : undefined}
                        >
                          {sub.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
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
