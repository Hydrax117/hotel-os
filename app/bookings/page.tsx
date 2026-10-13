'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { TravelerNav } from '../components/TravelerNav';
import { Footer } from '../components/Footer';
import { TravelerBooking, BookingStatus } from './mock';
import { useAuth } from '../lib/auth-context';
import { getMyBookings, cancelBooking, type BookingResponse } from '../lib/api/bookings';
import { ApiError } from '../lib/api/client';
import { calcNights } from '../lib/booking';

// ── Status mapping ────────────────────────────────────────────────────────────

function mapStatus(apiStatus: BookingResponse['status']): BookingStatus {
  switch (apiStatus) {
    case 'CONFIRMED':
    case 'HELD':
    case 'PAYMENT_PENDING':
    case 'CHECKED_IN':
    case 'PENDING':
      return 'upcoming';
    case 'CHECKED_OUT':
      return 'completed';
    case 'CANCELLED':
    case 'NO_SHOW':
      return 'cancelled';
  }
}

// ── API → UI mapping ──────────────────────────────────────────────────────────

function mapApiBooking(b: BookingResponse): TravelerBooking {
  return {
    id: b.id,
    hotelId: b.hotel?.id ?? b.hotelId,
    hotelName: b.hotel?.name ?? 'Hotel',
    hotelCity: b.hotel?.city ?? '—',
    hotelState: b.hotel?.state ?? '—',
    roomName: b.room?.name ?? 'Room',
    roomId: b.roomId,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    nights: calcNights(b.checkIn, b.checkOut),
    guests: b.guests,
    totalNgn: b.totalAmount,
    status: mapStatus(b.status),
    createdAt: b.createdAt,
    specialRequests: b.specialRequests,
  };
}

// ── Gradient helper ───────────────────────────────────────────────────────────

const GRADIENTS = [
  'linear-gradient(135deg, #c9a96e 0%, #8b5e3c 100%)',
  'linear-gradient(135deg, #7c9b6e 0%, #3d6b4f 100%)',
  'linear-gradient(135deg, #6e7fa3 0%, #3d4f6b 100%)',
  'linear-gradient(135deg, #9b6e7c 0%, #6b3d4f 100%)',
];

function hotelGradient(hotelId: string): string {
  const hash = hotelId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

// ── Date & currency helpers ───────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

function fmtNgn(amount: number): string {
  return '\u20A6' + amount.toLocaleString('en-NG');
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, { background: string; color: string; label: string }> = {
    upcoming:  { background: '#dbeafe', color: '#1d4ed8', label: 'Upcoming' },
    completed: { background: '#dcfce7', color: '#15803d', label: 'Completed' },
    cancelled: { background: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
  };
  const s = styles[status];
  return (
    <span
      style={{
        background: s.background,
        color: s.color,
        fontSize: '12px',
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: '999px',
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function IconBed({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M2 9V19" />
      <path d="M22 9V19" />
      <path d="M2 19H22" />
      <path d="M2 9H22" />
      <path d="M2 9C2 6.8 3.8 5 6 5H18C20.2 5 22 6.8 22 9" />
      <rect x="6" y="9" width="12" height="5" rx="1" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

function IconMapPin({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M12 2C8.7 2 6 4.7 6 8c0 5.2 6 13 6 13s6-7.8 6-13c0-3.3-2.7-6-6-6z" />
      <circle cx="12" cy="8" r="2" />
    </svg>
  );
}

function IconCalendar({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconPerson({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
    </svg>
  );
}

// ── Booking card ──────────────────────────────────────────────────────────────

type BookingCardProps = {
  booking: TravelerBooking;
  onCancel: (id: string) => Promise<void>;
  cancellingId: string | null;
};

function BookingCard({ booking, onCancel, cancellingId }: BookingCardProps) {
  const detailsHref = `/booking/confirmation?ref=${booking.id}&hotelName=${encodeURIComponent(booking.hotelName)}&roomName=${encodeURIComponent(booking.roomName)}&checkIn=${booking.checkIn}&checkOut=${booking.checkOut}&guests=${booking.guests}&total=${booking.totalNgn}`;
  const isCancelling = cancellingId === booking.id;

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--tp-border)',
        borderRadius: '14px',
        overflow: 'hidden',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="md:flex-row md:flex"
    >
      {/* Image placeholder */}
      <div
        style={{
          background: hotelGradient(booking.hotelId),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        className="booking-card-img"
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 700,
            color: 'white',
          }}
          aria-hidden="true"
        >
          {booking.hotelName.charAt(0)}
        </div>
      </div>

      {/* Card content */}
      <div
        style={{
          padding: '20px',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Row 1: Hotel name + status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--tp-primary)' }}>
            {booking.hotelName}
          </span>
          <StatusBadge status={booking.status} />
        </div>

        {/* Row 2: Room name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--tp-secondary)' }}>
          <IconBed size={16} />
          <span style={{ fontSize: '14px' }}>{booking.roomName}</span>
        </div>

        {/* Row 3: Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--tp-secondary)' }}>
          <IconMapPin size={16} />
          <span style={{ fontSize: '14px' }}>{booking.hotelCity}, {booking.hotelState}</span>
        </div>

        {/* Row 4: Dates */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', color: 'var(--tp-secondary)' }}>
          <IconCalendar size={16} />
          <span style={{ fontSize: '14px' }}>
            {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)}
          </span>
          <span
            style={{
              background: 'var(--tp-muted)',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '12px',
              color: 'var(--tp-secondary)',
            }}
          >
            {booking.nights} night{booking.nights !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Row 5: Guests */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--tp-secondary)' }}>
          <IconPerson size={16} />
          <span style={{ fontSize: '14px' }}>
            {booking.guests} guest{booking.guests !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Row 6: Price + actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '4px',
          }}
        >
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--tp-primary)' }}>
            {fmtNgn(booking.totalNgn)}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {booking.status === 'upcoming' && (
              <>
                <Link
                  href={detailsHref}
                  style={{
                    border: '1px solid var(--tp-border)',
                    background: 'transparent',
                    color: 'var(--tp-primary)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  View details
                </Link>
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isCancelling ? 'var(--tp-secondary)' : '#dc2626',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: isCancelling ? 'not-allowed' : 'pointer',
                    opacity: isCancelling ? 0.6 : 1,
                  }}
                  type="button"
                  disabled={isCancelling}
                  onClick={() => { void onCancel(booking.id); }}
                >
                  {isCancelling ? 'Cancelling…' : 'Cancel booking'}
                </button>
              </>
            )}

            {booking.status === 'completed' && (
              <>
                <Link
                  href={detailsHref}
                  style={{
                    border: '1px solid var(--tp-border)',
                    background: 'transparent',
                    color: 'var(--tp-primary)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  View details
                </Link>
                <Link
                  href={`/reviews/new?hotelId=${booking.hotelId}&bookingId=${booking.id}`}
                  style={{
                    border: '1px solid var(--tp-accent)',
                    color: 'var(--tp-accent)',
                    background: 'transparent',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  Leave a review
                </Link>
              </>
            )}

            {booking.status === 'cancelled' && (
              <Link
                href={detailsHref}
                style={{
                  border: '1px solid var(--tp-border)',
                  background: 'transparent',
                  color: 'var(--tp-secondary)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                View details
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Inline style for responsive image placeholder */}
      <style>{`
        .booking-card-img {
          height: 120px;
          width: 100%;
        }
        @media (min-width: 768px) {
          .booking-card-img {
            height: auto;
            width: 180px;
          }
        }
      `}</style>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

const EMPTY_MESSAGES: Record<BookingStatus, string> = {
  upcoming: 'You have no upcoming reservations. Start exploring hotels and plan your next stay.',
  completed: 'You have no completed stays yet. Your past reservations will appear here.',
  cancelled: 'You have no cancelled bookings.',
};

function EmptyState({ status }: { status: BookingStatus }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '96px',
          height: '96px',
          background: 'var(--tp-muted)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--tp-secondary)',
        }}
      >
        <IconCalendar size={40} />
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--tp-primary)', margin: 0 }}>
        No {status} bookings
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--tp-secondary)', margin: 0, maxWidth: '360px' }}>
        {EMPTY_MESSAGES[status]}
      </p>
      {status === 'upcoming' && (
        <Link
          href="/search"
          style={{
            background: 'var(--tp-accent)',
            color: 'white',
            padding: '10px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Explore hotels
        </Link>
      )}
    </div>
  );
}

// ── Reviewed toast banner ─────────────────────────────────────────────────────

function ReviewedBanner() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(true);
  const reviewed = searchParams.get('reviewed');

  if (!reviewed || !visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: '#dcfce7',
        border: '1px solid #86efac',
        borderRadius: '10px',
        padding: '14px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '14px', fontWeight: 500, color: '#15803d', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Your review has been submitted. Thank you!
      </span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss notification"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#15803d', padding: '4px', lineHeight: 1 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS: { status: BookingStatus; label: string }[] = [
  { status: 'upcoming',  label: 'Upcoming' },
  { status: 'completed', label: 'Completed' },
  { status: 'cancelled', label: 'Cancelled' },
];

export default function BookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<BookingStatus>('upcoming');
  const [bookings, setBookings] = useState<TravelerBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?redirect=/bookings');
    }
  }, [authLoading, user, router]);

  // Fetch bookings once user is known
  useEffect(() => {
    if (!user) return;
    setLoadingBookings(true);
    getMyBookings()
      .then(raw => setBookings(raw.map(mapApiBooking)))
      .catch(err => {
        const msg = err instanceof ApiError ? err.message : 'Failed to load bookings.';
        setFetchError(msg);
      })
      .finally(() => setLoadingBookings(false));
  }, [user]);

  // Cancel handler
  const handleCancelBooking = useCallback(async (bookingId: string): Promise<void> => {
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      setBookings(prev =>
        prev.map(b =>
          b.id === bookingId ? { ...b, status: 'cancelled' as BookingStatus } : b
        )
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to cancel booking.';
      alert(msg);
    } finally {
      setCancellingId(null);
    }
  }, []);

  const counts = {
    upcoming:  bookings.filter(b => b.status === 'upcoming').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  const nightsStayed = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.nights, 0);

  const totalSpent = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.totalNgn, 0);

  const filtered = bookings.filter(b => b.status === activeTab);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tp-bg)' }}>
      <TravelerNav />

      {/* Spacer for fixed nav */}
      <div style={{ paddingTop: '64px' }} />

      <main>
        <div
          style={{ maxWidth: '64rem', margin: '0 auto', padding: '40px 16px' }}
          className="md:px-6"
        >
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: '16px' }}>
            <ol
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                fontSize: '14px',
                color: 'var(--tp-secondary)',
              }}
            >
              <li>
                <Link href="/" style={{ color: 'var(--tp-secondary)', textDecoration: 'none' }}>
                  Home
                </Link>
              </li>
              <li aria-hidden="true" style={{ userSelect: 'none' }}>/</li>
              <li style={{ color: 'var(--tp-primary)', fontWeight: 500 }}>My Bookings</li>
            </ol>
          </nav>

          {/* Reviewed toast banner */}
          <Suspense fallback={null}>
            <ReviewedBanner />
          </Suspense>

          {/* Heading */}
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--tp-primary)',
              margin: '0 0 8px',
            }}
          >
            My Bookings
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--tp-secondary)', margin: '0 0 24px' }}>
            Manage your upcoming and past reservations.
          </p>

          {/* Summary strip (desktop only) */}
          <div
            style={{ gap: '16px', marginBottom: '24px' }}
            className="hidden md:flex"
          >
            {[
              { label: 'Total Bookings', value: String(bookings.length) },
              { label: 'Nights Stayed', value: String(nightsStayed) },
              { label: 'Total Spent', value: fmtNgn(totalSpent) },
            ].map(chip => (
              <div
                key={chip.label}
                style={{
                  background: 'var(--tp-surface)',
                  border: '1px solid var(--tp-border)',
                  borderRadius: '12px',
                  padding: '16px 24px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--tp-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '4px',
                  }}
                >
                  {chip.label}
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--tp-primary)' }}>
                  {chip.value}
                </div>
              </div>
            ))}
          </div>

          {/* Error banner */}
          {fetchError && !loadingBookings && (
            <div
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                borderRadius: '10px',
                padding: '14px 20px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              {fetchError}
            </div>
          )}

          {/* Tab bar */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '8px',
              marginBottom: '24px',
              borderBottom: '1px solid var(--tp-border)',
            }}
          >
            {TABS.map(tab => {
              const isActive = activeTab === tab.status;
              return (
                <button
                  key={tab.status}
                  onClick={() => setActiveTab(tab.status)}
                  type="button"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px 8px 0 0',
                    fontSize: '14px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive ? 'var(--tp-primary)' : 'transparent',
                    color: isActive ? 'white' : 'var(--tp-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background 0.15s',
                  }}
                >
                  {tab.label}
                  <span
                    style={{
                      background: isActive ? 'rgba(0,0,0,0.15)' : 'var(--tp-muted)',
                      color: 'inherit',
                      padding: '1px 7px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      marginLeft: '6px',
                    }}
                  >
                    {counts[tab.status]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Booking list */}
          <div>
            {loadingBookings ? (
              <div>
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    style={{
                      height: 120,
                      background: 'var(--tp-muted)',
                      borderRadius: '14px',
                      marginBottom: '16px',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState status={activeTab} />
            ) : (
              filtered.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={handleCancelBooking}
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
