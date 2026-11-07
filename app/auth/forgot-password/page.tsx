'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const SpinnerIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }}>
    <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setEmailError('Please enter your email address'); return; }
    setEmailError('');
    setLoading(true);
    // Backend endpoint not yet implemented — simulate success
    setTimeout(() => { setLoading(false); setSent(true); }, 900);
  }

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div className="flex min-h-screen items-center justify-center px-5 py-12" style={{ background: 'var(--color-bg)' }}>
        <div
          className="w-full max-w-md rounded-2xl px-8 py-10"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)' }}
        >
          {/* Logo */}
          <div className="mb-8">
            <Link href="/" className="flex items-baseline gap-0.5 w-fit">
              <span className="text-xl font-medium" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)' }}>Hotel</span>
              <span className="text-xl font-bold" style={{ color: 'var(--color-brand)' }}>OS</span>
            </Link>
          </div>

          {sent ? (
            /* Success state */
            <div className="flex flex-col items-center gap-5 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: 'var(--color-success-bg)' }}
                aria-hidden="true"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Check your inbox</h1>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  We&apos;ve sent a password reset link to{' '}
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{email}</span>
                </p>
              </div>
              <Link
                href="/auth/signin"
                className="flex items-center gap-1.5 text-sm mt-2 transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <ArrowLeftIcon /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Reset your password
              </h1>
              <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                Enter your email and we&apos;ll send a reset link.
              </p>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                    placeholder="you@example.com"
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'email-err' : undefined}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={{
                      border: `1px solid ${emailError ? 'var(--color-danger-text)' : 'var(--color-border)'}`,
                      background: 'var(--color-surface)',
                      color: 'var(--color-text-primary)',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-brand)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(36,71,53,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = emailError ? 'var(--color-danger-text)' : 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  {emailError && <p id="email-err" role="alert" className="text-xs" style={{ color: 'var(--color-danger-text)' }}>{emailError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-60"
                  style={{ background: 'var(--color-brand)' }}
                >
                  {loading ? <><SpinnerIcon /> Sending…</> : 'Send reset link'}
                </button>

                <Link
                  href="/auth/signin"
                  className="flex items-center justify-center gap-1.5 text-sm transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <ArrowLeftIcon /> Back to sign in
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
