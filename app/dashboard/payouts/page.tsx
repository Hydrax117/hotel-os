import React from 'react';
import { MOCK_PAYOUTS } from '../mock/data';
import { StatCard } from '../components/StatCard';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNgn(n: number): string {
  return '₦' + n.toLocaleString('en-NG');
}

// ── Local PayoutBadge (avoids StatusBadge's BookingStatus typing) ─────────────

type PayoutStatus = 'settled' | 'pending' | 'processing';

function PayoutBadge({ status }: { status: PayoutStatus }) {
  const styles: Record<PayoutStatus, { bg: string; color: string; label: string }> = {
    settled: { bg: '#dcfce7', color: '#166534', label: 'Settled' },
    processing: { bg: '#dbeafe', color: '#1e40af', label: 'Processing' },
    pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  };
  const { bg, color, label } = styles[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}

// ── Derived balances ──────────────────────────────────────────────────────────

const availableBalance = MOCK_PAYOUTS.filter(p => p.status === 'settled').reduce(
  (s, p) => s + p.netNgn,
  0,
);
const pendingBalance = MOCK_PAYOUTS.filter(p => p.status === 'pending').reduce(
  (s, p) => s + p.netNgn,
  0,
);
const totalSettled = availableBalance;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PayoutsPage() {
  const totalGross = MOCK_PAYOUTS.reduce((s, p) => s + p.grossNgn, 0);
  const totalFee = MOCK_PAYOUTS.reduce((s, p) => s + p.commissionNgn, 0);
  const totalNet = MOCK_PAYOUTS.reduce((s, p) => s + p.netNgn, 0);

  return (
    <div style={{ padding: '24px 28px' }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--db-primary)' }}>
        Payouts
      </h1>

      {/* Balance cards */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        <StatCard label="Available Balance" value={formatNgn(availableBalance)} />
        <StatCard label="Pending" value={formatNgn(pendingBalance)} />
        <StatCard label="Total Settled" value={formatNgn(totalSettled)} />
      </div>

      {/* Request Payout button */}
      <div className="mb-6">
        <button
          disabled={availableBalance === 0}
          title={availableBalance === 0 ? 'No available balance to payout' : undefined}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--db-accent)' }}
        >
          Request Payout
        </button>
      </div>

      {/* Transactions table */}
      <section
        className="rounded-xl border"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--db-border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--db-primary)' }}>
            Transactions
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--db-bg)' }}>
                {['Booking ID', 'Guest', 'Date', 'Gross (₦)', 'Platform Fee', 'Net (₦)', 'Status'].map(
                  col => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--db-secondary)' }}
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {MOCK_PAYOUTS.map((p, i) => (
                <tr
                  key={p.id}
                  style={{
                    background: i % 2 === 0 ? 'var(--db-surface)' : 'var(--db-bg)',
                    borderTop: '1px solid var(--db-border)',
                  }}
                  className="hover:bg-opacity-80"
                >
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--db-primary)' }}>
                    {p.bookingId}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--db-primary)' }}>
                    {p.guestName}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>
                    {p.date}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--db-primary)' }}>
                    {formatNgn(p.grossNgn)}
                  </td>
                  <td
                    className="px-4 py-3 font-medium"
                    style={{ color: 'var(--db-danger)' }}
                  >
                    -{formatNgn(p.commissionNgn)}
                  </td>
                  <td
                    className="px-4 py-3 font-semibold"
                    style={{ color: 'var(--db-success)' }}
                  >
                    {formatNgn(p.netNgn)}
                  </td>
                  <td className="px-4 py-3">
                    <PayoutBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Total row */}
            <tfoot>
              <tr
                style={{
                  borderTop: '2px solid var(--db-border)',
                  background: 'var(--db-muted)',
                }}
              >
                <td
                  colSpan={3}
                  className="px-4 py-3 text-sm font-semibold"
                  style={{ color: 'var(--db-primary)' }}
                >
                  Total
                </td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--db-primary)' }}>
                  {formatNgn(totalGross)}
                </td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--db-danger)' }}>
                  -{formatNgn(totalFee)}
                </td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--db-success)' }}>
                  {formatNgn(totalNet)}
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
