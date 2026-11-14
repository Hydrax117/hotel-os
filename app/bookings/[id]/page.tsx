'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { TravelerNav } from '../../components/TravelerNav';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../lib/auth-context';
import {
  getBookingById,
  cancelBooking,
  type BookingResponse,
  type ApiBookingStatus,
} from '../../lib/api/bookings';
import { getMyOrders, type ServiceOrder } from '../../lib/api/room-service';
import { ApiError } from '../../lib/api/client';
import { calcNights } from '../../lib/booking';

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

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const GRADIENTS = [
  ['#c9a96e','#7c5c3a'],
  ['#7c9b6e','#3d6b4f'],
  ['#9b8b6e','#6b5035'],
  ['#6e8b9b','#3d5f6b'],
];
function hotelGradient(id: string): string {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const [a, b] = GRADIENTS[h % GRADIENTS.length];
  return `linear-gradient(140deg, ${a} 0%, ${b} 100%)`;
}

// ── Status helpers ────────────────────────────────────────────────────────────

type UiStatus = 'upcoming' | 'checked-in' | 'completed' | 'cancelled';

function toUiStatus(s: ApiBookingStatus): UiStatus {
  switch (s) {
    case 'CHECKED_IN':                                      return 'checked-in';
    case 'CONFIRMED': case 'HELD':
    case 'PAYMENT_PENDING': case 'PENDING':                return 'upcoming';
    case 'CHECKED_OUT':                                    return 'completed';
    case 'CANCELLED': case 'NO_SHOW': default:             return 'cancelled';
  }
}

const STATUS_LABEL: Record<UiStatus, string> = {
  'checked-in': 'Checked in',
  upcoming:     'Upcoming',
  completed:    'Completed',
  cancelled:    'Cancelled',
};

const STATUS_STYLE: Record<UiStatus, { bg: string; color: string; dot?: string }> = {
  'checked-in': { bg: '#dcfce7', color: '#15803d', dot: '#16a34a' },
  upcoming:     { bg: '#dbeafe', color: '#1d4ed8' },
  completed:    { bg: 'var(--color-muted)', color: 'var(--color-text-secondary)' },
  cancelled:    { bg: '#fee2e2', color: '#dc2626' },
};

function StatusBadge({ status }: { status: UiStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, color: s.color,
      fontSize: 12, fontWeight: 600,
      padding: '4px 12px', borderRadius: 999, whiteSpace: 'nowrap',
    }}>
      {s.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} aria-hidden="true" />}
      {STATUS_LABEL[status]}
    </span>
  );
}

// ── Stay progress bar ─────────────────────────────────────────────────────────

function StayProgress({ checkIn, checkOut }: { checkIn: string; checkOut: string }) {
  const start = new Date(checkIn + 'T00:00:00').getTime();
  const end   = new Date(checkOut + 'T00:00:00').getTime();
  const now   = Date.now();
  const pct   = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
  const nightsLeft = Math.max(0, Math.ceil((end - now) / 86400000));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
        <span>Check-in · {fmtDate(checkIn)}</span>
        <span>{nightsLeft > 0 ? `${nightsLeft} night${nightsLeft !== 1 ? 's' : ''} remaining` : 'Checking out today'}</span>
        <span>Check-out · {fmtDate(checkOut)}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 999, background: '#fff', width: `${pct}%`, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      <h2 style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: 'var(--color-text-secondary)',
        padding: '12px 20px', margin: 0,
        borderBottom: '1px solid var(--color-border)',
      }}>
        {title}
      </h2>
      <div style={{ padding: '4px 20px 16px' }}>
        {children}
      </div>
    </section>
  );
}

function Row({ label, value, accent, last }: { label: string; value: React.ReactNode; accent?: boolean; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline',
      justifyContent: 'space-between', gap: 16,
      padding: '10px 0',
      borderBottom: last ? 'none' : '1px solid var(--color-border)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 500, textAlign: 'right',
        color: accent ? 'var(--color-brand)' : 'var(--color-text-primary)',
      }}>
        {value}
      </span>
    </div>
  );
}

// ── Order status colours ──────────────────────────────────────────────────────

const ORDER_STATUS: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: '#fef9c3', color: '#92400e' },
  CONFIRMED: { bg: '#dbeafe', color: '#1d4ed8' },
  PREPARING: { bg: '#fef3c7', color: '#d97706' },
  DELIVERED: { bg: '#dcfce7', color: '#15803d' },
  CANCELLED: { bg: '#fee2e2', color: '#b91c1c' },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonShell() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div style={{ height: 'var(--nav-height)', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }} />
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inner page (uses dynamic hooks — must be inside Suspense) ─────────────────

function BookingDetailInner() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [booking, setBooking]       = useState<BookingResponse | null>(null);
  const [orders, setOrders]         = useState<ServiceOrder[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/auth/signin?redirect=/bookings/${id}`);
  }, [authLoading, user, router, id]);

  const load = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    setError('');
    try {
      const b = await getBookingById(id);
      setBooking(b);
      try {
        const o = await getMyOrders(id);
        setOrders(o.filter(x => x.status !== 'CANCELLED'));
      } catch { /* orders panel is non-critical */ }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load booking.');
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => { void load(); }, [load]);

  const handleCancel = async () => {
    if (!booking || !confirm('Cancel this booking? This cannot be undone.')) return;
    setCancelling(true);
    try {
      await cancelBooking(booking.id);
      setBooking(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  // Derived
  const uiStatus      = booking ? toUiStatus(booking.status) : 'upcoming';
  const nights        = booking ? calcNights(booking.checkIn, booking.checkOut) : 0;
  const subtotal      = booking?.subtotalNgn ?? (booking ? Number(booking.totalNgn) - (booking.serviceFeeNgn ?? 0) : 0);
  const fee           = booking?.serviceFeeNgn ?? 0;
  const total         = booking ? Number(booking.totalNgn) : 0;
  const pricePerNight = booking?.roomType?.pricePerNight ?? (nights > 0 ? subtotal / nights : 0);
  const isCheckedIn   = uiStatus === 'checked-in';
  const isUpcoming    = uiStatus === 'upcoming';
  const isCompleted   = uiStatus === 'completed';

  // Loading
  if (authLoading || (loading && !booking)) return <SkeletonShell />;

  // Error / not found
  if (error || !booking) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <TravelerNav />
        <div style={{ paddingTop: 'var(--nav-height)' }} />
        <main style={{ maxWidth: 480, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
            {error || 'Booking not found.'}
          </p>
          <Link href="/bookings" style={{
            display: 'inline-block', background: 'var(--color-brand)', color: '#fff',
            padding: '10px 24px', borderRadius: 'var(--radius-md)',
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}>
            Back to My Bookings
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <TravelerNav />
      <div style={{ paddingTop: 'var(--nav-height)' }} />

      <main style={{ maxWidth: 820, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: 28 }}>
          <ol style={{
            display: 'flex', alignItems: 'center', gap: 8,
            listStyle: 'none', margin: 0, padding: 0,
            fontSize: 13, color: 'var(--color-text-secondary)',
          }}>
            <li><Link href="/bookings" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>My Bookings</Link></li>
            <li aria-hidden="true">/</li>
            <li style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
              {booking.reference ?? booking.id.slice(0, 10)}
            </li>
          </ol>
        </nav>

        {/* Hero card */}
        <div style={{
          position: 'relative', borderRadius: 'var(--radius-lg)',
          overflow: 'hidden', marginBottom: 20,
          background: hotelGradient(booking.hotelId), minHeight: 200,
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 60%)',
          }} />
          <span style={{
            position: 'absolute', top: 20, right: 24,
            fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: '8rem', lineHeight: 1,
            color: 'rgba(255,255,255,0.1)', userSelect: 'none',
          }} aria-hidden="true">
            {(booking.hotel?.name ?? 'H').charAt(0)}
          </span>
          <div style={{ position: 'relative', padding: '32px 28px 24px' }}>
            <div style={{ marginBottom: 14 }}>
              <StatusBadge status={uiStatus} />
            </div>
            <h1 style={{
              fontFamily: 'var(--font-serif)', fontWeight: 400,
              fontSize: 'clamp(1.4rem, 3vw, 2rem)', lineHeight: 1.1,
              color: '#fff', margin: '0 0 6px',
            }}>
              {booking.hotel?.name ?? 'Hotel'}
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', margin: '0 0 20px' }}>
              {booking.hotel?.city}{booking.hotel?.state ? `, ${booking.hotel.state}` : ''}
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 'var(--radius-md)', padding: '8px 14px',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
                Reference
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '0.03em' }}>
                {booking.reference ?? booking.id.slice(0, 10)}
              </span>
            </div>
          </div>
          {isCheckedIn && (
            <div style={{ position: 'relative', padding: '0 28px 24px' }}>
              <StayProgress checkIn={booking.checkIn} checkOut={booking.checkOut} />
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 16, alignItems: 'start' }} className="bk-detail-grid">

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Quick actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {isCheckedIn && (
                <>
                  <Link
                    href={`/room-service?bookingId=${booking.id}&hotelId=${booking.hotelId}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      background: 'var(--color-brand)', color: '#fff',
                      padding: '10px 20px', borderRadius: 'var(--radius-md)',
                      fontSize: 14, fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                      <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                    </svg>
                    Order room service
                  </Link>
                  <Link
                    href={`/bookings/${booking.id}/extend`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      border: '1px solid var(--color-brand)', color: 'var(--color-brand)',
                      background: 'transparent', padding: '9px 18px', borderRadius: 'var(--radius-md)',
                      fontSize: 14, fontWeight: 500, textDecoration: 'none',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/>
                    </svg>
                    Extend stay
                  </Link>
                </>
              )}
              {isUpcoming && (
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => void handleCancel()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'transparent', border: '1px solid var(--color-danger-text)',
                    color: 'var(--color-danger-text)', padding: '9px 18px',
                    borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500,
                    cursor: cancelling ? 'not-allowed' : 'pointer',
                    opacity: cancelling ? 0.55 : 1,
                  }}
                >
                  {cancelling ? 'Cancelling…' : 'Cancel booking'}
                </button>
              )}
              {isCompleted && !booking.hasReview && (
                <Link
                  href={`/reviews/new?hotelId=${booking.hotelId}&bookingId=${booking.id}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    border: '1px solid var(--color-brand)', color: 'var(--color-brand)',
                    background: 'transparent', padding: '9px 18px', borderRadius: 'var(--radius-md)',
                    fontSize: 14, fontWeight: 500, textDecoration: 'none',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  Leave a review
                </Link>
              )}
              {isCompleted && booking.hasReview && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#16a34a', fontWeight: 500 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  Review submitted
                </span>
              )}
              <Link
                href={`/hotels/${booking.hotelId}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)',
                  background: 'transparent', padding: '9px 18px', borderRadius: 'var(--radius-md)',
                  fontSize: 14, fontWeight: 400, textDecoration: 'none',
                }}
              >
                View hotel page
              </Link>
            </div>

            {/* Stay details */}
            <Section title="Stay details">
              <Row label="Check-in"  value={`${fmtDate(booking.checkIn)}${booking.hotel?.checkInTime ? ` · from ${booking.hotel.checkInTime}` : ''}`} />
              <Row label="Check-out" value={`${fmtDate(booking.checkOut)}${booking.hotel?.checkOutTime ? ` · by ${booking.hotel.checkOutTime}` : ''}`} />
              <Row label="Duration"  value={`${nights} night${nights !== 1 ? 's' : ''}`} />
              <Row label="Room type" value={booking.roomType?.name ?? 'Room'} />
              {booking.roomType?.bedType   && <Row label="Bed type"  value={booking.roomType.bedType} />}
              {booking.roomType?.capacity  && <Row label="Sleeps"    value={`${booking.roomType.capacity} guest${booking.roomType.capacity !== 1 ? 's' : ''}`} />}
              {booking.roomType?.sizeSqm   && <Row label="Room size" value={`${booking.roomType.sizeSqm} m²`} />}
              <Row label="Guests" value={`${booking.guests} guest${booking.guests !== 1 ? 's' : ''}`} />
              {booking.specialRequests && <Row label="Special requests" value={booking.specialRequests} last />}
            </Section>

            {/* Active room service orders */}
            {orders.length > 0 && (
              <Section title="Room service orders">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {orders.map((order, idx) => {
                    const sc = ORDER_STATUS[order.status] ?? ORDER_STATUS.PENDING;
                    const isLast = idx === orders.length - 1;
                    return (
                      <div key={order.id} style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                        padding: '12px 0',
                        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {order.venue?.name ?? 'Order'}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: 999 }}>
                              {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                            </span>
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
                            {order.items.map(i => `${i.quantity}× ${i.menuItem?.name ?? 'item'}`).join(', ')}
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                            {fmtNgn(Number(order.totalNgn))} · {order.reference}
                          </p>
                        </div>
                        <Link
                          href={`/room-service/orders/${order.id}`}
                          style={{
                            fontSize: 12, fontWeight: 600, color: 'var(--color-brand)',
                            textDecoration: 'none', flexShrink: 0,
                            border: '1px solid var(--color-brand)',
                            borderRadius: 'var(--radius-sm)', padding: '5px 12px',
                          }}
                        >
                          {order.status === 'DELIVERED' ? 'View' : 'Track'}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Hotel contact */}
            {(booking.hotel?.address || booking.hotel?.phone || booking.hotel?.email) && (
              <Section title="Hotel contact">
                {booking.hotel?.address && <Row label="Address" value={booking.hotel.address} />}
                {booking.hotel?.phone   && <Row label="Phone"   value={booking.hotel.phone} />}
                {booking.hotel?.email   && <Row label="Email"   value={booking.hotel.email} last />}
              </Section>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <Section title="Payment summary">
              <Row label={`${fmtNgn(pricePerNight)} × ${nights} night${nights !== 1 ? 's' : ''}`} value={fmtNgn(subtotal)} />
              {fee > 0 && <Row label="Service fee (3%)" value={fmtNgn(fee)} />}
              <div style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Total</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-brand)' }}>{fmtNgn(total)}</span>
                </div>
              </div>
              {booking.payment && (
                <>
                  <Row label="Payment status" value={
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: booking.payment.status === 'SUCCESS' ? '#15803d' : '#d97706',
                      background: booking.payment.status === 'SUCCESS' ? '#dcfce7' : '#fef9c3',
                      padding: '2px 8px', borderRadius: 999,
                    }}>
                      {booking.payment.status === 'SUCCESS' ? 'Paid' : booking.payment.status.toLowerCase()}
                    </span>
                  } />
                  {booking.payment.paidAt && <Row label="Paid on" value={fmtDateTime(booking.payment.paidAt)} />}
                  <Row label="Payment ref" last value={
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {booking.payment.reference}
                    </span>
                  } />
                </>
              )}
            </Section>

            <Section title="Booking info">
              <Row label="Booked on"  value={fmtDateTime(booking.createdAt)} />
              <Row label="Booking ID" last value={
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {booking.id}
                </span>
              } />
            </Section>

            <div style={{
              padding: '16px', borderRadius: 'var(--radius-md)',
              background: 'var(--color-brand-light)',
              border: '1px solid var(--color-border)',
              fontSize: 13, color: 'var(--color-text-secondary)',
            }}>
              <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Need help?</p>
              <p style={{ margin: 0, lineHeight: 1.6 }}>
                Email{' '}
                <a href="mailto:support@lodgen.com" style={{ color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 600 }}>
                  support@lodgen.com
                </a>
                {' '}with your booking reference.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 700px) {
          .bk-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ── Page export — inner component wrapped in Suspense (same pattern as checkout) ──

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<SkeletonShell />}>
      <BookingDetailInner />
    </Suspense>
  );
}
