'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }}>
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="12" fill="#16a34a" />
    <polyline points="7 12 10.5 15.5 17 9" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // suppress unused router warning — may be used later
  void router;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError('Please enter your email address');
      return;
    }

    setEmailError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1000);
  }

  const inputBase = 'w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors';
  const inputStyle = {
    border: '1px solid var(--tp-border)',
    background: 'var(--tp-surface)',
    color: 'var(--tp-primary)',
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        className="flex min-h-screen items-center justify-center px-4 py-12"
        style={{ background: 'var(--tp-bg)' }}
      >
        <div
          className="w-full max-w-md rounded-2xl px-8 py-10"
          style={{
            background: 'var(--tp-surface)',
            border: '1px solid var(--tp-border)',
          }}
        >
          {/* Logo */}
          <div className="mb-8">
            <Link href="/" className="text-xl font-semibold tracking-tight" style={{ color: 'var(--tp-primary)' }}>
              Hotel<span style={{ color: 'var(--tp-accent)' }}>OS</span>
            </Link>
          </div>

          {sent ? (
            /* Success state */
            <div className="flex flex-col items-center text-center gap-4">
              <CheckCircleIcon />
              <h1 className="text-2xl font-bold" style={{ color: 'var(--tp-primary)' }}>
                Check your inbox
              </h1>
              <p className="text-sm" style={{ color: 'var(--tp-secondary)' }}>
                We&apos;ve sent a password reset link to{' '}
                <span className="font-medium" style={{ color: 'var(--tp-primary)' }}>
                  {email}
                </span>
              </p>
              <Link
                href="/auth/signin"
                className="mt-4 flex items-center gap-1.5 text-sm"
                style={{ color: 'var(--tp-secondary)' }}
              >
                <ArrowLeftIcon />
                Back to sign in
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--tp-primary)' }}>
                Reset your password
              </h1>
              <p className="text-sm mb-8" style={{ color: 'var(--tp-secondary)' }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--tp-primary)' }}>
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputBase}
                    style={inputStyle}
                    onFocus={ev => { ev.currentTarget.style.borderColor = 'var(--tp-accent)'; }}
                    onBlur={ev => { ev.currentTarget.style.borderColor = 'var(--tp-border)'; }}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'email-error' : undefined}
                  />
                  {emailError && (
                    <p id="email-error" className="text-xs mt-1" style={{ color: '#dc2626' }} role="alert">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
                  style={{ background: 'var(--tp-primary)' }}
                >
                  {loading ? (
                    <>
                      <SpinnerIcon />
                      Sending...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </button>

                {/* Back link */}
                <Link
                  href="/auth/signin"
                  className="flex items-center justify-center gap-1.5 text-sm"
                  style={{ color: 'var(--tp-secondary)' }}
                >
                  <ArrowLeftIcon />
                  Back to sign in
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
