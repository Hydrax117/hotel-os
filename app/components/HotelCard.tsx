import React from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type HotelCardProps = {
  name: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  amenities: string[];
  imageUrl?: string;
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

const IconHeart = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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

export function HotelCard({
  name,
  city,
  state,
  rating,
  reviewCount,
  pricePerNight,
  amenities,
  imageUrl,
  featured,
}: HotelCardProps) {
  // Format price with Nigerian Naira
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const formattedPrice = formatter.format(pricePerNight);

  // Star rating rendering
  const stars = Array.from({ length: 5 }, (_, i) => i + 1 <= Math.floor(rating));

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md"
      style={{
        background: 'var(--tp-surface)',
        borderColor: 'var(--tp-border)',
      }}
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
        {imageUrl && (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        )}

        {/* Heart icon */}
        <button
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-colors hover:bg-white"
          style={{ color: 'var(--tp-primary)' }}
          aria-label="Save hotel"
        >
          <IconHeart />
        </button>

        {/* Featured badge */}
        {featured && (
          <div
            className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ background: 'var(--tp-accent)' }}
          >
            Featured
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Hotel name */}
        <h3 className="text-lg font-bold leading-tight" style={{ color: 'var(--tp-primary)' }}>
          {name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5" style={{ color: 'var(--tp-secondary)' }}>
          <IconMapPin />
          <span className="text-sm">
            {city} · {state}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5" style={{ color: 'var(--tp-gold)' }}>
            {stars.map((filled, i) => (
              <IconStar key={i} filled={filled} />
            ))}
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--tp-primary)' }}>
            {rating.toFixed(1)}
          </span>
          <span className="text-sm" style={{ color: 'var(--tp-secondary)' }}>
            ({reviewCount} reviews)
          </span>
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {amenities.slice(0, 3).map(amenity => (
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

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between border-t pt-4" style={{ borderColor: 'var(--tp-border)' }}>
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

          <button
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
            style={{
              borderColor: 'var(--tp-border)',
              color: 'var(--tp-primary)',
            }}
          >
            View rooms
          </button>
        </div>
      </div>
    </div>
  );
}
