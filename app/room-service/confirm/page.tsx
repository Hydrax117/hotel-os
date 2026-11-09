'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TravelerNav } from '../../components/TravelerNav';
import { Footer } from '../../components/Footer';
import { verifyOrderPayment } from '../../lib/api/room-service';
import { ApiError } from '../../lib/api/client';

function ConfirmInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference') ?? '';

  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference) { setStatus('failed'); setError('No payment reference.'); return; }
    verifyOrderPayment(reference)
      .then(r => {
        if (r.status === 'success') {
          setStatus('success');
          setOrderId(r.orderId);
        } else {
          setStatus('failed');
          setError('Payment was not completed.');
        }
      })
      .catch(err => {
        setStatus('failed');
        setError(err instanceof ApiError ? err.message : 'Verification failed.');
      });
  }, [reference]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tp-bg)' }}>
      <TravelerNav />
      <div style={{ paddingTop: 64 }} />
      <main style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>

        {status === 'loading' && (
          <div style={{ color: 'var(--tp-secondary)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3d6b4f" strokeWidth="2"
              style={{ animation: 'spin 0.8s linear infinite', display: 'block', margin: '0 auto 16px' }}>
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </svg>
            Confirming your order…
          </div>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🛎</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--tp-primary)', marginBottom: 10 }}>
              Order placed!
            </h1>
            <p style={{ fontSize: 15, color: 'var(--tp-secondary)', marginBottom: 8 }}>
              Your order has been confirmed and sent to the venue.
            </p>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 28 }}>
              Ref: {orderId}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link
                href="/bookings"
                style={{
                  background: '#3d6b4f', color: 'white', padding: '11px 24px',
                  borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Back to My Bookings
              </Link>
              <Link
                href={`/room-service/orders/${orderId}`}
                style={{
                  border: '1px solid var(--tp-accent)', color: 'var(--tp-accent)',
                  padding: '11px 24px', borderRadius: 10, fontSize: 14,
                  fontWeight: 600, textDecoration: 'none', display: 'inline-block',
                }}
              >
                Track order
              </Link>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#dc2626', marginBottom: 10 }}>
              Order failed
            </h1>
            <p style={{ fontSize: 15, color: 'var(--tp-secondary)', marginBottom: 28 }}>{error}</p>
            <Link
              href="/bookings"
              style={{
                border: '1px solid var(--tp-accent)', color: 'var(--tp-accent)',
                padding: '12px 28px', borderRadius: 10, fontSize: 14,
                fontWeight: 600, textDecoration: 'none', display: 'inline-block',
              }}
            >
              Back to bookings
            </Link>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function RoomServiceConfirmPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--tp-bg)' }} />}>
      <ConfirmInner />
    </Suspense>
  );
}
