'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '../../lib/api/auth';
import { ApiError } from '../../lib/api/client';
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

// ── Left panel ────────────────────────────────────────────────────────────────

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

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'traveler' | 'owner';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  hotelName?: string;
  general?: string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SignUpPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [role, setRole] = useState<Role>('traveler');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [hotelName, setHotelName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: FormErrors = {};

    if (!firstName.trim()) newErrors.firstName = 'Please enter your first name';
    if (!lastName.trim()) newErrors.lastName = 'Please enter your last name';
    if (!email.trim()) newErrors.email = 'Please enter your email address';
    if (!phone.trim()) newErrors.phone = 'Please enter your phone number';
    if (!password) newErrors.password = 'Please enter a password';
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password && confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!termsChecked) newErrors.terms = 'Please accept the terms to continue';
    if (role === 'owner' && !hotelName.trim()) newErrors.hotelName = 'Please enter your hotel name';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      setLoading(true);
      const res = await register({
        email,
        password,
        firstName,
        lastName,
        phone: phone || undefined,
        role: role === 'owner' ? 'HOTEL_OWNER' : 'TRAVELER',
      });
      setUser(res.user);
      if (role === 'owner') {
        router.push('/onboarding');
      } else {
        router.push('/');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrors(prev => ({ ...prev, email: 'This email is already registered.' }));
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

          <div className="w-full max-w-sm">
            {/* Role toggle */}
            <div className="flex gap-2 mb-6 p-1 rounded-full" style={{ background: 'var(--tp-muted)' }}>
              <button
                type="button"
                onClick={() => setRole('traveler')}
                className="flex-1 rounded-full py-2 text-sm font-medium transition-colors"
                style={{
                  background: role === 'traveler' ? 'var(--tp-primary)' : 'transparent',
                  color: role === 'traveler' ? '#ffffff' : 'var(--tp-secondary)',
                }}
              >
                I&apos;m a traveler
              </button>
              <button
                type="button"
                onClick={() => setRole('owner')}
                className="flex-1 rounded-full py-2 text-sm font-medium transition-colors"
                style={{
                  background: role === 'owner' ? 'var(--tp-primary)' : 'transparent',
                  color: role === 'owner' ? '#ffffff' : 'var(--tp-secondary)',
                }}
              >
                I&apos;m a hotel owner
              </button>
            </div>

            {/* Heading */}
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--tp-primary)' }}>
              Create your account
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--tp-secondary)' }}>
              {role === 'traveler'
                ? 'Join thousands of travelers booking verified hotels across Nigeria.'
                : 'List and manage your hotel on Hotel OS.'}
            </p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {/* Name row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* First name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--tp-primary)' }}>
                    First name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Emeka"
                    className={inputBase}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--tp-accent)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--tp-border)'; }}
                    aria-invalid={!!errors.firstName}
                    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  />
                  {errors.firstName && (
                    <p id="firstName-error" className="text-xs mt-1" style={{ color: '#dc2626' }} role="alert">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                {/* Last name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--tp-primary)' }}>
                    Last name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Obi"
                    className={inputBase}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--tp-accent)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--tp-border)'; }}
                    aria-invalid={!!errors.lastName}
                    aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                  />
                  {errors.lastName && (
                    <p id="lastName-error" className="text-xs mt-1" style={{ color: '#dc2626' }} role="alert">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

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
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-xs mt-1" style={{ color: '#dc2626' }} role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--tp-primary)' }}>
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className={inputBase}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--tp-accent)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--tp-border)'; }}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && (
                  <p id="phone-error" className="text-xs mt-1" style={{ color: '#dc2626' }} role="alert">
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Hotel name (owner only) */}
              {role === 'owner' && (
                <div>
                  <label htmlFor="hotelName" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--tp-primary)' }}>
                    Hotel name
                  </label>
                  <input
                    id="hotelName"
                    type="text"
                    value={hotelName}
                    onChange={e => setHotelName(e.target.value)}
                    placeholder="Sunrise Grand Hotel"
                    className={inputBase}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--tp-accent)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--tp-border)'; }}
                    aria-invalid={!!errors.hotelName}
                    aria-describedby={errors.hotelName ? 'hotelName-error' : undefined}
                  />
                  {errors.hotelName && (
                    <p id="hotelName-error" className="text-xs mt-1" style={{ color: '#dc2626' }} role="alert">
                      {errors.hotelName}
                    </p>
                  )}
                </div>
              )}

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--tp-primary)' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputBase} pr-11`}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--tp-accent)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--tp-border)'; }}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
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

              {/* Confirm password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--tp-primary)' }}>
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputBase} pr-11`}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--tp-accent)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--tp-border)'; }}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center"
                    style={{ color: 'var(--tp-secondary)' }}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="text-xs mt-1" style={{ color: '#dc2626' }} role="alert">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Terms checkbox */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={termsChecked}
                      onChange={e => setTermsChecked(e.target.checked)}
                      className="sr-only"
                      aria-describedby={errors.terms ? 'terms-error' : undefined}
                    />
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center transition-colors"
                      style={{
                        border: `2px solid ${termsChecked ? 'var(--tp-accent)' : 'var(--tp-border)'}`,
                        background: termsChecked ? 'var(--tp-accent-light)' : 'var(--tp-surface)',
                      }}
                      onClick={() => setTermsChecked(v => !v)}
                      role="checkbox"
                      aria-checked={termsChecked}
                      aria-label="I agree to the Terms of Service and Privacy Policy"
                    >
                      {termsChecked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3d6b4f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm" style={{ color: 'var(--tp-secondary)' }}>
                    I agree to the{' '}
                    <Link href="/terms" className="font-medium" style={{ color: 'var(--tp-accent)' }}>
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="font-medium" style={{ color: 'var(--tp-accent)' }}>
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.terms && (
                  <p id="terms-error" className="text-xs mt-1" style={{ color: '#dc2626' }} role="alert">
                    {errors.terms}
                  </p>
                )}
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
                    Creating account...
                  </>
                ) : (
                  'Create account'
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

            {/* Sign in link */}
            <p className="mt-6 text-center text-sm" style={{ color: 'var(--tp-secondary)' }}>
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-medium" style={{ color: 'var(--tp-primary)' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
