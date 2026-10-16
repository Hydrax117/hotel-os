import React from 'react';
import { notFound } from 'next/navigation';
import { TravelerNav } from '../../components/TravelerNav';
import { Footer } from '../../components/Footer';
import { RoomCard } from './components/RoomCard';
import { fetchHotelDetail, fetchHotelRooms } from '@/app/lib/api/search';

// @next-codemod-ignore
// This route fetches live data per-request — opt out of instant-navigation
// prerender validation (Next.js 16 cacheComponents requirement).
export const instant = false;

// ── Helper: amenity icons & categories ────────────────────────────────────────

function getAmenityIcon(name: string): React.ReactNode {
  const props = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  switch (name) {
    case 'Pool':
      return (
        <svg {...props}>
          <path d="M2 12h20" />
          <path d="M2 16c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" />
          <path d="M5 12V7a7 7 0 0 1 14 0v5" />
        </svg>
      );
    case 'Gym':
      return (
        <svg {...props}>
          <path d="M6.5 6.5h11" />
          <path d="M6.5 17.5h11" />
          <path d="M4 9h2v6H4z" />
          <path d="M18 9h2v6h-2z" />
          <path d="M6 12h12" />
        </svg>
      );
    case 'Spa':
      return (
        <svg {...props}>
          <path d="M12 22c-4.4 0-8-3.6-8-8 0-3.3 2-6.2 5-7.5C9 6 9 6 12 2c3 4 3 4 3 4.5 3 1.3 5 4.2 5 7.5 0 4.4-3.6 8-8 8z" />
        </svg>
      );
    case 'Restaurant':
      return (
        <svg {...props}>
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      );
    case 'Bar':
      return (
        <svg {...props}>
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="2" x2="6" y2="8" />
        </svg>
      );
    case 'Breakfast included':
      return (
        <svg {...props}>
          <path d="M3 6h18l-2 14H5z" />
          <path d="M3 6l2-3h14l2 3" />
        </svg>
      );
    case 'WiFi':
      return (
        <svg {...props}>
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      );
    case 'Parking':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
        </svg>
      );
    case 'Laundry':
      return (
        <svg {...props}>
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <circle cx="12" cy="13" r="4" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
          <line x1="10" y1="7" x2="10.01" y2="7" />
        </svg>
      );
    case 'Airport shuttle':
      return (
        <svg {...props}>
          <rect x="1" y="6" width="15" height="13" rx="2" />
          <polygon points="16 10 20 8 23 14 16 14" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    case 'Conference room':
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
  }
}

function getAmenityCategory(name: string): string {
  const categories: Record<string, string> = {
    Pool: 'Sleep & Comfort',
    Gym: 'Sleep & Comfort',
    Spa: 'Sleep & Comfort',
    Restaurant: 'Food & Drink',
    Bar: 'Food & Drink',
    'Breakfast included': 'Food & Drink',
    WiFi: 'Business',
    'Conference room': 'Business',
    Parking: 'Convenience',
    Laundry: 'Convenience',
    'Airport shuttle': 'Convenience',
  };
  return categories[name] ?? 'Other';
}

const KNOWN_AMENITIES = new Set([
  'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Breakfast included',
  'WiFi', 'Conference room', 'Parking', 'Laundry', 'Airport shuttle',
]);

// ── Inline SVG helpers ────────────────────────────────────────────────────────

const IconStar = ({ filled }: { filled: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

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

  if (!detail) {
    notFound();
  }

  const lowestPrice = rooms.reduce(
    (min, room) => Math.min(min, room.pricePerNight),
    Infinity
  );

  const stars = Array.from({ length: 5 }, (_, i) => i + 1 <= Math.floor(detail.rating ?? 0));

  return (
    <div style={{ background: 'var(--tp-bg)', minHeight: '100vh' }}>

      {/* ── Section 1: Nav ── */}
      <TravelerNav />

      {/* ── Section 2: Image gallery ── */}
      <div style={{ paddingTop: '64px' }}>
        {/* Gallery grid */}
        <div className="relative overflow-hidden" style={{ background: '#1a1a1a' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '3fr 2fr',
              gridTemplateRows: '240px 240px',
              gap: '4px',
              maxHeight: '484px',
            }}
            className="hidden md:grid"
          >
            {/* Main image */}
            <div
              style={{
                gridRow: 'span 2',
                background: 'linear-gradient(135deg, #c8b89a, #a08060)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="3" y="10" width="18" height="11" rx="1" />
                <path d="M8 21v-7m4 7v-7m4 7v-7" />
                <path d="M3 10l9-7 9 7" />
                <rect x="9" y="4" width="6" height="6" rx="0.5" />
              </svg>
            </div>

            {/* Thumbnail 1 */}
            <div style={{ background: 'linear-gradient(135deg, #d4c4a8, #b8a888)' }} />
            {/* Thumbnail 2 */}
            <div style={{ background: 'linear-gradient(135deg, #b8a888, #9c8868)', position: 'relative' }}>
              {/* View all photos button overlaid on last thumbnail */}
            </div>
          </div>

          {/* Mobile: main image only */}
          <div
            className="md:hidden"
            style={{
              height: '240px',
              background: 'linear-gradient(135deg, #c8b89a, #a08060)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <rect x="3" y="10" width="18" height="11" rx="1" />
              <path d="M8 21v-7m4 7v-7m4 7v-7" />
              <path d="M3 10l9-7 9 7" />
              <rect x="9" y="4" width="6" height="6" rx="0.5" />
            </svg>
          </div>

          {/* View all photos button */}
          <button
            className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', backdropFilter: 'blur(4px)' }}
            aria-label="View all photos"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            View all photos
          </button>
        </div>

        {/* Breadcrumb */}
        <div
          className="mx-auto max-w-7xl px-6 py-3"
          style={{ color: 'var(--tp-secondary)', fontSize: '0.8rem' }}
        >
          <a href="/search" className="hover:underline" style={{ color: 'var(--tp-secondary)' }}>
            Hotels
          </a>
          <span className="mx-2">/</span>
          <span>{detail.city}</span>
          <span className="mx-2">/</span>
          <span style={{ color: 'var(--tp-primary)' }}>{detail.name}</span>
        </div>
      </div>

      {/* ── Section 3: Hotel header ── */}
      <section aria-label="Hotel overview">
        <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto px-6 py-8">
          {/* Left column */}
          <div className="lg:flex-1 flex flex-col gap-5">
            {/* Hotel name */}
            <h1
              className="text-3xl font-bold leading-tight"
              style={{ color: 'var(--tp-primary)' }}
            >
              {detail.name}
            </h1>

            {/* Star rating row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-0.5" style={{ color: 'var(--tp-gold)' }}>
                {stars.map((filled, i) => (
                  <IconStar key={i} filled={filled} />
                ))}
              </div>
              {detail.rating != null && (
                <span className="text-sm font-semibold" style={{ color: 'var(--tp-primary)' }}>
                  {detail.rating.toFixed(1)}
                </span>
              )}
              <span className="text-sm" style={{ color: 'var(--tp-secondary)' }}>
                ({(detail.reviewCount ?? 0).toLocaleString()} reviews)
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2" style={{ color: 'var(--tp-secondary)' }}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-sm">
                {detail.city}, {detail.state}
              </span>
            </div>

            {/* Amenities highlights */}
            <div className="flex flex-wrap gap-2">
              {(detail.amenities ?? []).slice(0, 6).map(amenity => (
                <span
                  key={amenity}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium"
                  style={{ background: 'var(--tp-muted)', color: 'var(--tp-secondary)' }}
                >
                  {amenity}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed" style={{ color: 'var(--tp-secondary)' }}>
              {detail.description}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
                style={{ borderColor: 'var(--tp-border)', color: 'var(--tp-primary)' }}
                aria-label="Save hotel"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                Save
              </button>
              <button
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
                style={{ borderColor: 'var(--tp-border)', color: 'var(--tp-primary)' }}
                aria-label="Share hotel"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share
              </button>
            </div>
          </div>

          {/* Right column — booking summary card */}
          <aside
            className="lg:w-[340px] shrink-0"
            style={{ position: 'sticky', top: '80px', alignSelf: 'flex-start' }}
          >
            <div
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{
                background: 'var(--tp-surface)',
                borderColor: 'var(--tp-border)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
              }}
            >
              <div>
                <span className="text-xs" style={{ color: 'var(--tp-secondary)' }}>From</span>
                <div className="text-2xl font-bold" style={{ color: 'var(--tp-primary)' }}>
                  {isFinite(lowestPrice) ? `₦${lowestPrice.toLocaleString()}` : 'Contact us'}
                  <span className="text-sm font-normal ml-1" style={{ color: 'var(--tp-secondary)' }}>
                    /night
                  </span>
                </div>
              </div>

              {/* Display-only input rows */}
              <div
                className="rounded-lg border overflow-hidden"
                style={{ borderColor: 'var(--tp-border)' }}
              >
                {/* Check-in */}
                <div
                  className="flex items-center gap-3 px-4 py-3 border-b"
                  style={{ borderColor: 'var(--tp-border)' }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: 'var(--tp-secondary)', flexShrink: 0 }}
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <div>
                    <div className="text-xs font-medium" style={{ color: 'var(--tp-secondary)' }}>
                      Check-in
                    </div>
                    <div className="text-sm" style={{ color: 'var(--tp-primary)' }}>
                      Add date
                    </div>
                  </div>
                </div>

                {/* Check-out */}
                <div
                  className="flex items-center gap-3 px-4 py-3 border-b"
                  style={{ borderColor: 'var(--tp-border)' }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: 'var(--tp-secondary)', flexShrink: 0 }}
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <div>
                    <div className="text-xs font-medium" style={{ color: 'var(--tp-secondary)' }}>
                      Check-out
                    </div>
                    <div className="text-sm" style={{ color: 'var(--tp-primary)' }}>
                      Add date
                    </div>
                  </div>
                </div>

                {/* Guests */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ color: 'var(--tp-secondary)', flexShrink: 0 }}
                    aria-hidden="true"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <div>
                    <div className="text-xs font-medium" style={{ color: 'var(--tp-secondary)' }}>
                      Guests
                    </div>
                    <div className="text-sm" style={{ color: 'var(--tp-primary)' }}>
                      1 guest
                    </div>
                  </div>
                </div>
              </div>

              {/* Check availability CTA */}
              <a
                href="/search"
                className="block w-full rounded-lg py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-80"
                style={{ background: 'var(--tp-primary)' }}
              >
                Check availability
              </a>

              <p className="text-center text-xs" style={{ color: 'var(--tp-secondary)' }}>
                You won&apos;t be charged yet
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* ── Section 4: Available rooms ── */}
      <section
        aria-label="Available rooms"
        className="py-10"
        style={{ background: 'var(--tp-muted)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: 'var(--tp-primary)' }}
          >
            Available rooms
          </h2>
          <div className="flex flex-col gap-4">
            {rooms.map(room => (
              <RoomCard key={room.id} room={room} hotelId={id} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Amenities grid ── */}
      <section
        aria-label="Amenities"
        className="py-12"
        style={{ background: 'var(--tp-surface)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: 'var(--tp-primary)' }}
          >
            What&apos;s included
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(detail.amenities ?? [])
              .filter(amenity => KNOWN_AMENITIES.has(amenity))
              .map(amenity => (
                <div
                  key={amenity}
                  className="flex items-center gap-3 rounded-lg px-4 py-3"
                  style={{ background: 'var(--tp-muted)', color: 'var(--tp-secondary)' }}
                >
                  <span style={{ color: 'var(--tp-accent)', flexShrink: 0 }}>
                    {getAmenityIcon(amenity)}
                  </span>
                  <div className="min-w-0">
                    <span className="text-sm font-medium block truncate" style={{ color: 'var(--tp-primary)' }}>
                      {amenity}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--tp-secondary)' }}>
                      {getAmenityCategory(amenity)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Location & policies ── */}
      <section
        aria-label="Location and policies"
        className="py-12"
        style={{ background: 'var(--tp-bg)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location card */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{ background: 'var(--tp-surface)', borderColor: 'var(--tp-border)' }}
            >
              <h2 className="text-xl font-bold" style={{ color: 'var(--tp-primary)' }}>
                Location
              </h2>
              <p className="text-sm" style={{ color: 'var(--tp-secondary)' }}>
                {detail.address}
              </p>

              {/* Check-in / Check-out */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2" style={{ color: 'var(--tp-secondary)' }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="text-sm">Check-in: {detail.checkInTime}</span>
                </div>
                <div className="flex items-center gap-2" style={{ color: 'var(--tp-secondary)' }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="text-sm">Check-out: {detail.checkOutTime}</span>
                </div>
              </div>

              {/* Nearby attractions */}
              <div>
                <h3
                  className="text-sm font-semibold mb-3"
                  style={{ color: 'var(--tp-primary)' }}
                >
                  Nearby attractions
                </h3>
                <ul className="flex flex-col gap-2">
                  {(detail.nearbyAttractions ?? []).map(attr => (
                    <li key={attr.name} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--tp-primary)' }}>{attr.name}</span>
                      <span style={{ color: 'var(--tp-secondary)' }}>{attr.distance}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Policies card */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-4"
              style={{ background: 'var(--tp-surface)', borderColor: 'var(--tp-border)' }}
            >
              <h2 className="text-xl font-bold" style={{ color: 'var(--tp-primary)' }}>
                Hotel policies
              </h2>
              <ul className="flex flex-col gap-2">
                {(detail.policies ?? []).map(policy => (
                  <li key={policy} className="flex items-start gap-2 text-sm">
                    <span
                      style={{ color: 'var(--tp-accent)', marginTop: '2px', flexShrink: 0 }}
                      aria-hidden="true"
                    >
                      •
                    </span>
                    <span style={{ color: 'var(--tp-secondary)' }}>{policy}</span>
                  </li>
                ))}
              </ul>
              <p
                className="mt-2 rounded-lg px-4 py-3 text-sm"
                style={{ background: 'var(--tp-accent-light)', color: 'var(--tp-accent)' }}
              >
                Free cancellation available on select rooms
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 7: Footer ── */}
      <Footer />
    </div>
  );
}
