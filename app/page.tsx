import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TravelerNav } from './components/TravelerNav';
import { SearchBar } from './components/SearchBar';
import { HotelCard } from './components/HotelCard';
import { DestinationCard } from './components/DestinationCard';
import { Footer } from './components/Footer';
import { fetchFeaturedHotels, fetchCityCounts, type HotelSummary } from './lib/api/search';

export const instant = false;

// ── City gradients ────────────────────────────────────────────────────────────

const CITY_GRADIENTS: Record<string, { gradientFrom: string; gradientTo: string }> = {
  'Lagos':         { gradientFrom: '#c9a96e', gradientTo: '#7c5c3a' },
  'Abuja':         { gradientFrom: '#7a9e7e', gradientTo: '#3d6b4f' },
  'Port Harcourt': { gradientFrom: '#6b8cba', gradientTo: '#2d4a6b' },
  'Uyo':           { gradientFrom: '#c4956a', gradientTo: '#7a5035' },
  'Kano':          { gradientFrom: '#b8956a', gradientTo: '#6b4e2a' },
  'Kaduna':        { gradientFrom: '#8a9e8a', gradientTo: '#4a6b4a' },
};

const FALLBACK_DESTINATIONS = [
  { city: 'Lagos',         gradientFrom: '#c9a96e', gradientTo: '#7c5c3a' },
  { city: 'Abuja',         gradientFrom: '#7a9e7e', gradientTo: '#3d6b4f' },
  { city: 'Port Harcourt', gradientFrom: '#6b8cba', gradientTo: '#2d4a6b' },
  { city: 'Uyo',           gradientFrom: '#c4956a', gradientTo: '#7a5035' },
  { city: 'Kano',          gradientFrom: '#b8956a', gradientTo: '#6b4e2a' },
  { city: 'Kaduna',        gradientFrom: '#8a9e8a', gradientTo: '#4a6b4a' },
];

// ── Trust strip items ─────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  {
    label: 'Secure Booking',
    sub: 'Book with confidence',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
  },
  {
    label: 'Instant Confirmation',
    sub: 'Get your booking instantly',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    label: '24/7 Support',
    sub: "We're always here to help",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.42 2 2 0 0 1 3.6 1.26h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.4a16 16 0 0 0 6 6l.95-1.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 14.8"/>
      </svg>
    ),
  },
  {
    label: 'Top Rated Stays',
    sub: 'Trusted by travellers',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
] as const;

const HOW_IT_WORKS = [
  { num: '01', title: 'Search your destination',  body: 'Enter a city or landmark and pick your dates. Browse verified properties that match your needs.' },
  { num: '02', title: 'Compare and choose',       body: 'Review room options, photos, amenities and real guest ratings. Filter by price, category or facilities.' },
  { num: '03', title: 'Book with confidence',     body: 'Secure payment via Paystack. Instant confirmation. No hidden fees, no surprises at check-in.' },
] as const;

const OWNER_STEPS = [
  { step: '1', title: 'Create your listing',  body: 'Set up your hotel profile, rooms and pricing in minutes. No technical skills required.' },
  { step: '2', title: 'Manage in real time',  body: 'Update availability, block dates and control rates from any device, any time.' },
  { step: '3', title: 'Get paid faster',      body: 'Travelers book directly. Payouts arrive on a reliable schedule you can depend on.' },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [featuredResult, citiesResult] = await Promise.allSettled([
    fetchFeaturedHotels(),
    fetchCityCounts(),
  ]);

  const apiHotels: HotelSummary[] = featuredResult.status === 'fulfilled' ? featuredResult.value : [];
  const apiCities = citiesResult.status === 'fulfilled' ? citiesResult.value : [];

  const destinations = apiCities.length > 0
    ? apiCities.map(({ city, hotelCount }) => ({
        city, hotelCount,
        ...(CITY_GRADIENTS[city] ?? { gradientFrom: '#a0a094', gradientTo: '#606058' }),
      }))
    : FALLBACK_DESTINATIONS.map(d => ({ ...d, hotelCount: 0 }));

  const hasFeatured = apiHotels.length > 0;

  return (
    <>
      <style>{`
        .hp-cta-primary:hover  { opacity: 0.88; }
        .hp-cta-secondary:hover { opacity: 0.75; }
        .hp-view-all:hover     { opacity: 0.7; }
        .hp-city-pill:hover    { border-color: var(--color-brand) !important; color: var(--color-brand) !important; }
        .trust-item + .trust-item { border-left: 1px solid var(--color-border); }
        @media (max-width: 767px) {
          .trust-item + .trust-item { border-left: none; border-top: 1px solid var(--color-border); }
        }
      `}</style>

      <div style={{ background: 'var(--color-bg)' }}>
        <TravelerNav forceTransparent />

        {/* ════════ HERO — full-bleed image ════════ */}
        <section
          aria-label="Hero"
          className="relative w-full overflow-hidden"
          style={{
            /* 16:9 on desktop, taller on mobile so hotel stays visible */
            aspectRatio: '16 / 9',
            minHeight: '520px',
            maxHeight: '90vh',
          }}
        >
          {/* Background image */}
          <Image
            src="/lodgen-hero.webp.webp"
            alt="Luxury Nigerian hotel at sunset with pool"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{
              objectPosition: 'center center',
            }}
            /* Mobile: shift focus left so the building stays centred */
          />

          {/* Gradient overlay — left-heavy so text is always legible */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.38) 55%, rgba(0,0,0,0.10) 100%)',
            }}
            aria-hidden="true"
          />

          {/* Nav sits on top of the hero */}
          <div className="absolute inset-x-0 top-0 z-10">
            {/* TravelerNav is fixed-positioned so it already overlays */}
          </div>

          {/* Hero content */}
          <div
            className="absolute inset-0 flex flex-col justify-end"
            style={{ paddingBottom: '7%' }}
          >
            <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">

              {/* Badge */}
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-white"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Nigeria&apos;s Premier Hospitality Platform
              </div>

              {/* Headline */}
              <h1
                className="mb-4 leading-tight"
                style={{
                  color: '#ffffff',
                  fontSize: 'clamp(2.2rem, 5.5vw, 4rem)',
                  fontWeight: 700,
                  maxWidth: '11ch',
                  lineHeight: 1.1,
                }}
              >
                Stay somewhere{' '}
                <em
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    color: '#d4c09a',
                  }}
                >
                  worth remembering.
                </em>
              </h1>

              {/* Sub-copy */}
              <p
                className="mb-8 max-w-lg text-base leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.80)' }}
              >
                Discover exceptional stays across Nigeria. Find the perfect hotel,
                compare your options and book with confidence.
              </p>

              {/* Search bar — white card sitting on the hero */}
              <div className="max-w-4xl">
                <SearchBar />
              </div>
            </div>
          </div>
        </section>

        {/* ════════ TRUST STRIP ════════ */}
        <section
          aria-label="Why book with Lodgen"
          style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {TRUST_ITEMS.map(item => (
                <div
                  key={item.label}
                  className="trust-item flex items-center gap-4 py-6 px-4"
                >
                  <span style={{ color: 'var(--color-brand)', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {item.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {item.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ POPULAR DESTINATIONS ════════ */}
        <section id="explore" aria-label="Popular destinations" className="py-20" style={{ background: 'var(--color-bg)' }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p
                  className="mb-1.5 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-brand)' }}
                >
                  Explore top destinations
                </p>
                <h2
                  className="text-3xl font-bold leading-tight"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Popular Destinations
                </h2>
              </div>
              <Link
                href="/search"
                className="hp-view-all hidden shrink-0 items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-opacity sm:flex"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                View All Destinations →
              </Link>
            </div>

            {/* Desktop grid */}
            <div className="hidden gap-4 md:grid md:grid-cols-3 lg:grid-cols-6">
              {destinations.slice(0, 6).map(dest => (
                <DestinationCard key={dest.city} {...dest} />
              ))}
            </div>

            {/* Mobile horizontal scroll */}
            <div className="flex gap-3 overflow-x-auto pb-2 md:hidden" style={{ scrollSnapType: 'x mandatory' }}>
              {destinations.map(dest => (
                <div key={dest.city} className="w-48 shrink-0" style={{ scrollSnapAlign: 'start' }}>
                  <DestinationCard {...dest} />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center sm:hidden">
              <Link
                href="/search"
                className="rounded-lg border px-5 py-2.5 text-sm font-medium"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                View All Destinations →
              </Link>
            </div>
          </div>
        </section>

        {/* ════════ FEATURED HOTELS ════════ */}
        <section id="hotels" aria-label="Featured hotels" className="py-20" style={{ background: 'var(--color-surface)' }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p
                  className="mb-1.5 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-brand)' }}
                >
                  Curated picks
                </p>
                <h2
                  className="text-3xl font-bold leading-tight"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Featured Hotels
                </h2>
              </div>
              <Link
                href="/search"
                className="hp-view-all hidden shrink-0 items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-opacity sm:flex"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                View all hotels →
              </Link>
            </div>

            {hasFeatured ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {apiHotels.map(hotel => (
                  <HotelCard
                    key={hotel.id}
                    id={hotel.id}
                    name={hotel.name}
                    city={hotel.city}
                    state={hotel.state}
                    rating={hotel.rating}
                    reviewCount={hotel.reviewCount}
                    pricePerNight={hotel.pricePerNight}
                    amenities={hotel.amenities}
                    imageUrl={hotel.imageUrl}
                    featured={hotel.featured}
                  />
                ))}
              </div>
            ) : (
              <div
                className="flex flex-col items-center gap-4 rounded-2xl py-16 text-center"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ background: 'var(--color-brand-light)' }}
                  aria-hidden="true"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.5" aria-hidden="true">
                    <rect x="3" y="10" width="18" height="11" rx="1"/><path d="M8 21v-7m4 7v-7m4 7v-7"/><path d="M3 10l9-7 9 7"/>
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Hotels loading</p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Featured properties will appear here once available.</p>
                </div>
                <Link
                  href="/search"
                  className="hp-cta-primary rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity"
                  style={{ background: 'var(--color-brand)' }}
                >
                  Search all hotels
                </Link>
              </div>
            )}

            <div className="mt-8 flex justify-center sm:hidden">
              <Link href="/search" className="hp-view-all text-sm font-medium transition-opacity" style={{ color: 'var(--color-brand)' }}>
                View all hotels →
              </Link>
            </div>
          </div>
        </section>

        {/* ════════ HOW IT WORKS ════════ */}
        <section aria-label="How booking works" className="py-20" style={{ background: 'var(--color-bg)' }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mb-12 text-center">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-brand)' }}>
                Simple process
              </p>
              <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Book in three steps
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3 md:gap-12">
              {HOW_IT_WORKS.map(({ num, title, body }) => (
                <div key={num} className="flex flex-col gap-4">
                  <span
                    className="text-5xl font-light"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-brand-light)', lineHeight: 1 }}
                    aria-hidden="true"
                  >
                    {num}
                  </span>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <Link
                href="/search"
                className="hp-cta-primary rounded-xl px-7 py-3 text-sm font-semibold text-white transition-opacity"
                style={{ background: 'var(--color-brand)' }}
              >
                Explore hotels now
              </Link>
            </div>
          </div>
        </section>

        {/* ════════ OWNER ACQUISITION ════════ */}
        <section aria-label="List your hotel" className="py-20" style={{ background: 'var(--primitive-ink-900)' }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mb-12 max-w-xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-brand-secondary)' }}>
                For hotel owners
              </p>
              <h2 className="mb-4 text-3xl font-bold text-white">Grow your hotel with Lodgen</h2>
              <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Reach travelers across Nigeria. Manage bookings, rooms and rates from one professional dashboard.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 mb-10">
              {OWNER_STEPS.map(({ step, title, body }) => (
                <div key={step} className="flex flex-col gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shrink-0"
                    style={{ background: 'var(--color-brand)' }}
                    aria-hidden="true"
                  >
                    {step}
                  </div>
                  <h3 className="text-base font-semibold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{body}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="http://hotel.localhost:3000/auth/signup"
                className="hp-cta-primary inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-sm font-semibold text-white transition-opacity"
                style={{ background: 'var(--color-brand)' }}
              >
                Get started — it&apos;s free
              </Link>
              <Link
                href="http://hotel.localhost:3000"
                className="hp-cta-secondary inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-sm font-medium transition-opacity"
                style={{ border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.8)' }}
              >
                Learn more
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
