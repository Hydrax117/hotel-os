import React from 'react';
import Link from 'next/link';

// ── Owner Landing Page ────────────────────────────────────────────────────────
// Served at hotel.domain.com / (rewritten to /hotel-home by proxy.ts)
// Server component — no 'use client'.

export default function HotelHomePage() {
  return (
    <div style={{ background: 'var(--tp-bg)', minHeight: '100vh' }}>

      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{
          background: 'var(--tp-bg)',
          borderBottom: '1px solid var(--tp-border)',
        }}
      >
        <Link
          href="/hotel-home"
          className="text-xl font-bold tracking-tight"
          style={{ color: 'var(--tp-primary)' }}
        >
          Hotel<span style={{ color: 'var(--tp-accent)' }}>OS</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/signin"
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--tp-primary)' }}
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: 'var(--tp-primary)' }}
          >
            List your hotel
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="relative flex min-h-[85vh] items-center"
        style={{ background: 'var(--tp-bg)' }}
        aria-label="Hero"
      >
        <div className="mx-auto w-full max-w-5xl px-6 py-20">
          <div className="flex flex-col gap-8 text-center">
            <h1
              className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl"
              style={{ color: 'var(--tp-primary)' }}
            >
              Grow your hotel business
              <br />
              <span style={{ color: 'var(--tp-accent)' }}>with HotelOS</span>
            </h1>

            <p
              className="mx-auto max-w-xl text-lg leading-relaxed"
              style={{ color: 'var(--tp-secondary)' }}
            >
              Reach thousands of travelers across Nigeria. List your property,
              manage bookings in real time, and get paid faster — all from one
              dashboard.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/auth/signup"
                className="rounded-xl px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-80"
                style={{ background: 'var(--tp-primary)' }}
              >
                Get started — it&apos;s free
              </Link>
              <Link
                href="/auth/signin"
                className="rounded-xl px-8 py-4 text-base font-medium transition-opacity hover:opacity-70"
                style={{
                  border: '1px solid var(--tp-border)',
                  color: 'var(--tp-primary)',
                }}
              >
                Sign in to dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section
        className="py-16"
        style={{ background: 'var(--tp-surface)' }}
        aria-label="Features"
      >
        <div className="mx-auto max-w-5xl px-6">
          <h2
            className="mb-10 text-center text-3xl font-bold tracking-tight"
            style={{ color: 'var(--tp-primary)' }}
          >
            Everything you need to succeed
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: '🏨',
                title: 'Easy listing setup',
                desc: 'Add your hotel details, rooms, photos, and pricing in minutes — no technical skills required.',
              },
              {
                icon: '📅',
                title: 'Real-time reservations',
                desc: 'Get instant booking notifications and manage your availability calendar from any device.',
              },
              {
                icon: '💰',
                title: 'Fast payouts',
                desc: 'Receive payments directly to your bank account on a reliable schedule you can count on.',
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col gap-4 rounded-2xl p-6"
                style={{
                  border: '1px solid var(--tp-border)',
                  background: 'var(--tp-bg)',
                }}
              >
                <span className="text-3xl" aria-hidden="true">{icon}</span>
                <h3 className="text-lg font-bold" style={{ color: 'var(--tp-primary)' }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--tp-secondary)' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        className="py-16"
        style={{ background: 'var(--tp-bg)' }}
        aria-label="How it works"
      >
        <div className="mx-auto max-w-5xl px-6">
          <h2
            className="mb-10 text-center text-3xl font-bold tracking-tight"
            style={{ color: 'var(--tp-primary)' }}
          >
            How it works
          </h2>

          <div className="flex flex-col gap-8 md:flex-row md:gap-6">
            {[
              {
                step: '1',
                title: 'Create your account',
                desc: 'Sign up in seconds with your email. No credit card needed to get started.',
              },
              {
                step: '2',
                title: 'Submit hotel details',
                desc: 'Fill in your property info, upload documents for verification, and choose a plan.',
              },
              {
                step: '3',
                title: 'Start receiving bookings',
                desc: 'Once approved, your hotel goes live and travelers can book instantly.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-1 flex-col items-center gap-4 text-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ background: 'var(--tp-accent)' }}
                  aria-hidden="true"
                >
                  {step}
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--tp-primary)' }}>
                    {title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--tp-secondary)' }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section
        className="py-10"
        style={{ background: 'var(--tp-muted)' }}
        aria-label="Platform statistics"
      >
        <div className="mx-auto max-w-5xl px-6">
          <div
            className="flex flex-wrap items-center justify-center gap-0 divide-y md:divide-y-0 md:divide-x"
            style={{ borderColor: 'var(--tp-border)' }}
          >
            {[
              { value: '500+',    label: 'Hotels listed' },
              { value: '50,000+', label: 'Traveler bookings' },
              { value: '₦2B+',   label: 'Processed' },
            ].map(({ value, label }, i) => (
              <div
                key={i}
                className="flex w-1/2 flex-col items-center gap-1 py-6 md:w-auto md:flex-1 md:py-0 md:px-10"
              >
                <span
                  className="text-3xl font-bold"
                  style={{ color: 'var(--tp-accent)' }}
                >
                  {value}
                </span>
                <span className="text-sm" style={{ color: 'var(--tp-secondary)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="py-8 text-center"
        style={{
          background: 'var(--tp-bg)',
          borderTop: '1px solid var(--tp-border)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--tp-secondary)' }}>
          &copy; 2025 HotelOS. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
