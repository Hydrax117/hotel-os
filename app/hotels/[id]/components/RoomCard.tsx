import React from 'react';
import Link from 'next/link';
import { RoomAvailability } from '@/app/lib/api/search';

type RoomCardProps = {
  room: RoomAvailability;
  hotelId: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

export function RoomCard({ room, hotelId, checkIn, checkOut, guests = 1 }: RoomCardProps) {
  const cancellationPolicy = room.cancellationPolicy ?? '';
  const isFreeCancel     = cancellationPolicy.toLowerCase().includes('free');
  const isNonRefundable  = cancellationPolicy.toLowerCase().includes('non-refundable');

  const cancellationColor = isFreeCancel
    ? 'var(--color-brand)'
    : isNonRefundable
    ? 'var(--color-warning-text)'
    : 'var(--color-text-secondary)';

  const cancellationBg = isFreeCancel
    ? 'var(--color-brand-light)'
    : isNonRefundable
    ? 'var(--primitive-warning-bg)'
    : 'var(--color-muted)';

  // Build checkout URL — include dates if available
  const params = new URLSearchParams({
    hotelId,
    roomId: room.roomTypeId ?? room.id,
    guests: String(guests),
  });
  if (checkIn)  params.set('checkIn',  checkIn);
  if (checkOut) params.set('checkOut', checkOut);
  const reserveHref = `/checkout?${params.toString()}`;

  return (
    <article
      className="flex flex-col md:flex-row overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* Image placeholder */}
      <div
        className="relative flex-shrink-0"
        style={{
          width: '100%',
          height: '180px',
          background: 'linear-gradient(135deg, var(--primitive-ivory-300), var(--primitive-ivory-400))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden="true"
      >
        <svg
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 4v16"/><path d="M22 4v16"/>
          <path d="M2 8h20"/><path d="M2 16h20"/>
          <path d="M6 8v8"/><path d="M18 8v8"/>
          <rect x="6" y="8" width="12" height="4" rx="1"/>
        </svg>
        <style>{`@media(min-width:768px){.room-card-img{width:220px!important;height:auto!important}}`}</style>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5 min-w-0">
        {/* Name + badges */}
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {room.name}
          </h3>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
          >
            {room.bedType} bed
          </span>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
          >
            Up to {room.capacity} guest{room.capacity !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Size */}
        {room.sizeSqm != null && (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{room.sizeSqm} m²</p>
        )}

        {/* Amenities */}
        {(room.amenities ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(room.amenities ?? []).slice(0, 5).map(a => (
              <span key={a} className="rounded-md px-2 py-0.5 text-xs" style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}>
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Breakfast + cancellation */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              background: room.breakfastIncluded ? 'var(--color-brand-light)' : 'var(--color-muted)',
              color: room.breakfastIncluded ? 'var(--color-brand)' : 'var(--color-text-secondary)',
            }}
          >
            {room.breakfastIncluded ? 'Breakfast included' : 'Room only'}
          </span>
          {cancellationPolicy && (
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: cancellationBg, color: cancellationColor }}
            >
              {cancellationPolicy}
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div
          className="mt-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-t pt-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div>
            <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              ₦{room.pricePerNight.toLocaleString()}
            </span>
            <span className="ml-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              / night
            </span>
            {typeof room.availableRooms === 'number' && room.availableRooms <= 3 && room.availableRooms > 0 && (
              <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--color-warning-text)' }}>
                Only {room.availableRooms} left
              </p>
            )}
          </div>

          {/* Plain <a> tag — always works, no hydration dependency */}
          <a
            href={reserveHref}
            className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 shrink-0"
            style={{ background: 'var(--color-brand)' }}
          >
            Reserve
          </a>
        </div>
      </div>
    </article>
  );
}
