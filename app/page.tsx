import React from 'react';
import { TravelerNav } from './components/TravelerNav';
import { SearchBar } from './components/SearchBar';
import { HotelCard } from './components/HotelCard';
import { DestinationCard } from './components/DestinationCard';
import { Footer } from './components/Footer';
import { fetchFeaturedHotels, fetchCityCounts, HotelSummary } from './lib/api/search';

// Allow this route to block during prerender (fetch calls use no-store)
export const instant = false;

// ── City gradient palette ─────────────────────────────────────────────────────

const CITY_GRADIENTS: Record<string, { gradientFrom: string; gradientTo: string }> = {
  'Lagos':         { gradientFrom: '#d4a574', gradientTo: '#8b5e3c' },
  'Abuja':         { gradientFrom: '#7a9e7e', gradientTo: '#3d6b4f' },
  'Port Harcourt': { gradientFrom: '#6b8cba', gradientTo: '#2d4a6b' },
  'Uyo':           { gradientFrom: '#c4956a', gradientTo: '#8b6343' },
  'Kano':          { gradientFrom: '#b8956a', gradientTo: '#7a5c3a' },
  'Kaduna':        { gradientFrom: '#8a9e8a', gradientTo: '#4a6b4a' },
};

// ── Fallback static data (shown when API returns nothing) ─────────────────────

const FALLBACK_DESTINATIONS = [
  { city: 'Lagos',          hotelCount: 128, gradientFrom: '#d4a574', gradientTo: '#8b5e3c' },
  { city: 'Abuja',          hotelCount: 94,  gradientFrom: '#7a9e7e', gradientTo: '#3d6b4f' },
  { city: 'Port Harcourt',  hotelCount: 67,  gradientFrom: '#6b8cba', gradientTo: '#2d4a6b' },
  { city: 'Uyo',            hotelCount: 31,  gradientFrom: '#c4956a', gradientTo: '#8b6343' },
  { city: 'Kano',           hotelCount: 28,  gradientFrom: '#b8956a', gradientTo: '#7a5c3a' },
  { city: 'Kaduna',         hotelCount: 22,  gradientFrom: '#8a9e8a', gradientTo: '#4a6b4a' },
];

const FALLBACK_HOTELS: HotelSummary[] = [
  {
    id: 'transcorp-hilton',
    name: 'Transcorp Hilton',
    city: 'Abuja',
    state: 'FCT',
    rating: 4.8,
    reviewCount: 312,
    pricePerNight: 85000,
    amenities: ['Pool', 'Gym', 'Restaurant'],
    featured: true,
  },
  {
    id: 'eko-hotel',
    name: 'Eko Hotel',
    city: 'Lagos Island',
    state: 'Lagos',
    rating: 4.6,
    reviewCount: 287,
    pricePerNight: 72000,
    amenities: ['Pool', 'Spa', 'WiFi'],
    featured: true,
  },
  {
    id: 'nicon-luxury',
    name: 'Nicon Luxury',
    city: 'Abuja',
    state: 'FCT',
    rating: 4.7,
    reviewCount: 198,
    pricePerNight: 95000,
    amenities: ['Gym', 'Restaurant', 'Bar'],
    featured: true,
  },
  {
    id: 'southern-sun',
    name: 'Southern Sun',
    city: 'Lagos',
    state: 'Lagos',
    rating: 4.5,
    reviewCount: 156,
    pricePerNight: 68000,
    amenities: ['Pool', 'WiFi', 'Parking'],
    featured: true,
  },
];

// ── Hero collage boxes ────────────────────────────────────────────────────────

const collageBoxes = [
  'linear-gradient(135deg, #e8e4df, #d4cfc9)',
  'linear-gradient(135deg, #d4cfc9, #c8c2bb)',
  'linear-gradient(135deg, #c8c2bb, #b8b1aa)',
  'linear-gradient(135deg, #e0dbd5, #d4cfc9)',
  'linear-gradient(135deg, #d8d2cc, #ccc6bf)',
  'linear-gradient(135deg, #c8c2bb, #bdb6ae)',
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [featuredResult, citiesResult] = await Promise.allSettled([
    fetchFeaturedHotels(),
    fetchCityCounts(),
  ]);

  const apiHotels = featuredResult.status === 'fulfilled' ? featuredResult.value : [];
  const apiCities = citiesResult.status === 'fulfilled' ? citiesResult.value : [];

  // Fall back to static data when API returns empty arrays
  const featured = apiHotels.length > 0 ? apiHotels : FALLBACK_HOTELS;

  const destinations =
    apiCities.length > 0
      ? apiCities.map(({ city, hotelCount }) => ({
          city,
          hotelCount,
          ...(CITY_GRADIENTS[city] ?? { gradientFrom: '#a0a0a0', gradientTo: '#606060' }),
        }))
      : FALLBACK_DESTINATIONS;

  return (
    <div style={{ background: 'var(--tp-bg)', minHeight: '100vh' }}>
      {/* ── Section 1: Navigation ── */}
      <TravelerNav />

      {/* ── Section 2: Hero ── */}
      <section
        className="relative flex min-h-screen items-center"
        style={{ background: 'var(--tp-bg)' }}
        aria-label="Hero"
      >
        <div className="mx-auto w-full max-w-7xl px-6" style={{ paddingTop: '80px', paddingBottom: '4rem' }}>
          {/* Desktop: 60/40 split. Mobile: stacked */}
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
            {/* Left 60% — headline + search */}
            <div className="flex flex-col gap-8 lg:w-[58%]">
              <div className="flex flex-col gap-4">
                <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl" style={{ color: 'var(--tp-primary)' }}>
                  <span style={{ fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}>Stay </span>
                  <span
                    style={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontStyle: 'italic',
                    }}
                  >
                    somewhere worth remembering.
                  </span>
                </h1>

                <p className="max-w-xl text-lg leading-relaxed" style={{ color: 'var(--tp-secondary)' }}>
                  Discover verified hotels across Nigeria and book your next stay with confidence.
                </p>
              </div>

              <SearchBar />
            </div>

            {/* Right 40% — editorial photo collage (desktop only) */}
            <div className="hidden lg:block lg:w-[42%]" aria-hidden="true">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gridTemplateRows: '180px 140px 180px',
                  gap: '12px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}
              >
                {collageBoxes.map((gradient, i) => (
                  <div
                    key={i}
                    style={{
                      background: gradient,
                      borderRadius: '8px',
                      gridRow: i === 2 ? 'span 2' : 'span 1',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Popular destinations ── */}
      <section
        id="explore"
        className="py-16"
        style={{ background: 'var(--tp-surface)' }}
        aria-label="Popular destinations"
      >
        <div className="mx-auto max-w-7xl px-6">
          <h2
            className="mb-8 text-3xl font-bold tracking-tight"
            style={{ color: 'var(--tp-primary)' }}
          >
            Popular destinations
          </h2>

          {/* Desktop: 3-col grid. Mobile: horizontal scroll */}
          <div className="hidden gap-4 md:grid md:grid-cols-3">
            {destinations.map(dest => (
              <DestinationCard key={dest.city} {...dest} />
            ))}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 md:hidden">
            {destinations.map(dest => (
              <div key={dest.city} className="w-56 shrink-0">
                <DestinationCard {...dest} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Featured hotels ── */}
      <section
        id="hotels"
        className="py-16"
        style={{ background: 'var(--tp-bg)' }}
        aria-label="Featured hotels"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--tp-primary)' }}>
              Featured hotels
            </h2>
            <a
              href="#"
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--tp-accent)' }}
            >
              View all →
            </a>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {featured.map(({ id, imageUrl, ...rest }) => (
              <HotelCard key={id ?? rest.name} imageUrl={imageUrl} {...rest} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: How it works ── */}
      <section
        className="py-16"
        style={{ background: 'var(--tp-surface)' }}
        aria-label="List your hotel"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--tp-primary)' }}>
              List your hotel on Hotel OS
            </h2>
            <p className="mt-3 text-lg" style={{ color: 'var(--tp-secondary)' }}>
              Join hundreds of hotels already reaching travelers across Nigeria.
            </p>
          </div>

          {/* Steps */}
          <div className="mt-12 flex flex-col gap-8 md:flex-row md:gap-6">
            {[
              {
                step: '1',
                title: 'Create your listing',
                desc: 'Set up your hotel profile, rooms, and pricing in minutes.',
              },
              {
                step: '2',
                title: 'Manage your inventory',
                desc: 'Update availability, block dates, and control your rates in real time.',
              },
              {
                step: '3',
                title: 'Receive bookings & payments',
                desc: 'Travelers book directly; payouts arrive on your schedule.',
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

          {/* CTA */}
          <div className="mt-12 flex justify-center">
            <a
              href="/onboarding"
              className="rounded-xl px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80"
              style={{ background: 'var(--tp-primary)' }}
            >
              Get started — it&apos;s free
            </a>
          </div>
        </div>
      </section>

      {/* ── Section 6: Trust bar ── */}
      <section
        className="py-10"
        style={{ background: 'var(--tp-muted)' }}
        aria-label="Platform statistics"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-center justify-center gap-0 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: 'var(--tp-border)' }}>
            {[
              { value: '500+',    label: 'Verified hotels' },
              { value: '50,000+', label: 'Travelers served' },
              { value: '₦2B+',   label: 'In bookings processed' },
              { value: '6',       label: 'Cities covered' },
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

      {/* ── Section 7: Footer ── */}
      <Footer />
    </div>
  );
}
