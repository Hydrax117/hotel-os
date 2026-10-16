'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifySubscriptionPayment } from '@/app/lib/api/subscriptions';

// ── Icons ─────────────────────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin h-10 w-10"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="28" cy="28" r="28" fill="#dcfce7" />
      <path
        d="M16 28l9 9 15-15"
        stroke="#166534"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="28" cy="28" r="28" fill="#fee2e2" />
      <path
        d="M19 19l18 18M37 19L19 37"
        stroke="#991b1b"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Inner component that uses useSearchParams ─────────────────────────────────

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  type PageState = 'verifying' | 'success' | 'error';
  const [pageState, setPageState] = useState<PageState>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Read reference from URL param; fall back to sessionStorage
    const refFromUrl = searchParams.get('reference') ?? searchParams.get('trxref');
    const reference = refFromUrl ?? sessionStorage.getItem('pending_sub_ref') ?? '';
    const hotelId = sessionStorage.getItem('pending_sub_hotel') ?? '';

    if (!reference || !hotelId) {
      setErrorMessage(
        'We could not find a pending payment to verify. Please go back and try again.',
      );
      setPageState('error');
      return;
    }

    let cancelled = false;

    verifySubscriptionPayment(hotelId, reference)
      .then(() => {
        if (cancelled) return;
        sessionStorage.removeItem('pending_sub_ref');
        sessionStorage.removeItem('pending_sub_hotel');
        setPageState('success');
        setTimeout(() => {
          router.push('/dashboard/overview');
        }, 2000);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : 'Payment could not be verified. Please contact support if you were charged.';
        setErrorMessage(message);
        setPageState('error');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pageState === 'verifying') {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 min-h-[300px]"
        style={{ color: 'var(--db-secondary)' }}
      >
        <SpinnerIcon />
        <p className="text-sm font-medium">Verifying your payment...</p>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[300px] text-center">
        <CheckIcon />
        <h2 className="text-xl font-bold" style={{ color: 'var(--db-primary)' }}>
          Payment successful!
        </h2>
        <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>
          Your subscription is now active. Redirecting to dashboard...
        </p>
      </div>
    );
  }

  // error state
  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-[300px] text-center">
      <XIcon />
      <h2 className="text-xl font-bold" style={{ color: 'var(--db-primary)' }}>
        Payment could not be verified
      </h2>
      <p
        className="text-sm max-w-sm"
        style={{ color: '#991b1b' }}
      >
        {errorMessage}
      </p>
      <button
        onClick={() => router.push('/dashboard/subscription')}
        className="mt-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
        style={{ background: 'var(--db-accent)' }}
      >
        Try again
      </button>
    </div>
  );
}

// ── Page export — wraps inner component in Suspense ──────────────────────────

function SpinnerFallback() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <SpinnerIcon />
    </div>
  );
}

export default function SubscriptionCallbackPage() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ padding: '48px 24px' }}
    >
      <div
        className="rounded-xl border w-full max-w-md p-8"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <Suspense fallback={<SpinnerFallback />}>
          <CallbackInner />
        </Suspense>
      </div>
    </div>
  );
}
