'use client';

/**
 * /payment/callback
 *
 * Paystack redirects here after a card transaction with:
 *   ?trxref=<paystack-reference>&reference=<paystack-reference>
 *
 * This page:
 *   1. Reads the `reference` query param
 *   2. Calls GET /api/v1/payments/verify/:reference (JWT-guarded, confirms the booking)
 *   3. Fetches the booking details so it can pass them to the confirmation page
 *   4. Redirects to /booking/confirmation?ref=...&hotelName=...&...
 *
 * On any error it shows a clear message with links to check bookings or retry.
 */

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TravelerNav } from '../../components/TravelerNav';
import { verifyPayment, getMyBookings } from '../../lib/api/bookings';
import { ApiError } from '../../lib/api/client';
import { useAuth } from '../../lib/auth-context';

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        border: '4px solid var(--tp-muted)',
        borderTopColor: 'var(--tp-accent)',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
      }}
      role="status"
      aria-label="Loading"
    />
  );
}

// ── Inner component (needs useSearchParams) ───────────────────────────────────

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  // Paystack sends both `trxref` and `reference` — they are the same value.
  const reference = searchParams.get('reference') ?? searchParams.get('trxref') ?? '';

  useEffect(() => {
    if (authLoading) return;

    // Not logged in — send to sign-in, then come back here
    if (!user) {
      router.replace(`/auth/signin?redirect=${encodeURIComponent('/payment/callback?' + searchParams.toString())}`);
      return;
    }

    if (!reference) {
      setErrorMessage('No payment reference found. If you completed payment, check your bookings below.');
      setStatus('error');
      return;
    }

    void (async () => {
      try {
        // Verify the payment — backend confirms the booking
        await verifyPayment(reference);

        // Fetch the user's bookings to find the one we just confirmed so we can
        // pass the details to the confirmation page.
        const bookings = await getMyBookings();
        // Find the booking whose payment reference matches (reference contains bookingReference)
        // or fall back to the most recent CONFIRMED booking.
        const confirmed = bookings.find(b =>
          b.reference && reference.includes(b.reference)
        ) ?? bookings.find(b => b.status === 'CONFIRMED') ?? bookings[0];

        if (confirmed) {
          const params = new URLSearchParams({
            ref:       confirmed.reference ?? confirmed.id,
            hotelName: confirmed.hotel?.name ?? 'Hotel',
            roomName:  confirmed.roomType?.name ?? 'Room',
            checkIn:   confirmed.checkIn,
            checkOut:  confirmed.checkOut,
            guests:    String(confirmed.guests),
            total:     String(confirmed.totalNgn),
          });
          router.replace(`/booking/confirmation?${params.toString()}`);
        } else {
          // Booking confirmed but couldn't find details — still go to confirmation
          router.replace(`/booking/confirmation?ref=${encodeURIComponent(reference)}`);
        }

        setStatus('success');
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'We could not verify your payment.';
        setErrorMessage(msg);
        setStatus('error');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, reference]);

  // ── Verifying state ───────────────────────────────────────────────────────

  if (status === 'verifying' || status === 'success') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--tp-bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          padding: '32px',
        }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <Spinner />
        <p
          style={{ fontSize: '16px', fontWeight: 500, color: 'var(--tp-primary)', textAlign: 'center' }}
        >
          Confirming your payment…
        </p>
        <p style={{ fontSize: '14px', color: 'var(--tp-secondary)', textAlign: 'center', maxWidth: 360 }}>
          Please wait while we verify your payment and confirm your reservation. Do not close this tab.
        </p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tp-bg)' }}>
      <TravelerNav />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          padding: '100px 24px 48px',
          textAlign: 'center',
        }}
      >
        {/* Warning icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#fef3c7',
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
            stroke="#d97706"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h1
          style={{ fontSize: '22px', fontWeight: 700, color: 'var(--tp-primary)', margin: 0 }}
        >
          Payment verification failed
        </h1>

        <p style={{ fontSize: '15px', color: 'var(--tp-secondary)', maxWidth: 420, margin: 0 }}>
          {errorMessage || 'We could not verify your payment. If money was deducted from your account, please check your bookings — your reservation may still have been confirmed.'}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
          <Link
            href="/bookings"
            style={{
              background: 'var(--tp-accent)',
              color: 'white',
              padding: '10px 24px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Check my bookings
          </Link>
          <Link
            href="/hotels"
            style={{
              border: '1px solid var(--tp-border)',
              color: 'var(--tp-primary)',
              background: 'var(--tp-surface)',
              padding: '10px 24px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Back to hotels
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: 'var(--tp-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div
            style={{
              width: 48,
              height: 48,
              border: '4px solid var(--tp-muted)',
              borderTopColor: 'var(--tp-accent)',
              borderRadius: '50%',
              animation: 'spin 0.75s linear infinite',
            }}
          />
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
