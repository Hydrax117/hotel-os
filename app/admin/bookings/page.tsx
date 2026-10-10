import React from 'react';
import { ADMIN_BOOKINGS } from '../mock';
import type { AdminBooking } from '../mock';

function statusBadge(status: AdminBooking['status']) {
  const map: Record<AdminBooking['status'], { bg: string; color: string; label: string }> = {
    confirmed:   { bg: '#dbeafe', color: '#1d4ed8', label: 'Confirmed' },
    checked_in:  { bg: '#dcfce7', color: '#15803d', label: 'Checked In' },
    checked_out: { bg: '#f3f4f6', color: '#374151', label: 'Checked Out' },
    cancelled:   { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' },
  };
  const s = map[status];
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

export default function AdminBookingsPage() {
  const nonCancelledStatuses: AdminBooking['status'][] = ['confirmed', 'checked_in', 'checked_out'];

  const totalGmv = ADMIN_BOOKINGS.reduce((sum, b) => sum + b.totalNgn, 0);
  const commissionEarned = ADMIN_BOOKINGS
    .filter(b => nonCancelledStatuses.includes(b.status))
    .reduce((sum, b) => sum + b.commissionNgn, 0);
  const cancelledCount = ADMIN_BOOKINGS.filter(b => b.status === 'cancelled').length;
  const cancellationRate = ADMIN_BOOKINGS.length > 0
    ? ((cancelledCount / ADMIN_BOOKINGS.length) * 100).toFixed(1)
    : '0.0';

  const totalAmount = ADMIN_BOOKINGS.reduce((sum, b) => sum + b.totalNgn, 0);
  const totalCommission = ADMIN_BOOKINGS.reduce((sum, b) => sum + b.commissionNgn, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold" style={{ color: 'var(--ad-primary)' }}>Bookings</h1>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ background: 'var(--ad-muted)', color: 'var(--ad-secondary)' }}
        >
          {ADMIN_BOOKINGS.length}
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
            ₦{totalGmv.toLocaleString()}
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
            ₦{commissionEarned.toLocaleString()}
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
                {['Booking ID', 'Hotel', 'Guest', 'Dates', 'Room', 'Amount', 'Commission', 'Status', 'View'].map(h => (
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
              {ADMIN_BOOKINGS.map((b, idx) => (
                <tr
                  key={b.id}
                  style={{ borderTop: idx === 0 ? undefined : `1px solid var(--ad-border)` }}
                >
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--ad-secondary)' }}>
                    {b.id}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--ad-primary)' }}>
                    {b.hotelName}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ad-primary)' }}>
                    <div>{b.guestName}</div>
                    <div className="text-xs" style={{ color: 'var(--ad-secondary)' }}>{b.guestEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>
                    {b.checkIn} → {b.checkOut}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>
                    {b.roomName}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--ad-primary)' }}>
                    ₦{b.totalNgn.toLocaleString()}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ad-secondary)' }}>
                    ₦{b.commissionNgn.toLocaleString()}
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
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: `2px solid var(--ad-border)`, background: 'var(--ad-muted)' }}>
                <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--ad-secondary)' }} colSpan={5}>
                  Totals
                </td>
                <td className="px-4 py-3 font-bold" style={{ color: 'var(--ad-primary)' }}>
                  ₦{totalAmount.toLocaleString()}
                </td>
                <td className="px-4 py-3 font-bold" style={{ color: 'var(--ad-primary)' }}>
                  ₦{totalCommission.toLocaleString()}
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
