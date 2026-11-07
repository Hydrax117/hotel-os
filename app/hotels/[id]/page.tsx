import React from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { TravelerNav } from '../../components/TravelerNav';
import { Footer } from '../../components/Footer';
import { RoomCard } from './components/RoomCard';
import { fetchHotelDetail, fetchHotelRooms } from '@/app/lib/api/search';

// @next-codemod-ignore
export const instant = false;

// ── Amenity helpers ───────────────────────────────────────────────────────────

function getAmenityIcon(name: string): React.ReactNode {
  const p = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' as const, stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  switch (name) {
    case 'Pool':          return <svg {...p}><path d="M2 12h20"/><path d="M2 16c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/><path d="M5 12V7a7 7 0 0 1 14 0v5"/></svg>;
    case 'Gym':           return <svg {...p}><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M4 9h2v6H4z"/><path d="M18 9h2v6h-2z"/><path d="M6 12h12"/></svg>;
    case 'Spa':           return <svg {...p}><path d="M12 22c-4.4 0-8-3.6-8-8 0-3.3 2-6.2 5-7.5C9 6 9 6 12 2c3 4 3 4 3 4.5 3 1.3 5 4.2 5 7.5 0 4.4-3.6 8-8 8z"/></svg>;
    case 'Restaurant':    return <svg {...p}><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
    case 'Bar':           return <svg {...p}><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="8"/></svg>;
    case 'WiFi':          return <svg {...p}><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>;
    case 'Parking':       return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>;
    case 'Laundry':       return <svg {...p}><rect x="2" y="3" width="20" height="18" rx="2"/><circle cx="12" cy="13" r="4"/><line x1="7" y1="7" x2="7.01" y2="7"/><line x1="10" y1="7" x2="10.01" y2="7"/></svg>;
    case 'Airport shuttle': return <svg {...p}><rect x="1" y="6" width="15" height="13" rx="2"/><polygon points="16 10 20 8 23 14 16 14"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
    case 'Conference room': return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    default:              return <svg {...p}><circle cx="12" cy="12" r="4"/></svg>;
  }
}

const KNOWN_AMENITIES = new Set([
  'Pool','Gym','Spa','Restaurant','Bar','Breakfast included',
  'WiFi','Conference room','Parking','Laundry','Airport shuttle',
]);

// ── Star rating ───────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i + 1 <= Math.floor(rating) ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          style={{ color: 'var(--color-star)' }}
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [detail, rooms] = await Promise.all([
    fetchHotelDetail(id),
    fetchHotelRooms(id),
  ]);

  if (!detail) notFound();

  const lowestPrice = rooms.reduce((min, r) => Math.min(min, r.pricePerNight), Infinity);
  const priceDisplay = isFinite(lowestPrice) ? `₦${lowestPrice.toLocaleString()}` : null;

  // CSS-only hover for Server Component links
  const hoverStyle = `
    .hd-breadcrumb-link:hover { text-decoration: underline; }
    .hd-name-link:hover { color: var(--color-brand) !important; }
    .hd-action-btn:hover { background: var(--primitive-stone-50) !important; }
    .hd-cta:hover { opacity: 0.85; }
  `;

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <TravelerNav />
      <div style={{ paddingTop: 'var(--nav-height)' }}>
        <div
          className="relative overflow-hidden"
          style={{ background: 'var(--primitive-stone-800)' }}
        >
          {detail.imageUrl ? (
            /* Real image — fills the banner */
            <div className="relative h-[380px] md:h-[480px] w-full">
              <Image
                src={detail.imageUrl}
                alt={`${detail.name} — exterior`}
                fill
                priority
                sizes="100vw"
                className="object-cover"
                placeholder="blur"
                blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'%3E%3Crect fill='%23c8b89a' width='4' height='3'/%3E%3C/svg%3E"
              />
              {/* Scrim for legibility */}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' }}
              />
            </div>
          ) : (
            /* No image — editorial gradient placeholder */
            <div
              className="flex h-[300px] md:h-[400px] items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--primitive-stone-800), var(--primitive-ink-900))',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '6rem',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.1)',
                  userSelect: 'none',
                  lineHeight: 1,
                }}
                aria-hidden="true"
              >
                {detail.name.charAt(0)}
              </span>
            </div>
          )}

          {/* View all photos button */}
          <button
            type="button"
            className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            View all photos
          </button>
        </div>

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mx-auto max-w-7xl px-5 py-3 lg:px-8"
          style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}
        >
          <ol className="flex items-center gap-1.5 list-none p-0 m-0 flex-wrap">
            <li><a href="/search" style={{ color: 'var(--color-text-secondary)' }} className="hover:underline">Hotels</a></li>
            <li aria-hidden="true">/</li>
            <li><a href={`/search?destination=${encodeURIComponent(detail.city)}`} style={{ color: 'var(--color-text-secondary)' }} className="hover:underline">{detail.city}</a></li>
            <li aria-hidden="true">/</li>
            <li style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{detail.name}</li>
          </ol>
        </nav>
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

          {/* ── Left column ── */}
          <div className="flex flex-1 min-w-0 flex-col gap-6">

            {/* Hotel header */}
            <header className="flex flex-col gap-3">
              <h1
                className="text-3xl font-semibold leading-tight lg:text-4xl"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {detail.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3">
                {(detail.rating ?? 0) > 0 && (
                  <>
                    <StarRating rating={detail.rating} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {detail.rating.toFixed(1)}
                    </span>
                  </>
                )}
                {(detail.reviewCount ?? 0) > 0 && (
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {detail.reviewCount.toLocaleString()} reviews
                  </span>
                )}
                <span
                  className="hidden h-1 w-1 rounded-full sm:block"
                  style={{ background: 'var(--color-border-strong)' }}
                  aria-hidden="true"
                />
                <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span className="text-sm">{detail.city}, {detail.state}</span>
                </div>
              </div>

              {/* Amenity highlights */}
              {(detail.amenities ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {detail.amenities.slice(0, 6).map(a => (
                    <span
                      key={a}
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-stone-50"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  Save
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-stone-50"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  Share
                </button>
              </div>
            </header>

            {/* Description */}
            {detail.description && (
              <section aria-labelledby="desc-heading">
                <h2 id="desc-heading" className="sr-only">About this hotel</h2>
                <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {detail.description}
                </p>
              </section>
            )}

            {/* Available rooms */}
            <section aria-labelledby="rooms-heading">
              <h2
                id="rooms-heading"
                className="mb-4 text-xl font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Available rooms
              </h2>
              {rooms.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {rooms.map(room => (
                    <RoomCard key={room.roomTypeId ?? room.id} room={room} hotelId={id} />
                  ))}
                </div>
              ) : (
                <div
                  className="rounded-xl py-10 text-center"
                  style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
                >
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    No rooms available for the selected dates. Try adjusting your dates.
                  </p>
                </div>
              )}
            </section>

            {/* Amenities */}
            {(detail.amenities ?? []).some(a => KNOWN_AMENITIES.has(a)) && (
              <section aria-labelledby="amenities-heading">
                <h2
                  id="amenities-heading"
                  className="mb-4 text-xl font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  What&apos;s included
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {detail.amenities.filter(a => KNOWN_AMENITIES.has(a)).map(a => (
                    <div
                      key={a}
                      className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
                    >
                      <span style={{ color: 'var(--color-brand)', flexShrink: 0 }}>
                        {getAmenityIcon(a)}
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {a}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Location & policies */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Location */}
              <section
                aria-labelledby="location-heading"
                className="rounded-2xl border p-5 flex flex-col gap-4"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <h2 id="location-heading" className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Location
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{detail.address}</p>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Check-in', time: detail.checkInTime },
                    { label: 'Check-out', time: detail.checkOutTime },
                  ].map(({ label, time }) => time && (
                    <div key={label} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {label}: {time}
                    </div>
                  ))}
                </div>
                {(detail.nearbyAttractions ?? []).length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                      Nearby
                    </h3>
                    <ul className="flex flex-col gap-1.5">
                      {detail.nearbyAttractions.map(a => (
                        <li key={a.name} className="flex justify-between text-sm">
                          <span style={{ color: 'var(--color-text-primary)' }}>{a.name}</span>
                          <span style={{ color: 'var(--color-text-secondary)' }}>{a.distance}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* Policies */}
              <section
                aria-labelledby="policies-heading"
                className="rounded-2xl border p-5 flex flex-col gap-4"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <h2 id="policies-heading" className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Hotel policies
                </h2>
                {(detail.policies ?? []).length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {detail.policies.map(policy => (
                      <li key={policy} className="flex items-start gap-2 text-sm">
                        <span style={{ color: 'var(--color-brand)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true">•</span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{policy}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Contact the hotel for policy details.</p>
                )}
                <div
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}
                >
                  Free cancellation available on select rooms
                </div>
              </section>
            </div>
          </div>

          {/* ── Right column — sticky booking card ── */}
          <aside
            className="lg:w-[340px] shrink-0"
            style={{ position: 'sticky', top: 'calc(var(--nav-height) + 1.5rem)', alignSelf: 'flex-start' }}
          >
            <div
              className="rounded-2xl border p-6 flex flex-col gap-4"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {/* Price */}
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>From</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {priceDisplay ?? 'Contact us'}
                  {priceDisplay && (
                    <span className="ml-1 text-sm font-normal" style={{ color: 'var(--color-text-secondary)' }}>
                      / night
                    </span>
                  )}
                </p>
              </div>

              {/* Placeholder date/guest inputs */}
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
                {[
                  { label: 'Check-in', placeholder: 'Add date' },
                  { label: 'Check-out', placeholder: 'Add date' },
                  { label: 'Guests', placeholder: '1 guest' },
                ].map((field, i, arr) => (
                  <div
                    key={field.label}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid var(--color-border)` : 'none' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} aria-hidden="true">
                      {i < 2
                        ? <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>
                        : <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>
                      }
                    </svg>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{field.label}</p>
                      <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{field.placeholder}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <a
                href={`/search?destination=${encodeURIComponent(detail.name)}`}
                className="block w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-85"
                style={{ background: 'var(--color-brand)' }}
              >
                Check availability
              </a>
              <p className="text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                You won&apos;t be charged yet
              </p>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}
