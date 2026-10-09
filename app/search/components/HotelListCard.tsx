import React from 'react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

type HotelListCardProps = {
  id: string;
  name: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  amenities: string[];
  featured?: boolean;
};

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const IconStar = ({ filled }: { filled: boolean }) => (
  <svg
    width="14"
    height="14"
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

const IconMapPin = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export function HotelListCard({
  id,
  name,
  city,
  state,
  rating,
  reviewCount,
  pricePerNight,
  amenities,
  featured,
}: HotelListCardProps) {
  // Format price
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const formattedPrice = formatter.format(pricePerNight);

  // Star rendering
  const stars = Array.from({ length: 5 }, (_, i) => i + 1 <= Math.floor(rating));

  return (
    <div
      className="flex flex-col md:flex-row overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md"
      style={{
        background: '#ffffff',
        borderColor: 'var(--tp-border)',
      }}
    >
      {/* Image area */}
      <div
        className="relative w-full md:w-[280px] h-[200px] bg-gradient-to-br from-gray-200 to-gray-300"
        style={{ flexShrink: 0 }}
      >
        {/* Featured badge */}
        {featured && (
          <div
            className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ background: 'var(--tp-accent)' }}
          >
            Featured
          </div>
        )}
        {/* Placeholder for initials or icon */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            fontWeight: 700,
            color: 'rgba(0,0,0,0.1)',
            userSelect: 'none',
          }}
        >
          {name.substring(0, 2).toUpperCase()}
        </div>
      </div>

      {/* Content area */}
      <div
        className="flex flex-1 flex-col justify-between p-5"
        style={{ gap: '0.75rem' }}
      >
        {/* Top section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {/* Hotel name */}
          <h3
            className="text-xl font-bold leading-tight"
            style={{ color: 'var(--tp-primary)' }}
          >
            {name}
          </h3>

          {/* Location */}
          <div
            className="flex items-center gap-1.5"
            style={{ color: 'var(--tp-secondary)' }}
          >
            <IconMapPin />
            <span className="text-sm">
              {city} · {state}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-0.5"
              style={{ color: 'var(--tp-gold)' }}
            >
              {stars.map((filled, i) => (
                <IconStar key={i} filled={filled} />
              ))}
            </div>
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--tp-primary)' }}
            >
              {rating.toFixed(1)}
            </span>
            <span className="text-sm" style={{ color: 'var(--tp-secondary)' }}>
              ({reviewCount} reviews)
            </span>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {amenities.slice(0, 4).map(amenity => (
                <span
                  key={amenity}
                  className="rounded-md px-2 py-1 text-xs font-medium"
                  style={{
                    background: 'var(--tp-muted)',
                    color: 'var(--tp-secondary)',
                  }}
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom section: price + CTA */}
        <div
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
          style={{ borderTop: '1px solid var(--tp-border)', paddingTop: '1rem' }}
        >
          <div className="flex flex-col">
            <span className="text-xs" style={{ color: 'var(--tp-secondary)' }}>
              From
            </span>
            <span className="text-xl font-bold" style={{ color: 'var(--tp-primary)' }}>
              {formattedPrice}
            </span>
            <span className="text-xs" style={{ color: 'var(--tp-secondary)' }}>
              /night
            </span>
          </div>

          <Link
            href={`/hotels/${id}`}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80 text-center"
            style={{ background: 'var(--tp-accent)' }}
          >
            View rooms
          </Link>
        </div>
      </div>
    </div>
  );
}
