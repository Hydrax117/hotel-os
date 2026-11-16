'use client';

/**
 * RoomCalendarPicker
 *
 * A modal calendar that shows booked/unavailable dates for a specific room
 * and lets the user select check-in and check-out dates.
 *
 * Rules:
 *  - Unavailable dates are shown with a strikethrough and cannot be selected.
 *  - Past dates are disabled.
 *  - The selected range is highlighted between check-in and check-out.
 *  - Clicking a booked date that falls inside a range resets the selection.
 *  - Shows 2 months at a time; user can scroll forward/back.
 *  - Works for both traveler and admin roles.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getResourceCalendar } from '@/app/lib/api/bookings';

// ── Date utilities ────────────────────────────────────────────────────────────

function toYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function todayYMD(): string {
  return toYMD(new Date());
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return d;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstWeekday(year: number, month: number): number {
  // 0 = Sun … 6 = Sat; we want 0 = Mon
  const d = new Date(year, month, 1).getDay();
  return (d + 6) % 7; // shift so Monday = 0
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  resourceId: string;
  roomName: string;
  pricePerNight: number;
  initialCheckIn?: string;
  initialCheckOut?: string;
  guests?: number;
  hotelId: string;
  onConfirm: (checkIn: string, checkOut: string) => void;
  onClose: () => void;
};

// ── Calendar month grid ───────────────────────────────────────────────────────

type MonthGridProps = {
  year: number;
  month: number;
  today: string;
  unavailable: Set<string>;
  checkIn: string | null;
  checkOut: string | null;
  hoverDate: string | null;
  onDayClick: (ymd: string) => void;
  onDayHover: (ymd: string | null) => void;
};

function MonthGrid({
  year, month, today, unavailable,
  checkIn, checkOut, hoverDate,
  onDayClick, onDayHover,
}: MonthGridProps) {
  const days = daysInMonth(year, month);
  const startOffset = firstWeekday(year, month);
  const cells: (string | null)[] = Array(startOffset).fill(null);

  for (let d = 1; d <= days; d++) {
    cells.push(
      `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    );
  }
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const rangeEnd = checkIn ? (checkOut ?? hoverDate) : null;

  function getState(ymd: string): 'unavailable' | 'past' | 'checkin' | 'checkout' | 'inrange' | 'available' | 'today' {
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

  return (
    <div>
      {/* Month heading */}
      <p className="mb-3 text-center text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {MONTH_NAMES[month]} {year}
      </p>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(l => (
          <div key={l} className="text-center text-xs font-medium py-1" style={{ color: 'var(--color-text-secondary)' }}>
            {l}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((ymd, i) => {
          if (!ymd) return <div key={i} />;
          const state = getState(ymd);
          const isDisabled = state === 'past' || state === 'unavailable';
          const isCheckIn = state === 'checkin';
          const isCheckOut = state === 'checkout';
          const isInRange = state === 'inrange';
          const isToday = state === 'today';

          // Determine if this cell is at the start or end of its row for range edges
          const col = i % 7;
          const isRowStart = col === 0;
          const isRowEnd = col === 6;
          const isRangeStart = isCheckIn || (isInRange && isRowStart);
          const isRangeEnd = isCheckOut || (isInRange && isRowEnd);

          // Check if previous/next day is in range for half-background treatment
          const prevYmd = cells[i - 1] ?? null;
          const nextYmd = cells[i + 1] ?? null;
          const prevInRange = prevYmd ? (['checkin','checkout','inrange'].includes(getState(prevYmd))) : false;
          const nextInRange = nextYmd ? (['checkin','checkout','inrange'].includes(getState(nextYmd))) : false;

          let rangeBg = 'transparent';
          if (isInRange) rangeBg = 'var(--color-brand-light)';
          if (isCheckIn && nextInRange) {
            rangeBg = `linear-gradient(to right, transparent 50%, var(--color-brand-light) 50%)`;
          }
          if (isCheckOut && prevInRange) {
            rangeBg = `linear-gradient(to left, transparent 50%, var(--color-brand-light) 50%)`;
          }
          if (isCheckIn && isCheckOut) rangeBg = 'transparent';

          let dotColor = '';
          if (state === 'unavailable') dotColor = 'var(--color-warning-text)';

          return (
            <div
              key={ymd}
              style={{ background: rangeBg, position: 'relative' }}
              className="relative flex items-center justify-center py-0.5"
            >
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onDayClick(ymd)}
                onMouseEnter={() => !isDisabled && onDayHover(ymd)}
                onMouseLeave={() => onDayHover(null)}
                aria-label={ymd}
                aria-pressed={isCheckIn || isCheckOut}
                className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                style={{
                  cursor: isDisabled ? 'default' : 'pointer',
                  /* Booked: red-tinted fill + dashed ring */
                  background: state === 'unavailable'
                    ? 'rgba(239,68,68,0.1)'
                    : (isCheckIn || isCheckOut)
                    ? 'var(--color-brand)'
                    : 'transparent',
                  border: state === 'unavailable'
                    ? '1px dashed rgba(239,68,68,0.45)'
                    : '1px solid transparent',
                  color: state === 'unavailable'
                    ? 'rgba(239,68,68,0.65)'
                    : isDisabled
                    ? 'var(--color-text-secondary)'
                    : (isCheckIn || isCheckOut)
                    ? '#fff'
                    : (isInRange || isToday)
                    ? 'var(--color-brand)'
                    : 'var(--color-text-primary)',
                  opacity: state === 'past' ? 0.3 : 1,
                  textDecoration: state === 'unavailable' ? 'line-through' : 'none',
                  fontWeight: (isToday || isCheckIn || isCheckOut) ? 700 : undefined,
                  outlineColor: 'var(--color-brand)',
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

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full" style={{ background: 'var(--color-brand)', color: '#fff', fontSize: '0.65rem', fontWeight: 600 }}>7</span>
        <span>Your selection</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full" style={{ background: 'var(--color-brand-light)', color: 'var(--color-brand)', fontSize: '0.65rem', fontWeight: 600 }}>7</span>
        <span>Stay range</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
          style={{
            background: 'rgba(239,68,68,0.1)',
            color: 'rgba(239,68,68,0.65)',
            border: '1px dashed rgba(239,68,68,0.45)',
            textDecoration: 'line-through',
            fontSize: '0.65rem',
          }}
        >7</span>
        <span>Already booked</span>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function RoomCalendarPicker({
  resourceId,
  roomName,
  pricePerNight,
  initialCheckIn,
  initialCheckOut,
  guests = 1,
  hotelId,
  onConfirm,
  onClose,
}: Props) {
  const today = todayYMD();

  // Which two months are showing (anchor = first visible month)
  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    if (initialCheckIn) {
      const d = new Date(initialCheckIn + 'T00:00:00');
      d.setDate(1);
      return d;
    }
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // Calendar data
  const [calendarData, setCalendarData] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [calError, setCalError] = useState('');

  // Selection
  const [checkIn, setCheckIn] = useState<string | null>(initialCheckIn ?? null);
  const [checkOut, setCheckOut] = useState<string | null>(initialCheckOut ?? null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [selectingPhase, setSelectingPhase] = useState<'checkin' | 'checkout'>(
    initialCheckIn && !initialCheckOut ? 'checkout' : 'checkin'
  );

  // Fetch 3 months ahead from anchorDate so we can page forward/back without refetching
  const fetchCalendar = useCallback(async (anchor: Date) => {
    if (!resourceId) return;
    setLoading(true);
    setCalError('');
    try {
      const from = toYMD(anchor);
      const end = addMonths(anchor, 3);
      const to = toYMD(end);
      const data = await getResourceCalendar(resourceId, from, to);
      setCalendarData(prev => {
        const next = new Map(prev);
        for (const { date, available } of data) {
          next.set(date, available);
        }
        return next;
      });
    } catch {
      setCalError('Could not load availability. You can still enter dates manually.');
    } finally {
      setLoading(false);
    }
  }, [resourceId]);

  useEffect(() => {
    void fetchCalendar(anchorDate);
  }, [fetchCalendar, anchorDate]);

  // Build unavailable set from calendarData
  const unavailableSet = React.useMemo(() => {
    const s = new Set<string>();
    for (const [date, available] of calendarData) {
      if (!available) s.add(date);
    }
    return s;
  }, [calendarData]);

  function handleDayClick(ymd: string) {
    if (selectingPhase === 'checkin') {
      setCheckIn(ymd);
      setCheckOut(null);
      setSelectingPhase('checkout');
    } else {
      if (!checkIn) {
        setCheckIn(ymd);
        setSelectingPhase('checkout');
        return;
      }
      if (ymd <= checkIn) {
        // Clicked before check-in — start over
        setCheckIn(ymd);
        setCheckOut(null);
        return;
      }
      // Check if any booked date falls within the range
      let hasBlockedInRange = false;
      const lo = checkIn;
      const hi = ymd;
      for (const blocked of unavailableSet) {
        if (blocked > lo && blocked < hi) { hasBlockedInRange = true; break; }
      }
      if (hasBlockedInRange) {
        // Can't span over booked dates — reset to start
        setCheckIn(ymd);
        setCheckOut(null);
        return;
      }
      setCheckOut(ymd);
      setSelectingPhase('checkin');
    }
  }

  function handleDayHover(ymd: string | null) {
    if (selectingPhase === 'checkout' && checkIn) {
      setHoverDate(ymd);
    }
  }

  function handlePrevMonth() {
    const prev = addMonths(anchorDate, -1);
    if (toYMD(prev) >= toYMD(new Date(new Date().getFullYear(), new Date().getMonth(), 1))) {
      setAnchorDate(prev);
    }
  }

  function handleNextMonth() {
    setAnchorDate(addMonths(anchorDate, 1));
  }

  const month1 = { year: anchorDate.getFullYear(), month: anchorDate.getMonth() };
  const secondMonth = addMonths(anchorDate, 1);
  const month2 = { year: secondMonth.getFullYear(), month: secondMonth.getMonth() };

  // Computed night count + cost
  const nights = checkIn && checkOut
    ? Math.max(0, Math.floor((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000))
    : 0;
  const totalPrice = nights * pricePerNight;

  const canGoBack = (() => {
    const curMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return anchorDate > curMonthStart;
  })();

  // Keyboard dismiss
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Trap focus
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    modalRef.current?.focus();
    return () => prev?.focus();
  }, []);

  function formatDisplay(ymd: string | null) {
    if (!ymd) return '—';
    return new Date(ymd + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  const instructionText = selectingPhase === 'checkin'
    ? 'Select your check-in date'
    : 'Select your check-out date';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Select dates for ${roomName}`}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full sm:max-w-3xl max-h-[95dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl outline-none"
        style={{
          background: 'var(--color-surface)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 sm:px-6"
          style={{
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {roomName}
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {instructionText}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close calendar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
            style={{
              background: 'var(--color-muted)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-5 py-5 sm:px-6">

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Loading availability…
            </div>
          )}

          {/* Error banner */}
          {calError && (
            <div
              className="mb-4 rounded-lg px-4 py-3 text-sm"
              style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            >
              {calError}
            </div>
          )}

          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={!canGoBack}
              aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-30"
              style={{
                background: canGoBack ? 'var(--color-muted)' : 'transparent',
                color: 'var(--color-text-primary)',
                cursor: canGoBack ? 'pointer' : 'default',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            <div /> {/* spacer — labels are inside each grid */}

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
              style={{ background: 'var(--color-muted)', color: 'var(--color-text-primary)', cursor: 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          {/* Two-month grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <MonthGrid
              {...month1}
              today={today}
              unavailable={unavailableSet}
              checkIn={checkIn}
              checkOut={checkOut}
              hoverDate={hoverDate}
              onDayClick={handleDayClick}
              onDayHover={handleDayHover}
            />
            <MonthGrid
              {...month2}
              today={today}
              unavailable={unavailableSet}
              checkIn={checkIn}
              checkOut={checkOut}
              hoverDate={hoverDate}
              onDayClick={handleDayClick}
              onDayHover={handleDayHover}
            />
          </div>

          {/* Legend */}
          <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--color-border)' }}>
            <Legend />
          </div>
        </div>

        {/* ── Footer / summary + confirm ── */}
        <div
          className="sticky bottom-0 z-10 px-5 py-4 sm:px-6"
          style={{
            background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {/* Date summary row */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_auto_1fr]">
            {/* Check-in */}
            <div
              className="rounded-xl px-4 py-3 cursor-pointer transition-colors"
              style={{
                border: selectingPhase === 'checkin'
                  ? '2px solid var(--color-brand)'
                  : '1px solid var(--color-border)',
                background: selectingPhase === 'checkin' ? 'var(--color-brand-light)' : 'var(--color-muted)',
              }}
              onClick={() => { setSelectingPhase('checkin'); setCheckOut(null); }}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setSelectingPhase('checkin'); setCheckOut(null); }}}
              aria-label="Edit check-in date"
            >
              <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>Check-in</p>
              <p className="text-sm font-semibold" style={{ color: checkIn ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                {formatDisplay(checkIn)}
              </p>
            </div>

            {/* Arrow — desktop only */}
            <div className="hidden sm:flex items-center justify-center" style={{ color: 'var(--color-text-secondary)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>

            {/* Check-out */}
            <div
              className="rounded-xl px-4 py-3 cursor-pointer transition-colors"
              style={{
                border: selectingPhase === 'checkout'
                  ? '2px solid var(--color-brand)'
                  : '1px solid var(--color-border)',
                background: selectingPhase === 'checkout' ? 'var(--color-brand-light)' : 'var(--color-muted)',
              }}
              onClick={() => { if (checkIn) setSelectingPhase('checkout'); }}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && checkIn) setSelectingPhase('checkout'); }}
              aria-label="Edit check-out date"
            >
              <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>Check-out</p>
              <p className="text-sm font-semibold" style={{ color: checkOut ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                {formatDisplay(checkOut)}
              </p>
            </div>
          </div>

          {/* Price summary */}
          {nights > 0 && (
            <div className="mb-4 flex items-center justify-between text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>
                ₦{pricePerNight.toLocaleString()} × {nights} night{nights !== 1 ? 's' : ''}
              </span>
              <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                ₦{totalPrice.toLocaleString()}
              </span>
            </div>
          )}

          {/* Confirm button */}
          <button
            type="button"
            disabled={!checkIn || !checkOut}
            onClick={() => checkIn && checkOut && onConfirm(checkIn, checkOut)}
            className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{
              background: 'var(--color-brand)',
              cursor: checkIn && checkOut ? 'pointer' : 'not-allowed',
            }}
          >
            {checkIn && checkOut
              ? `Reserve — ${nights} night${nights !== 1 ? 's' : ''}`
              : checkIn
              ? 'Select a check-out date'
              : 'Select a check-in date'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
