import React from 'react';
import Link from 'next/link';
import { RoomType } from '../../mock';

// ── Types ─────────────────────────────────────────────────────────────────────

type RoomCardProps = {
  room: RoomType;
  hotelId: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function RoomCard({ room, hotelId }: RoomCardProps) {
  const isFreeCancel = room.cancellationPolicy.toLowerCase().includes('free');
  const isNonRefundable = room.cancellationPolicy.toLowerCase().includes('non-refundable');

  const cancellationColor = isFreeCancel
    ? 'var(--tp-accent)'
    : isNonRefundable
    ? '#d97706'
    : 'var(--tp-secondary)';

  return (
    <div
      className="flex flex-col md:flex-row overflow-hidden rounded-xl border"
      style={{
        background: 'var(--tp-surface)',
        borderColor: 'var(--tp-border)',
      }}
    >
      {/* Image placeholder */}
      <div
        className="relative w-full md:w-[240px] shrink-0"
        style={{
          height: '180px',
          background: 'linear-gradient(135deg, #d4c4a8, #a08870)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden="true"
      >
        {/* Bed icon */}
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 4v16" />
          <path d="M22 4v16" />
          <path d="M2 8h20" />
          <path d="M2 16h20" />
          <path d="M6 8v8" />
          <path d="M18 8v8" />
          <rect x="6" y="8" width="12" height="4" rx="1" />
        </svg>
      </div>

      {/* Content area */}
      <div
        className="flex flex-1 flex-col gap-3 p-5"
        style={{ minWidth: 0 }}
      >
        {/* Row 1: room name + badges */}
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold" style={{ color: 'var(--tp-primary)' }}>
            {room.name}
          </h3>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: 'var(--tp-muted)', color: 'var(--tp-secondary)' }}
          >
            {room.bedType} bed
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: 'var(--tp-muted)', color: 'var(--tp-secondary)' }}
          >
            Up to {room.capacity} guest{room.capacity !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Row 2: size */}
        <p className="text-sm" style={{ color: 'var(--tp-secondary)' }}>
          {room.sizeSqm} sqm
        </p>

        {/* Row 3: amenities chips (max 5) */}
        <div className="flex flex-wrap gap-1.5">
          {room.amenities.slice(0, 5).map(amenity => (
            <span
              key={amenity}
              className="rounded-md px-2 py-1 text-xs"
              style={{ background: 'var(--tp-muted)', color: 'var(--tp-secondary)' }}
            >
              {amenity}
            </span>
          ))}
        </div>

        {/* Row 4: breakfast + cancellation */}
        <div className="flex flex-wrap items-center gap-3">
          {room.breakfastIncluded ? (
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: 'var(--tp-accent-light)', color: 'var(--tp-accent)' }}
            >
              Breakfast included
            </span>
          ) : (
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: 'var(--tp-muted)', color: 'var(--tp-secondary)' }}
            >
              Room only
            </span>
          )}
          <span className="text-xs" style={{ color: cancellationColor }}>
            {room.cancellationPolicy}
          </span>
        </div>

        {/* Price + CTA row */}
        <div
          className="mt-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-t pt-4"
          style={{ borderColor: 'var(--tp-border)' }}
        >
          <div className="flex flex-col">
            <span className="text-2xl font-bold" style={{ color: 'var(--tp-primary)' }}>
              ₦{room.pricePerNight.toLocaleString()}
            </span>
            <span className="text-xs" style={{ color: 'var(--tp-secondary)' }}>
              per night
            </span>
            {room.available <= 3 && (
              <span
                className="mt-1 text-xs font-medium"
                style={{ color: '#d97706' }}
              >
                Only {room.available} left
              </span>
            )}
          </div>

          <Link
            href={`/checkout?hotelId=${hotelId}&roomId=${room.id}&checkIn=&checkOut=&guests=1`}
            className="inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white text-center transition-opacity hover:opacity-80"
            style={{ background: 'var(--tp-primary)' }}
          >
            Reserve
          </Link>
        </div>
      </div>
    </div>
  );
}
