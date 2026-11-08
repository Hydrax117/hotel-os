'use client';

export const instant = false;

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { apiClient, ApiError } from '../../../lib/api/client';
import { StatusBadge } from '../../components/StatusBadge';
import type { BookingStatus } from '../../types';

// ── Types ─────────────────────────────────────────────────────────────────────

type RawBooking = {
  id: string;
  reference?: string;
  status: string;
  guestFirstName?: string;
  guestLastName?: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string;
  checkIn: string;
  checkOut: string;
  nights?: number;
  guests?: number;
  totalNgn?: number;
  subtotalNgn?: number;
  serviceFeeNgn?: number;
  roomType?: { id?: string; name?: string; bedType?: string };
  hotel?: { id?: string; name?: string };
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNgn(n: number): string {
  return '₦' + n.toLocaleString('en-NG');
}

function fmtDate(iso: string): string {
  const d = new Date(iso.slice(0, 10) + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function normalizeStatus(s: string): BookingStatus {
  const map: Record<string, BookingStatus> = {
    HELD: 'pending', CONFIRMED: 'confirmed', CHECKED_IN: 'checked_in',
    CHECKED_OUT: 'checked_out', CANCELLED: 'cancelled',
    PAYMENT_PENDING: 'pending', NO_SHOW: 'no_show', PENDING: 'pending',
  };
  return map[s] ?? 'pending';
}

type StepItem = { label: string; done: boolean; danger?: boolean };

function getSteps(status: BookingStatus): StepItem[] {
  const created: StepItem = { label: 'Booking Created', done: true };
  switch (status) {
    case 'pending':     return [created];
    case 'confirmed':   return [created, { label: 'Confirmed', done: true }];
    case 'checked_in':  return [created, { label: 'Confirmed', done: true }, { label: 'Checked In', done: true }];
    case 'checked_out': return [created, { label: 'Confirmed', done: true }, { label: 'Checked In', done: true }, { label: 'Checked Out', done: true }];
    case 'cancelled':   return [created, { label: 'Cancelled', done: true, danger: true }];
    case 'no_show':     return [created, { label: 'Confirmed', done: true }, { label: 'No Show', done: true, danger: true }];
    default:            return [created];
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const id = params.id;

  const [booking, setBooking] = useState<RawBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [actionError, setActionError] = useState('');

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/signin');
  }, [authLoading, user, router]);

  // Fetch booking
  const fetchBooking = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await apiClient.get<RawBooking>(`/api/v1/bookings/${id}`);
      setBooking(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load reservation.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { if (user) fetchBooking(); }, [user, fetchBooking]);

  // Status action
  async function handleAction(newStatus: 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED') {
    if (!booking) return;
    setActionLoading(newStatus);
    setActionError('');
    try {
      await apiClient.patch(`/api/v1/bookings/${booking.id}/status`, { status: newStatus });
      await fetchBooking(); // refresh
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Action failed. Please try again.';
      setActionError(msg);
    } finally {
      setActionLoading('');
    }
  }

  // ── Loading / error states ────────────────────────────────────────────────

  if (authLoading || (!user && !authLoading)) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--db-secondary)' }}>
        Loading reservation…
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p style={{ color: 'var(--db-secondary)' }}>{error || 'Reservation not found.'}</p>
        <Link href="/dashboard/reservations" className="text-sm underline" style={{ color: 'var(--db-accent)' }}>
          ← Back to Reservations
        </Link>
      </div>
    );
  }

  const status     = normalizeStatus(booking.status);
  const steps      = getSteps(status);
  const nights     = booking.nights ?? Math.round((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86_400_000);
  const totalNgn   = Number(booking.totalNgn ?? 0);
  const guestName  = ((booking.guestFirstName ?? '') + ' ' + (booking.guestLastName ?? '')).trim() || 'Unknown Guest';
  const createdDate = new Date(booking.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const canCheckIn  = status === 'confirmed';
  const canCheckOut = status === 'checked_in';
  const canCancel   = status === 'pending' || status === 'confirmed';

  return (
    <div className="flex flex-col gap-6" style={{ color: 'var(--db-primary)' }}>

      {/* Back */}
      <Link href="/dashboard/reservations" className="inline-flex items-center gap-1.5 text-sm hover:underline underline-offset-2 w-fit" style={{ color: 'var(--db-secondary)' }}>
        ← Back to Reservations
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{booking.reference ?? booking.id}</h1>
        <StatusBadge status={status} />
        <span className="text-sm ml-auto" style={{ color: 'var(--db-secondary)' }}>Created {createdDate}</span>
      </div>

      {/* Action error */}
      {actionError && (
        <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: '10px', padding: '12px 16px', fontSize: '14px' }}>
          {actionError}
        </div>
      )}

      {/* Two-column grid */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Guest & booking details */}
        <div className="rounded-xl border p-5 flex flex-col gap-4" style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--db-primary)' }}>Guest &amp; Booking Details</h2>
          <dl className="flex flex-col gap-3 text-sm">
            {[
              { label: 'Guest Name',  value: guestName },
              { label: 'Email',       value: booking.guestEmail ?? '—' },
              { label: 'Phone',       value: booking.guestPhone ?? '—' },
              { label: 'Room Type',   value: booking.roomType?.name ?? '—' },
              { label: 'Guests',      value: String(booking.guests ?? 1) },
              { label: 'Check-in',    value: fmtDate(booking.checkIn) },
              { label: 'Check-out',   value: fmtDate(booking.checkOut) },
              { label: 'Nights',      value: String(nights) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-4">
                <dt style={{ color: 'var(--db-secondary)' }}>{label}</dt>
                <dd className="font-medium text-right">{value}</dd>
              </div>
            ))}
            <div className="border-t pt-3 mt-1 flex flex-col gap-2" style={{ borderColor: 'var(--db-border)' }}>
              {booking.subtotalNgn != null && (
                <div className="flex justify-between gap-4 text-sm">
                  <dt style={{ color: 'var(--db-secondary)' }}>Subtotal</dt>
                  <dd>{fmtNgn(Number(booking.subtotalNgn))}</dd>
                </div>
              )}
              {booking.serviceFeeNgn != null && (
                <div className="flex justify-between gap-4 text-sm">
                  <dt style={{ color: 'var(--db-secondary)' }}>Service fee</dt>
                  <dd>{fmtNgn(Number(booking.serviceFeeNgn))}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 font-bold">
                <dt>Total</dt>
                <dd style={{ color: 'var(--db-accent)' }}>{fmtNgn(totalNgn)}</dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Timeline */}
        <div className="rounded-xl border p-5" style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}>
          <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--db-primary)' }}>Booking Timeline</h2>
          <ol className="relative flex flex-col gap-0">
            {steps.map((step, idx) => {
              const isLast   = idx === steps.length - 1;
              const dotColor = step.danger ? 'var(--db-danger)' : step.done ? 'var(--db-success)' : 'var(--db-border)';
              const lblColor = step.danger ? 'var(--db-danger)' : step.done ? 'var(--db-primary)' : 'var(--db-secondary)';
              return (
                <li key={step.label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-4 rounded-full shrink-0 flex items-center justify-center" style={{ background: dotColor, border: step.done ? 'none' : '2px solid var(--db-border)' }}>
                      {step.done && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                          <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 my-1" style={{ background: 'var(--db-border)', minHeight: '24px' }}/>}
                  </div>
                  <div className="pb-5">
                    <p className="text-sm font-medium" style={{ color: lblColor }}>{step.label}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          disabled={!canCheckIn || !!actionLoading}
          onClick={() => handleAction('CHECKED_IN')}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity"
          style={{ background: canCheckIn ? 'var(--db-success)' : 'var(--db-muted)', color: canCheckIn ? '#fff' : 'var(--db-border)', cursor: canCheckIn ? 'pointer' : 'not-allowed', border: 'none', opacity: actionLoading === 'CHECKED_IN' ? 0.6 : 1 }}
        >
          {actionLoading === 'CHECKED_IN' ? 'Processing…' : 'Check In'}
        </button>

        <button
          disabled={!canCheckOut || !!actionLoading}
          onClick={() => handleAction('CHECKED_OUT')}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity"
          style={{ background: canCheckOut ? 'var(--db-primary)' : 'var(--db-muted)', color: canCheckOut ? '#fff' : 'var(--db-border)', cursor: canCheckOut ? 'pointer' : 'not-allowed', border: 'none', opacity: actionLoading === 'CHECKED_OUT' ? 0.6 : 1 }}
        >
          {actionLoading === 'CHECKED_OUT' ? 'Processing…' : 'Check Out'}
        </button>

        <button
          disabled={!canCancel || !!actionLoading}
          onClick={() => handleAction('CANCELLED')}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-opacity"
          style={{ background: 'transparent', borderColor: canCancel ? 'var(--db-danger)' : 'var(--db-border)', color: canCancel ? 'var(--db-danger)' : 'var(--db-border)', cursor: canCancel ? 'pointer' : 'not-allowed', opacity: actionLoading === 'CANCELLED' ? 0.6 : 1 }}
        >
          {actionLoading === 'CANCELLED' ? 'Cancelling…' : 'Cancel Booking'}
        </button>
      </div>

      {/* Special requests */}
      {booking.specialRequests && (
        <div className="rounded-xl border p-5" style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--db-primary)' }}>Special Requests</h2>
          <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>{booking.specialRequests}</p>
        </div>
      )}

    </div>
  );
}
