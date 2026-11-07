import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ── Types ─────────────────────────────────────────────────────────────────────

type HotelCardProps = {
  id?: string;
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
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconMapPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconHeart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

// ── Placeholder image ─────────────────────────────────────────────────────────

function ImagePlaceholder({ name }: { name: string }) {
  const gradients: Record<string, string> = {
    A:'#c9b89a,#9a7c5a', B:'#a8bca8,#6b8c6b', C:'#b8a8c8,#7a6b8a',
    D:'#c8b098,#9a7860', E:'#a0b8c0,#6080a0', F:'#c8a888,#8a6848',
    G:'#b0c0b0,#688068', H:'#c0b0a0,#807060', I:'#a8c0b8,#688078',
    J:'#c8b8a0,#9a8060', K:'#b8c8a8,#788060', L:'#c0a8b8,#806880',
    M:'#c8c0a8,#908060', N:'#a8b8c8,#607080', O:'#c8b0a0,#987058',
    P:'#b0b8a8,#708068', Q:'#c0b8b0,#807870', R:'#b8a8a8,#887068',
    S:'#a8c0a8,#688068', T:'#c8c0b0,#908870', U:'#b8c0c8,#788088',
    V:'#c0a8a8,#806868', W:'#b8b0a0,#787060', X:'#c8b8b8,#907878',
    Y:'#a8b8a8,#688068', Z:'#b8c0b0,#788070',
  };
  const letter = name.charAt(0).toUpperCase();
  const gradient = gradients[letter] ?? '#c8b89a,#9a7c5a';
  return (
    <div
      className="absolute inset-0 flex items-end justify-start p-4"
      style={{ background: `linear-gradient(135deg,${gradient})` }}
      aria-hidden="true"
    >
      <span
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '5rem',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.18)',
          userSelect: 'none',
          lineHeight: 1,
        }}
      >
        {letter}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
// Pure Server Component — no event handlers on elements.
// Hover effects use CSS classes only.

export function HotelCard({
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
}: HotelCardProps) {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const formattedPrice = formatter.format(pricePerNight);
  const href = id ? `/hotels/${id}` : '#';

  return (
    <>
      <style>{`
        .hotel-card { transition: box-shadow 0.2s, transform 0.2s; }
        .hotel-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
        .hotel-card-img img { transition: transform 0.5s; }
        .hotel-card:hover .hotel-card-img img { transform: scale(1.05); }
        .hotel-card-name:hover { color: var(--color-brand) !important; }
        .hotel-card-save:hover { background: #fff !important; }
        .hotel-card-cta:hover { opacity: 0.85; }
      `}</style>

      <article
        className="hotel-card relative flex flex-col overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {/* Image */}
        <Link href={href} className="hotel-card-img relative block aspect-[16/10] overflow-hidden" tabIndex={-1} aria-hidden="true">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${name} — ${city}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
              placeholder="blur"
              blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'%3E%3Crect fill='%23e8e4df' width='4' height='3'/%3E%3C/svg%3E"
            />
          ) : (
            <ImagePlaceholder name={name} />
          )}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.32) 0%,transparent 50%)' }}
          />
          {featured && (
            <div
              className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white"
              style={{ background: 'var(--color-brand)' }}
            >
              Featured
            </div>
          )}
        </Link>

        {/* Save button */}
        <button
          type="button"
          className="hotel-card-save absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.6)',
            color: 'var(--color-text-secondary)',
          }}
          aria-label={`Save ${name}`}
        >
          <IconHeart />
        </button>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <Link href={href}>
            <h3
              className="hotel-card-name line-clamp-1 text-base font-semibold leading-snug transition-colors"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {name}
            </h3>
          </Link>

          <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            <IconMapPin />
            <span className="text-sm">{city}{state ? `, ${state}` : ''}</span>
          </div>

          {(rating > 0 || reviewCount > 0) && (
            <div className="flex items-center gap-1.5">
              <span style={{ color: 'var(--color-star)' }}><IconStar /></span>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {rating > 0 ? rating.toFixed(1) : '—'}
              </span>
              {reviewCount > 0 && (
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  ({reviewCount.toLocaleString()})
                </span>
              )}
            </div>
          )}

          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {amenities.slice(0, 3).map(a => (
                <span
                  key={a}
                  className="rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
                >
                  {a}
                </span>
              ))}
              {amenities.length > 3 && (
                <span className="rounded-md px-2 py-0.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  +{amenities.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-end justify-between gap-2">
              <div>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>From </span>
                <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {pricePerNight > 0 ? formattedPrice : '—'}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}> /night</span>
              </div>
              <Link
                href={href}
                className="hotel-card-cta shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition-opacity"
                style={{ background: 'var(--color-brand)' }}
              >
                View hotel
              </Link>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
