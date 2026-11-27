import React from 'react';
import Link from 'next/link';
import { ScrollReveal } from '../components/ScrollReveal';

// Served at hotel.domain.com via proxy.ts rewrite
// Server Component — no 'use client'

const FEATURES = [
  {
    title: 'Booking management',
    body: 'See every reservation in one place. Confirm, modify or cancel from your dashboard — no spreadsheets.',
  },
  {
    title: 'Room and rate control',
    body: 'Update pricing, block dates and manage availability in real time from any device.',
  },
  {
    title: 'Guest communications',
    body: 'Automated booking confirmations and reminders go out without you lifting a finger.',
  },
  {
    title: 'Revenue reporting',
    body: 'Track occupancy, revenue and booking trends. Know how your property is performing at a glance.',
  },
  {
    title: 'Direct bookings',
    body: 'Travellers on lodgen.com.ng find and book your property. No OTA commissions on direct traffic.',
  },
  {
    title: 'Paystack payouts',
    body: 'Guest payments settle directly to your Nigerian bank account on a predictable schedule.',
  },
] as const;

// Shared tokens for this page
const INK  = '#0f0e0c';
const INK2 = '#161512';
const INK3 = '#1e1d1a';
const GOLD    = '#c9a96e';
const GOLD_LT = '#dfc9a2';
const GREEN   = '#244735';
const TEXT_HI  = '#f0ede6';
const TEXT_MID = 'rgba(240,237,230,0.52)';
const BORDER   = 'rgba(240,237,230,0.08)';
const BORDER_G = 'rgba(201,169,110,0.2)';

export default function HotelHomePage() {
  return (
    <>
      <style>{`
        .hh-btn { transition: opacity 0.16s ease, transform 0.16s ease; }
        .hh-btn:hover { opacity: 0.86; transform: translateY(-1px); }

        .feat-card {
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .feat-card:hover {
          border-color: rgba(201,169,110,0.3) !important;
          background: rgba(201,169,110,0.04) !important;
        }

        .gold-line {
          display: inline-block; width: 28px; height: 1px;
          background: linear-gradient(to right, ${GOLD}, transparent);
          vertical-align: middle; margin-right: 10px;
        }

        .step-row:hover .step-node {
          border-color: ${GOLD} !important;
          color: ${GOLD} !important;
        }

        @keyframes hh-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hh-hero-eyebrow { animation: hh-fade-up 0.6s 0.1s cubic-bezier(0.16,1,0.3,1) both; }
        .hh-hero-h1      { animation: hh-fade-up 0.7s 0.2s cubic-bezier(0.16,1,0.3,1) both; }
        .hh-hero-sub     { animation: hh-fade-up 0.7s 0.32s cubic-bezier(0.16,1,0.3,1) both; }
        .hh-hero-ctas    { animation: hh-fade-up 0.7s 0.44s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div style={{ background: INK, minHeight: '100vh' }}>

        {/* ════════════════════════════════════════
            NAV
            ════════════════════════════════════════ */}
        <nav
          className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
          style={{ background: 'rgba(15,14,12,0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${BORDER}` }}
        >
          <Link href="/hotel-home" aria-label="Lodgen for hotels">
            <img src="/logo.png" alt="Lodgen" style={{ height: 26, width: 'auto', display: 'block', filter: 'brightness(0) invert(1)' }} />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: TEXT_MID }}>
              Sign in
            </Link>
            <Link href="/auth/signup"
              className="hh-btn rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: GREEN }}>
              List your hotel
            </Link>
          </div>
        </nav>

        {/* ════════════════════════════════════════
            HERO
            ════════════════════════════════════════ */}
        <section
          aria-label="Hero"
          className="relative flex items-center overflow-hidden"
          style={{ minHeight: '92vh', background: INK }}
        >
          {/* Background texture — subtle radial glows */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div style={{
              position: 'absolute', top: '-10%', right: '-5%',
              width: '55%', height: '70%',
              background: `radial-gradient(ellipse at top right, rgba(36,71,53,0.28) 0%, transparent 65%)`,
            }} />
            <div style={{
              position: 'absolute', bottom: '-5%', left: '-5%',
              width: '50%', height: '60%',
              background: `radial-gradient(ellipse at bottom left, rgba(201,169,110,0.1) 0%, transparent 60%)`,
            }} />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-28 lg:px-8">
            <div className="max-w-3xl">

              <p className="hh-hero-eyebrow mb-5 text-xs font-semibold uppercase" style={{ color: GOLD, letterSpacing: '0.16em' }}>
                <span className="gold-line" aria-hidden="true" />
                Lodgen for hotel owners
              </p>

              <h1 className="hh-hero-h1 mb-6" style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 300,
                color: TEXT_HI,
                fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
              }}>
                Your hotel.<br />
                <em style={{
                  fontStyle: 'italic',
                  background: `linear-gradient(130deg, ${GOLD} 0%, ${GOLD_LT} 55%, ${GOLD} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  More bookings.
                </em>
              </h1>

              <p className="hh-hero-sub mb-10 max-w-lg text-lg leading-relaxed" style={{ color: TEXT_MID, fontWeight: 300 }}>
                List on Lodgen and get in front of travellers actively searching for
                hotels in your city. Manage everything — availability, pricing,
                guests — from one dashboard.
              </p>

              <div className="hh-hero-ctas flex flex-col gap-3 sm:flex-row">
                <Link href="/auth/signup"
                  className="hh-btn inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white"
                  style={{ background: GREEN }}>
                  Get started — it's free
                </Link>
                <Link href="/auth/signin"
                  className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-medium transition-opacity hover:opacity-70"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT_MID }}>
                  Sign in to dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            FEATURES
            ════════════════════════════════════════ */}
        <section aria-label="Features" className="py-24" style={{ background: INK2, borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-8">

            <ScrollReveal variant="fade-up">
              <div className="mb-14">
                <p className="mb-3 text-xs font-semibold uppercase" style={{ color: GOLD, letterSpacing: '0.16em' }}>
                  <span className="gold-line" aria-hidden="true" />
                  What you get
                </p>
                <h2 style={{
                  fontFamily: 'var(--font-serif)', fontWeight: 300,
                  fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1,
                  letterSpacing: '-0.02em', color: TEXT_HI,
                }}>
                  Built for Nigerian hotels
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <ScrollReveal key={f.title} variant="fade-up" delay={i * 55}>
                  <div className="feat-card flex flex-col gap-3 rounded-2xl p-6" style={{
                    border: `1px solid ${BORDER}`,
                    background: INK3,
                  }}>
                    <h3 className="text-base font-semibold" style={{ color: TEXT_HI }}>{f.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: TEXT_MID }}>{f.body}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            HOW IT WORKS
            ════════════════════════════════════════ */}
        <section aria-label="How it works" className="py-24" style={{ background: INK, borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="grid gap-20 lg:grid-cols-2 lg:items-center">

              <ScrollReveal variant="fade-left">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase" style={{ color: GOLD, letterSpacing: '0.16em' }}>
                    <span className="gold-line" aria-hidden="true" />
                    Getting started
                  </p>
                  <h2 className="mb-5" style={{
                    fontFamily: 'var(--font-serif)', fontWeight: 300,
                    fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1,
                    letterSpacing: '-0.02em', color: TEXT_HI,
                  }}>
                    Live in under an hour.
                  </h2>
                  <p className="mb-10 text-base leading-relaxed max-w-sm" style={{ color: TEXT_MID, fontWeight: 300 }}>
                    No technical setup. No monthly subscription.
                    Create your account, submit your hotel details for review,
                    and start receiving bookings once approved.
                  </p>
                  <Link href="/auth/signup"
                    className="hh-btn inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white"
                    style={{ background: GREEN }}>
                    Create your account
                  </Link>
                </div>
              </ScrollReveal>

              <div className="relative">
                <div className="absolute hidden lg:block" style={{
                  left: 18, top: 36, bottom: 36, width: 1,
                  background: `linear-gradient(to bottom, ${GOLD}, transparent)`, opacity: 0.25,
                }} aria-hidden="true" />
                <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 36 }}>
                  {[
                    { n: '01', title: 'Create your account',     body: 'Sign up with your email. No credit card required.' },
                    { n: '02', title: 'Submit your hotel details', body: 'Fill in your property info and upload required documents for verification.' },
                    { n: '03', title: 'Go live and get bookings', body: 'Once approved, your hotel appears on Lodgen and travellers can book.' },
                  ].map(({ n, title, body }, i) => (
                    <ScrollReveal key={n} as="li" variant="fade-right" delay={i * 110} className="step-row flex gap-5 items-start">
                      <div className="step-node relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{
                        border: `1px solid ${BORDER_G}`,
                        color: TEXT_MID,
                        fontFamily: 'var(--font-serif)', fontSize: '0.85rem',
                        background: INK,
                      }} aria-hidden="true">{n}</div>
                      <div style={{ paddingTop: '0.3rem' }}>
                        <h3 className="mb-1.5 text-base font-semibold" style={{ color: TEXT_HI }}>{title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: TEXT_MID }}>{body}</p>
                      </div>
                    </ScrollReveal>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            BOTTOM CTA
            ════════════════════════════════════════ */}
        <section
          aria-label="Get started"
          className="owner-gradient-mesh relative overflow-hidden py-28"
          style={{ background: '#0a0908', borderTop: `1px solid ${BORDER}` }}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" aria-hidden="true">
            <span style={{
              fontFamily: 'var(--font-serif)', fontWeight: 300, fontStyle: 'italic',
              fontSize: 'clamp(5rem, 15vw, 14rem)', lineHeight: 1,
              color: `rgba(201,169,110,0.035)`, whiteSpace: 'nowrap',
            }}>Free to list</span>
          </div>

          <ScrollReveal variant="fade-up">
            <div className="relative z-10 mx-auto max-w-2xl px-6 text-center">
              <p className="mb-4 text-xs font-semibold uppercase" style={{ color: '#71816b', letterSpacing: '0.16em' }}>
                Ready?
              </p>
              <h2 className="mb-5" style={{
                fontFamily: 'var(--font-serif)', fontWeight: 300,
                fontSize: 'clamp(2.2rem, 5vw, 4rem)', lineHeight: 1.08,
                letterSpacing: '-0.025em', color: TEXT_HI,
              }}>
                List your hotel today.{' '}
                <em style={{
                  fontStyle: 'italic',
                  background: `linear-gradient(130deg, ${GOLD} 0%, ${GOLD_LT} 60%, ${GOLD} 100%)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>No fees to start.</em>
              </h2>
              <p className="mb-10 text-base leading-relaxed" style={{ color: TEXT_MID, fontWeight: 300 }}>
                Join hotels across Nigeria already managing bookings on Lodgen.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/auth/signup"
                  className="hh-btn inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white"
                  style={{ background: GREEN }}>
                  Create free account
                </Link>
                <Link href="/auth/signin"
                  className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-medium transition-opacity hover:opacity-70"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT_MID }}>
                  Sign in
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ════════════════════════════════════════
            FOOTER
            ════════════════════════════════════════ */}
        <footer className="py-8 text-center" style={{ background: INK, borderTop: `1px solid ${BORDER}` }}>
          <div className="mx-auto max-w-6xl px-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <img src="/logo.png" alt="Lodgen" style={{ height: 22, width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.5 }} />
            <p className="text-xs" style={{ color: TEXT_MID }}>© 2025 Lodgen. All rights reserved.</p>
            <div className="flex gap-5">
              {['Privacy', 'Terms', 'Contact'].map(l => (
                <Link key={l} href="#" className="text-xs transition-opacity hover:opacity-70" style={{ color: TEXT_MID }}>{l}</Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
