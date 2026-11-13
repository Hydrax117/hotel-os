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
];

const TRUST_ITEMS = [
  {
    label: 'Secure Booking',
    sub: 'Book with confidence',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
  },
  {
    label: 'Instant Confirmation',
    sub: 'Get your booking instantly',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    label: '24/7 Support',
    sub: "We're always here to help",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.42 2 2 0 0 1 3.6 1.26h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.4a16 16 0 0 0 6 6l.95-1.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 14.8"/>
      </svg>
    ),
  },
  {
    label: 'Top Rated Stays',
    sub: 'Trusted by travellers',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
] as const;

export default async function HomePage() {
  const [featuredResult, citiesResult] = await Promise.allSettled([
    fetchFeaturedHotels(),
    fetchCityCounts(),
  ]);

  const apiHotels: HotelSummary[] = featuredResult.status === 'fulfilled' ? featuredResult.value : [];
  const apiCities = citiesResult.status === 'fulfilled' ? citiesResult.value : [];

  const destinations = apiCities.length > 0
    ? apiCities.slice(0, 4).map(({ city, hotelCount }) => ({
        city, hotelCount,
        ...(CITY_GRADIENTS[city] ?? { gradientFrom: '#a0a094', gradientTo: '#606058' }),
      }))
    : FALLBACK_DESTINATIONS.map(d => ({ ...d, hotelCount: 0 }));

  const hasFeatured = apiHotels.length > 0;

  return (
    <>
      <style>{`
        .hp-cta:hover  { opacity: 0.88; }
        .hp-link:hover { opacity: 0.7; }
        .hp-pill:hover { border-color: var(--color-brand) !important; color: var(--color-brand) !important; }
        .trust-col + .trust-col { border-left: 1px solid var(--color-border); }
        @media (max-width: 767px) {
          .trust-col + .trust-col { border-left: none; border-top: 1px solid var(--color-border); }
        }
      `}</style>

      <div style={{ background: 'var(--color-bg)' }}>
        <TravelerNav forceTransparent />

        {/* HERO */}
        <section
          aria-label="Hero"
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: '16 / 9',
            minHeight: '540px',
            maxHeight: '92vh',
          }}
        >
          <Image
            src="/lodgen-hero.webp.webp"
            alt="Luxury hotel at sunset with illuminated pool"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: 'center center' }}
          />

          {/* Gradient — heavier on the left where text sits */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(100deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.40) 45%, rgba(0,0,0,0.08) 100%)',
            }}
            aria-hidden="true"
          />

          {/* Content — anchored to the lower-left of the image */}
          <div
            className="absolute inset-0 flex flex-col justify-end"
            style={{ paddingBottom: '6%' }}
          >
            <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">

              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 400,
                  color: '#ffffff',
                  fontSize: 'clamp(2.4rem, 5.5vw, 4rem)',
                  lineHeight: 1.08,
                  letterSpacing: '-0.01em',
                  maxWidth: '11ch',
                  marginBottom: '1rem',
                }}
              >
                Stay somewhere{' '}
                <em
                  style={{
                    fontStyle: 'italic',
                    fontWeight: 300,
                    color: '#d4c09a',
                  }}
                >
                  worth remembering.
                </em>
              </h1>

              <p
                className="mb-8 max-w-md text-base leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.78)' }}
              >
                Discover exceptional stays across Nigeria. Find the right hotel,
                compare your options and book with confidence.
              </p>

              <div style={{ maxWidth: '880px' }}>
                <SearchBar />
              </div>
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section
          aria-label="Why book with Lodgen"
          style={{
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {TRUST_ITEMS.map(item => (
                <div
                  key={item.label}
                  className="trust-col flex items-center gap-4 py-6 px-5"
                >
                  <span style={{ color: 'var(--color-brand)', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {item.label}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {item.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* POPULAR DESTINATIONS */}
        <section
          id="explore"
          aria-label="Popular destinations"
          className="py-20"
          style={{ background: 'var(--color-bg)' }}
        >
          <div className="mx-auto max-w-7xl px-5 lg:px-8">

            {/* Section header — left-aligned, asymmetric */}
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-brand)' }}
                >
                  Explore top destinations
                </p>
                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontWeight: 400,
                    fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                    lineHeight: 1.15,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Popular Destinations
                </h2>
              </div>
              <Link
                href="/search"
                className="hp-link hidden shrink-0 items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-opacity sm:flex"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                View All Destinations →
              </Link>
            </div>

            {/* 4-column grid — large readable cards */}
            <div className="hidden gap-5 md:grid md:grid-cols-4">
              {destinations.map(dest => (
                <DestinationCard key={dest.city} {...dest} />
              ))}
            </div>

            {/* Mobile horizontal scroll */}
            <div
              className="flex gap-3 overflow-x-auto pb-2 md:hidden"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {destinations.map(dest => (
                <div
                  key={dest.city}
                  className="w-64 shrink-0"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <DestinationCard {...dest} />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-center sm:hidden">
              <Link
                href="/search"
                className="rounded-lg border px-5 py-2.5 text-sm font-medium"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                View All Destinations →
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURED HOTELS */}
        <section
          id="hotels"
          aria-label="Featured hotels"
          className="py-20"
          style={{ background: 'var(--color-surface)' }}
        >
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-brand)' }}
                >
                  Curated picks
                </p>
                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontWeight: 400,
                    fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                    lineHeight: 1.15,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Featured Hotels
                </h2>
              </div>
              <Link
                href="/search"
                className="hp-link hidden shrink-0 items-center gap-1 text-sm font-medium transition-opacity sm:flex"
                style={{ color: 'var(--color-brand)' }}
              >
                View all →
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
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <p
                  className="text-base font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Hotels loading
                </p>
                <p
                  className="text-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Featured properties will appear here once available.
                </p>
                <Link
                  href="/search"
                  className="hp-cta rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity"
                  style={{ background: 'var(--color-brand)' }}
                >
                  Search all hotels
                </Link>
              </div>
            )}

            <div className="mt-8 flex justify-center sm:hidden">
              <Link
                href="/search"
                className="hp-link text-sm font-medium transition-opacity"
                style={{ color: 'var(--color-brand)' }}
              >
                View all hotels →
              </Link>
            </div>
          </div>
        </section>

        {/* EDITORIAL SPLIT — how it works, without the numbered card pattern */}
        <section
          aria-label="How booking works"
          className="py-20"
          style={{ background: 'var(--color-bg)' }}
        >
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 lg:items-center">

              {/* Left: editorial copy */}
              <div>
                <p
                  className="mb-4 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-brand)' }}
                >
                  Simple by design
                </p>
                <h2
                  className="mb-6"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontWeight: 400,
                    fontSize: 'clamp(1.75rem, 3vw, 2.75rem)',
                    lineHeight: 1.1,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Booking the right stay
                  {' '}
                  <em style={{ fontStyle: 'italic', color: 'var(--color-brand-secondary)' }}>
                    should take minutes.
                  </em>
                </h2>
                <p
                  className="mb-8 text-base leading-relaxed max-w-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Enter your city and dates, browse verified hotels, and confirm with
                  Paystack in a single flow. No account required to search.
                </p>
                <Link
                  href="/search"
                  className="hp-cta inline-flex items-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity"
                  style={{ background: 'var(--color-brand)' }}
                >
                  Explore hotels
                </Link>
              </div>

              {/* Right: three clean steps — left-aligned list, not cards */}
              <ol
                className="flex flex-col gap-8"
                aria-label="Booking steps"
                style={{ listStyle: 'none', padding: 0, margin: 0 }}
              >
                {[
                  {
                    n: '01',
                    title: 'Search your destination',
                    body: 'Enter a city, neighbourhood or landmark. Pick your dates and number of guests.',
                  },
                  {
                    n: '02',
                    title: 'Compare and choose',
                    body: 'Review room options, amenities and verified guest ratings side by side.',
                  },
                  {
                    n: '03',
                    title: 'Book and confirm',
                    body: 'Pay securely via Paystack. Instant confirmation sent to your email.',
                  },
                ].map(({ n, title, body }) => (
                  <li key={n} className="flex gap-5 items-start">
                    <span
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontWeight: 300,
                        fontSize: '2.5rem',
                        lineHeight: 1,
                        color: 'var(--color-border-strong)',
                        minWidth: '3rem',
                        userSelect: 'none',
                      }}
                      aria-hidden="true"
                    >
                      {n}
                    </span>
                    <div style={{ paddingTop: '0.4rem' }}>
                      <h3
                        className="mb-1.5 text-base font-semibold"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* OWNER SECTION */}
        <section
          aria-label="List your hotel"
          className="py-24"
          style={{ background: 'var(--primitive-ink-900)' }}
        >
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 lg:items-center">

              <div>
                <p
                  className="mb-4 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--primitive-forest-300)' }}
                >
                  For hotel owners
                </p>
                <h2
                  className="mb-5 text-white"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontWeight: 400,
                    fontSize: 'clamp(1.75rem, 3vw, 2.75rem)',
                    lineHeight: 1.1,
                  }}
                >
                  Grow your hotel with
                  {' '}
                  <em style={{ fontStyle: 'italic', color: '#d4c09a', fontWeight: 300 }}>
                    Lodgen.
                  </em>
                </h2>
                <p
                  className="mb-8 max-w-sm text-base leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.52)' }}
                >
                  Reach travelers across Nigeria. Manage bookings, rooms and rates
                  from one professional dashboard.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="http://hotel.localhost:3000/auth/signup"
                    className="hp-cta inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity"
                    style={{ background: 'var(--color-brand)' }}
                  >
                    Get started — it's free
                  </Link>
                  <Link
                    href="http://hotel.localhost:3000"
                    className="hp-link inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-medium transition-opacity"
                    style={{
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'rgba(255,255,255,0.75)',
                    }}
                  >
                    Learn more
                  </Link>
                </div>
              </div>

              {/* Three owner steps — same list pattern, no cards */}
              <ol
                className="flex flex-col gap-8"
                style={{ listStyle: 'none', padding: 0, margin: 0 }}
              >
                {[
                  {
                    n: '1',
                    title: 'Create your listing',
                    body: 'Set up your hotel profile, rooms and pricing in minutes.',
                  },
                  {
                    n: '2',
                    title: 'Manage in real time',
                    body: 'Update availability, block dates and control rates from any device.',
                  },
                  {
                    n: '3',
                    title: 'Get paid reliably',
                    body: 'Travelers book directly. Payouts arrive on a consistent schedule.',
                  },
                ].map(({ n, title, body }) => (
                  <li key={n} className="flex gap-5 items-start">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: 'var(--color-brand)' }}
                      aria-hidden="true"
                    >
                      {n}
                    </div>
                    <div style={{ paddingTop: '0.3rem' }}>
                      <h3
                        className="mb-1 text-base font-semibold text-white"
                      >
                        {title}
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.48)' }}
                      >
                        {body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
