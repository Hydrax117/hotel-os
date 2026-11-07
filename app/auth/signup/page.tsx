'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { register } from '../../lib/api/auth';
import { ApiError } from '../../lib/api/client';
import { useAuth } from '../../lib/auth-context';
import { Toast, useToast } from '../../components/Toast';

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

// ── Left panel ─────────────────────────────────────────────────────────────────

function AuthLeftPanel({ context }: { context: 'traveler' | 'owner' }) {
  const bullets =
    context === 'owner'
      ? ['Manage bookings and availability in real time', 'Professional dashboard for your team', 'Receive payouts on a reliable schedule']
      : ['Verified hotels across Nigeria', 'Secure booking and payment via Paystack', 'Instant confirmation, no waiting'];
  const quote =
    context === 'owner'
      ? '"The professional way to run your hotel business."'
      : '"Your next great stay is one search away."';

  return (
    <div className="hidden lg:flex lg:w-[42%] shrink-0 flex-col" style={{ background: 'var(--primitive-ink-900)', minHeight: '100vh' }}>
      <div className="px-10 pt-10">
        <Link href="/" className="flex items-baseline gap-0.5">
          <span className="text-xl font-medium text-white" style={{ fontFamily: 'var(--font-serif)' }}>Hotel</span>
          <span className="text-xl font-bold" style={{ color: 'var(--color-brand-secondary)' }}>OS</span>
        </Link>
      </div>
      <div className="flex flex-1 flex-col justify-center px-10 pb-10">
        <blockquote className="mb-10 text-2xl font-light leading-snug text-white" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
          {quote}
        </blockquote>
        <ul className="flex flex-col gap-4">
          {bullets.map(item => (
            <li key={item} className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(36,71,53,0.4)', color: 'var(--color-brand-secondary)' }}>
                <CheckIcon />
              </span>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="px-10 pb-8">
        <p className="text-xs tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Lagos · Abuja · Port Harcourt · Uyo · Kano · Kaduna
        </p>
      </div>
    </div>
  );
}

// ── Field component ───────────────────────────────────────────────────────────

function Field({ id, label, type = 'text', placeholder, value, onChange, error, autoComplete, suffix }: {
  id: string; label: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void;
  error?: string; autoComplete?: string; suffix?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</label>
      <div className="relative">
        <input
          id={id} type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)} autoComplete={autoComplete}
          aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
          style={{
            border: `1px solid ${error ? 'var(--color-danger-text)' : 'var(--color-border)'}`,
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            paddingRight: suffix ? '2.75rem' : undefined,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = error ? 'var(--color-danger-text)' : 'var(--color-brand)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(36,71,53,0.1)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = error ? 'var(--color-danger-text)' : 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center" style={{ color: 'var(--color-text-secondary)' }}>{suffix}</span>}
      </div>
      {error && <p id={`${id}-err`} role="alert" className="text-xs" style={{ color: 'var(--color-danger-text)' }}>{error}</p>}
    </div>
  );
}

// ── Sign-up form ──────────────────────────────────────────────────────────────

interface FormErrors {
  firstName?: string; lastName?: string; email?: string;
  phone?: string; password?: string; confirmPassword?: string;
  terms?: string; general?: string;
}

function SignUpForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const searchParams = useSearchParams();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const [isOwnerContext, setIsOwnerContext] = React.useState(searchParams.get('context') === 'owner');
  React.useEffect(() => {
    setIsOwnerContext(window.location.hostname.startsWith('hotel.') || searchParams.get('context') === 'owner');
  }, [searchParams]);

  const [firstName, setFirstName]         = useState('');
  const [lastName, setLastName]           = useState('');
  const [email, setEmail]                 = useState('');
  const [phone, setPhone]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirm]     = useState('');
  const [showPw, setShowPw]               = useState(false);
  const [showCPw, setShowCPw]             = useState(false);
  const [termsChecked, setTermsChecked]   = useState(false);
  const [errors, setErrors]               = useState<FormErrors>({});
  const [loading, setLoading]             = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: FormErrors = {};
    if (!firstName.trim()) errs.firstName = 'Required';
    if (!lastName.trim())  errs.lastName  = 'Required';
    if (!email.trim())     errs.email     = 'Please enter your email';
    if (!phone.trim())     errs.phone     = 'Please enter your phone number';
    if (!password)         errs.password  = 'Please enter a password';
    if (!confirmPassword)  errs.confirmPassword = 'Please confirm your password';
    else if (confirmPassword !== password) errs.confirmPassword = 'Passwords do not match';
    if (!termsChecked)     errs.terms = 'Please accept the terms to continue';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await register({ email, password, firstName, lastName, phone, role: isOwnerContext ? 'HOTEL_OWNER' : 'TRAVELER' });
      setUser(res.user);
      showToast('Account created! Welcome to Hotel OS.', 'success');
      await new Promise(r => setTimeout(r, 700));
      router.push(isOwnerContext ? '/onboarding/steps/step-2' : '/');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) setErrors(p => ({ ...p, email: 'This email is already registered.' }));
        else setErrors(p => ({ ...p, general: err.message }));
      } else {
        setErrors(p => ({ ...p, general: 'Something went wrong. Please try again.' }));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="mb-7">
        <h1 className="text-2xl font-semibold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
          {isOwnerContext ? 'Create your Hotel OS account' : 'Create your account'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {isOwnerContext ? 'Start listing your hotel in minutes.' : 'Join travelers booking verified hotels across Nigeria.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field id="firstName" label="First name" placeholder="Emeka" value={firstName} onChange={setFirstName} error={errors.firstName} autoComplete="given-name" />
          <Field id="lastName"  label="Last name"  placeholder="Obi"   value={lastName}  onChange={setLastName}  error={errors.lastName}  autoComplete="family-name" />
        </div>
        <Field id="email" label="Email address" type="email" placeholder="you@example.com" value={email} onChange={setEmail} error={errors.email} autoComplete="email" />
        <Field id="phone" label="Phone number"  type="tel"   placeholder="+234 800 000 0000" value={phone} onChange={setPhone} error={errors.phone} autoComplete="tel" />
        <Field id="password" label="Password" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters"
          value={password} onChange={setPassword} error={errors.password} autoComplete="new-password"
          suffix={<button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide' : 'Show'}>{showPw ? <EyeOffIcon /> : <EyeIcon />}</button>} />
        <Field id="confirm" label="Confirm password" type={showCPw ? 'text' : 'password'} placeholder="••••••••"
          value={confirmPassword} onChange={setConfirm} error={errors.confirmPassword} autoComplete="new-password"
          suffix={<button type="button" onClick={() => setShowCPw(v => !v)} aria-label={showCPw ? 'Hide' : 'Show'}>{showCPw ? <EyeOffIcon /> : <EyeIcon />}</button>} />

        {/* Terms */}
        <label className="flex items-start gap-3 cursor-pointer">
          <button
            type="button"
            role="checkbox"
            aria-checked={termsChecked}
            onClick={() => setTermsChecked(v => !v)}
            className="mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded-md transition-colors"
            style={{
              border: `2px solid ${termsChecked ? 'var(--color-brand)' : 'var(--color-border)'}`,
              background: termsChecked ? 'var(--color-brand)' : 'transparent',
              color: '#fff',
            }}
          >
            {termsChecked && <CheckIcon />}
          </button>
          <span className="text-sm leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
            I agree to the{' '}
            <Link href="/terms" className="font-medium underline underline-offset-2" style={{ color: 'var(--color-brand)' }}>Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="font-medium underline underline-offset-2" style={{ color: 'var(--color-brand)' }}>Privacy Policy</Link>
          </span>
        </label>
        {errors.terms && <p role="alert" className="text-xs" style={{ color: 'var(--color-danger-text)' }}>{errors.terms}</p>}

        {errors.general && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)' }}>
            {errors.general}
          </div>
        )}

        <button
          type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-60 mt-1"
          style={{ background: 'var(--color-brand)' }}
        >
          {loading ? <><SpinnerIcon /> Creating account…</> : 'Create account'}
        </button>

        <div className="flex items-center gap-3 my-1">
          <hr className="flex-1" style={{ borderColor: 'var(--color-border)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>or</span>
          <hr className="flex-1" style={{ borderColor: 'var(--color-border)' }} />
        </div>

        <a href="#" className="flex w-full items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
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
        Already have an account?{' '}
        <Link href="/auth/signin" className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Sign in</Link>
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SignUpPage() {
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
            <SignUpForm />
          </Suspense>
        </div>
      </div>
    </>
  );
}
