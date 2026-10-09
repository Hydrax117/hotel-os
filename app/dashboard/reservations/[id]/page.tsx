// Allow blocking prerender (required because layout uses usePathname() + dynamic params)
export const instant = false;

import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MOCK_RESERVATIONS } from '../../mock/data';
import { StatusBadge } from '../../components/StatusBadge';
import type { BookingStatus } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNgn(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// ── Stepper ───────────────────────────────────────────────────────────────────

type StepItem = {
  label: string;
  done: boolean;
  danger?: boolean;
};

function getSteps(status: BookingStatus): StepItem[] {
  const created: StepItem = { label: 'Booking Created', done: true };
  switch (status) {
    case 'pending':
      return [created];
    case 'confirmed':
      return [created, { label: 'Confirmed', done: true }];
    case 'checked_in':
      return [created, { label: 'Confirmed', done: true }, { label: 'Checked In', done: true }];
    case 'checked_out':
      return [
        created,
        { label: 'Confirmed',  done: true },
        { label: 'Checked In', done: true },
        { label: 'Checked Out', done: true },
      ];
    case 'cancelled':
      return [created, { label: 'Cancelled', done: true, danger: true }];
    case 'no_show':
      return [created, { label: 'No Show', done: true, danger: true }];
    default:
      return [created];
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reservation = MOCK_RESERVATIONS.find(r => r.id === id);
  if (!reservation) notFound();

  const steps         = getSteps(reservation.status);
  const ratePerNight  = Math.round(reservation.amountNgn / reservation.nights);
  const createdDate   = new Date(reservation.createdAt).toLocaleDateString('en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const canConfirm   = reservation.status === 'pending';
  const canCheckIn   = reservation.status === 'confirmed';
  const canCheckOut  = reservation.status === 'checked_in';
  const canCancel    = reservation.status === 'pending' || reservation.status === 'confirmed';

  return (
    <div className="flex flex-col gap-6" style={{ color: 'var(--db-primary)' }}>

      {/* ── Back link ── */}
      <Link
        href="/dashboard/reservations"
        className="inline-flex items-center gap-1.5 text-sm hover:underline underline-offset-2 w-fit"
        style={{ color: 'var(--db-secondary)' }}
      >
        ← Back to Reservations
      </Link>

      {/* ── Header row ── */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{reservation.id}</h1>
        <StatusBadge status={reservation.status} />
        <span className="text-sm ml-auto" style={{ color: 'var(--db-secondary)' }}>
          Created {createdDate}
        </span>
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* LEFT — Guest info card */}
        <div
          className="rounded-xl border p-5 flex flex-col gap-4"
          style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--db-primary)' }}>
            Guest &amp; Booking Details
          </h2>

          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt style={{ color: 'var(--db-secondary)' }}>Guest Name</dt>
              <dd className="font-medium text-right">{reservation.guestName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt style={{ color: 'var(--db-secondary)' }}>Email</dt>
              <dd className="font-medium text-right">{reservation.guestEmail}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt style={{ color: 'var(--db-secondary)' }}>Room Type</dt>
              <dd className="font-medium text-right">{reservation.roomTypeName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt style={{ color: 'var(--db-secondary)' }}>Room Number</dt>
              <dd className="font-medium text-right">{reservation.roomNumber}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt style={{ color: 'var(--db-secondary)' }}>Check-in</dt>
              <dd className="font-medium text-right">{formatDate(reservation.checkIn)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt style={{ color: 'var(--db-secondary)' }}>Check-out</dt>
              <dd className="font-medium text-right">{formatDate(reservation.checkOut)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt style={{ color: 'var(--db-secondary)' }}>Nights</dt>
              <dd className="font-medium text-right">{reservation.nights}</dd>
            </div>

            <div
              className="border-t pt-3 mt-1 flex flex-col gap-2"
              style={{ borderColor: 'var(--db-border)' }}
            >
              <div className="flex justify-between gap-4">
                <dt style={{ color: 'var(--db-secondary)' }}>
                  Rate ({formatNgn(ratePerNight)} × {reservation.nights} nights)
                </dt>
                <dd className="font-medium text-right">{formatNgn(reservation.amountNgn)}</dd>
              </div>
              <div className="flex justify-between gap-4 font-bold">
                <dt>Total</dt>
                <dd style={{ color: 'var(--db-accent)' }}>{formatNgn(reservation.amountNgn)}</dd>
              </div>
            </div>
          </dl>
        </div>

        {/* RIGHT — Timeline stepper */}
        <div
          className="rounded-xl border p-5"
          style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
        >
          <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--db-primary)' }}>
            Booking Timeline
          </h2>

          <ol className="relative flex flex-col gap-0">
            {steps.map((step, idx) => {
              const isLast  = idx === steps.length - 1;
              const dotColor = step.danger
                ? 'var(--db-danger)'
                : step.done
                ? 'var(--db-success)'
                : 'var(--db-border)';
              const labelColor = step.danger
                ? 'var(--db-danger)'
                : step.done
                ? 'var(--db-primary)'
                : 'var(--db-secondary)';
              return (
                <li key={step.label} className="flex gap-4">
                  {/* Line + dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className="h-4 w-4 rounded-full shrink-0 flex items-center justify-center"
                      style={{
                        background: dotColor,
                        border: step.done ? 'none' : '2px solid var(--db-border)',
                      }}
                    >
                      {step.done && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="white" aria-hidden="true">
                          <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className="w-0.5 flex-1 my-1"
                        style={{ background: 'var(--db-border)', minHeight: '24px' }}
                      />
                    )}
                  </div>
                  {/* Label */}
                  <div className="pb-5">
                    <p className="text-sm font-medium" style={{ color: labelColor }}>
                      {step.label}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex flex-wrap gap-3">
        <button
          disabled={!canConfirm}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity"
          style={{
            background: canConfirm ? 'var(--db-accent)' : 'var(--db-muted)',
            color: canConfirm ? '#ffffff' : 'var(--db-border)',
            cursor: canConfirm ? 'pointer' : 'not-allowed',
            border: 'none',
          }}
        >
          Confirm Booking
        </button>

        <button
          disabled={!canCheckIn}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity"
          style={{
            background: canCheckIn ? 'var(--db-success)' : 'var(--db-muted)',
            color: canCheckIn ? '#ffffff' : 'var(--db-border)',
            cursor: canCheckIn ? 'pointer' : 'not-allowed',
            border: 'none',
          }}
        >
          Check In
        </button>

        <button
          disabled={!canCheckOut}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity"
          style={{
            background: canCheckOut ? 'var(--db-primary)' : 'var(--db-muted)',
            color: canCheckOut ? '#ffffff' : 'var(--db-border)',
            cursor: canCheckOut ? 'pointer' : 'not-allowed',
            border: 'none',
          }}
        >
          Check Out
        </button>

        <button
          disabled={!canCancel}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-opacity"
          style={{
            background: 'transparent',
            borderColor: canCancel ? 'var(--db-danger)' : 'var(--db-border)',
            color: canCancel ? 'var(--db-danger)' : 'var(--db-border)',
            cursor: canCancel ? 'pointer' : 'not-allowed',
          }}
        >
          Cancel Booking
        </button>
      </div>

      {/* ── Special requests ── */}
      <div
        className="rounded-xl border p-5"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--db-primary)' }}>
          Special Requests
        </h2>
        <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>
          Guest requested a high-floor room with city view. Early check-in if possible. No feather pillows (allergy).
        </p>
      </div>

    </div>
  );
}
