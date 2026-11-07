'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconLocation = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconMinus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconPlus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
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
  initialRooms?: number;
};

// ── Counter subcomponent ──────────────────────────────────────────────────────

function Counter({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        id={`${id}-dec`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors disabled:opacity-30"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)',
          background: 'transparent',
        }}
        aria-label={`Decrease ${label}`}
        onMouseEnter={e => { if (value > min) (e.currentTarget as HTMLElement).style.background = 'var(--color-muted)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <IconMinus />
      </button>
      <span
        id={id}
        className="w-5 text-center text-sm font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
        aria-live="polite"
        aria-atomic="true"
        aria-label={`${value} ${label}`}
      >
        {value}
      </span>
      <button
        type="button"
        id={`${id}-inc`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors disabled:opacity-30"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)',
          background: 'transparent',
        }}
        aria-label={`Increase ${label}`}
        onMouseEnter={e => { if (value < max) (e.currentTarget as HTMLElement).style.background = 'var(--color-muted)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <IconPlus />
      </button>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SearchBar({
  initialDestination = '',
  initialCheckIn    = '',
  initialCheckOut   = '',
  initialGuests     = 2,
  initialRooms      = 1,
}: SearchBarProps) {
  const router = useRouter();

  const [destination, setDestination] = useState(initialDestination);
  const [checkIn,  setCheckIn]  = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [rooms,  setRooms]  = useState(initialRooms);
  const [error, setError] = useState('');

  function handleCheckInChange(value: string) {
    setCheckIn(value);
    setError('');
    // If check-out is before new check-in, push it forward
    if (checkOut && value >= checkOut) {
      setCheckOut(addDays(value, 1));
    }
  }

  function handleCheckOutChange(value: string) {
    if (checkIn && value <= checkIn) {
      setError('Check-out must be after check-in');
      return;
    }
    setCheckOut(value);
    setError('');
  }

  function handleSearch() {
    if (!destination.trim()) { setError('Please enter a destination'); return; }
    if (!checkIn)  { setError('Please select a check-in date'); return; }
    if (!checkOut) { setError('Please select a check-out date'); return; }
    if (checkIn >= checkOut) { setError('Check-out must be after check-in'); return; }
    setError('');

    const params = new URLSearchParams({
      destination: destination.trim(),
      checkIn,
      checkOut,
      guests: String(guests),
      rooms:  String(rooms),
    });
    router.push(`/search?${params.toString()}`);
  }

  const tdMin = today();
  const checkOutMin = checkIn ? addDays(checkIn, 1) : addDays(tdMin, 1);

  // ── Desktop layout ──────────────────────────────────────────────────────────

  const desktopField = (
    content: React.ReactNode,
    opts: { flex?: string; noBorder?: boolean } = {}
  ) => (
    <div
      className={`hidden md:flex flex-col justify-center px-5 py-3.5 ${opts.noBorder ? '' : 'border-r'}`}
      style={{
        flex: opts.flex ?? '0 0 auto',
        borderColor: 'var(--color-border)',
      }}
    >
      {content}
    </div>
  );

  return (
    <div className="w-full">
      {/* Container */}
      <div
        className="overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* ── Desktop: horizontal pill ── */}
        <div className="hidden md:flex items-stretch min-h-[68px]">

          {/* Destination */}
          <div
            className="flex flex-1 items-center gap-3 px-5 py-3 border-r"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <span style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}>
              <IconLocation />
            </span>
            <div className="flex flex-col flex-1 min-w-0">
              <label htmlFor="sb-destination" className="text-label mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Where
              </label>
              <input
                id="sb-destination"
                type="text"
                value={destination}
                onChange={e => { setDestination(e.target.value); setError(''); }}
                placeholder="City, neighbourhood, landmark…"
                className="w-full bg-transparent text-sm outline-none"
                style={{
                  color: 'var(--color-text-primary)',
                  caretColor: 'var(--color-brand)',
                }}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Check-in */}
          {desktopField(
            <>
              <label htmlFor="sb-checkin" className="text-label mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Check-in
              </label>
              <input
                id="sb-checkin"
                type="date"
                value={checkIn}
                onChange={e => handleCheckInChange(e.target.value)}
                min={tdMin}
                className="bg-transparent text-sm outline-none cursor-pointer"
                style={{ color: checkIn ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
              />
            </>
          )}

          {/* Check-out */}
          {desktopField(
            <>
              <label htmlFor="sb-checkout" className="text-label mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Check-out
              </label>
              <input
                id="sb-checkout"
                type="date"
                value={checkOut}
                onChange={e => handleCheckOutChange(e.target.value)}
                min={checkOutMin}
                className="bg-transparent text-sm outline-none cursor-pointer"
                style={{ color: checkOut ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
              />
            </>
          )}

          {/* Guests */}
          {desktopField(
            <>
              <span className="text-label mb-1" style={{ color: 'var(--color-text-secondary)' }}>Guests</span>
              <Counter id="sb-guests" label="guests" value={guests} min={1} max={30} onChange={setGuests} />
            </>
          )}

          {/* Rooms */}
          {desktopField(
            <>
              <span className="text-label mb-1" style={{ color: 'var(--color-text-secondary)' }}>Rooms</span>
              <Counter id="sb-rooms" label="rooms" value={rooms} min={1} max={10} onChange={setRooms} />
            </>,
            { noBorder: true }
          )}

          {/* Search button */}
          <div className="flex items-center px-4 py-3 shrink-0">
            <button
              type="button"
              onClick={handleSearch}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 whitespace-nowrap"
              style={{ background: 'var(--color-brand)' }}
              aria-label="Search hotels"
            >
              <IconSearch />
              Search
            </button>
          </div>
        </div>

        {/* ── Mobile: stacked ── */}
        <div className="flex flex-col md:hidden divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {/* Destination */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}><IconLocation /></span>
            <div className="flex flex-col flex-1">
              <label htmlFor="sb-destination-m" className="text-label mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>Where</label>
              <input
                id="sb-destination-m"
                type="text"
                value={destination}
                onChange={e => { setDestination(e.target.value); setError(''); }}
                placeholder="City, neighbourhood…"
                className="bg-transparent text-sm outline-none"
                style={{ color: 'var(--color-text-primary)' }}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 divide-x" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex flex-col px-4 py-3.5">
              <label htmlFor="sb-checkin-m" className="text-label mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>Check-in</label>
              <input
                id="sb-checkin-m"
                type="date"
                value={checkIn}
                onChange={e => handleCheckInChange(e.target.value)}
                min={tdMin}
                className="bg-transparent text-sm outline-none cursor-pointer"
                style={{ color: checkIn ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
              />
            </div>
            <div className="flex flex-col px-4 py-3.5">
              <label htmlFor="sb-checkout-m" className="text-label mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>Check-out</label>
              <input
                id="sb-checkout-m"
                type="date"
                value={checkOut}
                onChange={e => handleCheckOutChange(e.target.value)}
                min={checkOutMin}
                className="bg-transparent text-sm outline-none cursor-pointer"
                style={{ color: checkOut ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
              />
            </div>
          </div>

          {/* Guests + Rooms */}
          <div className="grid grid-cols-2 divide-x" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex flex-col px-4 py-3.5">
              <span className="text-label mb-2" style={{ color: 'var(--color-text-secondary)' }}>Guests</span>
              <Counter id="sb-guests-m" label="guests" value={guests} min={1} max={30} onChange={setGuests} />
            </div>
            <div className="flex flex-col px-4 py-3.5">
              <span className="text-label mb-2" style={{ color: 'var(--color-text-secondary)' }}>Rooms</span>
              <Counter id="sb-rooms-m" label="rooms" value={rooms} min={1} max={10} onChange={setRooms} />
            </div>
          </div>

          {/* Search button */}
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={handleSearch}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
              style={{ background: 'var(--color-brand)' }}
            >
              <IconSearch />
              Search hotels
            </button>
          </div>
        </div>
      </div>

      {/* Validation error */}
      {error && (
        <p
          role="alert"
          className="mt-2 text-sm font-medium animate-fade-in"
          style={{ color: 'var(--color-danger-text)' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
