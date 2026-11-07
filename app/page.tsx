import React from 'react';
import Link from 'next/link';
import { TravelerNav } from './components/TravelerNav';
import { SearchBar } from './components/SearchBar';
import { HotelCard } from './components/HotelCard';
import { DestinationCard } from './components/DestinationCard';
import { Footer } from './components/Footer';
import { fetchFeaturedHotels, fetchCityCounts, type HotelSummary } from './lib/api/search';

// Allow this route to block during prerender
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

const FALLBACK_DESTINATIONS: { city: string; gradientFrom: string; gradientTo: string }[] = [
  { city: 'Lagos',         gradientFrom: '#c9a96e', gradientTo: '#7c5c3a' },
  { city: 'Abuja',         gradientFrom: '#7a9e7e', gradientTo: '#3d6b4f' },
  { city: 'Port Harcourt', gradientFrom: '#6b8cba', gradientTo: '#2d4a6b' },
  { city: 'Uyo',           gradientFrom: '#c4956a', gradientTo: '#7a5035' },
  { city: 'Kano',          gradientFrom: '#b8956a', gradientTo: '#6b4e2a' },
  { city: 'Kaduna',        gradientFrom: '#8a9e8a', gradientTo: '#4a6b4a' },
];

const HOW_IT_WORKS = [
  { num: '01', title: 'Search your destination',   body: 'Enter a city, neighbourhood or landmark and pick your dates. Browse verified properties that match your needs.' },
  { num: '02', title: 'Compare and choose',        body: 'Review room options, photos, amenities and real guest ratings. Filter by price, category or facilities.' },
  { num: '03', title: 'Book with confidence',      body: 'Secure payment via Paystack. Instant confirmation. No hidden fees, no surprises at check-in.' },
] as const;

const OWNER_STEPS = [
  { step: '1', title: 'Create your listing',  body: 'Set up your hotel profile, rooms and pricing in minutes. No technical skills required.' },
  { step: '2', title: 'Manage in real time',  body: 'Update availability, block dates and control rates from any device, any time.' },
  { step: '3', title: 'Get paid faster',       body: 'Travelers book directly. Payouts arrive on a reliable schedule you can depend on.' },
] as const;

const TRUST_ITEMS = [
  { icon: '✓',  title: 'Verified properties',  body: 'Every hotel goes through a verification process before going live.' },
  { icon: '🔒', title: 'Secure payments',       body: "Powered by Paystack — Nigeria's most trusted payment infrastructure." },
  { icon: '✉',  title: 'Instant confirmation', body: 'Booking confirmation sent to your email the moment payment clears.' },
  { icon: '☎',  title: 'Traveler support',     body: 'Our team is available to help with any booking question or issue.' },
] as const;

// ── Page — pure Server Component, no event handlers ───────────────────────────

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
        .hp-city-pill:hover { border-color: var(--color-brand) !important; color: var(--color-brand) !important; }
        .hp-view-all:hover   { opacity: 0.7; }
        .hp-cta-primary:hover { opacity: 0.85; }
        .hp-cta-secondary:hover { opacity: 0.8; }
      `}</style>

      <div style={{ background: 'var(--color-bg)' }}>
        <TravelerNav />

        {/* ════════ HERO ════════ */}
        <section
          aria-label="Hero"
          className="relative flex min-h-screen flex-col items-center justify-center px-5 lg:px-8"
          style={{
            paddingTop: 'calc(var(--nav-height) + 4rem)',
            paddingBottom: '5rem',
            background: 'var(--color-bg)',
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-full pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%,rgba(36,71,53,0.06) 0%,transparent 70%)' }}
            aria-hidden="true"
          />

          <div className="relative mx-auto w-full max-w-4xl text-center">
            <p className="text-label mb-6" style={{ color: 'var(--color-brand-secondary)' }}>
              Hotel OS — Nigeria&apos;s hospitality platform
            </p>

            <h1 className="text-display-xl mb-6" style={{ color: 'var(--color-text-primary)' }}>
              Stay somewhere{' '}
              <em
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  color: 'var(--color-brand)',
                  fontWeight: 400,
                }}
              >
                worth remembering.
              </em>
            </h1>

            <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Discover exceptional stays across Nigeria. Find the right hotel, compare your options and book with confidence.
            </p>

            <SearchBar />

            {/* Quick destination chips — styled via CSS class, no JS hover */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Popular:</span>
              {['Lagos', 'Abuja', 'Port Harcourt', 'Uyo'].map(city => (
                <Link
                  key={city}
                  href={`/search?destination=${encodeURIComponent(city)}`}
                  className="hp-city-pill rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-surface)',
                  }}
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ POPULAR DESTINATIONS ════════ */}
        <section id="explore" aria-label="Popular destinations" className="py-20" style={{ background: 'var(--color-surface)' }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mb-10">
              <p className="text-label mb-2" style={{ color: 'var(--color-brand)' }}>Explore Nigeria</p>
              <h2 className="text-display-md" style={{ color: 'var(--color-text-primary)' }}>Popular destinations</h2>
            </div>
            <div className="hidden gap-4 md:grid md:grid-cols-3">
              {destinations.map(dest => <DestinationCard key={dest.city} {...dest} />)}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 md:hidden" style={{ scrollSnapType: 'x mandatory' }}>
              {destinations.map(dest => (
                <div key={dest.city} className="w-56 shrink-0" style={{ scrollSnapAlign: 'start' }}>
                  <DestinationCard {...dest} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ FEATURED HOTELS ════════ */}
        <section id="hotels" aria-label="Featured hotels" className="py-20" style={{ background: 'var(--color-bg)' }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-label mb-2" style={{ color: 'var(--color-brand)' }}>Curated picks</p>
                <h2 className="text-display-md" style={{ color: 'var(--color-text-primary)' }}>Featured hotels</h2>
              </div>
              <Link href="/search" className="hp-view-all shrink-0 text-sm font-medium transition-opacity hidden sm:block" style={{ color: 'var(--color-brand)' }}>
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
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--color-brand-light)' }} aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.5" aria-hidden="true">
                    <rect x="3" y="10" width="18" height="11" rx="1"/><path d="M8 21v-7m4 7v-7m4 7v-7"/><path d="M3 10l9-7 9 7"/>
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Hotels loading</p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Featured properties will appear here once available.</p>
                </div>
                <Link href="/search" className="hp-cta-primary rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity" style={{ background: 'var(--color-brand)' }}>
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
        <section aria-label="How booking works" className="py-20" style={{ background: 'var(--color-surface)' }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mb-12 text-center">
              <p className="text-label mb-2" style={{ color: 'var(--color-brand)' }}>Simple process</p>
              <h2 className="text-display-md" style={{ color: 'var(--color-text-primary)' }}>Book in three steps</h2>
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
              <Link href="/search" className="hp-cta-primary rounded-xl px-7 py-3 text-sm font-semibold text-white transition-opacity" style={{ background: 'var(--color-brand)' }}>
                Explore hotels now
              </Link>
            </div>
          </div>
        </section>

        {/* ════════ TRUST ════════ */}
        <section aria-label="Why book with Hotel OS" className="py-20" style={{ background: 'var(--color-bg-alt)' }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-display-md" style={{ color: 'var(--color-text-primary)' }}>Built for trust</h2>
              <p className="mx-auto mt-3 max-w-lg text-base" style={{ color: 'var(--color-text-secondary)' }}>
                Hotel OS is designed around the things that matter most when booking accommodation.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {TRUST_ITEMS.map(({ icon, title, body }) => (
                <div
                  key={title}
                  className="flex flex-col gap-3 rounded-2xl p-6"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <span className="text-2xl" role="img" aria-hidden="true">{icon}</span>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════ OWNER ACQUISITION ════════ */}
        <section aria-label="List your hotel" className="py-20" style={{ background: 'var(--primitive-ink-900)' }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mb-12 max-w-xl">
              <p className="text-label mb-3" style={{ color: 'var(--color-brand-secondary)' }}>For hotel owners</p>
              <h2 className="text-display-md text-white mb-4">Grow your hotel with Hotel OS</h2>
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
