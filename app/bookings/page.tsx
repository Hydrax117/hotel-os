'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { TravelerNav } from '../components/TravelerNav';
import { Footer } from '../components/Footer';
import { type BookingStatus, type TravelerBooking } from './mock';
import { useAuth } from '../lib/auth-context';
import { getMyBookings, cancelBooking, type BookingResponse } from '../lib/api/bookings';
import { ApiError } from '../lib/api/client';
import { calcNights } from '../lib/booking';

// ── Status mapping ────────────────────────────────────────────────────────────

function mapStatus(s: BookingResponse['status']): BookingStatus {
  switch (s) {
    case 'CHECKED_IN':                                      return 'checked-in';
    case 'CONFIRMED': case 'HELD':
    case 'PAYMENT_PENDING': case 'PENDING':                 return 'upcoming';
    case 'CHECKED_OUT':                                     return 'completed';
    case 'CANCELLED': case 'NO_SHOW': default:              return 'cancelled';
  }
}

function mapApiBooking(b: BookingResponse): TravelerBooking {
  return {
    id:           b.id,
    hotelId:      b.hotel?.id ?? b.hotelId,
    hotelName:    b.hotel?.name ?? 'Hotel',
    hotelCity:    b.hotel?.city ?? '',
    hotelState:   b.hotel?.state ?? '',
    roomName:     b.resource?.name ?? b.roomType?.name ?? 'Resource',
    roomId:       b.resourceId ?? b.roomTypeId ?? '',
    checkIn:      b.checkIn,
    checkOut:     b.checkOut,
    nights:       calcNights(b.checkIn, b.checkOut),
    guests:       b.guests,
    totalNgn:     Number(b.totalNgn),
    status:       mapStatus(b.status),
    createdAt:    b.createdAt,
    specialRequests: b.specialRequests,
    hasReview:    (b as BookingResponse & { hasReview?: boolean }).hasReview ?? false,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

function fmtNgn(n: number): string {
  return '\u20A6' + Number(n).toLocaleString('en-NG');
}

// Deterministic warm gradient for hotels with no image
const HOTEL_GRADIENTS = [
  ['#c9a96e','#8b5e3c'],
  ['#7c9b6e','#3d6b4f'],
  ['#9b8b6e','#6b5035'],
  ['#6e8b9b','#3d5f6b'],
];
function hotelGradient(id: string): string {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const [a, b] = HOTEL_GRADIENTS[h % HOTEL_GRADIENTS.length];
  return `linear-gradient(140deg, ${a} 0%, ${b} 100%)`;
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { bg: string; color: string; dot?: string; label: string }> = {
  'checked-in': { bg: '#dcfce7', color: '#15803d', dot: '#16a34a', label: 'Checked in'  },
  upcoming:     { bg: '#dbeafe', color: '#1d4ed8',                  label: 'Upcoming'    },
  completed:    { bg: 'var(--color-muted)', color: 'var(--color-text-secondary)', label: 'Completed' },
  cancelled:    { bg: '#fee2e2', color: '#dc2626',                  label: 'Cancelled'   },
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: c.bg, color: c.color,
        fontSize: 12, fontWeight: 600,
        padding: '3px 10px', borderRadius: 999,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      {c.dot && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} aria-hidden="true" />
      )}
      {c.label}
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="skeleton"
      style={{ height: 160, borderRadius: 'var(--radius-lg)', marginBottom: 12 }}
      aria-hidden="true"
    />
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

const EMPTY_COPY: Record<BookingStatus | 'all', { heading: string; body: string; cta: boolean }> = {
  all:          { heading: 'No bookings yet',           body: 'Your confirmed reservations will appear here.',                           cta: true  },
  upcoming:     { heading: 'No upcoming stays',         body: 'Once you book a hotel, your upcoming reservations will appear here.',     cta: true  },
  'checked-in': { heading: 'Not currently checked in',  body: 'Active stays will show here when you are at the hotel.',                  cta: false },
  completed:    { heading: 'No completed stays yet',    body: 'Past stays will appear here after check-out.',                           cta: false },
  cancelled:    { heading: 'No cancelled bookings',     body: 'Cancelled reservations will appear here if you ever cancel a booking.',  cta: false },
};

function EmptyState({ tab }: { tab: BookingStatus | 'all' }) {
  const e = EMPTY_COPY[tab];
  return (
    <div
      style={{
        padding: '72px 24px',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}
    >
      <div
        style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--color-brand-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-hidden="true"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div>
        <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>
          {e.heading}
        </p>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0, maxWidth: 320 }}>
          {e.body}
        </p>
      </div>
      {e.cta && (
        <Link
          href="/search"
          style={{
            display: 'inline-block',
            background: 'var(--color-brand)', color: '#fff',
            padding: '10px 24px', borderRadius: 'var(--radius-md)',
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}
        >
          Explore hotels
        </Link>
      )}
    </div>
  );
}

// ── Booking card ──────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  onCancel,
  cancellingId,
}: {
  booking: TravelerBooking;
  onCancel: (id: string) => Promise<void>;
  cancellingId: string | null;
}) {
  const isCancelling = cancellingId === booking.id;
  const detailsHref = `/bookings/${booking.id}`;
  const isCheckedIn  = booking.status === 'checked-in';
  const isUpcoming   = booking.status === 'upcoming';
  const isCompleted  = booking.status === 'completed';
  const isCancelled  = booking.status === 'cancelled';

  return (
    <article
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      {/* Property image */}
      <Link
        href={detailsHref}
        aria-hidden="true"
        tabIndex={-1}
        className="relative shrink-0 overflow-hidden"
        style={{
          width: 'clamp(120px, 20vw, 200px)',
          minHeight: 160,
          display: 'block',
        }}
      >
        <div
          style={{
            position: 'absolute', inset: 0,
            background: hotelGradient(booking.hotelId),
          }}
        />
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)',
          }}
        />
        <span
          style={{
            position: 'absolute', bottom: 12, left: 14,
            fontFamily: 'var(--font-serif)',
            fontWeight: 300, fontSize: '3rem', lineHeight: 1,
            color: 'rgba(255,255,255,0.22)',
            userSelect: 'none',
          }}
          aria-hidden="true"
        >
          {booking.hotelName.charAt(0)}
        </span>
      </Link>

      {/* Content */}
      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>

        {/* Row 1: name + badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <Link href={detailsHref} style={{ textDecoration: 'none', minWidth: 0 }}>
            <h2
              style={{
                fontSize: 16, fontWeight: 600,
                color: 'var(--color-text-primary)',
                margin: 0, lineHeight: 1.3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {booking.hotelName}
            </h2>
          </Link>
          <StatusBadge status={booking.status} />
        </div>

        {/* Row 2: meta row — room · location · dates · guests */}
        <div
          style={{
            display: 'flex', flexWrap: 'wrap',
            gap: '6px 20px', fontSize: 13,
            color: 'var(--color-text-secondary)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 9V19M22 9V19M2 19H22M2 9H22M2 9C2 6.8 3.8 5 6 5H18C20.2 5 22 6.8 22 9"/>
              <rect x="6" y="9" width="12" height="5" rx="1" fill="currentColor" fillOpacity=".12"/>
            </svg>
            {booking.roomName}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {booking.hotelCity}{booking.hotelState ? `, ${booking.hotelState}` : ''}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {fmtDate(booking.checkIn)} &rarr; {fmtDate(booking.checkOut)}
            <span
              style={{
                background: 'var(--color-muted)',
                borderRadius: 999, padding: '1px 7px',
                fontSize: 11, fontWeight: 500,
              }}
            >
              {booking.nights} night{booking.nights !== 1 ? 's' : ''}
            </span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>
            </svg>
            {booking.guests} guest{booking.guests !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Row 3: amount + actions */}
        <div
          style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            marginTop: 'auto', paddingTop: 12,
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {fmtNgn(booking.totalNgn)}
            </span>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 4 }}>total</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>

            {/* Checked-in actions */}
            {isCheckedIn && (
              <>
                <Link
                  href={`/room-service?bookingId=${booking.id}&hotelId=${booking.hotelId}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'var(--color-brand)', color: '#fff',
                    padding: '8px 16px', borderRadius: 'var(--radius-md)',
                    fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                    <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                  </svg>
                  Room service
                </Link>
                <Link
                  href={`/bookings/${booking.id}/extend`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    border: '1px solid var(--color-brand)', color: 'var(--color-brand)',
                    background: 'transparent',
                    padding: '7px 14px', borderRadius: 'var(--radius-md)',
                    fontSize: 13, fontWeight: 500, textDecoration: 'none',
                  }}
                >
                  Extend stay
                </Link>
                <Link
                  href={detailsHref}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    border: '1px solid var(--color-border)', color: 'var(--color-text-primary)',
                    background: 'transparent',
                    padding: '7px 14px', borderRadius: 'var(--radius-md)',
                    fontSize: 13, fontWeight: 500, textDecoration: 'none',
                  }}
                >
                  Details
                </Link>
              </>
            )}

            {/* Upcoming actions */}
            {isUpcoming && (
              <>
                <Link
                  href={detailsHref}
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    border: '1px solid var(--color-border)', color: 'var(--color-text-primary)',
                    background: 'transparent',
                    padding: '7px 14px', borderRadius: 'var(--radius-md)',
                    fontSize: 13, fontWeight: 500, textDecoration: 'none',
                  }}
                >
                  View details
                </Link>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => void onCancel(booking.id)}
                  style={{
                    background: 'transparent', border: 'none',
                    color: isCancelling ? 'var(--color-text-secondary)' : '#dc2626',
                    fontSize: 13, fontWeight: 500,
                    cursor: isCancelling ? 'not-allowed' : 'pointer',
                    opacity: isCancelling ? 0.55 : 1,
                    padding: '7px 4px',
                  }}
                >
                  {isCancelling ? 'Cancelling…' : 'Cancel'}
                </button>
              </>
            )}

            {/* Completed actions */}
            {isCompleted && (
              <>
                <Link
                  href={detailsHref}
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    border: '1px solid var(--color-border)', color: 'var(--color-text-primary)',
                    background: 'transparent',
                    padding: '7px 14px', borderRadius: 'var(--radius-md)',
                    fontSize: 13, fontWeight: 500, textDecoration: 'none',
                  }}
                >
                  View details
                </Link>
                {!booking.hasReview ? (
                  <Link
                    href={`/reviews/new?hotelId=${booking.hotelId}&bookingId=${booking.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      border: '1px solid var(--color-brand)', color: 'var(--color-brand)',
                      background: 'transparent',
                      padding: '7px 14px', borderRadius: 'var(--radius-md)',
                      fontSize: 13, fontWeight: 500, textDecoration: 'none',
                    }}
                  >
                    Leave a review
                  </Link>
                ) : (
                  <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Reviewed
                  </span>
                )}
              </>
            )}

            {/* Cancelled */}
            {isCancelled && (
              <Link
                href={detailsHref}
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)',
                  background: 'transparent',
                  padding: '7px 14px', borderRadius: 'var(--radius-md)',
                  fontSize: 13, fontWeight: 500, textDecoration: 'none',
                }}
              >
                View details
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Review banner ─────────────────────────────────────────────────────────────

function ReviewedBanner() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(true);
  if (!searchParams.get('reviewed') || !visible) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        background: '#f0fdf4', border: '1px solid #bbf7d0',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px', marginBottom: 24,
        fontSize: 14, fontWeight: 500, color: '#15803d',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Your review has been submitted. Thank you!
      </span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d', lineHeight: 1, padding: 2 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type TabKey = BookingStatus | 'all';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',         label: 'All'             },
  { key: 'upcoming',    label: 'Upcoming'        },
  { key: 'checked-in',  label: 'Staying now'     },
  { key: 'completed',   label: 'Completed'       },
  { key: 'cancelled',   label: 'Cancelled'       },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab]       = useState<TabKey>('all');
  const [bookings, setBookings]         = useState<TravelerBooking[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/signin?redirect=/bookings');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getMyBookings()
      .then(raw => setBookings(raw.map(mapApiBooking)))
      .catch(err => setFetchError(err instanceof ApiError ? err.message : 'Failed to load bookings.'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleCancel = useCallback(async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' as BookingStatus } : b));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  }, []);

  // Counts per tab
  const counts: Record<TabKey, number> = {
    all:          bookings.length,
    upcoming:     bookings.filter(b => b.status === 'upcoming').length,
    'checked-in': bookings.filter(b => b.status === 'checked-in').length,
    completed:    bookings.filter(b => b.status === 'completed').length,
    cancelled:    bookings.filter(b => b.status === 'cancelled').length,
  };

  // Stats — from real data
  const totalNights = bookings
    .filter(b => b.status === 'completed' || b.status === 'checked-in')
    .reduce((s, b) => s + b.nights, 0);

  // "Total value" = all non-cancelled bookings (booked amount, not just paid)
  const totalValue = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((s, b) => s + b.totalNgn, 0);

  const filtered = activeTab === 'all'
    ? bookings
    : bookings.filter(b => b.status === activeTab);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <TravelerNav />
      <div style={{ paddingTop: 'var(--nav-height)' }} />

      <main>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 80px' }}>

          <Suspense fallback={null}>
            <ReviewedBanner />
          </Suspense>

          {/* Page header */}
          <header style={{ marginBottom: 36 }}>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 400,
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                lineHeight: 1.1,
                color: 'var(--color-text-primary)',
                margin: '0 0 10px',
              }}
            >
              Your stays, all in one place.
            </h1>
            <p style={{ fontSize: 15, color: 'var(--color-text-secondary)', margin: 0, maxWidth: 480 }}>
              Manage reservations, discover upcoming stays and revisit your travel history.
            </p>
          </header>

          {/* Stats strip */}
          {!loading && bookings.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1,
                background: 'var(--color-border)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                marginBottom: 32,
              }}
            >
              {[
                { label: 'Total bookings',   value: String(bookings.length)   },
                { label: 'Nights booked',    value: String(totalNights)       },
                { label: 'Total value',      value: fmtNgn(totalValue)        },
              ].map(stat => (
                <div
                  key={stat.label}
                  style={{
                    background: 'var(--color-surface)',
                    padding: '20px 24px',
                  }}
                >
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>
                    {stat.label}
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {fetchError && !loading && (
            <div
              style={{
                background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)',
                borderRadius: 'var(--radius-md)', padding: '12px 16px',
                fontSize: 14, marginBottom: 24,
              }}
            >
              {fetchError}
            </div>
          )}

          {/* Filter tabs */}
          <div
            style={{
              display: 'flex', gap: 2,
              borderBottom: '1px solid var(--color-border)',
              marginBottom: 28,
              overflowX: 'auto',
            }}
          >
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              const count = counts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 14px',
                    background: 'none', border: 'none',
                    borderBottom: isActive
                      ? '2px solid var(--color-brand)'
                      : '2px solid transparent',
                    color: isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s',
                    marginBottom: -1,
                  }}
                  aria-selected={isActive}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      style={{
                        background: isActive ? 'var(--color-brand-light)' : 'var(--color-muted)',
                        color: isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                        borderRadius: 999, padding: '1px 7px',
                        fontSize: 11, fontWeight: 600,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Booking list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              [0,1,2].map(i => <SkeletonCard key={i} />)
            ) : filtered.length === 0 ? (
              <div
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <EmptyState tab={activeTab} />
              </div>
            ) : (
              filtered.map(b => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  onCancel={handleCancel}
                  cancellingId={cancellingId}
                />
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
