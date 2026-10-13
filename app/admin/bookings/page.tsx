'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { getAdminBookings, type AdminBooking } from '../../lib/api/admin';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNgn(amount: number): string {
  return '\u20a6' + amount.toLocaleString('en-NG');
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    CONFIRMED:   { bg: '#dbeafe', color: '#1d4ed8', label: 'Confirmed' },
    confirmed:   { bg: '#dbeafe', color: '#1d4ed8', label: 'Confirmed' },
    CHECKED_IN:  { bg: '#dcfce7', color: '#15803d', label: 'Checked In' },
    checked_in:  { bg: '#dcfce7', color: '#15803d', label: 'Checked In' },
    CHECKED_OUT: { bg: '#f3f4f6', color: '#374151', label: 'Checked Out' },
    checked_out: { bg: '#f3f4f6', color: '#374151', label: 'Checked Out' },
    CANCELLED:   { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' },
    cancelled:   { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' },
  };
  const s = map[status] ?? { bg: '#f3f4f6', color: '#374151', label: status };
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ padding: '32px 24px' }}>
      <div style={{ height: 28, width: 200, background: 'var(--ad-muted)', borderRadius: 6, marginBottom: 24 }} />
      <div style={{ height: 100, background: 'var(--ad-muted)', borderRadius: 8 }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminBookingsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    getAdminBookings({ limit: 20 })
      .then(res => {
        setBookings(res.bookings);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!authLoading && user?.role === 'SUPER_ADMIN') {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  if (authLoading) return <LoadingSkeleton />;

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--ad-secondary)' }}>Access denied. Super admin role required.</p>
      </div>
    );
  }

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--ad-danger)', marginBottom: 12 }}>{error}</p>
        <button
          type="button"
          onClick={load}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--ad-accent)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  const nonCancelledStatuses = ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'confirmed', 'checked_in', 'checked_out'];

  const totalGmv = bookings.reduce((sum, b) => sum + Number(b.totalNgn), 0);
  const commissionEarned = bookings
    .filter(b => nonCancelledStatuses.includes(b.status))
    .reduce((sum, b) => sum + Number(b.totalNgn) * 0.1, 0);
  const cancelledCount = bookings.filter(b => ['CANCELLED', 'cancelled'].includes(b.status)).length;
  const cancellationRate = bookings.length > 0
    ? ((cancelledCount / bookings.length) * 100).toFixed(1)
    : '0.0';

  const totalAmount = bookings.reduce((sum, b) => sum + Number(b.totalNgn), 0);
  const totalCommission = bookings.reduce((sum, b) => sum + Number(b.totalNgn) * 0.1, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold" style={{ color: 'var(--ad-primary)' }}>Bookings</h1>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ background: 'var(--ad-muted)', color: 'var(--ad-secondary)' }}
        >
          {total}
        </span>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <div
          className="rounded-lg border px-4 py-3"
          style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
        >
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--ad-secondary)' }}>
            Total GMV
          </p>
          <p className="mt-0.5 text-lg font-bold" style={{ color: 'var(--ad-primary)' }}>
            {fmtNgn(totalGmv)}
          </p>
        </div>
        <div
          className="rounded-lg border px-4 py-3"
          style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
        >
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--ad-secondary)' }}>
            Commission Earned
          </p>
          <p className="mt-0.5 text-lg font-bold" style={{ color: 'var(--ad-accent)' }}>
            {fmtNgn(Math.round(commissionEarned))}
          </p>
        </div>
        <div
          className="rounded-lg border px-4 py-3"
          style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
        >
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--ad-secondary)' }}>
            Cancellation Rate
          </p>
          <p className="mt-0.5 text-lg font-bold" style={{ color: cancelledCount > 0 ? 'var(--ad-warning)' : 'var(--ad-primary)' }}>
            {cancellationRate}%
          </p>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border shadow-sm"
        style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--ad-muted)' }}>
                {['Booking Ref', 'Hotel', 'Guest', 'Dates', 'Room', 'Amount', 'Commission', 'Status', 'View'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--ad-secondary)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-sm" style={{ color: 'var(--ad-secondary)' }}>
                    No bookings found.
                  </td>
                </tr>
              ) : (
                bookings.map((b, idx) => (
                  <tr
                    key={b.id}
                    style={{ borderTop: idx === 0 ? undefined : `1px solid var(--ad-border)` }}
                  >
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--ad-secondary)' }}>
                      {b.reference}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--ad-primary)' }}>
                      {b.hotel?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--ad-primary)' }}>
                      <div>{b.user ? `${b.user.firstName} ${b.user.lastName}`.trim() : '—'}</div>
                      {b.user && (
                        <div className="text-xs" style={{ color: 'var(--ad-secondary)' }}>{b.user.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>
                      {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>
                      {b.roomType?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--ad-primary)' }}>
                      {fmtNgn(Number(b.totalNgn))}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--ad-secondary)' }}>
                      {fmtNgn(Math.round(Number(b.totalNgn) * 0.1))}
                    </td>
                    <td className="px-4 py-3">{statusBadge(b.status)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="rounded border px-2 py-1 text-xs font-medium transition-colors"
                        style={{ borderColor: 'var(--ad-border)', color: 'var(--ad-secondary)' }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid var(--ad-border)`, background: 'var(--ad-muted)' }}>
                <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--ad-secondary)' }} colSpan={5}>
                  Totals
                </td>
                <td className="px-4 py-3 font-bold" style={{ color: 'var(--ad-primary)' }}>
                  {fmtNgn(totalAmount)}
                </td>
                <td className="px-4 py-3 font-bold" style={{ color: 'var(--ad-primary)' }}>
                  {fmtNgn(Math.round(totalCommission))}
                </td>
                <td className="px-4 py-3" colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
