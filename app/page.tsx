import React from 'react';
import Link from 'next/link';
import { TravelerNav } from './components/TravelerNav';
import { SearchBar } from './components/SearchBar';
import { HotelCard } from './components/HotelCard';
import { DestinationCard } from './components/DestinationCard';
import { Footer } from './components/Footer';
import { fetchFeaturedHotels, fetchCityCounts, type HotelSummary } from './lib/api/search';
import HeroParticlesLazy from './components/HeroParticlesLazy';
import HeroSceneLazy from './components/HeroSceneLazy';
import { ScrollReveal } from './components/ScrollReveal';
import { TiltCard } from './components/TiltCard';

export const instant = false;

export const metadata = {
  alternates: { canonical: '/' },
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://lodgen.com.ng';
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Lodgen',
  url: BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/search?destination={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

const CITY_DATA: Record<string, { gradientFrom: string; gradientTo: string; imageUrl: string }> = {
  Lagos:           { gradientFrom: '#c9a96e', gradientTo: '#7c5c3a', imageUrl: 'https://images.unsplash.com/photo-1648023200201-8fcede127835?w=600&auto=format&fit=crop&q=60' },
  Abuja:           { gradientFrom: '#7a9e7e', gradientTo: '#3d6b4f', imageUrl: 'https://images.unsplash.com/photo-1696744999160-02e02ab8754a?q=80&w=735&auto=format&fit=crop' },
  'Port Harcourt': { gradientFrom: '#6b8cba', gradientTo: '#2d4a6b', imageUrl: 'https://plus.unsplash.com/premium_photo-1671089657680-9d86ebc74976?w=600&auto=format&fit=crop&q=60' },
  Uyo:             { gradientFrom: '#c4956a', gradientTo: '#7a5035', imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80' },
  Kano:            { gradientFrom: '#b8956a', gradientTo: '#6b4e2a', imageUrl: 'https://images.unsplash.com/photo-1584985639203-ac653e3b3c8f?q=80&w=1170&auto=format&fit=crop' },
  Kaduna:          { gradientFrom: '#8a9e8a', gradientTo: '#4a6b4a', imageUrl: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800&q=80' },
};

const FALLBACK_DESTINATIONS = [
  { city: 'Lagos',           ...CITY_DATA['Lagos'] },
  { city: 'Abuja',           ...CITY_DATA['Abuja'] },
  { city: 'Port Harcourt',   ...CITY_DATA['Port Harcourt'] },
  { city: 'Uyo',             ...CITY_DATA['Uyo'] },
];

export default async function HomePage() {
  const [featuredResult, citiesResult] = await Promise.allSettled([
    fetchFeaturedHotels(),
    fetchCityCounts(),
  ]);

  const apiHotels: HotelSummary[] = featuredResult.status === 'fulfilled' ? featuredResult.value : [];
  const apiCities  = citiesResult.status  === 'fulfilled' ? citiesResult.value  : [];

  const destinations = apiCities.length > 0
    ? apiCities.slice(0, 4).map(({ city, hotelCount }) => ({
        city, hotelCount,
        ...(CITY_DATA[city] ?? { gradientFrom: '#a0a094', gradientTo: '#606058', imageUrl: undefined }),
      }))
    : FALLBACK_DESTINATIONS.map(d => ({ ...d, hotelCount: 0 }));

  const hasFeatured = apiHotels.length > 0;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />

      <style>{`
        .hp-btn { transition: opacity 0.16s ease, transform 0.16s ease; }
        .hp-btn:hover { opacity: 0.86; transform: translateY(-1px); }

        /* Destination card shine sweep */
        .dest-shine { position: relative; overflow: hidden; }
        .dest-shine::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(108deg, transparent 42%, rgba(255,255,255,0.055) 50%, transparent 58%);
          transform: translateX(-110%);
          transition: transform 0.55s ease;
          pointer-events: none;
        }
        .dest-shine:hover::after { transform: translateX(110%); }

        /* Step hover */
        .step-row:hover .step-node {
          border-color: var(--color-brand) !important;
          color: var(--color-brand) !important;
        }

        .gold-line {
          display: inline-block; width: 28px; height: 1px;
          background: linear-gradient(to right, var(--color-brand), transparent);
          vertical-align: middle; margin-right: 10px;
        }

        /* trust strip dividers */
        .trust-col + .trust-col { border-left: 1px solid var(--color-border); }
        @media (max-width: 767px) {
          .trust-col + .trust-col { border-left: none; border-top: 1px solid var(--color-border); }
        }
      `}</style>

      {/* Page wrapper — hero is dark, everything else is warm light */}
      <div>
        <TravelerNav forceTransparent />

        {/* ════════════════════════════════════════════════
            HERO — dark cinematic
            ════════════════════════════════════════════════ */}
        <section
          aria-label="Hero"
          className="relative w-full overflow-hidden"
          style={{ minHeight: '100svh', maxHeight: '100svh', background: '#0c0b09' }}
        >
          <HeroSceneLazy />
          <HeroParticlesLazy />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(to bottom,
                rgba(12,11,9,0.78) 0%,
                rgba(12,11,9,0.0)  22%,
                rgba(12,11,9,0.0)  50%,
                rgba(12,11,9,0.88) 100%)`,
              zIndex: 2,
            }}
            aria-hidden="true"
          />

          <div
            className="absolute inset-0 flex flex-col justify-end"
            style={{ paddingBottom: 'clamp(3.5rem, 9vh, 7rem)', zIndex: 3 }}
          >
            <div className="mx-auto w-full max-w-7xl px-5 lg:px-8">

              <ScrollReveal variant="fade-up" delay={80}>
                <p className="mb-5 text-xs font-semibold uppercase" style={{ color: '#c9a96e', letterSpacing: '0.16em' }}>
                  <span style={{ display: 'inline-block', width: 28, height: 1, background: 'linear-gradient(to right, #c9a96e, transparent)', verticalAlign: 'middle', marginRight: 10 }} aria-hidden="true" />
                  Lodgen · Nigeria
                </p>
              </ScrollReveal>

              <ScrollReveal variant="fade-up" delay={160}>
                <h1
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontWeight: 300,
                    color: '#f0ede6',
                    fontSize: 'clamp(2.8rem, 8.5vw, 6rem)',
                    lineHeight: 1.03,
                    letterSpacing: '-0.025em',
                    maxWidth: '13ch',
                    marginBottom: '1.5rem',
                  }}
                >
                  Stay somewhere{' '}
                  <em style={{
                    fontStyle: 'italic',
                    background: 'linear-gradient(130deg, #c9a96e 0%, #dfc9a2 55%, #c9a96e 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    worth&nbsp;remembering.
                  </em>
                </h1>
              </ScrollReveal>

              <ScrollReveal variant="fade-up" delay={230}>
                <p className="mb-9 max-w-sm text-base leading-relaxed" style={{ color: 'rgba(240,237,230,0.6)', fontWeight: 300 }}>
                  Discover and book hotels across Nigeria —
                  from Lagos to Port Harcourt.
                </p>
              </ScrollReveal>

              <ScrollReveal variant="fade-up" delay={300}>
                <div style={{ maxWidth: '900px' }}>
                  <SearchBar />
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            TRUST STRIP — transition from dark to light
            ════════════════════════════════════════════════ */}
        <section
          aria-label="Why Lodgen"
          style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {[
                { title: 'Secure payments',      sub: 'Paystack-powered checkout' },
                { title: 'Instant confirmation', sub: 'Your booking, confirmed immediately' },
                { title: 'Verified hotels',      sub: 'Every property is reviewed' },
                { title: 'No booking fees',      sub: 'The price you see is what you pay' },
              ].map(item => (
                <div key={item.title} className="trust-col flex flex-col justify-center py-6 px-5">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            DESTINATIONS
            ════════════════════════════════════════════════ */}
        <section id="explore" aria-label="Popular destinations" className="py-24" style={{ background: 'var(--color-bg)' }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">

            <ScrollReveal variant="fade-up">
              <div className="mb-12 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase" style={{ color: 'var(--color-brand)', letterSpacing: '0.14em' }}>
                    <span className="gold-line" aria-hidden="true" />
                    Destinations
                  </p>
                  <h2 style={{
                    fontFamily: 'var(--font-serif)', fontWeight: 400,
                    fontSize: 'clamp(1.9rem, 3.5vw, 3rem)', lineHeight: 1.1,
                    letterSpacing: '-0.015em', color: 'var(--color-text-primary)',
                  }}>
                    Popular across Nigeria
                  </h2>
                </div>
                <Link href="/search" className="hidden sm:flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                  Explore all
                </Link>
              </div>
            </ScrollReveal>

            {/* Bento grid */}
            <div className="hidden gap-3 md:grid md:grid-cols-12" style={{ gridTemplateRows: '260px 260px' }}>
              {destinations[0] && (
                <ScrollReveal variant="fade-up" delay={0} className="col-span-5 row-span-2 dest-shine" style={{ borderRadius: 16 }}>
                  <TiltCard className="h-full" maxTilt={5}><DestinationCard {...destinations[0]} /></TiltCard>
                </ScrollReveal>
              )}
              {destinations[1] && (
                <ScrollReveal variant="fade-up" delay={70} className="col-span-4 row-span-1 dest-shine" style={{ borderRadius: 16 }}>
                  <TiltCard className="h-full" maxTilt={7}><DestinationCard {...destinations[1]} /></TiltCard>
                </ScrollReveal>
              )}
              {destinations[2] && (
                <ScrollReveal variant="fade-up" delay={110} className="col-span-3 row-span-1 dest-shine" style={{ borderRadius: 16 }}>
                  <TiltCard className="h-full" maxTilt={7}><DestinationCard {...destinations[2]} /></TiltCard>
                </ScrollReveal>
              )}
              {destinations[3] && (
                <ScrollReveal variant="fade-up" delay={150} className="col-span-7 row-span-1 dest-shine" style={{ borderRadius: 16 }}>
                  <TiltCard className="h-full" maxTilt={5}><DestinationCard {...destinations[3]} /></TiltCard>
                </ScrollReveal>
              )}
            </div>

            {/* Mobile */}
            <div className="flex gap-3 overflow-x-auto pb-2 md:hidden" style={{ scrollSnapType: 'x mandatory' }}>
              {destinations.map((dest, i) => (
                <ScrollReveal key={dest.city} variant="fade-up" delay={i * 55} className="w-64 shrink-0" style={{ scrollSnapAlign: 'start', aspectRatio: '3/4' }}>
                  <DestinationCard {...dest} />
                </ScrollReveal>
              ))}
            </div>

            <div className="mt-6 flex justify-center sm:hidden">
              <Link href="/search" className="rounded-full px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                All destinations →
              </Link>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            FEATURED HOTELS
            ════════════════════════════════════════════════ */}
        <section id="hotels" aria-label="Featured hotels" className="py-24" style={{ background: 'var(--color-surface)' }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">

            <ScrollReveal variant="fade-up">
              <div className="mb-12 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase" style={{ color: 'var(--color-brand)', letterSpacing: '0.14em' }}>
                    <span className="gold-line" aria-hidden="true" />
                    Featured
                  </p>
                  <h2 style={{
                    fontFamily: 'var(--font-serif)', fontWeight: 400,
                    fontSize: 'clamp(1.9rem, 3.5vw, 3rem)', lineHeight: 1.1,
                    letterSpacing: '-0.015em', color: 'var(--color-text-primary)',
                  }}>
                    Handpicked hotels
                  </h2>
                </div>
                <Link href="/search" className="hidden sm:flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                  View all
                </Link>
              </div>
            </ScrollReveal>

            {hasFeatured ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {apiHotels.map((hotel, i) => (
                  <ScrollReveal key={hotel.id} variant="fade-up" delay={i * 65}>
                    <HotelCard
                      id={hotel.id} name={hotel.name} city={hotel.city} state={hotel.state}
                      rating={hotel.rating} reviewCount={hotel.reviewCount}
                      pricePerNight={hotel.pricePerNight} amenities={hotel.amenities}
                      imageUrl={hotel.imageUrl} featured={hotel.featured}
                    />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <ScrollReveal variant="fade-up">
                <div className="flex flex-col items-center gap-4 rounded-2xl py-20 text-center"
                  style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                  </svg>
                  <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>No featured hotels yet</p>
                  <p className="text-sm max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Hotels will appear here once available.
                  </p>
                  <Link href="/search" className="hp-btn mt-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
                    style={{ background: 'var(--color-brand)' }}>
                    Browse all hotels
                  </Link>
                </div>
              </ScrollReveal>
            )}

            <div className="mt-8 flex justify-center sm:hidden">
              <Link href="/search" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--color-brand)' }}>
                View all →
              </Link>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            HOW IT WORKS
            ════════════════════════════════════════════════ */}
        <section aria-label="How booking works" className="py-24" style={{ background: 'var(--color-bg)' }}>
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-20 lg:grid-cols-2 lg:items-center">

              <ScrollReveal variant="fade-left">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase" style={{ color: 'var(--color-brand)', letterSpacing: '0.14em' }}>
                    <span className="gold-line" aria-hidden="true" />
                    How it works
                  </p>
                  <h2 className="mb-5" style={{
                    fontFamily: 'var(--font-serif)', fontWeight: 400,
                    fontSize: 'clamp(1.9rem, 3.5vw, 3rem)', lineHeight: 1.1,
                    letterSpacing: '-0.015em', color: 'var(--color-text-primary)',
                  }}>
                    Book in three steps.
                  </h2>
                  <p className="mb-10 text-base leading-relaxed max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Search by city and dates, compare rooms across verified hotels,
                    and pay through Paystack. No account required to browse.
                  </p>
                  <Link href="/search" className="hp-btn inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white"
                    style={{ background: 'var(--color-brand)' }}>
                    Search hotels
                  </Link>
                </div>
              </ScrollReveal>

              <div className="relative">
                <div className="absolute hidden lg:block" style={{
                  left: 18, top: 36, bottom: 36, width: 1,
                  background: 'linear-gradient(to bottom, var(--color-brand), transparent)',
                  opacity: 0.2,
                }} aria-hidden="true" />
                <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 36 }}>
                  {[
                    { n: '01', title: 'Search your destination', body: 'City, neighbourhood or landmark. Pick your dates and number of guests.' },
                    { n: '02', title: 'Compare and choose',      body: 'Room options, amenities and guest ratings — side by side.' },
                    { n: '03', title: 'Pay and confirm',          body: 'Paystack checkout. Instant confirmation to your email.' },
                  ].map(({ n, title, body }, i) => (
                    <ScrollReveal key={n} as="li" variant="fade-right" delay={i * 110} className="step-row flex gap-5 items-start">
                      <div className="step-node relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{
                        border: '1px solid var(--color-border-strong)',
                        color: 'var(--color-text-secondary)',
                        fontFamily: 'var(--font-serif)', fontSize: '0.85rem',
                        background: 'var(--color-bg)',
                      }} aria-hidden="true">{n}</div>
                      <div style={{ paddingTop: '0.3rem' }}>
                        <h3 className="mb-1.5 text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{body}</p>
                      </div>
                    </ScrollReveal>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            OWNER CTA — dark, statement piece
            ════════════════════════════════════════════════ */}
        <section
          aria-label="List your hotel on Lodgen"
          className="owner-gradient-mesh relative overflow-hidden py-28"
          style={{ background: 'var(--primitive-ink-900)' }}
        >
          <div className="absolute inset-0 flex items-center justify-end px-8 pointer-events-none select-none" aria-hidden="true">
            <span style={{
              fontFamily: 'var(--font-serif)', fontWeight: 300, fontStyle: 'italic',
              fontSize: 'clamp(7rem, 18vw, 16rem)', lineHeight: 1,
              color: 'rgba(201,169,110,0.04)', whiteSpace: 'nowrap',
            }}>Lodgen</span>
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">

              <ScrollReveal variant="fade-left">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase" style={{ color: '#71816b', letterSpacing: '0.14em' }}>
                    <span style={{ display: 'inline-block', width: 28, height: 1, background: 'linear-gradient(to right, #c9a96e, transparent)', verticalAlign: 'middle', marginRight: 10 }} aria-hidden="true" />
                    For hotel owners
                  </p>
                  <h2 className="mb-6" style={{
                    fontFamily: 'var(--font-serif)', fontWeight: 300,
                    fontSize: 'clamp(2.2rem, 4.5vw, 3.75rem)', lineHeight: 1.06,
                    letterSpacing: '-0.025em', color: '#f0ede6',
                  }}>
                    List your hotel.{' '}
                    <em style={{
                      fontStyle: 'italic',
                      background: 'linear-gradient(130deg, #c9a96e 0%, #dfc9a2 60%, #c9a96e 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>Reach Nigeria.</em>
                  </h2>
                  <p className="mb-10 max-w-sm text-base leading-relaxed" style={{ color: 'rgba(240,237,230,0.5)', fontWeight: 300 }}>
                    Set up your hotel profile, manage rooms and pricing, and receive
                    bookings from travellers across the country.
                    Free to list — no monthly fees.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="http://hotel.localhost:3000/auth/signup"
                      className="hp-btn inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white"
                      style={{ background: 'var(--color-brand)' }}>
                      Get started free
                    </Link>
                    <Link href="http://hotel.localhost:3000"
                      className="inline-flex items-center justify-center rounded-xl px-7 py-3.5 text-sm font-medium transition-opacity hover:opacity-70"
                      style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}>
                      Learn more
                    </Link>
                  </div>
                </div>
              </ScrollReveal>

              <div className="relative">
                <div className="absolute hidden lg:block" style={{
                  left: 18, top: 36, bottom: 36, width: 1,
                  background: 'linear-gradient(to bottom, #c9a96e, transparent)', opacity: 0.3,
                }} aria-hidden="true" />
                <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 36 }}>
                  {[
                    { n: '1', title: 'Create your listing',  body: 'Add your hotel details, rooms, photos and pricing.' },
                    { n: '2', title: 'Manage availability',  body: 'Control rates and availability in real time from any device.' },
                    { n: '3', title: 'Receive bookings',     body: 'Guests book and pay. Funds settle to your account on schedule.' },
                  ].map(({ n, title, body }, i) => (
                    <ScrollReveal key={n} as="li" variant="fade-right" delay={i * 110} className="step-row flex gap-5 items-start">
                      <div className="step-node relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{
                        background: 'rgba(201,169,110,0.09)',
                        border: '1px solid rgba(201,169,110,0.25)',
                        color: 'rgba(240,237,230,0.5)',
                        fontFamily: 'var(--font-serif)', fontSize: '0.9rem',
                      }} aria-hidden="true">{n}</div>
                      <div style={{ paddingTop: '0.3rem' }}>
                        <h3 className="mb-1 text-base font-semibold" style={{ color: '#f0ede6' }}>{title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,237,230,0.45)' }}>{body}</p>
                      </div>
                    </ScrollReveal>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
