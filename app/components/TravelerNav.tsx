'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { logout } from '../lib/api/auth';

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="3" y1="7" x2="21" y2="7" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="17" x2="21" y2="17" />
  </svg>
);

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ── NavLink ───────────────────────────────────────────────────────────────────

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = href !== '/' && pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className="relative text-sm font-medium transition-colors duration-150"
      style={{
        color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.color = isActive
          ? 'var(--color-text-primary)'
          : 'var(--color-text-secondary)';
      }}
    >
      {children}
      {isActive && (
        <span
          className="absolute -bottom-[22px] left-0 right-0 h-[2px] rounded-full"
          style={{ background: 'var(--color-brand)' }}
        />
      )}
    </Link>
  );
}

// ── User dropdown ─────────────────────────────────────────────────────────────

function UserMenu({
  firstName,
  lastName,
  email,
  onSignOut,
}: {
  firstName: string;
  lastName: string;
  email: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = (firstName[0] ?? '') + (lastName[0] ?? '');

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition-colors"
        style={{
          border: '1px solid var(--color-border)',
          background: open ? 'var(--color-muted)' : 'transparent',
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        {/* Avatar */}
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: 'var(--color-brand)' }}
          aria-hidden="true"
        >
          {initials}
        </span>
        <span className="max-w-[80px] truncate text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {firstName}
        </span>
        <span style={{ color: 'var(--color-text-secondary)' }}>
          <IconChevronDown />
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border py-1 animate-fade-in"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 'var(--z-dropdown)',
          }}
        >
          {/* User info */}
          <div className="border-b px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
              {firstName} {lastName}
            </p>
            <p className="mt-0.5 text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
              {email}
            </p>
          </div>

          {/* Menu items */}
          {[
            { label: 'My bookings', href: '/bookings' },
            { label: 'Profile', href: '/profile' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm transition-colors"
              style={{ color: 'var(--color-text-primary)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-muted)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {item.label}
            </Link>
          ))}

          <div className="my-1 border-t" style={{ borderColor: 'var(--color-border)' }} />

          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onSignOut(); }}
            className="block w-full px-4 py-2.5 text-left text-sm transition-colors"
            style={{ color: 'var(--color-danger-text)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-muted)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main nav component ────────────────────────────────────────────────────────

export function TravelerNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore API errors — clear locally regardless
    }
    signOut();
    router.push('/');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        role="navigation"
        aria-label="Main"
        className="fixed left-0 right-0 top-0 z-[300] transition-all duration-200"
        style={{
          height: 'var(--nav-height)',
          background: scrolled ? 'rgba(255,255,255,0.96)' : 'var(--color-surface)',
          borderBottom: `1px solid ${scrolled ? 'var(--color-border)' : 'transparent'}`,
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
          boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
        }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 lg:px-8">

          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex items-center shrink-0"
            aria-label="Lodgen home"
          >
            <img
              src="/logo.png"
              alt="Lodgen"
              style={{ height: 32, width: 'auto', display: 'block' }}
            />
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden items-center gap-8 md:flex">
            <NavLink href="/search">Explore stays</NavLink>
            <NavLink href="/bookings">My bookings</NavLink>
            <a
              href="http://hotel.localhost:3000"
              className="text-sm font-medium transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)'; }}
            >
              List your property
            </a>
          </div>

          {/* ── Desktop auth ── */}
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <UserMenu
                firstName={user.firstName}
                lastName={user.lastName}
                email={user.email}
                onSignOut={() => void handleLogout()}
              />
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)'; }}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85"
                  style={{ background: 'var(--color-brand)' }}
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            type="button"
            className="flex items-center justify-center rounded-lg p-2 transition-colors md:hidden"
            style={{ color: 'var(--color-text-primary)' }}
            onClick={() => setMobileOpen(o => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 md:hidden"
            style={{
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(2px)',
              zIndex: 299,
            }}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            id="mobile-nav"
            role="dialog"
            aria-label="Navigation menu"
            className="fixed inset-x-0 top-0 md:hidden animate-slide-up"
            style={{
              paddingTop: 'var(--nav-height)',
              background: 'var(--color-surface)',
              borderBottom: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 300,
            }}
          >
            {/* User info strip (when signed in) */}
            {user && (
              <div
                className="flex items-center gap-3 border-b px-5 py-4"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: 'var(--color-brand)' }}
                  aria-hidden="true"
                >
                  {user.firstName[0]}{user.lastName[0]}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {user.email}
                  </p>
                </div>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex flex-col px-3 py-3">
              {[
                { label: 'Explore stays', href: '/search' },
                { label: 'My bookings', href: '/bookings' },
                { label: 'List your property', href: 'http://hotel.localhost:3000' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center rounded-lg px-3 py-3 text-base font-medium transition-colors"
                  style={{ color: 'var(--color-text-primary)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-muted)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Auth buttons */}
            <div
              className="flex flex-col gap-2 border-t px-5 py-4"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    My profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setMobileOpen(false); void handleLogout(); }}
                    className="flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium"
                    style={{
                      background: 'var(--color-danger-bg)',
                      color: 'var(--color-danger-text)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85"
                    style={{ background: 'var(--color-brand)' }}
                  >
                    Get started free
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
