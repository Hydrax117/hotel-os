import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

type DestinationCardProps = {
  city: string;
  hotelCount: number;
  imageUrl?: string;
  gradientFrom?: string;
  gradientTo?: string;
};

// Pure Server Component — no event handlers, hover via CSS only.
export function DestinationCard({
  city,
  hotelCount,
  imageUrl,
  gradientFrom = '#c9a96e',
  gradientTo   = '#7c6b4a',
}: DestinationCardProps) {
  return (
    <>
      <style>{`
        .dest-card-inner { transition: transform 0.5s; }
        .dest-card:hover .dest-card-inner { transform: scale(1.05); }
        .dest-card-explore { transition: opacity 0.2s; opacity: 0.7; }
        .dest-card:hover .dest-card-explore { opacity: 1; }
      `}</style>

      <Link
        href={`/search?destination=${encodeURIComponent(city)}`}
        className="dest-card group relative block aspect-[4/3] overflow-hidden"
        style={{ borderRadius: 'var(--radius-lg)' }}
        aria-label={`Explore hotels in ${city}`}
      >
        <div className="dest-card-inner absolute inset-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={city}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
              placeholder="blur"
              blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'%3E%3Crect fill='%23c8b89a' width='4' height='3'/%3E%3C/svg%3E"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(145deg,${gradientFrom} 0%,${gradientTo} 100%)` }}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Scrim */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.68) 0%,rgba(0,0,0,0.18) 55%,transparent 100%)' }}
          aria-hidden="true"
        />

        {/* Hotel count */}
        {hotelCount > 0 && (
          <div
            className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
          >
            {hotelCount.toLocaleString()} {hotelCount === 1 ? 'hotel' : 'hotels'}
          </div>
        )}

        {/* City label */}
        <div className="absolute bottom-0 left-0 p-4">
          <h3 className="text-xl font-semibold text-white drop-shadow-sm leading-tight">{city}</h3>
          <p className="dest-card-explore mt-0.5 text-xs font-medium text-white">Explore →</p>
        </div>
      </Link>
    </>
  );
}
