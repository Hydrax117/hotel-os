'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

type NavSection = {
  section: string;
  items: NavItem[];
};

const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
  </svg>
);
const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="2" width="16" height="20" rx="1" /><line x1="9" y1="22" x2="9" y2="12" />
    <line x1="15" y1="22" x2="15" y2="12" /><line x1="9" y1="7" x2="9" y2="7" strokeWidth="3" strokeLinecap="round" />
    <line x1="15" y1="7" x2="15" y2="7" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconBookOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="7" r="4" /><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
    <circle cx="19" cy="7" r="2" /><path d="M22 21v-1a2 2 0 0 0-2-2h-2" />
  </svg>
);
const IconCreditCard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);
const IconDollar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const IconArrowUpRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
  </svg>
);
const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconMap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);
const IconBarChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);
const IconClipboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);
const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const NAV_SECTIONS: NavSection[] = [
  {
    section: 'PLATFORM',
    items: [
      { label: 'Overview', href: '/admin', icon: <IconGrid /> },
      { label: 'Hotels', href: '/admin/hotels', icon: <IconBuilding /> },
      { label: 'Hotel Verification', href: '/admin/hotels/verification', icon: <IconShield /> },
      { label: 'Bookings', href: '/admin/bookings', icon: <IconBookOpen /> },
      { label: 'Users', href: '/admin/users', icon: <IconUsers /> },
    ],
  },
  {
    section: 'FINANCE',
    items: [
      { label: 'Subscriptions', href: '/admin/subscriptions', icon: <IconCreditCard /> },
      { label: 'Payments', href: '/admin/payments', icon: <IconDollar /> },
      { label: 'Payouts', href: '/admin/payouts', icon: <IconArrowUpRight /> },
    ],
  },
  {
    section: 'CONTENT',
    items: [
      { label: 'Reviews', href: '/admin/reviews', icon: <IconStar /> },
      { label: 'Cities', href: '/admin/cities', icon: <IconMap /> },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { label: 'Reports', href: '/admin/reports', icon: <IconBarChart /> },
      { label: 'Audit Logs', href: '/admin/audit', icon: <IconClipboard /> },
      { label: 'System', href: '/admin/system', icon: <IconSettings /> },
    ],
  },
];

type AdminSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

export function AdminSidebar({ mobileOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/admin') return pathname === '/admin' || pathname === '/admin/overview';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 flex flex-col',
          'transition-transform duration-200 ease-in-out',
          'lg:static lg:translate-x-0 lg:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{
          width: 'var(--ad-sidebar-w)',
          background: 'var(--ad-sidebar-bg)',
          minHeight: '100vh',
        }}
        aria-label="Admin navigation"
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center gap-2 px-5">
          <span className="text-lg font-bold tracking-tight text-white">
            Hotel<span style={{ color: 'var(--ad-accent)' }}>OS</span>
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
            style={{ background: 'var(--ad-accent)' }}
          >
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Main navigation">
          {NAV_SECTIONS.map(({ section, items }) => (
            <div key={section} className="mb-4">
              <p
                className="mb-1 px-3 text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(139,146,165,0.5)' }}
              >
                {section}
              </p>
              <ul className="flex flex-col gap-0.5" role="list">
                {items.map(item => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={[
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          active ? 'bg-white/10' : 'hover:bg-white/5',
                        ].join(' ')}
                        style={{
                          color: active
                            ? 'var(--ad-sidebar-active)'
                            : 'var(--ad-sidebar-text)',
                        }}
                        aria-current={active ? 'page' : undefined}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div
          className="shrink-0 border-t px-4 py-3"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--ad-sidebar-text)' }}>Super Admin</p>
          <p className="text-xs" style={{ color: 'rgba(139,146,165,0.5)' }}>Platform Operator</p>
        </div>
      </aside>
    </>
  );
}
