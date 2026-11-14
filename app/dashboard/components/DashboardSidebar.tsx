'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { logout } from '@/app/lib/api/auth';

// ── Nav structure ─────────────────────────────────────────────────────────────

type NavItem  = { label: string; href: string; icon: React.ReactNode };
type NavGroup = { group: string; items: NavItem[] };

// ── Icons (18×18 stroke-2) ────────────────────────────────────────────────────

const ic = (d: React.ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

const Icons = {
  overview:    ic(<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>),
  calendar:    ic(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
  rooms:       ic(<><path d="M3 12L12 3L21 12V20H15V14H9V20H3V12Z"/></>),
  resources:   ic(<><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/></>),
  rates:       ic(<><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3"/></>),
  promotions:  ic(<><circle cx="9" cy="9" r="1.5"/><circle cx="15" cy="15" r="1.5"/><path d="M20 12a8 8 0 11-16 0 8 8 0 0116 0z"/><line x1="9.5" y1="14.5" x2="14.5" y2="9.5"/></>),
  guests:      ic(<><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><path d="M19 8v6M22 11h-6"/></>),
  analytics:   ic(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>),
  profile:     ic(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
  preview:     ic(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>),
  staff:       ic(<><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><circle cx="19" cy="7" r="2"/><path d="M22 21v-1a2 2 0 0 0-2-2h-2"/></>),
  complaints:  ic(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/></>),
  reviews:     ic(<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>),
  subscription:ic(<><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>),
  payouts:     ic(<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>),
  integrations:ic(<><rect x="2" y="3" width="9" height="9" rx="1"/><rect x="13" y="3" width="9" height="9" rx="1"/><rect x="2" y="14" width="9" height="7" rx="1"/><path d="M17.5 14v7M14 17.5h7"/></>),
  settings:    ic(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>),
  frontDesk:   ic(<><rect x="2" y="13" width="20" height="8" rx="1"/><path d="M6 13V9a6 6 0 0 1 12 0v4"/><line x1="12" y1="13" x2="12" y2="21"/></>),
  roomService: ic(<><circle cx="12" cy="5" r="3"/><path d="M3 18a9 9 0 0 1 18 0"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="9" y1="18" x2="15" y2="18"/></>),
  chevronDown: ic(<polyline points="6 9 12 15 18 9"/>),
  chevronUp:   ic(<polyline points="18 15 12 9 6 15"/>),
  signOut:     ic(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>),
};

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'Operations',
    items: [
      { label: 'Overview',     href: '/dashboard/overview',    icon: Icons.overview },
      { label: 'Reservations', href: '/dashboard/reservations', icon: Icons.calendar },
      { label: 'Calendar',     href: '/dashboard/inventory',   icon: Icons.calendar },
      { label: 'Rooms',        href: '/dashboard/rooms',       icon: Icons.rooms },
      { label: 'Resources',    href: '/dashboard/resources',   icon: Icons.resources },
      { label: 'Rates',        href: '/dashboard/rates',       icon: Icons.rates },
      { label: 'Promotions',   href: '/dashboard/promotions',  icon: Icons.promotions },
      { label: 'Guests',       href: '/dashboard/guests',      icon: Icons.guests },
      { label: 'Room Service', href: '/dashboard/room-service', icon: Icons.roomService },
    ],
  },
  {
    group: 'Insights',
    items: [
      { label: 'Analytics',  href: '/dashboard/analytics', icon: Icons.analytics },
      { label: 'Reviews',    href: '/dashboard/reviews',   icon: Icons.reviews },
      { label: 'Complaints', href: '/dashboard/complaints', icon: Icons.complaints },
    ],
  },
  {
    group: 'Property',
    items: [
      { label: 'Hotel Profile',   href: '/dashboard/profile',         icon: Icons.profile },
      { label: 'Listing Preview', href: '/dashboard/listing-preview', icon: Icons.preview },
      { label: 'Staff',           href: '/dashboard/staff',           icon: Icons.staff },
    ],
  },
  {
    group: 'Account',
    items: [
      { label: 'Subscription', href: '/dashboard/subscription', icon: Icons.subscription },
      { label: 'Payouts',      href: '/dashboard/payouts',      icon: Icons.payouts },
      { label: 'Integrations', href: '/dashboard/integrations', icon: Icons.integrations },
      { label: 'Settings',     href: '/dashboard/settings',     icon: Icons.settings },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

type Props = { mobileOpen: boolean; onClose: () => void };

export function DashboardSidebar({ mobileOpen, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [frontDeskOpen, setFrontDeskOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const initials = user ? (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '') : 'HO';
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Hotel Owner';

  async function handleSignOut() {
    setSigningOut(true);
    try { await logout(); } catch { /* ignore */ }
    signOut();
    router.replace('/auth/signin');
  }

  const frontDeskSubItems = [
    { label: 'Check In',  href: '/dashboard/front-desk/check-in' },
    { label: 'Check Out', href: '/dashboard/front-desk/check-out' },
  ];

  const isFrontDeskActive = pathname.startsWith('/dashboard/front-desk');

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  // ── Sidebar panel ────────────────────────────────────────────────────────

  const sidebarPanel = (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-30 flex flex-col',
        'transition-transform duration-200 ease-in-out',
        'lg:static lg:translate-x-0 lg:z-auto',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
      style={{ width: 'var(--sidebar-w)', background: 'var(--primitive-ink-900)' }}
      aria-label="Hotel dashboard navigation"
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Link href="/dashboard/overview" className="flex items-center" onClick={onClose}>
          <img
            src="/logo.png"
            alt="Lodgen"
            style={{ height: 28, width: 'auto', display: 'block', filter: 'brightness(0) invert(1)' }}
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6" aria-label="Dashboard navigation">
        {NAV_GROUPS.map(({ group, items }) => (
          <div key={group}>
            <p
              className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              {group}
            </p>
            <ul className="flex flex-col gap-0.5" role="list">
              {items.map(item => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                      style={{
                        color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                      }}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span style={{ opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}

              {/* Front Desk — expandable (only in Operations group) */}
              {group === 'Operations' && (
                <li>
                  <button
                    type="button"
                    onClick={() => setFrontDeskOpen(o => !o)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                    style={{
                      color: isFrontDeskActive ? '#fff' : 'rgba(255,255,255,0.5)',
                      background: isFrontDeskActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                    }}
                    aria-expanded={frontDeskOpen}
                  >
                    <span style={{ opacity: isFrontDeskActive ? 1 : 0.7 }}>{Icons.frontDesk}</span>
                    <span className="flex-1 text-left">Front Desk</span>
                    {frontDeskOpen ? Icons.chevronUp : Icons.chevronDown}
                  </button>
                  {frontDeskOpen && (
                    <ul className="mt-0.5 flex flex-col gap-0.5 pl-9" role="list">
                      {frontDeskSubItems.map(sub => {
                        const subActive = pathname === sub.href;
                        return (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              onClick={onClose}
                              className="flex items-center rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                              style={{
                                color: subActive ? '#fff' : 'rgba(255,255,255,0.45)',
                                background: subActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                              }}
                              aria-current={subActive ? 'page' : undefined}
                            >
                              {sub.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              )}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t px-4 py-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: 'var(--color-brand)' }}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{displayName}</p>
            <p className="truncate text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{user?.email ?? ''}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50"
          style={{ color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: signingOut ? 'not-allowed' : 'pointer' }}
        >
          {Icons.signOut}
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  );

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
      {sidebarPanel}
    </>
  );
}
