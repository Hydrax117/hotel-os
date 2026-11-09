'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TravelerNav } from '../../../../components/TravelerNav';
import { Footer } from '../../../../components/Footer';
import { apiClient, ApiError } from '../../../../lib/api/client';

function ExtensionVerifyInner() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const reference = searchParams.get('reference') ?? '';
  const bookingId = params.id as string;

  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference) { setStatus('failed'); setError('No payment reference found.'); return; }
    apiClient
      .get<{ status: string }>(`/api/v1/payments/extension/verify/${encodeURIComponent(reference)}`)
      .then(r => {
        if (r.status === 'success' || r.status === 'already_confirmed') {
          setStatus('success');
        } else {
          setStatus('failed');
          setError('Payment was not completed. Please try again.');
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
          <div style={{ color: 'var(--tp-secondary)', fontSize: 16 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3d6b4f" strokeWidth="2"
              style={{ animation: 'spin 0.8s linear infinite', display: 'block', margin: '0 auto 16px' }}>
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </svg>
            Confirming your extension…
          </div>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--tp-primary)', marginBottom: 10 }}>
              Stay extended!
            </h1>
            <p style={{ fontSize: 15, color: 'var(--tp-secondary)', marginBottom: 28 }}>
              Your check-out date has been updated successfully.
            </p>
            <Link
              href="/bookings"
              style={{
                background: '#3d6b4f', color: 'white', padding: '12px 28px',
                borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Back to My Bookings
            </Link>
          </>
        )}
        {status === 'failed' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#dc2626', marginBottom: 10 }}>
              Extension failed
            </h1>
            <p style={{ fontSize: 15, color: 'var(--tp-secondary)', marginBottom: 28 }}>{error}</p>
            <Link
              href={`/bookings/${bookingId}/extend`}
              style={{
                border: '1px solid var(--tp-accent)', color: 'var(--tp-accent)',
                padding: '12px 28px', borderRadius: 10, fontSize: 15,
                fontWeight: 600, textDecoration: 'none', display: 'inline-block',
              }}
            >
              Try again
            </Link>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function ExtensionVerifyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--tp-bg)' }} />}>
      <ExtensionVerifyInner />
    </Suspense>
  );
}
