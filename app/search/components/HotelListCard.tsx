import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
  imageUrl?: string;
  featured?: boolean;
};

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconStar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconMapPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
  imageUrl,
  featured,
}: HotelListCardProps) {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const formattedPrice = formatter.format(pricePerNight);

  return (
    <>
      <style>{`
        .hlc:hover { box-shadow: var(--shadow-md) !important; }
        .hlc-name:hover { color: var(--color-brand) !important; }
        .hlc-cta:hover { opacity: 0.85; }
      `}</style>
    <article
      className="hlc group flex flex-col md:flex-row overflow-hidden transition-shadow duration-150"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Image */}
      <Link
        href={`/hotels/${id}`}
        className="relative block flex-shrink-0 overflow-hidden"
        style={{ width: '100%', height: '200px' }}
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="md:w-[260px] md:h-full h-full w-full relative">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, 260px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              placeholder="blur"
              blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'%3E%3Crect fill='%23e8e4df' width='4' height='3'/%3E%3C/svg%3E"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, var(--primitive-ivory-300), var(--primitive-ivory-400))`,
              }}
              aria-hidden="true"
            >
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '4rem',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.5)',
                  userSelect: 'none',
                  lineHeight: 1,
                }}
              >
                {name.charAt(0)}
              </span>
            </div>
          )}
          {featured && (
            <div
              className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
              style={{ background: 'var(--color-brand)' }}
            >
              Featured
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-5 gap-3">
        <div className="flex flex-col gap-2.5">
          {/* Name */}
          <Link href={`/hotels/${id}`}>
            <h3
              className="hlc-name text-lg font-semibold leading-snug transition-colors"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {name}
            </h3>
          </Link>

          {/* Location */}
          <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            <IconMapPin />
            <span className="text-sm">{city}{state ? `, ${state}` : ''}</span>
          </div>

          {/* Rating */}
          {(rating > 0 || reviewCount > 0) && (
            <div className="flex items-center gap-1.5">
              <span style={{ color: 'var(--color-star)' }}><IconStar /></span>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {rating > 0 ? rating.toFixed(1) : '—'}
              </span>
              {reviewCount > 0 && (
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  ({reviewCount.toLocaleString()} reviews)
                </span>
              )}
            </div>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {amenities.slice(0, 5).map(a => (
                <span
                  key={a}
                  className="rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
                >
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price + CTA */}
        <div
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-t pt-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>From </span>
            <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {pricePerNight > 0 ? formattedPrice : '—'}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}> / night</span>
          </div>
          <Link
            href={`/hotels/${id}`}
            className="hlc-cta inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity shrink-0"
            style={{ background: 'var(--color-brand)' }}
          >
            View hotel
          </Link>
        </div>
      </div>
    </article>
    </>
  );
}
