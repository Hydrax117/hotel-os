'use client';

/**
 * RoomDetailDrawer
 *
 * A slide-up bottom sheet (mobile) / side sheet (desktop) that shows full room
 * detail for both travelers and hotel owners.
 *
 * Travelers see:
 *   - All room images (carousel)
 *   - Full description, amenities, capacity, booking unit
 *   - Availability calendar with blocked dates highlighted
 *   - "Reserve" CTA that proceeds to checkout when dates are confirmed
 *
 * Hotel owners additionally see:
 *   - Edit button → inline edit form for name, price, description, visibility
 *   - Archive button (soft-delete — preserves booking history)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { RoomAvailability } from '@/app/lib/api/search';
import { resourcesApi, type Resource } from '@/app/lib/api/resources';
import { getResourceCalendar } from '@/app/lib/api/bookings';
import { apiClient, ApiError } from '@/app/lib/api/client';
import RoomScene3DLazy from './RoomScene3DLazy';

// ── Utility types ─────────────────────────────────────────────────────────────

export type DrawerRole = 'traveler' | 'owner';

type Props = {
  room: RoomAvailability;
  hotelId: string;
  role: DrawerRole;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  onClose: () => void;
  /** Called after a successful archive so parent can remove card */
  onArchived?: (resourceId: string) => void;
  /** Called after a successful edit so parent can refresh */
  onEdited?: (resourceId: string, patch: Partial<Resource>) => void;
};

// ── Calendar utilities ────────────────────────────────────────────────────────

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_ABBR = ['M','T','W','T','F','S','S'];

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function addMonths(d: Date, n: number) { const nd = new Date(d); nd.setDate(1); nd.setMonth(nd.getMonth()+n); return nd; }
function daysInMonth(y: number, m: number) { return new Date(y, m+1, 0).getDate(); }
function firstWeekday(y: number, m: number) { return (new Date(y,m,1).getDay()+6)%7; }

// ── Icons ─────────────────────────────────────────────────────────────────────

const X = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ChevL = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const ChevR = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const CalIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const ArchiveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
    <line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
);

// ── Booking unit labels ───────────────────────────────────────────────────────

const UNIT_LABELS: Record<string, string> = {
  NIGHT: 'night', HOUR: 'hour', DAY: 'day', SESSION: 'session', CUSTOM: 'booking',
};

// ── Calendar component (read-only view + range selection) ─────────────────────

type CalProps = {
  resourceId: string;
  checkIn: string | null;
  checkOut: string | null;
  phase: 'checkin' | 'checkout' | 'done';
  onDayClick: (ymd: string) => void;
};

function AvailabilityCalendar({ resourceId, checkIn, checkOut, phase, onDayClick }: CalProps) {
  const today = toYMD(new Date());
  const [anchor, setAnchor] = useState<Date>(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [calMap, setCalMap] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);

  const load = useCallback(async (anch: Date) => {
    if (!resourceId) return;
    setLoading(true);
    try {
      const from = toYMD(anch);
      const to = toYMD(addMonths(anch, 3));
      const data = await getResourceCalendar(resourceId, from, to);
      setCalMap(prev => {
        const next = new Map(prev);
        for (const { date, available } of data) next.set(date, available);
        return next;
      });
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }, [resourceId]);

  useEffect(() => { void load(anchor); }, [load, anchor]);

  const booked = React.useMemo(() => {
    const s = new Set<string>();
    for (const [d, av] of calMap) { if (!av) s.add(d); }
    return s;
  }, [calMap]);

  const rangeEnd = checkIn ? (checkOut || (phase === 'checkout' ? hovered : null)) : null;

  function getState(ymd: string) {
    if (ymd < today) return 'past';
    if (booked.has(ymd)) return 'booked';
    if (ymd === checkIn) return 'checkin';
    if (ymd === checkOut) return 'checkout';
    if (checkIn && rangeEnd) {
      const lo = checkIn < rangeEnd ? checkIn : rangeEnd;
      const hi = checkIn < rangeEnd ? rangeEnd : checkIn;
      if (ymd > lo && ymd < hi) return 'inrange';
    }
    if (ymd === today) return 'today';
    return 'free';
  }

  function renderMonth(year: number, month: number) {
    const days = daysInMonth(year, month);
    const offset = firstWeekday(year, month);
    const cells: (string | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= days; d++) {
      cells.push(`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div>
        <p className="mb-2 text-center text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {MONTH_NAMES[month]} {year}
        </p>
        <div className="grid grid-cols-7 mb-1">
          {DAY_ABBR.map((l, i) => (
            <div key={i} className="text-center text-xs py-0.5 font-medium" style={{ color: 'var(--color-text-secondary)' }}>{l}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((ymd, i) => {
            if (!ymd) return <div key={i} aria-hidden="true" />;
            const state = getState(ymd);
            const isBooked = state === 'booked';
            const isPast = state === 'past';
            const disabled = isBooked || isPast;
            const isCI = state === 'checkin';
            const isCO = state === 'checkout';
            const isRange = state === 'inrange';
            const isToday = state === 'today';

            const nextYmd = cells[i + 1];
            const prevYmd = i > 0 ? cells[i - 1] : null;
            const nextInRange = nextYmd ? ['checkin','inrange','checkout'].includes(getState(nextYmd)) : false;
            const prevInRange = prevYmd ? ['checkin','inrange','checkout'].includes(getState(prevYmd)) : false;

            let rowBg = 'transparent';
            if (isRange) rowBg = 'var(--color-brand-light)';
            if (isCI && nextInRange) rowBg = 'linear-gradient(to right, transparent 50%, var(--color-brand-light) 50%)';
            if (isCO && prevInRange) rowBg = 'linear-gradient(to left, transparent 50%, var(--color-brand-light) 50%)';
            if (isCI && isCO) rowBg = 'transparent';

            return (
              <div key={ymd} style={{ background: rowBg }} className="flex items-center justify-center py-0.5">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && onDayClick(ymd)}
                  onMouseEnter={() => !disabled && phase === 'checkout' && setHovered(ymd)}
                  onMouseLeave={() => setHovered(null)}
                  aria-label={`${ymd}${isBooked ? ' — booked' : ''}`}
                  aria-pressed={isCI || isCO}
                  aria-disabled={disabled}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2"
                  style={{
                    cursor: disabled ? 'default' : 'pointer',
                    /* Booked dates: red-tinted background, struck-through text */
                    background: isBooked
                      ? 'rgba(239,68,68,0.1)'
                      : (isCI || isCO)
                      ? 'var(--color-brand)'
                      : 'transparent',
                    color: isBooked
                      ? 'rgba(239,68,68,0.6)'
                      : isPast
                      ? 'var(--color-text-secondary)'
                      : (isCI || isCO)
                      ? '#fff'
                      : (isRange || isToday)
                      ? 'var(--color-brand)'
                      : 'var(--color-text-primary)',
                    opacity: isPast ? 0.3 : 1,
                    textDecoration: isBooked ? 'line-through' : undefined,
                    fontWeight: (isToday || isCI || isCO) ? 700 : undefined,
                    outlineColor: 'var(--color-brand)',
                    /* Booked: dashed border ring */
                    border: isBooked ? '1px dashed rgba(239,68,68,0.4)' : '1px solid transparent',
                  }}
                >
                  {new Date(ymd + 'T00:00:00').getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const canGoBack = anchor > new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const m2 = addMonths(anchor, 1);

  return (
    <div>
      {loading && (
        <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Checking availability…
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between mb-2">
        <button type="button" disabled={!canGoBack} onClick={() => setAnchor(prev => addMonths(prev, -1))}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:opacity-30"
          style={{ background: 'var(--color-muted)', color: 'var(--color-text-primary)', cursor: canGoBack ? 'pointer' : 'default' }}>
          <ChevL />
        </button>
        <div />
        <button type="button" onClick={() => setAnchor(prev => addMonths(prev, 1))}
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          style={{ background: 'var(--color-muted)', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
          <ChevR />
        </button>
      </div>

      {/* Months — 1 on mobile, 2 on sm+ */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {renderMonth(anchor.getFullYear(), anchor.getMonth())}
        <div className="hidden sm:block">
          {renderMonth(m2.getFullYear(), m2.getMonth())}
        </div>
      </div>

      {/* Legend */}
      <div
        className="mt-4 pt-3 flex flex-wrap gap-4 text-xs"
        style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
      >
        <span className="flex items-center gap-1.5">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white font-semibold"
            style={{ background: 'var(--color-brand)', fontSize: '0.6rem' }}
          >7</span>
          Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full font-semibold"
            style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)', fontSize: '0.6rem' }}
          >7</span>
          Stay range
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full font-semibold"
            style={{
              background: 'rgba(239,68,68,0.1)',
              color: 'rgba(239,68,68,0.7)',
              border: '1px dashed rgba(239,68,68,0.4)',
              textDecoration: 'line-through',
              fontSize: '0.6rem',
            }}
          >7</span>
          Already booked
        </span>
      </div>
    </div>
  );
}

// ── Edit form ─────────────────────────────────────────────────────────────────

type EditFormProps = {
  resource: Resource;
  onSaved: (patch: Partial<Resource>) => void;
  onCancel: () => void;
};

function EditForm({ resource, onSaved, onCancel }: EditFormProps) {
  const [name,        setName]       = useState(resource.name);
  const [price,       setPrice]      = useState(resource.pricePerNight != null ? String(resource.pricePerNight) : '');
  const [desc,        setDesc]       = useState(resource.description ?? '');
  const [visibility,  setVisibility] = useState(resource.marketplaceVisibility);
  const [capacity,    setCapacity]   = useState(resource.capacity != null ? String(resource.capacity) : '');
  const [submitting,  setSubmitting] = useState(false);
  const [err,         setErr]        = useState('');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setErr('Name is required.'); return; }
    setSubmitting(true); setErr('');
    try {
      const patch: Parameters<typeof resourcesApi.updateResource>[1] = {
        name: name.trim(),
        description: desc.trim() || null,
        marketplaceVisibility: visibility,
      };
      if (price !== '') patch.pricePerNight = parseFloat(price) || null;
      if (capacity !== '') patch.capacity = parseInt(capacity, 10) || null;

      const updated = await resourcesApi.updateResource(resource.id, patch);
      onSaved(updated);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text-primary)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    display: 'block',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <div>
        <label style={labelStyle}>Room name *</label>
        <input value={name} onChange={e => setName(e.target.value)} required style={fieldStyle} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={labelStyle}>Price per {UNIT_LABELS[resource.bookingUnit] ?? 'night'} (₦)</label>
          <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 45000" style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>Max guests</label>
          <input type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 2" style={fieldStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          rows={3}
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Room features, amenities, notes…"
          style={{ ...fieldStyle, resize: 'vertical' }}
        />
      </div>

      <div>
        <label style={labelStyle}>Marketplace visibility</label>
        <select value={visibility} onChange={e => setVisibility(e.target.value as typeof visibility)} style={fieldStyle}>
          <option value="PUBLIC">Public — visible to all guests</option>
          <option value="UNLISTED">Unlisted — accessible via direct link</option>
          <option value="PRIVATE">Private — hidden from guests</option>
        </select>
      </div>

      {err && (
        <p className="rounded-lg px-3 py-2 text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{err}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: 'var(--color-brand)', border: 'none', cursor: submitting ? 'default' : 'pointer' }}
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl py-3 text-sm font-semibold transition-colors"
          style={{ background: 'var(--color-muted)', color: 'var(--color-text-primary)', border: 'none', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────

export function RoomDetailDrawer({
  room, hotelId, role, checkIn: initialCheckIn, checkOut: initialCheckOut,
  guests = 1, onClose, onArchived, onEdited,
}: Props) {
  const router = useRouter();
  const resourceId = room.roomTypeId ?? room.id ?? '';
  const unitLabel = UNIT_LABELS[room.bookingUnit ?? 'NIGHT'] ?? 'night';

  // Full resource detail (fetched for owners to get all fields)
  const [resource, setResource] = useState<Resource | null>(null);

  useEffect(() => {
    if (!resourceId) return;
    resourcesApi.getResource(resourceId)
      .then(setResource)
      .catch(() => { /* non-fatal — drawer still works from RoomAvailability data */ });
  }, [resourceId]);

  // Image gallery
  const images = room.images ?? [];
  const [imgIndex, setImgIndex] = useState(0);

  // Calendar state
  const [checkIn,  setCheckIn]  = useState<string | null>(initialCheckIn ?? null);
  const [checkOut, setCheckOut] = useState<string | null>(initialCheckOut ?? null);
  const [calPhase, setCalPhase] = useState<'checkin' | 'checkout' | 'done'>(
    initialCheckIn && initialCheckOut ? 'done' : initialCheckIn ? 'checkout' : 'checkin'
  );
  const [showCalendar, setShowCalendar] = useState(!initialCheckIn);

  function handleDayClick(ymd: string) {
    if (calPhase === 'checkin') {
      setCheckIn(ymd); setCheckOut(null); setCalPhase('checkout');
    } else if (calPhase === 'checkout') {
      if (!checkIn || ymd <= checkIn) { setCheckIn(ymd); setCheckOut(null); return; }
      setCheckOut(ymd); setCalPhase('done');
    }
  }

  function resetDates() {
    setCheckIn(null); setCheckOut(null); setCalPhase('checkin'); setShowCalendar(true);
  }

  const nights = checkIn && checkOut
    ? Math.max(0, Math.floor((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000))
    : 0;

  function handleReserve() {
    if (!checkIn || !checkOut) { setShowCalendar(true); return; }
    const p = new URLSearchParams({ hotelId, roomId: resourceId, guests: String(guests), checkIn, checkOut });
    router.push(`/checkout?${p.toString()}`);
  }

  // Owner: edit / archive
  const [editing,   setEditing]   = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [archiveErr, setArchiveErr] = useState('');

  async function handleArchive() {
    setArchiving(true); setArchiveErr('');
    try {
      await resourcesApi.archiveResource(resourceId);
      onArchived?.(resourceId);
      onClose();
    } catch (e) {
      setArchiveErr(e instanceof ApiError ? e.message : 'Failed to archive room.');
    } finally {
      setArchiving(false);
    }
  }

  // Keyboard dismiss + focus trap
  const drawerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    drawerRef.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus(); };
  }, [onClose]);

  function formatDateDisp(d: string | null) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const hasPrice = room.pricePerNight > 0;
  const canReserve = !!checkIn && !!checkOut && nights > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={room.name}
    >
      <div
        ref={drawerRef}
        tabIndex={-1}
        className="relative w-full sm:max-w-2xl max-h-[95dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl outline-none"
        style={{ background: 'var(--color-surface)', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Image gallery ── */}
        <div className="relative overflow-hidden" style={{ height: 260, background: 'var(--color-muted)' }}>
          {images.length > 0 ? (
            <>
              <Image
                src={images[imgIndex].url}
                alt={images[imgIndex].caption ?? room.name}
                fill
                sizes="(max-width: 672px) 100vw, 672px"
                className="object-cover"
                priority
              />
              {/* Gallery nav */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-100"
                    style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', opacity: 0.8 }}
                  ><ChevL /></button>
                  <button
                    type="button"
                    onClick={() => setImgIndex(i => (i + 1) % images.length)}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-100"
                    style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', opacity: 0.8 }}
                  ><ChevR /></button>
                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setImgIndex(i)}
                        aria-label={`Photo ${i + 1}`}
                        className="rounded-full transition-all"
                        style={{
                          width: i === imgIndex ? 20 : 6,
                          height: 6,
                          background: i === imgIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>
                  {/* Counter */}
                  <span
                    className="absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                    style={{ background: 'rgba(0,0,0,0.5)' }}
                  >
                    {imgIndex + 1} / {images.length}
                  </span>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path d="M2 4v16"/><path d="M22 4v16"/><path d="M2 8h20"/><path d="M2 16h20"/>
                <path d="M6 8v8"/><path d="M18 8v8"/><rect x="6" y="8" width="12" height="4" rx="1"/>
              </svg>
            </div>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 left-3 flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-100"
            style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', opacity: 0.8, border: 'none', cursor: 'pointer' }}
          ><X /></button>
        </div>

        {/* ── Body ── */}
        <div className="px-5 pt-5 pb-32 sm:pb-6 flex flex-col gap-6 sm:px-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {room.name}
                </h2>
                {room.isResource && room.bedType && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide"
                    style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)' }}
                  >
                    {room.bedType}
                  </span>
                )}
                {!room.isResource && room.bedType && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
                  >
                    {room.bedType} bed
                  </span>
                )}
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <span>Up to {room.capacity} guest{room.capacity !== 1 ? 's' : ''}</span>
                {room.sizeSqm && <><span>·</span><span>{room.sizeSqm} m²</span></>}
                {room.bookingUnit && room.bookingUnit !== 'NIGHT' && (
                  <><span>·</span><span className="font-medium" style={{ color: 'var(--color-brand)' }}>Per {unitLabel}</span></>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="text-right shrink-0">
              {hasPrice ? (
                <>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    ₦{room.pricePerNight.toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>/ {unitLabel}</p>
                </>
              ) : (
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Contact for pricing
                </p>
              )}
              {typeof room.availableRooms === 'number' && room.availableRooms <= 3 && room.availableRooms > 0 && (
                <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-warning-text)' }}>
                  Only {room.availableRooms} left!
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          {room.description && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {room.description}
            </p>
          )}

          {/* Amenities */}
          {(room.amenities ?? []).length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Amenities
              </h3>
              <div className="flex flex-wrap gap-2">
                {room.amenities!.map(a => (
                  <span
                    key={a}
                    className="rounded-lg px-3 py-1.5 text-sm"
                    style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── 3D Room Preview ── */}
          <div>
            <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Room preview
            </h3>
            <div
              style={{
                height: 280,
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
              }}
            >
              <RoomScene3DLazy
                bedType={room.bedType}
                sizeSqm={room.sizeSqm}
                amenities={room.amenities ?? []}
                name={room.name}
              />
            </div>
          </div>

          {/* Policies (breakfast / cancellation) — traveler-facing */}
          {!room.isResource && (room.breakfastIncluded != null || room.cancellationPolicy) && (
            <div>
              <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Policies</h3>
              <div className="flex flex-wrap gap-2">
                {room.breakfastIncluded != null && (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      background: room.breakfastIncluded ? 'var(--color-brand-light)' : 'var(--color-muted)',
                      color: room.breakfastIncluded ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {room.breakfastIncluded ? 'Breakfast included' : 'Room only'}
                  </span>
                )}
                {room.cancellationPolicy && (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}
                  >
                    {room.cancellationPolicy}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Owner: resource metadata */}
          {role === 'owner' && resource && (
            <div
              className="rounded-xl p-4 flex flex-col gap-2 text-xs"
              style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
            >
              <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>Room details</p>
              {[
                ['Code', resource.code],
                ['Category', resource.category?.name],
                ['Building', resource.building?.name ?? '—'],
                ['Floor', resource.floor?.name ?? '—'],
                ['Lifecycle', resource.lifecycleStatus],
                ['Status', resource.operationalStatus],
                ['Visibility', resource.marketplaceVisibility],
                ['Bookable', resource.isBookable ? 'Yes' : 'No'],
              ].map(([label, val]) => (
                <div key={label as string} className="flex justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{val as string}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Owner: Edit form ── */}
          {role === 'owner' && editing && resource && (
            <div>
              <h3 className="mb-4 text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Edit room</h3>
              <EditForm
                resource={resource}
                onSaved={patch => {
                  setResource(prev => prev ? { ...prev, ...patch } as Resource : prev);
                  setEditing(false);
                  onEdited?.(resourceId, patch);
                }}
                onCancel={() => setEditing(false)}
              />
            </div>
          )}

          {/* ── Owner: Archive confirmation ── */}
          {role === 'owner' && archiveConfirm && (
            <div
              className="rounded-xl p-4"
              style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: '#9a3412' }}>Archive this room?</p>
              <p className="text-xs mb-4" style={{ color: '#c2410c' }}>
                The room will be hidden from guests. Existing bookings are not affected. You can restore it later from the dashboard.
              </p>
              {archiveErr && (
                <p className="mb-3 text-xs" style={{ color: '#dc2626' }}>{archiveErr}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={archiving}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: '#ea580c', border: 'none', cursor: archiving ? 'default' : 'pointer' }}
                >
                  {archiving ? 'Archiving…' : 'Yes, archive'}
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveConfirm(false)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                  style={{ background: 'var(--color-muted)', color: 'var(--color-text-primary)', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Availability calendar (traveler + owner) ── */}
          {!editing && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Availability
                </h3>
                {(checkIn || checkOut) && (
                  <button
                    type="button"
                    onClick={resetDates}
                    className="text-xs underline"
                    style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Clear dates
                  </button>
                )}
              </div>

              {/* Selected date chips */}
              {(checkIn || checkOut) && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { label: 'Check-in', val: checkIn },
                    { label: 'Check-out', val: checkOut },
                  ].map(({ label, val }) => (
                    <div
                      key={label}
                      className="rounded-xl px-3 py-2.5"
                      style={{
                        background: val ? 'var(--color-brand-light)' : 'var(--color-muted)',
                        border: `1px solid ${val ? 'var(--color-brand)' : 'var(--color-border)'}`,
                      }}
                    >
                      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
                      <p className="text-sm font-semibold" style={{ color: val ? 'var(--color-brand)' : 'var(--color-text-secondary)' }}>
                        {formatDateDisp(val)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <AvailabilityCalendar
                resourceId={resourceId}
                checkIn={checkIn}
                checkOut={checkOut}
                phase={calPhase}
                onDayClick={handleDayClick}
              />
            </div>
          )}
        </div>

        {/* ── Sticky footer ── */}
        {!editing && !archiveConfirm && (
          <div
            className="sticky bottom-0 left-0 right-0 px-5 py-4 sm:px-6"
            style={{
              background: 'var(--color-surface)',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            {role === 'traveler' ? (
              /* Traveler CTA */
              <div className="flex flex-col gap-3">
                {checkIn && checkOut && nights > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDateDisp(checkIn)} → {formatDateDisp(checkOut)}
                    </span>
                    {hasPrice && (
                      <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        ₦{(room.pricePerNight * nights).toLocaleString()} total
                      </span>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleReserve}
                  disabled={!canReserve}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-40"
                  style={{ background: 'var(--color-brand)', border: 'none', cursor: canReserve ? 'pointer' : 'default' }}
                >
                  <CalIcon />
                  {canReserve
                    ? `Reserve — ${nights} night${nights !== 1 ? 's' : ''}`
                    : checkIn
                    ? 'Select check-out date'
                    : 'Select dates to reserve'}
                </button>
              </div>
            ) : (
              /* Owner actions */
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setEditing(true); setArchiveConfirm(false); }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors"
                  style={{
                    background: 'var(--color-brand)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <EditIcon />
                  Edit room
                </button>
                <button
                  type="button"
                  onClick={() => { setArchiveConfirm(true); setEditing(false); }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors"
                  style={{
                    background: 'var(--color-muted)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                  }}
                >
                  <ArchiveIcon />
                  Archive
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
