'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { login } from '../../lib/api/auth';
import { ApiError, clearTokens } from '../../lib/api/client';
import { useAuth } from '../../lib/auth-context';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d6b4f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }}>
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

// ── Left panel (shared) ───────────────────────────────────────────────────────

function AuthLeftPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-[40%] flex-col relative"
      style={{ background: '#111110', minHeight: '100vh' }}
    >
      {/* Logo */}
      <div style={{ padding: '32px' }}>
        <Link href="/" className="text-xl font-semibold tracking-tight" style={{ color: '#ffffff' }}>
          Hotel<span style={{ color: '#3d6b4f' }}>OS</span>
        </Link>
      </div>

      {/* Quote */}
      <div className="flex-1 flex flex-col justify-center px-10">
        <p className="text-3xl font-bold leading-snug mb-10" style={{ color: '#ffffff' }}>
          &ldquo;Your next great stay is one search away.&rdquo;
        </p>

        {/* Trust bullets */}
        <ul className="flex flex-col gap-4">
          {[
            '500+ verified hotels across Nigeria',
            'Secure online booking and payment',
            'Instant confirmation, no waiting',
          ].map(item => (
            <li key={item} className="flex items-center gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full" style={{ background: 'rgba(61,107,79,0.2)' }}>
                <CheckIcon />
              </span>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* City names */}
      <div style={{ position: 'absolute', bottom: '32px', left: '40px', right: '40px' }}>
        <p className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Lagos · Abuja · Port Harcourt · Uyo · Kano · Kaduna
        </p>
      </div>
    </div>
  );
}

// ── Sign-in form (inner component — needs Suspense for useSearchParams) ────────

function SignInForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const searchParams = useSearchParams();

  // Detect hotel subdomain on the client. State + useEffect avoids a
  // server/client hydration mismatch and re-renders with the real hostname.
  const [isOwnerContext, setIsOwnerContext] = React.useState(
    searchParams.get('context') === 'owner'
  );
  React.useEffect(() => {
    const fromHostname = window.location.hostname.startsWith('hotel.');
    const fromParam = searchParams.get('context') === 'owner';
    setIsOwnerContext(fromHostname || fromParam);
  }, [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  // Compute the hotel subdomain URL for the static hint shown on the traveler signin page.
  // Uses NEXT_PUBLIC_HOTEL_DOMAIN if set; otherwise prepends "hotel." to the current host.
  const hotelSigninUrl = React.useMemo(() => {
    if (typeof window === 'undefined') return '#';
    if (process.env.NEXT_PUBLIC_HOTEL_DOMAIN) {
      return `https://${process.env.NEXT_PUBLIC_HOTEL_DOMAIN}/auth/signin`;
    }
    // Local dev: preserve the protocol (http for localhost)
    return `${window.location.protocol}//hotel.${window.location.host}/auth/signin`;
  }, []);

  // Roles that belong exclusively to the hotel subdomain
  const HOTEL_ROLES = ['HOTEL_OWNER', 'HOTEL_MANAGER', 'HOTEL_STAFF'] as const;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: { email?: string; password?: string; general?: string } = {};
    if (!email.trim()) newErrors.email = 'Please enter your email address';
    if (!password) newErrors.password = 'Please enter your password';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      setLoading(true);
      const res = await login({ email, password });

      // Security: if a hotel-side role signs in on the traveler domain (no context=owner),
      // silently reject — clear the session and show a generic invalid-credentials error
      // so no information about whether the credentials were valid is leaked.
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
        if (err.status === 401) {
          setErrors(prev => ({ ...prev, general: 'Invalid email or password.' }));
        } else {
          setErrors(prev => ({ ...prev, general: err.message }));
        }
      } else {
        setErrors(prev => ({ ...prev, general: 'Something went wrong. Please try again.' }));
      }
    } finally {
      setLoading(false);
    }
  }

  const inputBase = 'w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors';
  const inputStyle = {
    border: '1px solid var(--tp-border)',
    background: 'var(--tp-surface)',
    color: 'var(--tp-primary)',
  };

  return (
    <div className="w-full max-w-sm">
      {/* Heading */}
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--tp-primary)' }}>
        {isOwnerContext ? 'Sign in to your Hotel OS account' : 'Welcome back'}
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--tp-secondary)' }}>
        {isOwnerContext
          ? 'Access your hotel owner dashboard.'
          : 'Sign in to manage your bookings and discover hotels.'}
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
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--tp-accent)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--tp-border)'; }}
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p id="email-error" className="text-xs mt-1" style={{ color: '#dc2626' }} role="alert">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--tp-primary)' }}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputBase} pr-11`}
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--tp-accent)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--tp-border)'; }}
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center"
              style={{ color: 'var(--tp-secondary)' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-xs mt-1" style={{ color: '#dc2626' }} role="alert">
              {errors.password}
            </p>
          )}
        </div>

        {/* Forgot password */}
        <div className="flex justify-end -mt-2">
          <Link href="/auth/forgot-password" className="text-xs" style={{ color: 'var(--tp-accent)' }}>
            Forgot password?
          </Link>
        </div>

        {errors.general && (
          <div style={{background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px'}}>
            {errors.general}
          </div>
        )}

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
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <hr className="flex-1" style={{ borderColor: 'var(--tp-border)' }} />
          <span className="text-sm" style={{ color: 'var(--tp-secondary)' }}>or continue with</span>
          <hr className="flex-1" style={{ borderColor: 'var(--tp-border)' }} />
        </div>

        {/* Google button */}
        <a
          href="#"
          className="flex w-full items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            border: '1px solid var(--tp-border)',
            background: 'var(--tp-surface)',
            color: 'var(--tp-primary)',
          }}
        >
          <GoogleG />
          Continue with Google
        </a>
      </form>

      {/* Sign up link */}
      <p className="mt-6 text-center text-sm" style={{ color: 'var(--tp-secondary)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="font-medium" style={{ color: 'var(--tp-primary)' }}>
          Sign up
        </Link>
      </p>

      {/* Static hotel-owner hint — always visible, shown on the traveler page only.
          Unconditional: leaks nothing about any particular login attempt. */}
      {!isOwnerContext && (
        <p className="mt-4 text-center text-xs" style={{ color: 'var(--tp-secondary)' }}>
          Hotel owner?{' '}
          <a
            href={hotelSigninUrl}
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: 'var(--tp-secondary)' }}
          >
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="flex min-h-screen" style={{ background: 'var(--tp-bg)' }}>
        <AuthLeftPanel />

        {/* Right — form column */}
        <div
          className="flex flex-1 lg:w-[60%] flex-col items-center justify-center overflow-y-auto px-8 sm:px-12 py-12"
          style={{ background: 'var(--tp-surface)' }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 self-start">
            <Link href="/" className="text-xl font-semibold tracking-tight" style={{ color: 'var(--tp-primary)' }}>
              Hotel<span style={{ color: 'var(--tp-accent)' }}>OS</span>
            </Link>
          </div>

          <Suspense fallback={<div style={{ color: 'var(--tp-secondary)', fontSize: '14px' }}>Loading…</div>}>
            <SignInForm />
          </Suspense>
        </div>
      </div>
    </>
  );
}
