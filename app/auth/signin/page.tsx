'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '../../lib/api/auth';
import { ApiError, clearTokens } from '../../lib/api/client';
import { useAuth } from '../../lib/auth-context';

// ── Icons ─────────────────────────────────────────────────────────────────────

const EyeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }}>
    <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ── Shared left panel ─────────────────────────────────────────────────────────

function AuthLeftPanel({ context }: { context: 'traveler' | 'owner' }) {
  const bullets =
    context === 'owner'
      ? [
          'Manage bookings and availability in real time',
          'Professional dashboard for your team',
          'Receive payouts on a reliable schedule',
        ]
      : [
          'Verified hotels across Nigeria',
          'Secure booking and payment via Paystack',
          'Instant confirmation, no waiting',
        ];

  const quote =
    context === 'owner'
      ? '"The professional way to run your hotel business."'
      : '"Your next great stay is one search away."';

  return (
    <div
      className="hidden lg:flex lg:w-[42%] shrink-0 flex-col"
      style={{ background: 'var(--primitive-ink-900)', minHeight: '100vh' }}
    >
      {/* Logo */}
      <div className="px-10 pt-10">
        <Link href="/" className="flex items-baseline gap-0.5">
          <span className="text-xl font-medium text-white" style={{ fontFamily: 'var(--font-serif)' }}>Hotel</span>
          <span className="text-xl font-bold" style={{ color: 'var(--color-brand-secondary)' }}>OS</span>
        </Link>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-center px-10 pb-10">
        <blockquote
          className="mb-10 text-2xl font-light leading-snug text-white"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
        >
          {quote}
        </blockquote>

        <ul className="flex flex-col gap-4">
          {bullets.map(item => (
            <li key={item} className="flex items-center gap-3">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'rgba(36,71,53,0.4)', color: 'var(--color-brand-secondary)' }}
              >
                <CheckIcon />
              </span>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Cities */}
      <div className="px-10 pb-8">
        <p className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Lagos · Abuja · Port Harcourt · Uyo · Kano · Kaduna
        </p>
      </div>
    </div>
  );
}

// ── Input component ───────────────────────────────────────────────────────────

function Field({
  id, label, type = 'text', placeholder, value, onChange,
  error, autoComplete, suffix,
}: {
  id: string; label: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void;
  error?: string; autoComplete?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
          style={{
            border: `1px solid ${error ? 'var(--color-danger-text)' : 'var(--color-border)'}`,
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            paddingRight: suffix ? '2.75rem' : undefined,
          }}
          onFocus={e => { if (!error) e.currentTarget.style.borderColor = 'var(--color-brand)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(36,71,53,0.1)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = error ? 'var(--color-danger-text)' : 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center" style={{ color: 'var(--color-text-secondary)' }}>
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="text-xs" style={{ color: 'var(--color-danger-text)' }}>{error}</p>
      )}
    </div>
  );
}

// ── Sign-in form ──────────────────────────────────────────────────────────────

function SignInForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const searchParams = useSearchParams();

  const [isOwnerContext, setIsOwnerContext] = React.useState(
    searchParams.get('context') === 'owner'
  );
  React.useEffect(() => {
    setIsOwnerContext(
      window.location.hostname.startsWith('hotel.') ||
      searchParams.get('context') === 'owner'
    );
  }, [searchParams]);

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<{ email?: string; password?: string; general?: string }>({});

  const HOTEL_ROLES = ['HOTEL_OWNER', 'HOTEL_MANAGER', 'HOTEL_STAFF'] as const;

  const hotelSigninUrl = React.useMemo(() => {
    if (typeof window === 'undefined') return '#';
    if (process.env.NEXT_PUBLIC_HOTEL_DOMAIN) return `https://${process.env.NEXT_PUBLIC_HOTEL_DOMAIN}/auth/signin`;
    return `${window.location.protocol}//hotel.${window.location.host}/auth/signin`;
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = 'Please enter your email address';
    if (!password)     errs.password = 'Please enter your password';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await login({ email, password });
      if (!isOwnerContext && (HOTEL_ROLES as readonly string[]).includes(res.user.role)) {
        clearTokens();
        setErrors({ general: 'Invalid email or password.' });
        return;
      }
      setUser(res.user);
      const role = res.user.role;
      if (role === 'HOTEL_OWNER' || role === 'HOTEL_MANAGER' || role === 'HOTEL_STAFF') {
        router.push('/dashboard/overview');
      } else if (role === 'SUPER_ADMIN') {
        router.push('/admin/overview');
      } else {
        router.push('/');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({ general: err.status === 401 ? 'Invalid email or password.' : err.message });
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
          {isOwnerContext ? 'Welcome back' : 'Sign in'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {isOwnerContext
            ? 'Access your hotel management dashboard.'
            : 'Sign in to manage your bookings and find your next stay.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field id="email" label="Email address" type="email" placeholder="you@example.com"
          value={email} onChange={setEmail} error={errors.email} autoComplete="email" />

        <Field id="password" label="Password" type={showPw ? 'text' : 'password'} placeholder="••••••••"
          value={password} onChange={setPassword} error={errors.password} autoComplete="current-password"
          suffix={
            <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide' : 'Show'}>
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          }
        />

        <div className="flex justify-end -mt-1">
          <Link href="/auth/forgot-password" className="text-xs font-medium" style={{ color: 'var(--color-brand)' }}>
            Forgot password?
          </Link>
        </div>

        {errors.general && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)' }}>
            {errors.general}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-60 mt-1"
          style={{ background: 'var(--color-brand)' }}
        >
          {loading ? <><SpinnerIcon /> Signing in…</> : 'Sign in'}
        </button>

        <div className="flex items-center gap-3 my-1">
          <hr className="flex-1" style={{ borderColor: 'var(--color-border)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>or</span>
          <hr className="flex-1" style={{ borderColor: 'var(--color-border)' }} />
        </div>

        <a
          href="#"
          className="flex w-full items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </a>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Sign up
        </Link>
      </p>

      {!isOwnerContext && (
        <p className="mt-3 text-center text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Hotel owner?{' '}
          <a href={hotelSigninUrl} className="underline underline-offset-2" style={{ color: 'var(--color-text-secondary)' }}>
            Sign in on the hotel portal
          </a>
        </p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SignInPage() {
  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <AuthLeftPanel context="traveler" />
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12 sm:px-12" style={{ background: 'var(--color-surface)' }}>
          <div className="lg:hidden mb-8 self-start">
            <Link href="/" className="flex items-baseline gap-0.5">
              <span className="text-xl font-medium" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)' }}>Hotel</span>
              <span className="text-xl font-bold" style={{ color: 'var(--color-brand)' }}>OS</span>
            </Link>
          </div>
          <Suspense fallback={<div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading…</div>}>
            <SignInForm />
          </Suspense>
        </div>
      </div>
    </>
  );
}
