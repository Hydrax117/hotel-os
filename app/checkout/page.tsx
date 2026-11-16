'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TravelerNav } from '../components/TravelerNav';
import { Footer } from '../components/Footer';
import { useAuth } from '../lib/auth-context';
import { createBooking, initializePayment, getResourceCalendar, type CreateBookingPayload } from '../lib/api/bookings';
import { calcNights, calcBookingCost } from '../lib/booking';
import { ApiError, apiClient } from '../lib/api/client';
import type { HotelDetail } from '../lib/api/search';
import type { Resource } from '../lib/api/resources';

// ── Icons ──────────────────────────────────────────────────────────────────────

const LockIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const CalIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
);
const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Form input ────────────────────────────────────────────────────────────────

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
      <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--tp-primary)' }}>
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
        className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-colors"
        style={{ border: '1px solid var(--tp-border)', background: 'var(--tp-surface)', color: 'var(--tp-primary)' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--tp-accent)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--tp-border)'; }}
      />
    </div>
  );
}

// ── Calendar utilities ────────────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
// Abbreviated for small screens
const DAY_LABELS = ['M','T','W','T','F','S','S'];

function calToYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function calAddMonths(d: Date, n: number) {
  const nd = new Date(d); nd.setDate(1); nd.setMonth(nd.getMonth()+n); return nd;
}
function calDaysInMonth(y: number, m: number) { return new Date(y, m+1, 0).getDate(); }
function calFirstWeekday(y: number, m: number) { return (new Date(y,m,1).getDay()+6)%7; }

// ── Inline availability calendar ──────────────────────────────────────────────

type InlineCalendarProps = {
  roomId: string;
  checkIn: string;
  checkOut: string;
  onCheckInChange: (v: string) => void;
  onCheckOutChange: (v: string) => void;
};

function InlineCalendar({ roomId, checkIn, checkOut, onCheckInChange, onCheckOutChange }: InlineCalendarProps) {
  const today = calToYMD(new Date());

  const [anchor, setAnchor] = useState<Date>(() => {
    if (checkIn) { const d = new Date(checkIn+'T00:00:00'); d.setDate(1); return d; }
    const d = new Date(); d.setDate(1); return d;
  });

  const [calData, setCalData] = useState<Map<string, boolean>>(new Map());
  const [calLoading, setCalLoading] = useState(true);
  const [phase, setPhase] = useState<'checkin'|'checkout'>(checkIn && !checkOut ? 'checkout' : 'checkin');
  const [hovered, setHovered] = useState<string|null>(null);

  const fetchData = useCallback(async (anch: Date) => {
    if (!roomId) return;
    setCalLoading(true);
    try {
      const from = calToYMD(anch);
      const to = calToYMD(calAddMonths(anch, 3));
      const data = await getResourceCalendar(roomId, from, to);
      setCalData(prev => {
        const next = new Map(prev);
        for (const { date, available } of data) next.set(date, available);
        return next;
      });
    } catch { /* non-fatal */ }
    finally { setCalLoading(false); }
  }, [roomId]);

  useEffect(() => { void fetchData(anchor); }, [fetchData, anchor]);

  const unavailable = React.useMemo(() => {
    const s = new Set<string>();
    for (const [d, av] of calData) { if (!av) s.add(d); }
    return s;
  }, [calData]);

  const rangeEnd = checkIn ? (checkOut || hovered) : null;

  function getState(ymd: string) {
    if (ymd < today) return 'past';
    if (unavailable.has(ymd)) return 'unavailable';
    if (ymd === checkIn) return 'checkin';
    if (ymd === checkOut) return 'checkout';
    if (checkIn && rangeEnd) {
      const lo = checkIn < rangeEnd ? checkIn : rangeEnd;
      const hi = checkIn < rangeEnd ? rangeEnd : checkIn;
      if (ymd > lo && ymd < hi) return 'inrange';
    }
    if (ymd === today) return 'today';
    return 'available';
  }

  function handleDayClick(ymd: string) {
    if (phase === 'checkin') {
      onCheckInChange(ymd); onCheckOutChange(''); setPhase('checkout');
    } else {
      if (!checkIn || ymd <= checkIn) { onCheckInChange(ymd); onCheckOutChange(''); return; }
      let blocked = false;
      for (const b of unavailable) { if (b > checkIn && b < ymd) { blocked = true; break; } }
      if (blocked) { onCheckInChange(ymd); onCheckOutChange(''); return; }
      onCheckOutChange(ymd); setPhase('checkin');
    }
  }

  function renderMonth(year: number, month: number) {
    const days = calDaysInMonth(year, month);
    const offset = calFirstWeekday(year, month);
    const cells: (string|null)[] = Array(offset).fill(null);
    for (let d = 1; d <= days; d++) {
      cells.push(`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div>
        <p className="mb-3 text-center text-sm font-semibold" style={{ color: 'var(--tp-primary)' }}>
          {MONTH_NAMES[month]} {year}
        </p>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((l, i) => (
            <div key={i} className="text-center text-xs py-1 font-medium" style={{ color: 'var(--tp-secondary)' }}>{l}</div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((ymd, i) => {
            if (!ymd) return <div key={i} aria-hidden="true" />;

            const state = getState(ymd);
            const disabled = state === 'past' || state === 'unavailable';
            const isCI = state === 'checkin';
            const isCO = state === 'checkout';
            const isRange = state === 'inrange';

            const nextYmd = cells[i+1];
            const prevYmd = i > 0 ? cells[i-1] : null;
            const nextInRange = nextYmd ? ['checkin','checkout','inrange'].includes(getState(nextYmd)) : false;
            const prevInRange = prevYmd ? ['checkin','checkout','inrange'].includes(getState(prevYmd)) : false;

            let rangeBg = 'transparent';
            if (isRange) rangeBg = 'var(--tp-accent-light, rgba(217,119,6,0.1))';
            if (isCI && nextInRange) rangeBg = 'linear-gradient(to right, transparent 50%, var(--tp-accent-light, rgba(217,119,6,0.1)) 50%)';
            if (isCO && prevInRange) rangeBg = 'linear-gradient(to left, transparent 50%, var(--tp-accent-light, rgba(217,119,6,0.1)) 50%)';
            if (isCI && isCO) rangeBg = 'transparent';

            return (
              <div key={ymd} style={{ background: rangeBg }} className="flex items-center justify-center py-0.5">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && handleDayClick(ymd)}
                  onMouseEnter={() => !disabled && phase === 'checkout' && checkIn && setHovered(ymd)}
                  onMouseLeave={() => setHovered(null)}
                  /* Minimum 44×44 touch target */
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2"
                  style={{
                    cursor: disabled ? 'default' : 'pointer',
                    opacity: state === 'past' ? 0.3 : 1,
                    textDecoration: state === 'unavailable' ? 'line-through' : undefined,
                    background: (isCI || isCO) ? 'var(--tp-accent)' : 'transparent',
                    color: disabled
                      ? 'var(--tp-secondary)'
                      : (isCI || isCO) ? '#fff'
                      : (isRange || state === 'today') ? 'var(--tp-accent)'
                      : 'var(--tp-primary)',
                    fontWeight: state === 'today' ? 700 : undefined,
                    outlineColor: 'var(--tp-accent)',
                  }}
                  aria-label={ymd}
                  aria-pressed={isCI || isCO}
                >
                  {new Date(ymd+'T00:00:00').getDate()}
                  {/* Booked dot */}
                  {state === 'unavailable' && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full" style={{ background: 'var(--tp-accent)' }} aria-hidden="true" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const canGoBack = anchor > new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const instruction = phase === 'checkin' ? 'Tap a date to set check-in' : 'Now tap a date to set check-out';

  return (
    <div>
      {/* Phase instruction */}
      <p className="mb-3 text-sm font-medium" style={{ color: 'var(--tp-accent)' }}>{instruction}</p>

      {/* Loading indicator */}
      {calLoading && (
        <div className="flex items-center gap-2 mb-3 text-sm" style={{ color: 'var(--tp-secondary)' }}>
          <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Checking room availability…
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => setAnchor(prev => calAddMonths(prev, -1))}
          aria-label="Previous month"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:opacity-30"
          style={{ background: 'var(--tp-muted)', color: 'var(--tp-primary)', cursor: canGoBack ? 'pointer' : 'default' }}
        >
          <ChevronLeft />
        </button>
        <div />
        <button
          type="button"
          onClick={() => setAnchor(prev => calAddMonths(prev, 1))}
          aria-label="Next month"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          style={{ background: 'var(--tp-muted)', color: 'var(--tp-primary)', cursor: 'pointer' }}
        >
          <ChevronRight />
        </button>
      </div>

      {/* On mobile: single month. On sm+: two months side by side */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {renderMonth(anchor.getFullYear(), anchor.getMonth())}
        <div className="hidden sm:block">
          {(() => {
            const m2 = calAddMonths(anchor, 1);
            return renderMonth(m2.getFullYear(), m2.getMonth());
          })()}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 flex flex-wrap gap-3 text-xs" style={{ borderTop: '1px solid var(--tp-border)', color: 'var(--tp-secondary)' }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ background: 'var(--tp-accent)', fontSize: '0.6rem' }}>7</span>
          Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full" style={{ background: 'var(--tp-accent-light, rgba(217,119,6,0.1))', color: 'var(--tp-accent)', fontSize: '0.6rem' }}>7</span>
          Stay range
        </span>
        <span className="flex items-center gap-1.5">
          <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full text-xs" style={{ color: 'var(--tp-secondary)', textDecoration: 'line-through', opacity: 0.5 }}>7</span>
          Booked
        </span>
      </div>
    </div>
  );
}

// ── Booking summary card (shared by sidebar + mobile drawer) ──────────────────

type SummaryProps = {
  dataLoading: boolean;
  hotelName: string;
  hotelCity: string;
  roomName: string;
  roomDescription: string;
  roomCapacity: number | null;
  roomCategory: string;
  roomBookingUnit: string;
  roomPrimaryImage: string | null;
  checkInInput: string;
  checkOutInput: string;
  nights: number;
  guests: string;
  pricePerNight: number;
  subtotal: number;
  fee: number;
  total: number;
  cancellationPolicy: string;
  isFreeCancel: boolean;
  isNonRefundable: boolean;
};

function BookingSummaryCard({
  dataLoading, hotelName, hotelCity, roomName, roomDescription, roomCapacity,
  roomCategory, roomBookingUnit, roomPrimaryImage,
  checkInInput, checkOutInput, nights, guests,
  pricePerNight, subtotal, fee, total,
  cancellationPolicy, isFreeCancel, isNonRefundable,
}: SummaryProps) {
  return (
    <div className="flex flex-col gap-0">
      {/* Room image */}
      {!dataLoading && (
        <div className="overflow-hidden rounded-t-xl" style={{ borderBottom: '1px solid var(--tp-border)' }}>
          {roomPrimaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={roomPrimaryImage}
              alt={roomName}
              style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div
              style={{ height: 100, background: 'var(--tp-muted)' }}
              className="flex items-center justify-center"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--tp-secondary)' }} aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
          )}
        </div>
      )}

      <div className="p-5 flex flex-col gap-4">
        {/* Hotel + room names */}
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--tp-primary)' }}>
            {dataLoading ? '—' : hotelName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tp-secondary)' }}>
            {dataLoading ? '' : hotelCity}
          </p>
          {!dataLoading && (
            <div className="mt-2 flex flex-col gap-0.5">
              <p className="text-sm font-medium" style={{ color: 'var(--tp-primary)' }}>{roomName}</p>
              {roomCategory && <p className="text-xs" style={{ color: 'var(--tp-secondary)' }}>{roomCategory}</p>}
              {roomDescription && (
                <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--tp-secondary)' }}>
                  {roomDescription.length > 80 ? roomDescription.slice(0, 80) + '…' : roomDescription}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {roomCapacity && (
                  <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'var(--tp-muted)', color: 'var(--tp-secondary)' }}>
                    Up to {roomCapacity} guest{roomCapacity !== 1 ? 's' : ''}
                  </span>
                )}
                <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'var(--tp-muted)', color: 'var(--tp-secondary)' }}>
                  Per {roomBookingUnit}
                </span>
              </div>
            </div>
          )}
        </div>

        <hr style={{ borderColor: 'var(--tp-border)', margin: 0 }} />

        {/* Dates & guests */}
        <dl className="flex flex-col gap-2">
          {[
            { label: 'Check-in', value: formatDate(checkInInput) },
            { label: 'Check-out', value: formatDate(checkOutInput) },
            { label: 'Nights', value: nights > 0 ? `${nights} night${nights !== 1 ? 's' : ''}` : '—' },
            { label: 'Guests', value: `${guests} guest${Number(guests) !== 1 ? 's' : ''}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <dt style={{ color: 'var(--tp-secondary)' }}>{label}</dt>
              <dd style={{ color: 'var(--tp-primary)', fontWeight: 500 }}>{value}</dd>
            </div>
          ))}
        </dl>

        <hr style={{ borderColor: 'var(--tp-border)', margin: 0 }} />

        {/* Price breakdown */}
        <dl className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <dt style={{ color: 'var(--tp-secondary)' }}>Room rate</dt>
            <dd style={{ color: 'var(--tp-primary)' }}>
              {dataLoading ? '—' : pricePerNight > 0 ? `₦${pricePerNight.toLocaleString()} × ${nights}` : 'TBD'}
            </dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt style={{ color: 'var(--tp-secondary)' }}>Subtotal</dt>
            <dd style={{ color: 'var(--tp-primary)' }}>{dataLoading ? '—' : pricePerNight > 0 ? `₦${subtotal.toLocaleString()}` : '—'}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt style={{ color: 'var(--tp-secondary)' }}>Service fee (3%)</dt>
            <dd style={{ color: 'var(--tp-primary)' }}>{dataLoading ? '—' : pricePerNight > 0 ? `₦${fee.toLocaleString()}` : '—'}</dd>
          </div>
        </dl>

        <hr style={{ borderColor: 'var(--tp-border)', borderWidth: 2, margin: 0 }} />

        {/* Total */}
        <div className="flex items-baseline justify-between">
          <span className="text-base font-bold" style={{ color: 'var(--tp-primary)' }}>Total</span>
          <span className="text-xl font-bold" style={{ color: 'var(--tp-accent)' }}>
            {dataLoading ? '—' : pricePerNight > 0 ? `₦${total.toLocaleString()}` : 'TBD'}
          </span>
        </div>

        {/* No-price warning */}
        {!dataLoading && pricePerNight === 0 && (
          <div className="rounded-lg px-3 py-2.5 text-xs" style={{ background: '#fef3c7', color: '#92400e' }}>
            Price not set for this room. The hotel owner must set a price before booking.
          </div>
        )}

        {/* Cancellation badge */}
        {!dataLoading && cancellationPolicy && (
          <span
            className="self-start rounded-full px-3 py-1 text-xs font-medium"
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
        )}

        <p className="text-center text-xs" style={{ color: 'var(--tp-secondary)' }}>
          Price in Nigerian Naira (NGN)
        </p>
      </div>
    </div>
  );
}

// ── Main checkout ─────────────────────────────────────────────────────────────

function CheckoutInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const hotelId  = searchParams.get('hotelId')  ?? '';
  const roomId   = searchParams.get('roomId')   ?? '';
  const checkIn  = searchParams.get('checkIn')  ?? '';
  const checkOut = searchParams.get('checkOut') ?? '';
  const guests   = searchParams.get('guests')   ?? '1';

  // Auth gate
  const { user, isLoading: authLoading } = useAuth();
  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/signin?redirect=/checkout');
  }, [authLoading, user, router]);

  // Date state — seeded from URL
  const [checkInInput,  setCheckInInput]  = useState(checkIn);
  const [checkOutInput, setCheckOutInput] = useState(checkOut);

  // Guest details
  const [firstName,       setFirstName]       = useState('');
  const [lastName,        setLastName]        = useState('');
  const [email,           setEmail]           = useState('');
  const [phone,           setPhone]           = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    if (user) { setFirstName(user.firstName); setLastName(user.lastName); setEmail(user.email); }
  }, [user]);

  // Hotel/room data
  const [hotelName,       setHotelName]       = useState('');
  const [hotelCity,       setHotelCity]       = useState('');
  const [roomName,        setRoomName]        = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [roomCapacity,    setRoomCapacity]    = useState<number | null>(null);
  const [roomCategory,    setRoomCategory]    = useState('');
  const [roomBookingUnit, setRoomBookingUnit] = useState('night');
  const [roomPrimaryImage,setRoomPrimaryImage]= useState<string | null>(null);
  const [pricePerNight,   setPricePerNight]   = useState(0);
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError,   setDataError]   = useState('');

  useEffect(() => {
    if (!hotelId || !roomId) return;
    setDataLoading(true);
    Promise.all([
      apiClient.get<HotelDetail>(`/api/v1/hotels/${hotelId}`),
      apiClient.get<Resource>(`/api/v1/resources/${roomId}`),
    ])
      .then(([hotel, resource]) => {
        setHotelName(hotel.name);
        setHotelCity(hotel.city);
        setRoomName(resource.name);
        setRoomDescription(resource.description ?? '');
        setRoomCapacity(resource.capacity ?? null);
        setRoomCategory(resource.category?.name ?? '');
        setRoomBookingUnit(resource.bookingUnit?.toLowerCase() ?? 'night');
        const primary = resource.images?.find(img => img.isPrimary) ?? resource.images?.[0];
        setRoomPrimaryImage(primary?.url ?? null);
        setPricePerNight(resource.pricePerNight ? Number(resource.pricePerNight) : 0);
        setCancellationPolicy('');
      })
      .catch(() => setDataError('Failed to load booking details.'))
      .finally(() => setDataLoading(false));
  }, [hotelId, roomId]);

  // Mobile summary drawer
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Submit
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState('');
  const [formError,    setFormError]    = useState('');

  // Calculations
  const nights = calcNights(checkInInput, checkOutInput);
  const { subtotal, fee, total } = calcBookingCost(pricePerNight, nights);
  const isFreeCancel    = cancellationPolicy.toLowerCase().includes('free');
  const isNonRefundable = cancellationPolicy.toLowerCase().includes('non-refundable');

  const summaryProps: SummaryProps = {
    dataLoading, hotelName, hotelCity, roomName, roomDescription, roomCapacity,
    roomCategory, roomBookingUnit, roomPrimaryImage,
    checkInInput, checkOutInput, nights, guests,
    pricePerNight, subtotal, fee, total,
    cancellationPolicy, isFreeCancel, isNonRefundable,
  };

  async function handlePay(): Promise<void> {
    if (!firstName.trim()) { setFormError('Please enter your first name.'); return; }
    if (!lastName.trim())  { setFormError('Please enter your last name.'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid email address.'); return;
    }
    if (!phone.trim())       { setFormError('Please enter your phone number.'); return; }
    if (!checkInInput)       { setFormError('Please select a check-in date.'); return; }
    if (!checkOutInput)      { setFormError('Please select a check-out date.'); return; }

    setFormError(''); setSubmitting(true); setSubmitError('');
    try {
      const payload: CreateBookingPayload = {
        hotelId, resourceId: roomId,
        checkIn: checkInInput, checkOut: checkOutInput,
        guests: Number(guests),
        guestFirstName: firstName.trim(), guestLastName: lastName.trim(),
        guestEmail: email.trim(), guestPhone: phone.trim(),
        specialRequests: specialRequests.trim() || undefined,
      };
      const booking = await createBooking(payload);
      const callbackUrl = `${window.location.origin}/payment/callback`;
      const payment = await initializePayment(booking.id, email.trim(), callbackUrl);
      window.location.href = payment.paymentUrl;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading / error guards ────────────────────────────────────────────────

  if (authLoading || !user) {
    return (
      <div style={{ background: 'var(--tp-bg)', minHeight: '100vh' }} className="flex items-center justify-center">
        <TravelerNav />
        <p style={{ color: 'var(--tp-secondary)' }}>Loading…</p>
      </div>
    );
  }

  if (!dataLoading && dataError) {
    return (
      <div style={{ background: 'var(--tp-bg)', minHeight: '100vh' }}>
        <TravelerNav />
        <div className="flex flex-col items-center justify-center gap-4 px-4" style={{ paddingTop: 128 }}>
          <p className="text-lg font-semibold" style={{ color: 'var(--tp-primary)' }}>{dataError}</p>
          <Link href="/hotels" className="text-sm underline" style={{ color: 'var(--tp-accent)' }}>← Back to hotels</Link>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const payLabel = submitting
    ? 'Processing…'
    : pricePerNight === 0 && !dataLoading
    ? 'Price not set'
    : nights > 0
    ? `Pay ₦${total.toLocaleString()}`
    : 'Select dates to continue';

  const payDisabled = submitting || (!dataLoading && pricePerNight === 0) || !checkInInput || !checkOutInput;

  return (
    <div style={{ background: 'var(--tp-bg)', minHeight: '100vh' }}>
      <TravelerNav />

      {/* ── Mobile summary drawer ────────────────────────────────────────── */}
      {summaryOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setSummaryOpen(false)}
        >
          <div
            className="rounded-t-2xl overflow-y-auto max-h-[85dvh]"
            style={{ background: 'var(--tp-surface)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full" style={{ background: 'var(--tp-border)' }} />
            </div>
            <div className="px-1">
              <BookingSummaryCard {...summaryProps} />
            </div>
            <div className="px-5 pb-6">
              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                className="w-full rounded-xl py-3 text-sm font-semibold transition-colors"
                style={{ background: 'var(--tp-muted)', color: 'var(--tp-primary)', border: 'none', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <main style={{ paddingTop: 56 }}>
        {/* ── Mobile summary bar ────────────────────────────────────────── */}
        <div
          className="lg:hidden sticky top-14 z-30 flex items-center justify-between gap-3 px-4 py-3"
          style={{ background: 'var(--tp-surface)', borderBottom: '1px solid var(--tp-border)' }}
        >
          <div className="flex flex-col gap-0 min-w-0">
            <p className="text-xs truncate" style={{ color: 'var(--tp-secondary)' }}>
              {dataLoading ? 'Loading…' : `${hotelName} · ${roomName}`}
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--tp-accent)' }}>
              {!dataLoading && pricePerNight > 0 && nights > 0
                ? `₦${total.toLocaleString()} total`
                : !dataLoading && pricePerNight > 0
                ? `₦${pricePerNight.toLocaleString()} / ${roomBookingUnit}`
                : dataLoading ? '…' : 'Price TBD'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSummaryOpen(true)}
            className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
            style={{ background: 'var(--tp-muted)', color: 'var(--tp-primary)', border: '1px solid var(--tp-border)' }}
          >
            Summary
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10 lg:px-6">

          {/* Back link */}
          <Link
            href={hotelId ? `/hotels/${hotelId}` : '/hotels'}
            className="mb-5 inline-flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: 'var(--tp-secondary)' }}
          >
            <ChevronLeft />
            Back to hotel
          </Link>

          <h1 className="mb-6 text-xl font-bold sm:text-2xl" style={{ color: 'var(--tp-primary)' }}>
            Complete your booking
          </h1>

          {/* Two-column layout — form left, summary right on desktop */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">

            {/* ── Form ───────────────────────────────────────────────────── */}
            <form
              onSubmit={e => { e.preventDefault(); void handlePay(); }}
              className="flex flex-col gap-5"
            >

              {/* Section: Dates */}
              <section
                className="rounded-2xl p-5 sm:p-6"
                style={{ background: 'var(--tp-surface)', border: '1px solid var(--tp-border)' }}
                aria-labelledby="dates-heading"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 id="dates-heading" className="text-base font-semibold" style={{ color: 'var(--tp-primary)' }}>
                    When are you staying?
                  </h2>
                  {/* Selected date chips */}
                  {checkInInput && checkOutInput && nights > 0 && (
                    <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--tp-accent)', color: '#fff' }}>
                      {nights} night{nights !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Selected dates row */}
                {(checkInInput || checkOutInput) && (
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    <div
                      className="rounded-xl px-3 py-3 cursor-pointer transition-colors"
                      style={{
                        border: '1px solid var(--tp-border)',
                        background: 'var(--tp-muted)',
                      }}
                      onClick={() => {/* calendar handles reset via phase */}}
                      role="presentation"
                    >
                      <p className="text-xs mb-0.5 flex items-center gap-1" style={{ color: 'var(--tp-secondary)' }}>
                        <CalIcon size={11} /> Check-in
                      </p>
                      <p className="text-sm font-semibold truncate" style={{ color: checkInInput ? 'var(--tp-primary)' : 'var(--tp-secondary)' }}>
                        {checkInInput ? formatDateShort(checkInInput) : '—'}
                      </p>
                    </div>
                    <div
                      className="rounded-xl px-3 py-3"
                      style={{ border: '1px solid var(--tp-border)', background: 'var(--tp-muted)' }}
                    >
                      <p className="text-xs mb-0.5 flex items-center gap-1" style={{ color: 'var(--tp-secondary)' }}>
                        <CalIcon size={11} /> Check-out
                      </p>
                      <p className="text-sm font-semibold truncate" style={{ color: checkOutInput ? 'var(--tp-primary)' : 'var(--tp-secondary)' }}>
                        {checkOutInput ? formatDateShort(checkOutInput) : '—'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Calendar */}
                {roomId && (
                  <InlineCalendar
                    roomId={roomId}
                    checkIn={checkInInput}
                    checkOut={checkOutInput}
                    onCheckInChange={setCheckInInput}
                    onCheckOutChange={setCheckOutInput}
                  />
                )}
              </section>

              {/* Section: Your details */}
              <section
                className="rounded-2xl p-5 sm:p-6"
                style={{ background: 'var(--tp-surface)', border: '1px solid var(--tp-border)' }}
                aria-labelledby="details-heading"
              >
                <h2 id="details-heading" className="mb-5 text-base font-semibold" style={{ color: 'var(--tp-primary)' }}>
                  Your details
                </h2>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormInput id="firstName" label="First name" placeholder="Emeka" value={firstName} onChange={setFirstName} required autoComplete="given-name" />
                    <FormInput id="lastName"  label="Last name"  placeholder="Obi"   value={lastName}  onChange={setLastName}  required autoComplete="family-name" />
                  </div>
                  <FormInput id="email" label="Email address" type="email" placeholder="emeka@example.com" value={email} onChange={setEmail} required autoComplete="email" />
                  <FormInput id="phone" label="Phone number"  type="tel"   placeholder="+234 800 000 0000"  value={phone} onChange={setPhone} required autoComplete="tel" />
                </div>
              </section>

              {/* Section: Special requests */}
              <section
                className="rounded-2xl p-5 sm:p-6"
                style={{ background: 'var(--tp-surface)', border: '1px solid var(--tp-border)' }}
                aria-labelledby="requests-heading"
              >
                <h2 id="requests-heading" className="mb-4 text-base font-semibold" style={{ color: 'var(--tp-primary)' }}>
                  Special requests{' '}
                  <span className="text-sm font-normal" style={{ color: 'var(--tp-secondary)' }}>(optional)</span>
                </h2>
                <label htmlFor="specialRequests" className="sr-only">Special requests</label>
                <textarea
                  id="specialRequests"
                  rows={3}
                  placeholder="e.g. High floor, extra pillows, late check-in…"
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-colors resize-none"
                  style={{ border: '1px solid var(--tp-border)', background: 'var(--tp-surface)', color: 'var(--tp-primary)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--tp-accent)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--tp-border)'; }}
                />
                <p className="mt-2 text-xs" style={{ color: 'var(--tp-secondary)' }}>
                  Requests are subject to availability and cannot be guaranteed.
                </p>
              </section>

              {/* Section: Secure payment notice */}
              <section
                className="rounded-2xl p-5 sm:p-6"
                style={{ background: 'var(--tp-surface)', border: '1px solid var(--tp-border)' }}
                aria-labelledby="payment-heading"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: 'var(--tp-primary)' }}><LockIcon size={16} /></span>
                  <h2 id="payment-heading" className="text-base font-semibold" style={{ color: 'var(--tp-primary)' }}>
                    Secure payment
                  </h2>
                </div>
                <p className="text-sm" style={{ color: 'var(--tp-secondary)' }}>
                  You'll be redirected to Paystack's secure payment page to complete your booking.
                </p>
              </section>

              {/* Error messages */}
              {(formError || submitError) && (
                <p role="alert" className="rounded-xl px-4 py-3 text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  {formError || submitError}
                </p>
              )}

              {/* Desktop pay button — hidden on mobile (uses sticky bottom bar instead) */}
              <div className="hidden lg:flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={payDisabled}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--tp-accent)', border: 'none', cursor: payDisabled ? 'not-allowed' : 'pointer' }}
                >
                  <LockIcon size={17} />
                  {payLabel}
                </button>
                <p className="text-center text-xs" style={{ color: 'var(--tp-secondary)' }}>
                  You won't be charged until payment is completed on Paystack
                </p>
                <p className="text-center text-xs" style={{ color: 'var(--tp-secondary)' }}>
                  By booking you agree to our{' '}
                  <Link href="/terms" className="underline" style={{ color: 'var(--tp-accent)' }}>Terms</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="underline" style={{ color: 'var(--tp-accent)' }}>Privacy Policy</Link>
                </p>
              </div>
            </form>

            {/* ── Desktop summary sidebar ─────────────────────────────────── */}
            <aside
              className="hidden lg:block"
              style={{ position: 'sticky', top: 88, alignSelf: 'flex-start' }}
            >
              <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid var(--tp-border)' }}>
                <BookingSummaryCard {...summaryProps} />
              </div>
            </aside>

          </div>
        </div>

        <div className="hidden lg:block">
          <Footer />
        </div>
      </main>

      {/* ── Mobile sticky pay bar ─────────────────────────────────────────── */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-safe"
        style={{
          background: 'var(--tp-surface)',
          borderTop: '1px solid var(--tp-border)',
          paddingTop: 12,
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Error — show inline above button */}
        {(formError || submitError) && (
          <p role="alert" className="mb-2 rounded-lg px-3 py-2 text-xs" style={{ background: '#fee2e2', color: '#dc2626' }}>
            {formError || submitError}
          </p>
        )}

        <div className="flex items-center gap-3">
          {/* Total + nights blurb */}
          <div className="flex flex-col min-w-0">
            {nights > 0 && pricePerNight > 0 ? (
              <>
                <span className="text-base font-bold leading-tight" style={{ color: 'var(--tp-primary)' }}>
                  ₦{total.toLocaleString()}
                </span>
                <span className="text-xs" style={{ color: 'var(--tp-secondary)' }}>
                  {nights} night{nights !== 1 ? 's' : ''} total
                </span>
              </>
            ) : (
              <span className="text-sm" style={{ color: 'var(--tp-secondary)' }}>
                {!checkInInput ? 'Pick dates above' : !checkOutInput ? 'Pick check-out' : 'Price TBD'}
              </span>
            )}
          </div>

          {/* Pay button */}
          <button
            type="button"
            disabled={payDisabled}
            onClick={() => void handlePay()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: 'var(--tp-accent)', border: 'none', cursor: payDisabled ? 'not-allowed' : 'pointer' }}
          >
            <LockIcon size={15} />
            {payLabel}
          </button>
        </div>

        <p className="mt-2 text-center text-xs" style={{ color: 'var(--tp-secondary)' }}>
          By booking you agree to our{' '}
          <Link href="/terms" className="underline" style={{ color: 'var(--tp-accent)' }}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline" style={{ color: 'var(--tp-accent)' }}>Privacy Policy</Link>
        </p>
      </div>

      {/* Spacer so content above the sticky bar isn't clipped on mobile */}
      <div className="lg:hidden" style={{ height: 120 }} aria-hidden="true" />
      <div className="lg:hidden"><Footer /></div>
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div style={{ background: 'var(--tp-bg)', minHeight: '100vh' }} className="flex items-center justify-center">
          <p style={{ color: 'var(--tp-secondary)' }}>Loading booking details…</p>
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
