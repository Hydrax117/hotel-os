'use client';

/**
 * BookingWidget — sticky sidebar on the hotel detail page.
 *
 * Lets the user pick dates + guest count, then either:
 *  - Scrolls to the rooms section so they can pick a specific room
 *  - Or (if a roomId is pre-selected) jumps straight to checkout
 *
 * Persists the selection in the URL as ?checkIn=&checkOut=&guests=
 * so the server component can pass the dates into each RoomCard's link.
 */

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

type Props = {
  lowestPrice: number | null;
  hotelId: string;
};

// Today's date in YYYY-MM-DD (local time)
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Tomorrow's date in YYYY-MM-DD
function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calcNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export function BookingWidget({ lowestPrice, hotelId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Seed from URL params if present, else default to today/tomorrow
  const [checkIn, setCheckIn]   = useState(searchParams.get('checkIn')  ?? today());
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') ?? tomorrow());
  const [guests, setGuests]     = useState(Number(searchParams.get('guests') ?? '1'));

  const nights = calcNights(checkIn, checkOut);

  // Sync back to URL whenever the user changes a value — causes server re-render
  // which updates the RoomCard links with the correct dates.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (checkIn)  params.set('checkIn',  checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    params.set('guests', String(guests));
    const newUrl = `${pathname}?${params.toString()}`;
    startTransition(() => { router.replace(newUrl, { scroll: false }); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, guests]);

  const priceDisplay = lowestPrice != null
    ? `₦${lowestPrice.toLocaleString()}`
    : null;

  const checkoutHref = checkIn && checkOut
    ? `/checkout?hotelId=${hotelId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
    : `/checkout?hotelId=${hotelId}&guests=${guests}`;

  function handleCheckAvailability() {
    // Scroll the rooms section into view and briefly highlight it
    const section = document.getElementById('rooms-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Flash a highlight ring on the section so users know to pick a room
      section.style.transition = 'outline 0s';
      section.style.outline = '2px solid var(--color-brand)';
      section.style.borderRadius = '12px';
      setTimeout(() => {
        section.style.outline = 'none';
      }, 1800);
    }
  }

  const hasValidDates = nights > 0;

  return (
    <div
      className="rounded-2xl border p-6 flex flex-col gap-4"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-lg)',
        opacity: isPending ? 0.85 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {/* Price */}
      <div>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>From</p>
        <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {priceDisplay ?? 'Contact us'}
          {priceDisplay && (
            <span className="ml-1 text-sm font-normal" style={{ color: 'var(--color-text-secondary)' }}>
              / night
            </span>
          )}
        </p>
      </div>

      {/* Date + guest inputs */}
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
        {/* Check-in */}
        <label
          className="flex items-center gap-3 px-4 py-3 cursor-pointer"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Check-in</p>
            <input
              type="date"
              value={checkIn}
              min={today()}
              onChange={e => {
                setCheckIn(e.target.value);
                // If check-out is before new check-in, push it forward by 1 day
                if (e.target.value && checkOut && e.target.value >= checkOut) {
                  const d = new Date(e.target.value);
                  d.setDate(d.getDate() + 1);
                  setCheckOut(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                }
              }}
              className="w-full bg-transparent text-sm font-medium outline-none"
              style={{ color: 'var(--color-text-primary)', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label="Check-in date"
            />
          </div>
        </label>

        {/* Check-out */}
        <label
          className="flex items-center gap-3 px-4 py-3 cursor-pointer"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Check-out</p>
            <input
              type="date"
              value={checkOut}
              min={checkIn || today()}
              onChange={e => setCheckOut(e.target.value)}
              className="w-full bg-transparent text-sm font-medium outline-none"
              style={{ color: 'var(--color-text-primary)', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label="Check-out date"
            />
          </div>
        </label>

        {/* Guests */}
        <div className="flex items-center gap-3 px-4 py-3">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Guests</p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {guests} guest{guests !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Decrease guests"
                disabled={guests <= 1}
                onClick={() => setGuests(g => Math.max(1, g - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full border text-sm font-semibold transition-colors"
                style={{
                  borderColor: 'var(--color-border)',
                  color: guests <= 1 ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                  background: 'var(--color-bg)',
                  cursor: guests <= 1 ? 'not-allowed' : 'pointer',
                  opacity: guests <= 1 ? 0.4 : 1,
                }}
              >
                −
              </button>
              <button
                type="button"
                aria-label="Increase guests"
                disabled={guests >= 10}
                onClick={() => setGuests(g => Math.min(10, g + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full border text-sm font-semibold transition-colors"
                style={{
                  borderColor: 'var(--color-border)',
                  color: guests >= 10 ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                  background: 'var(--color-bg)',
                  cursor: guests >= 10 ? 'not-allowed' : 'pointer',
                  opacity: guests >= 10 ? 0.4 : 1,
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Night count summary */}
      {hasValidDates && (
        <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {nights} night{nights !== 1 ? 's' : ''}
          </span>
          {priceDisplay && lowestPrice != null && (
            <> · from ₦{(lowestPrice * nights).toLocaleString()} total</>
          )}
        </p>
      )}

      {/* CTA */}
      <button
        type="button"
        onClick={handleCheckAvailability}
        className="block w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-85"
        style={{ background: 'var(--color-brand)', cursor: 'pointer', border: 'none' }}
      >
        Check availability
      </button>

      <p className="text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        You won&apos;t be charged yet
      </p>
    </div>
  );
}
