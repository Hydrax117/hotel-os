'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TravelerNav } from '../components/TravelerNav';
import { Footer } from '../components/Footer';
import { HOTEL_DETAILS, HOTEL_ROOM_TYPES, DEFAULT_ROOM_TYPES } from '../hotels/mock';
import { SEARCH_MOCK_HOTELS } from '../search/mock';

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

const CardIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const ShieldIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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

  // Date state — seeded from URL params so a pre-filled link works too
  const [checkInInput, setCheckInInput] = useState(checkIn);
  const [checkOutInput, setCheckOutInput] = useState(checkOut);

  // Guest details state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Payment state
  const [paymentTab, setPaymentTab] = useState<'card' | 'bank'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  // ── Data lookup ──────────────────────────────────────────────────────────────

  const hotelDetail = HOTEL_DETAILS[hotelId];
  const hotelFallback = SEARCH_MOCK_HOTELS.find(h => h.id === hotelId);
  const hotel = hotelDetail ?? hotelFallback;

  const rooms = HOTEL_ROOM_TYPES[hotelId] ?? DEFAULT_ROOM_TYPES;
  const room = rooms.find(r => r.id === roomId);

  // ── Error state ──────────────────────────────────────────────────────────────

  if (!hotel || !room) {
    return (
      <div style={{ background: 'var(--tp-bg)', minHeight: '100vh' }}>
        <TravelerNav />
        <div
          className="flex flex-col items-center justify-center gap-4 px-4"
          style={{ paddingTop: '128px' }}
        >
          <p className="text-lg font-semibold" style={{ color: 'var(--tp-primary)' }}>
            Booking details not found
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

  // ── Calculations ─────────────────────────────────────────────────────────────

  let nights = 1;
  if (checkInInput && checkOutInput) {
    const diff = Math.floor(
      (new Date(checkOutInput).getTime() - new Date(checkInInput).getTime()) / 86400000
    );
    nights = Math.max(1, diff);
  }

  const subtotal = room.pricePerNight * nights;
  const fee = Math.round(subtotal * 0.03);
  const total = subtotal + fee;

  const isFreeCancel = room.cancellationPolicy.toLowerCase().includes('free');
  const isNonRefundable = room.cancellationPolicy.toLowerCase().includes('non-refundable');

  // ── Pay handler ──────────────────────────────────────────────────────────────

  function handlePay() {
    const ref = `HOS-${Math.floor(10000 + Math.random() * 90000)}`;
    router.push(
      `/booking/confirmation?ref=${ref}&hotelId=${hotelId}&roomId=${roomId}` +
        `&checkIn=${checkInInput}&checkOut=${checkOutInput}&guests=${guests}&total=${total}`
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const hotelName = hotel.name;
  const hotelCity = hotel.city;

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
                  handlePay();
                }}
                className="flex flex-col gap-6"
                noValidate
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
                          // If check-out is now before or same as new check-in, clear it
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

                {/* Section 3: Payment */}
                <section
                  className="rounded-xl p-6"
                  style={{
                    background: 'var(--tp-surface)',
                    border: '1px solid var(--tp-border)',
                  }}
                  aria-labelledby="payment-heading"
                >
                  {/* Heading with lock icon */}
                  <div className="mb-5 flex items-center gap-2">
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

                  {/* Payment tabs */}
                  <div className="mb-5 flex gap-2" role="tablist" aria-label="Payment method">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={paymentTab === 'card'}
                      onClick={() => setPaymentTab('card')}
                      className="rounded-full px-5 py-2 text-sm font-medium transition-colors"
                      style={{
                        background: paymentTab === 'card' ? 'var(--tp-primary)' : 'var(--tp-muted)',
                        color: paymentTab === 'card' ? '#fff' : 'var(--tp-secondary)',
                      }}
                    >
                      Card
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={paymentTab === 'bank'}
                      onClick={() => setPaymentTab('bank')}
                      className="rounded-full px-5 py-2 text-sm font-medium transition-colors"
                      style={{
                        background: paymentTab === 'bank' ? 'var(--tp-primary)' : 'var(--tp-muted)',
                        color: paymentTab === 'bank' ? '#fff' : 'var(--tp-secondary)',
                      }}
                    >
                      Bank transfer
                    </button>
                  </div>

                  {/* Card tab */}
                  {paymentTab === 'card' && (
                    <div className="flex flex-col gap-4">
                      {/* Card number with icon */}
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="cardNumber"
                          className="text-sm font-medium"
                          style={{ color: 'var(--tp-primary)' }}
                        >
                          Card number
                        </label>
                        <div className="relative">
                          <input
                            id="cardNumber"
                            type="text"
                            inputMode="numeric"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={e => setCardNumber(e.target.value)}
                            autoComplete="cc-number"
                            className="w-full rounded-lg py-3 pl-4 pr-12 text-sm outline-none transition-colors"
                            style={{
                              border: '1px solid var(--tp-border)',
                              background: 'var(--tp-surface)',
                              color: 'var(--tp-primary)',
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = 'var(--tp-accent)'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'var(--tp-border)'; }}
                          />
                          <span
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            style={{ color: 'var(--tp-secondary)' }}
                            aria-hidden="true"
                          >
                            <CardIcon />
                          </span>
                        </div>
                      </div>

                      {/* Expiry + CVV */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor="expiry"
                            className="text-sm font-medium"
                            style={{ color: 'var(--tp-primary)' }}
                          >
                            Expiry
                          </label>
                          <input
                            id="expiry"
                            type="text"
                            inputMode="numeric"
                            placeholder="MM/YY"
                            value={expiry}
                            onChange={e => setExpiry(e.target.value)}
                            autoComplete="cc-exp"
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
                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor="cvv"
                            className="text-sm font-medium"
                            style={{ color: 'var(--tp-primary)' }}
                          >
                            CVV
                          </label>
                          <input
                            id="cvv"
                            type="text"
                            inputMode="numeric"
                            placeholder="CVV"
                            value={cvv}
                            onChange={e => setCvv(e.target.value)}
                            autoComplete="cc-csc"
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
                      </div>

                      {/* Cardholder name */}
                      <FormInput
                        id="cardholderName"
                        label="Cardholder name"
                        placeholder="Name on card"
                        value={cardholderName}
                        onChange={setCardholderName}
                        autoComplete="cc-name"
                      />

                      {/* Security note */}
                      <div
                        className="flex items-center gap-2"
                        style={{ color: 'var(--tp-secondary)' }}
                      >
                        <ShieldIcon />
                        <span className="text-xs">Your card details are encrypted and secure</span>
                      </div>
                    </div>
                  )}

                  {/* Bank transfer tab */}
                  {paymentTab === 'bank' && (
                    <div
                      className="rounded-lg p-4"
                      style={{ background: 'var(--tp-muted)' }}
                    >
                      <dl className="flex flex-col gap-2 text-sm">
                        <div className="flex justify-between">
                          <dt style={{ color: 'var(--tp-secondary)' }}>Bank</dt>
                          <dd style={{ color: 'var(--tp-primary)' }}>Paystack Trust</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt style={{ color: 'var(--tp-secondary)' }}>Account number</dt>
                          <dd
                            className="font-mono font-bold"
                            style={{ color: 'var(--tp-primary)' }}
                          >
                            0123456789
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt style={{ color: 'var(--tp-secondary)' }}>Account name</dt>
                          <dd style={{ color: 'var(--tp-primary)' }}>Hotel OS Escrow</dd>
                        </div>
                      </dl>
                      <p className="mt-3 text-xs" style={{ color: 'var(--tp-secondary)' }}>
                        Transfer the exact amount shown in your booking summary. Your booking will be
                        confirmed once payment is verified (usually within 5 minutes).
                      </p>
                    </div>
                  )}
                </section>

                {/* Pay button */}
                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'var(--tp-primary)' }}
                  >
                    <LockIcon size={18} />
                    Pay ₦{total.toLocaleString()}
                  </button>
                  <p className="text-center text-sm" style={{ color: 'var(--tp-secondary)' }}>
                    You won&apos;t be charged until you click Pay &amp; reserve
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
                    {hotelName}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--tp-secondary)' }}>
                    {hotelCity}
                  </p>
                </div>

                {/* Room info */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--tp-primary)' }}>
                    {room.name}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ background: 'var(--tp-muted)', color: 'var(--tp-secondary)' }}
                  >
                    {room.bedType} bed
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
                      ₦{room.pricePerNight.toLocaleString()} × {nights} night{nights !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--tp-secondary)' }}>Subtotal</span>
                    <span style={{ color: 'var(--tp-primary)' }}>₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--tp-secondary)' }}>Service fee (3%)</span>
                    <span style={{ color: 'var(--tp-primary)' }}>₦{fee.toLocaleString()}</span>
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
                    ₦{total.toLocaleString()}
                  </span>
                </div>

                {/* Cancellation policy chip */}
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
                    {room.cancellationPolicy}
                  </span>
                </div>

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
