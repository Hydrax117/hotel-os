'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TravelerNav } from '../components/TravelerNav';
import { Footer } from '../components/Footer';
import { useAuth } from '../lib/auth-context';
import { createBooking, initializePayment, type CreateBookingPayload } from '../lib/api/bookings';
import { calcNights, calcBookingCost } from '../lib/booking';
import { ApiError, apiClient } from '../lib/api/client';
import type { HotelDetail, RoomAvailability } from '../lib/api/search';

// ── SVG icons ─────────────────────────────────────────────────────────────────

const LockIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// ── Helper ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── Input component ───────────────────────────────────────────────────────────

type InputProps = {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
};

function FormInput({ id, label, type = 'text', placeholder, value, onChange, required, autoComplete }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium"
        style={{ color: 'var(--tp-primary)' }}
      >
        {label}
        {required && <span aria-hidden="true" style={{ color: 'var(--tp-accent)' }}> *</span>}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
        style={{
          border: '1px solid var(--tp-border)',
          background: 'var(--tp-surface)',
          color: 'var(--tp-primary)',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--tp-accent)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--tp-border)'; }}
      />
    </div>
  );
}

// ── Main checkout inner component (uses useSearchParams) ──────────────────────

function CheckoutInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const hotelId = searchParams.get('hotelId') ?? '';
  const roomId = searchParams.get('roomId') ?? '';
  const checkIn = searchParams.get('checkIn') ?? '';
  const checkOut = searchParams.get('checkOut') ?? '';
  const guests = searchParams.get('guests') ?? '1';

  // Auth gate
  const { user, isLoading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/signin?redirect=/checkout');
  }, [authLoading, user, router]);

  // Date state — seeded from URL params
  const [checkInInput, setCheckInInput] = useState(checkIn);
  const [checkOutInput, setCheckOutInput] = useState(checkOut);

  // Guest details state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Pre-fill from auth context
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
    }
  }, [user]);

  // Hotel/room data state (replaces mock lookup)
  const [hotelName, setHotelName] = useState('');
  const [hotelCity, setHotelCity] = useState('');
  const [roomName, setRoomName] = useState('');
  const [pricePerNight, setPricePerNight] = useState(0);
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  // Fetch hotel + room data
  useEffect(() => {
    if (!hotelId || !roomId) return;
    setDataLoading(true);
    Promise.all([
      apiClient.get<HotelDetail>(`/api/v1/hotels/${hotelId}`),
      apiClient.get<{ rooms: RoomAvailability[] }>(`/api/v1/hotels/${hotelId}/rooms`),
    ])
      .then(([hotel, roomsData]) => {
        setHotelName(hotel.name);
        setHotelCity(hotel.city);
        const room = roomsData.rooms.find(r => r.id === roomId);
        if (room) {
          setRoomName(room.name);
          setPricePerNight(room.pricePerNight);
          setCancellationPolicy(room.cancellationPolicy ?? '');
        } else {
          setDataError('Room not found.');
        }
      })
      .catch(() => setDataError('Failed to load booking details.'))
      .finally(() => setDataLoading(false));
  }, [hotelId, roomId]);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Form validation error state
  const [formError, setFormError] = useState('');

  // ── Calculations ─────────────────────────────────────────────────────────────

  const nights = calcNights(checkInInput, checkOutInput);
  const { subtotal, fee, total } = calcBookingCost(pricePerNight, nights);

  const isFreeCancel = cancellationPolicy.toLowerCase().includes('free');
  const isNonRefundable = cancellationPolicy.toLowerCase().includes('non-refundable');

  // ── Auth loading / not logged in ─────────────────────────────────────────────

  if (authLoading || !user) {
    return (
      <div
        style={{ background: 'var(--tp-bg)', minHeight: '100vh' }}
        className="flex items-center justify-center"
      >
        <TravelerNav />
        <p style={{ color: 'var(--tp-secondary)' }}>Loading…</p>
      </div>
    );
  }

  // ── Data error state ─────────────────────────────────────────────────────────

  if (!dataLoading && dataError) {
    return (
      <div style={{ background: 'var(--tp-bg)', minHeight: '100vh' }}>
        <TravelerNav />
        <div
          className="flex flex-col items-center justify-center gap-4 px-4"
          style={{ paddingTop: '128px' }}
        >
          <p className="text-lg font-semibold" style={{ color: 'var(--tp-primary)' }}>
            {dataError}
          </p>
          <Link
            href="/hotels"
            className="text-sm underline"
            style={{ color: 'var(--tp-accent)' }}
          >
            ← Back to hotels
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Pay handler ──────────────────────────────────────────────────────────────

  async function handlePay(): Promise<void> {
    // Validate required guest details
    if (!firstName.trim()) { setFormError('Please enter your first name.'); return; }
    if (!lastName.trim()) { setFormError('Please enter your last name.'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) { setFormError('Please enter your phone number.'); return; }
    // Validate dates
    if (!checkInInput) { setFormError('Please select a check-in date.'); return; }
    if (!checkOutInput) { setFormError('Please select a check-out date.'); return; }

    setFormError('');
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload: CreateBookingPayload = {
        roomId,
        checkIn: checkInInput,
        checkOut: checkOutInput,
        guests: Number(guests),
        specialRequests: specialRequests.trim() || undefined,
      };
      const booking = await createBooking(payload);
      const payment = await initializePayment(booking.id);
      window.location.href = payment.paymentUrl;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: 'var(--tp-bg)', minHeight: '100vh' }}>
      <TravelerNav />

      <main style={{ paddingTop: '64px' }}>
        <div className="mx-auto max-w-6xl px-4 py-10">
          {/* Page heading */}
          <h1
            className="mb-8 text-2xl font-bold lg:text-3xl"
            style={{ color: 'var(--tp-primary)' }}
          >
            Complete your booking
          </h1>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
            {/* ── Left column — form ── */}
            <div className="flex flex-col gap-6 lg:order-first order-last">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  void handlePay();
                }}
                className="flex flex-col gap-6"
              >
                {/* Section 0: When are you staying? */}
                <section
                  className="rounded-xl p-6"
                  style={{
                    background: 'var(--tp-surface)',
                    border: '1px solid var(--tp-border)',
                  }}
                  aria-labelledby="dates-heading"
                >
                  <h2
                    id="dates-heading"
                    className="mb-5 text-lg font-semibold"
                    style={{ color: 'var(--tp-primary)' }}
                  >
                    When are you staying?
                  </h2>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Check-in */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="checkInDate"
                        className="text-sm font-medium"
                        style={{ color: 'var(--tp-primary)' }}
                      >
                        Check-in
                        <span aria-hidden="true" style={{ color: 'var(--tp-accent)' }}> *</span>
                      </label>
                      <input
                        id="checkInDate"
                        type="date"
                        value={checkInInput}
                        onChange={e => {
                          setCheckInInput(e.target.value);
                          if (checkOutInput && e.target.value >= checkOutInput) {
                            setCheckOutInput('');
                          }
                        }}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
                        style={{
                          border: '1px solid var(--tp-border)',
                          background: 'var(--tp-surface)',
                          color: checkInInput ? 'var(--tp-primary)' : 'var(--tp-secondary)',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'var(--tp-accent)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'var(--tp-border)'; }}
                      />
                    </div>

                    {/* Check-out */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="checkOutDate"
                        className="text-sm font-medium"
                        style={{ color: 'var(--tp-primary)' }}
                      >
                        Check-out
                        <span aria-hidden="true" style={{ color: 'var(--tp-accent)' }}> *</span>
                      </label>
                      <input
                        id="checkOutDate"
                        type="date"
                        value={checkOutInput}
                        onChange={e => setCheckOutInput(e.target.value)}
                        required
                        min={
                          checkInInput
                            ? (() => {
                                const d = new Date(checkInInput);
                                d.setDate(d.getDate() + 1);
                                return d.toISOString().split('T')[0];
                              })()
                            : new Date().toISOString().split('T')[0]
                        }
                        className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
                        style={{
                          border: '1px solid var(--tp-border)',
                          background: 'var(--tp-surface)',
                          color: checkOutInput ? 'var(--tp-primary)' : 'var(--tp-secondary)',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'var(--tp-accent)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'var(--tp-border)'; }}
                      />
                    </div>
                  </div>

                  {/* Live nights indicator */}
                  {checkInInput && checkOutInput && nights >= 1 && (
                    <p className="mt-3 text-sm" style={{ color: 'var(--tp-accent)' }}>
                      {nights} night{nights !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </section>

                {/* Section 1: Your details */}
                <section
                  className="rounded-xl p-6"
                  style={{
                    background: 'var(--tp-surface)',
                    border: '1px solid var(--tp-border)',
                  }}
                  aria-labelledby="details-heading"
                >
                  <h2
                    id="details-heading"
                    className="mb-5 text-lg font-semibold"
                    style={{ color: 'var(--tp-primary)' }}
                  >
                    Your details
                  </h2>

                  <div className="flex flex-col gap-4">
                    {/* Name row */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormInput
                        id="firstName"
                        label="First name"
                        placeholder="Emeka"
                        value={firstName}
                        onChange={setFirstName}
                        required
                        autoComplete="given-name"
                      />
                      <FormInput
                        id="lastName"
                        label="Last name"
                        placeholder="Obi"
                        value={lastName}
                        onChange={setLastName}
                        required
                        autoComplete="family-name"
                      />
                    </div>

                    <FormInput
                      id="email"
                      label="Email address"
                      type="email"
                      placeholder="emeka@example.com"
                      value={email}
                      onChange={setEmail}
                      required
                      autoComplete="email"
                    />

                    <FormInput
                      id="phone"
                      label="Phone number"
                      type="tel"
                      placeholder="+234 800 000 0000"
                      value={phone}
                      onChange={setPhone}
                      required
                      autoComplete="tel"
                    />
                  </div>
                </section>

                {/* Section 2: Special requests */}
                <section
                  className="rounded-xl p-6"
                  style={{
                    background: 'var(--tp-surface)',
                    border: '1px solid var(--tp-border)',
                  }}
                  aria-labelledby="requests-heading"
                >
                  <h2
                    id="requests-heading"
                    className="mb-5 text-lg font-semibold"
                    style={{ color: 'var(--tp-primary)' }}
                  >
                    Special requests{' '}
                    <span className="text-base font-normal" style={{ color: 'var(--tp-secondary)' }}>
                      (optional)
                    </span>
                  </h2>

                  <label htmlFor="specialRequests" className="sr-only">
                    Special requests
                  </label>
                  <textarea
                    id="specialRequests"
                    rows={4}
                    placeholder="e.g. High floor, extra pillows, late check-in…"
                    value={specialRequests}
                    onChange={e => setSpecialRequests(e.target.value)}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors resize-none"
                    style={{
                      border: '1px solid var(--tp-border)',
                      background: 'var(--tp-surface)',
                      color: 'var(--tp-primary)',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--tp-accent)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--tp-border)'; }}
                  />
                  <p className="mt-2 text-xs" style={{ color: 'var(--tp-secondary)' }}>
                    Special requests are subject to availability and cannot be guaranteed.
                  </p>
                </section>

                {/* Section 3: Secure payment notice */}
                <section
                  className="rounded-xl p-6"
                  style={{
                    background: 'var(--tp-surface)',
                    border: '1px solid var(--tp-border)',
                  }}
                  aria-labelledby="payment-heading"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span style={{ color: 'var(--tp-primary)' }}>
                      <LockIcon size={16} />
                    </span>
                    <h2
                      id="payment-heading"
                      className="text-lg font-semibold"
                      style={{ color: 'var(--tp-primary)' }}
                    >
                      Secure payment
                    </h2>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--tp-secondary)' }}>
                    You will be redirected to Paystack&apos;s secure payment page to complete your booking.
                  </p>
                </section>

                {/* Pay button */}
                <div className="flex flex-col gap-3">
                  {(formError || submitError) && (
                    <p
                      role="alert"
                      className="rounded-lg px-4 py-3 text-sm"
                      style={{ background: '#fee2e2', color: '#dc2626' }}
                    >
                      {formError || submitError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ background: 'var(--tp-primary)' }}
                  >
                    <LockIcon size={18} />
                    {submitting ? 'Processing…' : `Pay ₦${total.toLocaleString()}`}
                  </button>
                  <p className="text-center text-sm" style={{ color: 'var(--tp-secondary)' }}>
                    You won&apos;t be charged until payment is completed on Paystack
                  </p>
                  <p className="text-center text-xs" style={{ color: 'var(--tp-secondary)' }}>
                    By booking you agree to our{' '}
                    <Link href="/terms" className="underline" style={{ color: 'var(--tp-accent)' }}>
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="underline" style={{ color: 'var(--tp-accent)' }}>
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </form>
            </div>

            {/* ── Right column — booking summary ── */}
            <div
              className="order-first lg:order-last"
              style={{ position: 'sticky', top: '88px', alignSelf: 'flex-start' }}
            >
              <aside
                className="rounded-xl p-6"
                style={{
                  background: 'var(--tp-surface)',
                  border: '1px solid var(--tp-border)',
                }}
                aria-label="Booking summary"
              >
                <h2
                  className="mb-4 text-base font-semibold"
                  style={{ color: 'var(--tp-primary)' }}
                >
                  Booking summary
                </h2>

                {/* Hotel info */}
                <div className="mb-4">
                  <p className="font-semibold" style={{ color: 'var(--tp-primary)' }}>
                    {dataLoading ? '—' : hotelName}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--tp-secondary)' }}>
                    {dataLoading ? '—' : hotelCity}
                  </p>
                </div>

                {/* Room info */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--tp-primary)' }}>
                    {dataLoading ? '—' : roomName}
                  </span>
                </div>

                <hr style={{ borderColor: 'var(--tp-border)' }} />

                {/* Dates & guests */}
                <div className="my-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--tp-secondary)' }}>Check-in</span>
                    <span style={{ color: 'var(--tp-primary)' }}>{formatDate(checkInInput)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--tp-secondary)' }}>Check-out</span>
                    <span style={{ color: 'var(--tp-primary)' }}>{formatDate(checkOutInput)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--tp-secondary)' }}>Nights</span>
                    <span style={{ color: 'var(--tp-primary)' }}>
                      {nights} night{nights !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--tp-secondary)' }}>Guests</span>
                    <span style={{ color: 'var(--tp-primary)' }}>
                      {guests} guest{Number(guests) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <hr style={{ borderColor: 'var(--tp-border)' }} />

                {/* Price breakdown */}
                <div className="my-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--tp-secondary)' }}>Room rate</span>
                    <span style={{ color: 'var(--tp-primary)' }}>
                      {dataLoading
                        ? '—'
                        : `₦${pricePerNight.toLocaleString()} × ${nights} night${nights !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--tp-secondary)' }}>Subtotal</span>
                    <span style={{ color: 'var(--tp-primary)' }}>
                      {dataLoading ? '—' : `₦${subtotal.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--tp-secondary)' }}>Service fee (3%)</span>
                    <span style={{ color: 'var(--tp-primary)' }}>
                      {dataLoading ? '—' : `₦${fee.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <hr style={{ borderColor: 'var(--tp-border)', borderWidth: '2px' }} />

                {/* Total */}
                <div className="my-4 flex justify-between">
                  <span className="text-lg font-bold" style={{ color: 'var(--tp-primary)' }}>
                    Total
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: 'var(--tp-accent)' }}
                  >
                    {dataLoading ? '—' : `₦${total.toLocaleString()}`}
                  </span>
                </div>

                {/* Cancellation policy chip */}
                {!dataLoading && cancellationPolicy && (
                  <div className="mb-4">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={
                        isFreeCancel
                          ? { background: 'var(--tp-accent-light)', color: 'var(--tp-accent)' }
                          : isNonRefundable
                          ? { background: '#fffbeb', color: '#b45309' }
                          : { background: 'var(--tp-muted)', color: 'var(--tp-secondary)' }
                      }
                    >
                      {cancellationPolicy}
                    </span>
                  </div>
                )}

                <p className="text-center text-xs" style={{ color: 'var(--tp-secondary)' }}>
                  Price shown in Nigerian Naira (NGN)
                </p>
              </aside>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ── Page export (wraps inner in Suspense for build compatibility) ──────────────

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{ background: 'var(--tp-bg)', minHeight: '100vh' }}
          className="flex items-center justify-center"
        >
          <p style={{ color: 'var(--tp-secondary)' }}>Loading booking details…</p>
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
