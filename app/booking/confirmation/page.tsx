import React from 'react';
import Link from 'next/link';
import { TravelerNav } from '../../components/TravelerNav';
import { Footer } from '../../components/Footer';
import { HOTEL_DETAILS, HOTEL_ROOM_TYPES, DEFAULT_ROOM_TYPES } from '../../hotels/mock';
import { SEARCH_MOCK_HOTELS } from '../../search/mock';
import { calcNights, calcBookingCost } from '../../lib/booking';

// ── Helper ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

// `instant = false` opts this route out of instant-navigation validation in
// Next.js 16.4+ Cache Components mode. The confirmation page accesses
// `searchParams` (a dynamic data source) outside Suspense, so the route blocks
// on each navigation — this export tells Next.js that is intentional.
export const instant = false;

async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    ref?: string;
    hotelId?: string;
    roomId?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    total?: string;
  }>;
}) {
  const params = await searchParams;

  const ref = params.ref ?? 'HOS-00000';
  const hotelId = params.hotelId ?? '';
  const roomId = params.roomId ?? '';
  const checkIn = params.checkIn;
  const checkOut = params.checkOut;
  const guests = params.guests ?? '1';

  // ── Data lookup ──────────────────────────────────────────────────────────────

  const hotelName =
    HOTEL_DETAILS[hotelId]?.name ??
    SEARCH_MOCK_HOTELS.find(h => h.id === hotelId)?.name ??
    'Hotel';

  const rooms = HOTEL_ROOM_TYPES[hotelId] ?? DEFAULT_ROOM_TYPES;
  const room = rooms.find(r => r.id === roomId);
  const roomName = room?.name ?? 'Room';

  // ── Guard: room not found → render error state ────────────────────────────────

  if (!room) {
    return (
      <div style={{ background: 'var(--tp-bg)', minHeight: '100vh' }}>
        <TravelerNav />
        <main style={{ paddingTop: '64px' }}>
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-24 text-center">
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-hidden="true"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--tp-primary)' }}>
              Booking not found
            </h1>
            <p className="text-sm" style={{ color: 'var(--tp-secondary)' }}>
              We couldn&apos;t locate the booking details for this confirmation.
              Please check your booking reference or try again.
            </p>
            <Link
              href="/hotels"
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80"
              style={{ background: 'var(--tp-primary)' }}
            >
              Back to hotels
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Recompute total server-side (do not trust the URL param) ─────────────────

  const nights = calcNights(checkIn, checkOut);
  const { total } = calcBookingCost(room.pricePerNight, nights);

  return (
    <div style={{ background: 'var(--tp-bg)', minHeight: '100vh' }}>
      <TravelerNav />

      <main style={{ paddingTop: '64px' }}>
        <div
          className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-4 py-16"
        >
          {/* ── 1. Success header ── */}
          <div className="flex flex-col items-center text-center">
            {/* Green circle with checkmark */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'var(--tp-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h1
              className="mt-4 text-3xl font-bold"
              style={{ color: 'var(--tp-primary)' }}
            >
              Reservation confirmed
            </h1>
            <p className="mt-2 text-base" style={{ color: 'var(--tp-secondary)' }}>
              Your booking is confirmed. A confirmation has been sent to your email.
            </p>
          </div>

          {/* ── 2. Booking reference card ── */}
          <div
            className="w-full rounded-xl p-6 text-center"
            style={{
              background: 'var(--tp-surface)',
              border: '1px solid var(--tp-border)',
            }}
          >
            <p
              className="mb-2 text-xs uppercase tracking-wider"
              style={{ color: 'var(--tp-secondary)' }}
            >
              Booking reference
            </p>
            <p
              className="font-mono text-3xl font-bold"
              style={{ color: 'var(--tp-accent)' }}
            >
              {ref}
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--tp-secondary)' }}>
              Save this reference number for check-in
            </p>
          </div>

          {/* ── 3. Booking details card ── */}
          <div
            className="w-full rounded-xl p-6"
            style={{
              background: 'var(--tp-surface)',
              border: '1px solid var(--tp-border)',
            }}
          >
            <h2
              className="mb-4 text-base font-semibold"
              style={{ color: 'var(--tp-primary)' }}
            >
              Booking details
            </h2>

            <dl>
              {[
                { label: 'Hotel', value: hotelName, accent: false },
                { label: 'Room type', value: roomName, accent: false },
                { label: 'Check-in', value: formatDate(checkIn), accent: false },
                { label: 'Check-out', value: formatDate(checkOut), accent: false },
                {
                  label: 'Guests',
                  value: `${guests} guest${Number(guests) !== 1 ? 's' : ''}`,
                  accent: false,
                },
                {
                  label: 'Total paid',
                  value: total > 0 ? `₦${total.toLocaleString()}` : '—',
                  accent: true,
                },
              ].map(({ label, value, accent }, idx, arr) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between py-3"
                  style={{
                    borderBottom: idx < arr.length - 1 ? '1px solid var(--tp-border)' : 'none',
                  }}
                >
                  <dt className="text-sm" style={{ color: 'var(--tp-secondary)' }}>
                    {label}
                  </dt>
                  <dd
                    className="text-sm font-semibold"
                    style={{ color: accent ? 'var(--tp-accent)' : 'var(--tp-primary)' }}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ── 4. Action buttons ── */}
          <div className="grid w-full grid-cols-2 gap-3">
            {/* View booking */}
            <Link
              href="/bookings"
              className="flex items-center justify-center rounded-xl py-3 px-4 text-sm font-semibold text-white text-center transition-opacity hover:opacity-80"
              style={{ background: 'var(--tp-primary)' }}
            >
              View booking
            </Link>

            {/* Download receipt */}
            <a
              href="#"
              className="flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{
                border: '1px solid var(--tp-border)',
                color: 'var(--tp-primary)',
                background: 'var(--tp-surface)',
              }}
            >
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download receipt
            </a>

            {/* Add to calendar */}
            <a
              href="#"
              className="flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{
                border: '1px solid var(--tp-border)',
                color: 'var(--tp-primary)',
                background: 'var(--tp-surface)',
              }}
            >
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
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Add to calendar
            </a>

            {/* Contact hotel */}
            <Link
              href={`/hotels/${hotelId || ''}`}
              className="flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{
                border: '1px solid var(--tp-border)',
                color: 'var(--tp-primary)',
                background: 'var(--tp-surface)',
              }}
            >
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
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Contact hotel
            </Link>
          </div>

          {/* ── 5. Help link ── */}
          <p className="text-center text-sm" style={{ color: 'var(--tp-secondary)' }}>
            Need help?{' '}
            <Link
              href="/support"
              className="underline"
              style={{ color: 'var(--tp-accent)' }}
            >
              Contact our support team
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Page;
