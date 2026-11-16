'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { RoomAvailability } from '@/app/lib/api/search';
import { RoomCalendarPicker } from './RoomCalendarPicker';

type RoomCardProps = {
  room: RoomAvailability;
  hotelId: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

const BOOKING_UNIT_LABELS: Record<string, string> = {
  NIGHT: 'night', HOUR: 'hour', DAY: 'day', SESSION: 'session', CUSTOM: 'booking',
};

export function RoomCard({ room, hotelId, checkIn, checkOut, guests = 1 }: RoomCardProps) {
  const router = useRouter();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const cancellationPolicy = room.cancellationPolicy ?? '';
  const isFreeCancel    = cancellationPolicy.toLowerCase().includes('free');
  const isNonRefundable = cancellationPolicy.toLowerCase().includes('non-refundable');

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

  // The resource/room ID to query the inventory calendar
  const resourceId = room.roomTypeId ?? room.id;

  // Pick the primary image, fall back to first image
  const primaryImage =
    room.images?.find((img) => img.isPrimary) ?? room.images?.[0] ?? null;

  // Price label — resource with no rate plan shows "Contact for pricing"
  const hasPrice = room.pricePerNight > 0;
  const unitLabel = BOOKING_UNIT_LABELS[room.bookingUnit ?? 'NIGHT'] ?? 'night';

  // When the user confirms dates in the calendar, navigate to checkout
  const handleConfirm = useCallback((selectedCheckIn: string, selectedCheckOut: string) => {
    const params = new URLSearchParams({
      hotelId,
      roomId: resourceId,
      guests: String(guests),
      checkIn: selectedCheckIn,
      checkOut: selectedCheckOut,
    });
    router.push(`/checkout?${params.toString()}`);
  }, [hotelId, resourceId, guests, router]);

  return (
    <>
      <article
        className="flex flex-col md:flex-row overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {/* ── Image ─────────────────────────────────────────────────────────── */}
        <div
          className="room-card-img relative flex-shrink-0 overflow-hidden"
          style={{
            width: '100%',
            height: '180px',
            background: 'linear-gradient(135deg, var(--primitive-ivory-300), var(--primitive-ivory-400))',
          }}
          aria-hidden="true"
        >
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.caption ?? room.name}
              fill
              sizes="(max-width: 768px) 100vw, 220px"
              className="object-cover"
            />
          ) : (
            /* Placeholder */
            <div className="flex h-full w-full items-center justify-center">
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
            </div>
          )}

          {/* Multiple photos badge */}
          {(room.images?.length ?? 0) > 1 && (
            <span
              style={{
                position: 'absolute', bottom: 6, right: 6,
                background: 'rgba(0,0,0,0.55)', color: '#fff',
                borderRadius: 4, padding: '2px 7px', fontSize: 11,
              }}
            >
              {room.images!.length} photos
            </span>
          )}

          {/* Resource type badge */}
          {room.isResource && (
            <span
              style={{
                position: 'absolute', top: 6, left: 6,
                background: 'rgba(0,0,0,0.55)', color: '#fff',
                borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}
            >
              {room.bedType}
            </span>
          )}

          <style>{`
            @media(min-width:768px){
              .room-card-img { width: 220px !important; height: auto !important; min-height: 180px; }
            }
          `}</style>
        </div>

        {/* ── Content ───────────────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-3 p-5 min-w-0">
          {/* Name + badges */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {room.name}
            </h3>
            {!room.isResource && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
              >
                {room.bedType} bed
              </span>
            )}
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
            >
              Up to {room.capacity} guest{room.capacity !== 1 ? 's' : ''}
            </span>
            {room.bookingUnit && room.bookingUnit !== 'NIGHT' && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}
              >
                {unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1)} rate
              </span>
            )}
          </div>

          {/* Description (resources have this; room types use sizeSqm) */}
          {room.description && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {room.description}
            </p>
          )}

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

          {/* Breakfast + cancellation (room types only) */}
          {!room.isResource && (
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
          )}

          {/* Price + CTA */}
          <div
            className="mt-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-t pt-4"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div>
              {hasPrice ? (
                <>
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    ₦{room.pricePerNight.toLocaleString()}
                  </span>
                  <span className="ml-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    / {unitLabel}
                  </span>
                </>
              ) : (
                <span className="text-base font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Contact for pricing
                </span>
              )}
              {typeof room.availableRooms === 'number' && room.availableRooms <= 3 && room.availableRooms > 0 && (
                <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--color-warning-text)' }}>
                  Only {room.availableRooms} left
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setCalendarOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 shrink-0"
              style={{ background: 'var(--color-brand)', border: 'none', cursor: 'pointer' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Reserve
            </button>
          </div>
        </div>
      </article>

      {/* Calendar picker modal */}
      {calendarOpen && (
        <RoomCalendarPicker
          resourceId={resourceId}
          roomName={room.name}
          pricePerNight={room.pricePerNight}
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
          guests={guests}
          hotelId={hotelId}
          onConfirm={handleConfirm}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </>
  );
}
