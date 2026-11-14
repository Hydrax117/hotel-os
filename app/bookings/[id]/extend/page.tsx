'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TravelerNav } from '../../../components/TravelerNav';
import { Footer } from '../../../components/Footer';
import { useAuth } from '../../../lib/auth-context';
import { getMyBookings, type BookingResponse } from '../../../lib/api/bookings';
import {
  checkExtensionAvailability,
  type ExtensionCheck,
} from '../../../lib/api/room-service';
import { apiClient, ApiError } from '../../../lib/api/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNgn(n: number) {
  return '₦' + Number(n).toLocaleString('en-NG');
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      aria-hidden="true"
      style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}
    >
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

// ── Inner page ────────────────────────────────────────────────────────────────

function ExtendStayInner() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);

  // Extension form state
  const [newCheckOut, setNewCheckOut] = useState('');
  const [check, setCheck] = useState<ExtensionCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');

  // Payment state
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/signin?redirect=/bookings');
  }, [authLoading, user, router]);

  // Load the specific booking
  useEffect(() => {
    if (!user) return;
    getMyBookings()
      .then(list => {
        const b = list.find(b => b.id === bookingId) ?? null;
        setBooking(b);
        if (b) {
          // Pre-fill with current checkout + 1
          setNewCheckOut(addDays(b.checkOut, 1));
        }
      })
      .finally(() => setLoadingBooking(false));
  }, [user, bookingId]);

  async function handleCheck() {
    if (!newCheckOut) return;
    setChecking(true);
    setCheck(null);
    setCheckError('');
    try {
      const result = await checkExtensionAvailability(bookingId, newCheckOut);
      setCheck(result);
    } catch (err) {
      setCheckError(err instanceof ApiError ? err.message : 'Failed to check availability');
    } finally {
      setChecking(false);
    }
  }

  async function handlePay() {
    if (!check?.available || !booking || !user) return;
    setPaying(true);
    setPayError('');
    try {
      // Initialize payment for the extension via standard Paystack flow
      // We create a temporary "extension payment" by calling a dedicated endpoint
      const result = await apiClient.post<{ paymentUrl: string; reference: string }>(
        `/api/v1/payments/extension/initialize`,
        {
          bookingId,
          newCheckOut,
          email: user.email,
          callbackUrl: `${window.location.origin}/bookings/${bookingId}/extend/verify`,
        },
      );
      window.location.href = result.paymentUrl;
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : 'Failed to start payment');
      setPaying(false);
    }
  }

  if (authLoading || loadingBooking) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--tp-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!booking || booking.status !== 'CHECKED_IN') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--tp-bg)' }}>
        <TravelerNav />
        <div style={{ paddingTop: 64 }} />
        <main style={{ maxWidth: 480, margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--tp-primary)', marginBottom: 12 }}>
            Booking not found or not eligible
          </h2>
          <p style={{ color: 'var(--tp-secondary)', marginBottom: 24 }}>
            You can only extend a booking while you are checked in.
          </p>
          <Link href="/bookings" style={{ color: 'var(--tp-accent)', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to My Bookings
          </Link>
        </main>
      </div>
    );
  }

  const minDate = addDays(booking.checkOut, 1);
  const currentCheckOut = booking.checkOut;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tp-bg)' }}>
      <TravelerNav />
      <div style={{ paddingTop: 64 }} />

      <main style={{ padding: '40px 16px' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
            <ol style={{ display: 'flex', alignItems: 'center', gap: 8, listStyle: 'none', margin: 0, padding: 0, fontSize: 14, color: 'var(--tp-secondary)' }}>
              <li><Link href="/bookings" style={{ color: 'var(--tp-secondary)', textDecoration: 'none' }}>My Bookings</Link></li>
              <li aria-hidden="true">/</li>
              <li style={{ color: 'var(--tp-primary)', fontWeight: 500 }}>Extend Stay</li>
            </ol>
          </nav>

          <div style={{ background: 'white', border: '1px solid var(--tp-border)', borderRadius: 16, padding: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--tp-primary)', margin: '0 0 8px' }}>
              Extend your stay
            </h1>
            <p style={{ fontSize: 14, color: 'var(--tp-secondary)', margin: '0 0 24px' }}>
              {booking.hotel?.name} — currently checking out {fmtDate(currentCheckOut)}
            </p>

            {/* Current stay summary */}
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
              padding: '14px 16px', marginBottom: 24, fontSize: 14,
            }}>
              <span style={{ color: '#15803d', fontWeight: 600 }}>● Currently checked in</span>
              <div style={{ color: '#374151', marginTop: 6 }}>
                {booking.resource?.name} · Check-in: {fmtDate(booking.checkIn)} · Check-out: {fmtDate(currentCheckOut)}
              </div>
            </div>

            {/* Date picker */}
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="newCheckOut"
                style={{ fontSize: 14, fontWeight: 600, color: 'var(--tp-primary)', display: 'block', marginBottom: 8 }}
              >
                New check-out date
              </label>
              <input
                id="newCheckOut"
                type="date"
                value={newCheckOut}
                min={minDate}
                onChange={e => { setNewCheckOut(e.target.value); setCheck(null); setCheckError(''); }}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: '1px solid var(--tp-border)', borderRadius: 8,
                  fontSize: 14, color: 'var(--tp-primary)', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => { void handleCheck(); }}
              disabled={checking || !newCheckOut}
              style={{
                width: '100%', padding: '11px',
                background: checking || !newCheckOut ? '#e5e7eb' : '#1e3a5f',
                color: checking || !newCheckOut ? '#9ca3af' : 'white',
                border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                cursor: checking || !newCheckOut ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginBottom: 20,
              }}
            >
              {checking && <Spinner />}
              {checking ? 'Checking…' : 'Check availability'}
            </button>

            {checkError && (
              <div role="alert" style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '12px 14px', fontSize: 14, marginBottom: 16 }}>
                {checkError}
              </div>
            )}

            {check && !check.available && (
              <div role="alert" style={{ background: '#fef9c3', color: '#92400e', borderRadius: 10, padding: '16px', fontSize: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Not available</div>
                The room type is already booked for those dates. Please choose a different check-out date.
              </div>
            )}

            {check && check.available && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Extension summary
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Extra nights</span>
                    <span style={{ fontWeight: 600 }}>{check.extraNights} night{check.extraNights !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Rate per night</span>
                    <span style={{ fontWeight: 600 }}>{fmtNgn(check.pricePerNight)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>New check-out</span>
                    <span style={{ fontWeight: 600 }}>{fmtDate(newCheckOut)}</span>
                  </div>
                  <div style={{ height: 1, background: '#bbf7d0', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700 }}>Total due now</span>
                    <span style={{ fontWeight: 700, fontSize: 18, color: '#15803d' }}>{fmtNgn(check.extraAmountNgn)}</span>
                  </div>
                </div>

                {payError && (
                  <div role="alert" style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginTop: 12 }}>
                    {payError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { void handlePay(); }}
                  disabled={paying}
                  style={{
                    width: '100%', marginTop: 16, padding: '13px',
                    background: paying ? '#9ca3af' : '#15803d',
                    color: 'white', border: 'none', borderRadius: 10,
                    fontSize: 15, fontWeight: 700,
                    cursor: paying ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {paying && <Spinner />}
                  {paying ? 'Redirecting to payment…' : `Pay ${fmtNgn(check.extraAmountNgn)} to extend`}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ExtendStayPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--tp-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3d6b4f" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </svg>
      </div>
    }>
      <ExtendStayInner />
    </Suspense>
  );
}
