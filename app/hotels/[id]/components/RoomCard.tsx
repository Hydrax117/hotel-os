'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { RoomAvailability } from '@/app/lib/api/search';
import { RoomCalendarPicker } from './RoomCalendarPicker';
import { RoomDetailDrawer } from './RoomDetailDrawer';
import type { Resource } from '@/app/lib/api/resources';

type RoomCardProps = {
  room: RoomAvailability;
  hotelId: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  /** If provided the card shows owner actions (edit/archive) */
  isOwnerView?: boolean;
  /** Called after a room is archived so the parent can remove it from the list */
  onArchived?: (resourceId: string) => void;
  /** Called after a room is edited so the parent can update its data */
  onEdited?: (resourceId: string, patch: Partial<Resource>) => void;
};

const BOOKING_UNIT_LABELS: Record<string, string> = {
  NIGHT: 'night', HOUR: 'hour', DAY: 'day', SESSION: 'session', CUSTOM: 'booking',
};

export function RoomCard({
  room, hotelId, checkIn, checkOut, guests = 1,
  isOwnerView = false, onArchived, onEdited,
}: RoomCardProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Determine role for the drawer
  const ownerRole =
    isOwnerView ||
    user?.role === 'HOTEL_OWNER' ||
    user?.role === 'HOTEL_MANAGER' ||
    user?.role === 'HOTEL_STAFF' ||
    user?.role === 'SUPER_ADMIN';

  const [drawerOpen,   setDrawerOpen]   = useState(false);
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

  const resourceId = room.roomTypeId ?? room.id;
  const primaryImage = room.images?.find(img => img.isPrimary) ?? room.images?.[0] ?? null;
  const hasPrice = room.pricePerNight > 0;
  const unitLabel = BOOKING_UNIT_LABELS[room.bookingUnit ?? 'NIGHT'] ?? 'night';

  const handleCalendarConfirm = useCallback((selectedCheckIn: string, selectedCheckOut: string) => {
    const params = new URLSearchParams({
      hotelId, roomId: resourceId, guests: String(guests),
      checkIn: selectedCheckIn, checkOut: selectedCheckOut,
    });
    router.push(`/checkout?${params.toString()}`);
  }, [hotelId, resourceId, guests, router]);

  return (
    <>
      <article
        className="flex flex-col md:flex-row overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}
        onClick={() => setDrawerOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={`View details for ${room.name}`}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setDrawerOpen(true); }}
      >
        {/* ── Image ── */}
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
            <div className="flex h-full w-full items-center justify-center">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 4v16"/><path d="M22 4v16"/>
                <path d="M2 8h20"/><path d="M2 16h20"/>
                <path d="M6 8v8"/><path d="M18 8v8"/>
                <rect x="6" y="8" width="12" height="4" rx="1"/>
              </svg>
            </div>
          )}

          {(room.images?.length ?? 0) > 1 && (
            <span style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>
              {room.images!.length} photos
            </span>
          )}
          {room.isResource && (
            <span style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {room.bedType}
            </span>
          )}

          {/* "View details" hint overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            aria-hidden="true"
          >
            <span className="rounded-full px-4 py-2 text-xs font-semibold text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
              View details
            </span>
          </div>

          <style>{`
            @media(min-width:768px){
              .room-card-img { width: 220px !important; height: auto !important; min-height: 180px; }
            }
          `}</style>
        </div>

        {/* ── Content ── */}
        <div className="flex flex-1 flex-col gap-3 p-5 min-w-0">
          {/* Name + badges */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>{room.name}</h3>
            {!room.isResource && (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}>
                {room.bedType} bed
              </span>
            )}
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}>
              Up to {room.capacity} guest{room.capacity !== 1 ? 's' : ''}
            </span>
            {room.bookingUnit && room.bookingUnit !== 'NIGHT' && (
              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}>
                {unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1)} rate
              </span>
            )}
          </div>

          {room.description && (
            <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
              {room.description}
            </p>
          )}
          {room.sizeSqm != null && (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{room.sizeSqm} m²</p>
          )}

          {(room.amenities ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(room.amenities ?? []).slice(0, 5).map(a => (
                <span key={a} className="rounded-md px-2 py-0.5 text-xs" style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}>{a}</span>
              ))}
              {(room.amenities ?? []).length > 5 && (
                <span className="rounded-md px-2 py-0.5 text-xs" style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}>
                  +{(room.amenities ?? []).length - 5} more
                </span>
              )}
            </div>
          )}

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
                <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: cancellationBg, color: cancellationColor }}>
                  {cancellationPolicy}
                </span>
              )}
            </div>
          )}

          {/* Price + CTA row */}
          <div
            className="mt-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-t pt-4"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div>
              {hasPrice ? (
                <>
                  <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>₦{room.pricePerNight.toLocaleString()}</span>
                  <span className="ml-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>/ {unitLabel}</span>
                </>
              ) : (
                <span className="text-base font-medium" style={{ color: 'var(--color-text-secondary)' }}>Contact for pricing</span>
              )}
              {typeof room.availableRooms === 'number' && room.availableRooms <= 3 && room.availableRooms > 0 && (
                <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--color-warning-text)' }}>Only {room.availableRooms} left</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
              {/* Details button */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-stone-50"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', background: 'transparent', cursor: 'pointer' }}
              >
                Details
              </button>

              {/* Reserve button — traveler only */}
              {!ownerRole && (
                <button
                  type="button"
                  onClick={() => setCalendarOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
                  style={{ background: 'var(--color-brand)', border: 'none', cursor: 'pointer' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Reserve
                </button>
              )}

              {/* Owner: quick-access edit button */}
              {ownerRole && (
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors"
                  style={{ background: 'var(--color-brand)', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Manage
                </button>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* Room detail drawer */}
      {drawerOpen && (
        <RoomDetailDrawer
          room={room}
          hotelId={hotelId}
          role={ownerRole ? 'owner' : 'traveler'}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          onClose={() => setDrawerOpen(false)}
          onArchived={id => { setDrawerOpen(false); onArchived?.(id); }}
          onEdited={(id, patch) => { onEdited?.(id, patch); }}
        />
      )}

      {/* Quick calendar modal — only for travelers, bypass detail drawer */}
      {calendarOpen && !ownerRole && (
        <RoomCalendarPicker
          resourceId={resourceId}
          roomName={room.name}
          pricePerNight={room.pricePerNight}
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
          guests={guests}
          hotelId={hotelId}
          onConfirm={handleCalendarConfirm}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </>
  );
}
