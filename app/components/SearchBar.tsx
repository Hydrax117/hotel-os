'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const IconLocation = () => (
  <svg
    width="16"
    height="16"
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

const IconMinus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────

type SearchBarProps = {
  initialDestination?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function SearchBar({
  initialDestination = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 1,
}: SearchBarProps) {
  const router = useRouter();
  const [destination, setDestination] = useState(initialDestination);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);

  const handleSearch = () => {
    router.push(
      `/search?destination=${encodeURIComponent(destination)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${guests}`
    );
  };

  const decrementGuests = () => setGuests(g => Math.max(1, g - 1));
  const incrementGuests = () => setGuests(g => Math.min(20, g + 1));

  return (
    <div
      className="w-full rounded-2xl shadow-lg"
      style={{
        background: 'var(--tp-surface)',
        border: '1px solid var(--tp-border)',
      }}
    >
      {/* Desktop: horizontal pill layout */}
      <div className="hidden md:flex items-stretch divide-x" style={{ borderColor: 'var(--tp-border)' }}>
        {/* Destination field */}
        <div className="flex flex-1 items-center gap-3 px-5 py-4">
          <span style={{ color: 'var(--tp-secondary)' }}>
            <IconLocation />
          </span>
          <div className="flex flex-col flex-1 min-w-0">
            <label htmlFor="destination" className="text-xs font-semibold mb-0.5" style={{ color: 'var(--tp-primary)' }}>
              Where
            </label>
            <input
              id="destination"
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="Where are you going?"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              style={{ color: 'var(--tp-primary)' }}
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', background: 'var(--tp-border)', alignSelf: 'stretch' }} />

        {/* Check-in field */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex flex-col min-w-0">
            <label htmlFor="checkin" className="text-xs font-semibold mb-0.5" style={{ color: 'var(--tp-primary)' }}>
              Check-in
            </label>
            <input
              id="checkin"
              type="date"
              value={checkIn}
              onChange={e => setCheckIn(e.target.value)}
              className="bg-transparent text-sm outline-none cursor-pointer"
              style={{ color: checkIn ? 'var(--tp-primary)' : 'var(--tp-secondary)' }}
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', background: 'var(--tp-border)', alignSelf: 'stretch' }} />

        {/* Check-out field */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex flex-col min-w-0">
            <label htmlFor="checkout" className="text-xs font-semibold mb-0.5" style={{ color: 'var(--tp-primary)' }}>
              Check-out
            </label>
            <input
              id="checkout"
              type="date"
              value={checkOut}
              onChange={e => setCheckOut(e.target.value)}
              className="bg-transparent text-sm outline-none cursor-pointer"
              style={{ color: checkOut ? 'var(--tp-primary)' : 'var(--tp-secondary)' }}
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', background: 'var(--tp-border)', alignSelf: 'stretch' }} />

        {/* Guests field */}
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex flex-col">
            <span className="text-xs font-semibold mb-0.5" style={{ color: 'var(--tp-primary)' }}>
              Guests
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={decrementGuests}
                disabled={guests <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors disabled:opacity-30"
                style={{ borderColor: 'var(--tp-border)', color: 'var(--tp-primary)' }}
                aria-label="Remove guest"
              >
                <IconMinus />
              </button>
              <span className="w-5 text-center text-sm font-medium" style={{ color: 'var(--tp-primary)' }}>
                {guests}
              </span>
              <button
                onClick={incrementGuests}
                disabled={guests >= 20}
                className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors disabled:opacity-30"
                style={{ borderColor: 'var(--tp-border)', color: 'var(--tp-primary)' }}
                aria-label="Add guest"
              >
                <IconPlus />
              </button>
            </div>
          </div>
        </div>

        {/* Search button */}
        <div className="flex items-center px-4 py-3">
          <button
            type="button"
            onClick={handleSearch}
            className="h-full rounded-xl px-6 text-sm font-semibold text-white transition-opacity hover:opacity-80 whitespace-nowrap"
            style={{ background: 'var(--tp-accent)' }}
          >
            Search hotels
          </button>
        </div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="flex flex-col gap-0 md:hidden">
        {/* Destination */}
        <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'var(--tp-border)' }}>
          <span style={{ color: 'var(--tp-secondary)' }}>
            <IconLocation />
          </span>
          <div className="flex flex-col flex-1">
            <label htmlFor="destination-mobile" className="text-xs font-semibold mb-0.5" style={{ color: 'var(--tp-primary)' }}>
              Where
            </label>
            <input
              id="destination-mobile"
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="Where are you going?"
              className="bg-transparent text-sm outline-none placeholder:text-gray-400"
              style={{ color: 'var(--tp-primary)' }}
            />
          </div>
        </div>

        {/* Check-in */}
        <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'var(--tp-border)' }}>
          <div className="flex flex-col flex-1">
            <label htmlFor="checkin-mobile" className="text-xs font-semibold mb-0.5" style={{ color: 'var(--tp-primary)' }}>
              Check-in
            </label>
            <input
              id="checkin-mobile"
              type="date"
              value={checkIn}
              onChange={e => setCheckIn(e.target.value)}
              className="bg-transparent text-sm outline-none"
              style={{ color: checkIn ? 'var(--tp-primary)' : 'var(--tp-secondary)' }}
            />
          </div>
        </div>

        {/* Check-out */}
        <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'var(--tp-border)' }}>
          <div className="flex flex-col flex-1">
            <label htmlFor="checkout-mobile" className="text-xs font-semibold mb-0.5" style={{ color: 'var(--tp-primary)' }}>
              Check-out
            </label>
            <input
              id="checkout-mobile"
              type="date"
              value={checkOut}
              onChange={e => setCheckOut(e.target.value)}
              className="bg-transparent text-sm outline-none"
              style={{ color: checkOut ? 'var(--tp-primary)' : 'var(--tp-secondary)' }}
            />
          </div>
        </div>

        {/* Guests */}
        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'var(--tp-border)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--tp-primary)' }}>Guests</span>
          <div className="flex items-center gap-3">
            <button
              onClick={decrementGuests}
              disabled={guests <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors disabled:opacity-30"
              style={{ borderColor: 'var(--tp-border)', color: 'var(--tp-primary)' }}
              aria-label="Remove guest"
            >
              <IconMinus />
            </button>
            <span className="w-6 text-center text-sm font-medium" style={{ color: 'var(--tp-primary)' }}>
              {guests}
            </span>
            <button
              onClick={incrementGuests}
              disabled={guests >= 20}
              className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors disabled:opacity-30"
              style={{ borderColor: 'var(--tp-border)', color: 'var(--tp-primary)' }}
              aria-label="Add guest"
            >
              <IconPlus />
            </button>
          </div>
        </div>

        {/* Search button */}
        <div className="p-4">
          <button
            type="button"
            onClick={handleSearch}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80"
            style={{ background: 'var(--tp-accent)' }}
          >
            Search hotels
          </button>
        </div>
      </div>
    </div>
  );
}
