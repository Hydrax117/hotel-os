import React from 'react';
import { connection } from 'next/server';
import { ADMIN_BOOKINGS } from '../mock';
import type { AdminBooking } from '../mock';

export const instant = false;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNgn(n: number): string {
  if (n >= 1_000_000) return '₦' + (n / 1_000_000).toFixed(1) + 'm';
  return '₦' + n.toLocaleString('en-NG');
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

type PaymentStatus = 'settled' | 'pending' | 'failed';

function statusBadge(status: PaymentStatus) {
  const styles: Record<PaymentStatus, { bg: string; color: string; label: string }> = {
    settled: { bg: '#dcfce7', color: '#15803d', label: 'Settled' },
    pending: { bg: '#fef3c7', color: '#b45309', label: 'Pending' },
    failed:  { bg: '#fee2e2', color: '#dc2626', label: 'Failed' },
  };
  const s = styles[status];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: '12px',
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: '999px',
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

function getPaymentStatus(index: number): PaymentStatus {
  if (index < 10) return 'settled';
  if (index < 13) return 'pending';
  return 'failed';
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        background: 'var(--ad-surface)',
        border: '1px solid var(--ad-border)',
        borderRadius: '12px',
        padding: '20px 24px',
        flex: '1 1 0',
        minWidth: '180px',
      }}
    >
      <div style={{ fontSize: '13px', color: 'var(--ad-secondary)', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ad-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--ad-secondary)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminPaymentsPage() {
  await connection();

  const activeBks = ADMIN_BOOKINGS.filter(b => b.status !== 'cancelled');
  const totalProcessed = activeBks.reduce((sum, b) => sum + b.totalNgn, 0);
  const totalCommission = activeBks.reduce((sum, b) => sum + b.commissionNgn, 0);
  const pendingSettlement = 4_200_000;

  // Generate 15 rows from ADMIN_BOOKINGS (pad/truncate to 15)
  const rows: AdminBooking[] = ADMIN_BOOKINGS.slice(0, 15);

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--ad-primary)', margin: 0 }}>
          Payments
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--ad-secondary)', margin: '6px 0 0' }}>
          Track all payment transactions and platform earnings.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <StatCard label="Total Processed" value={fmtNgn(totalProcessed)} sub="All non-cancelled bookings" />
        <StatCard label="Platform Commission" value={fmtNgn(totalCommission)} sub="10% of gross" />
        <StatCard label="Pending Settlement" value={fmtNgn(pendingSettlement)} sub="Awaiting payout" />
      </div>

      {/* Controls row */}
      <div
        style={{
          background: 'var(--ad-surface)',
          border: '1px solid var(--ad-border)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <label htmlFor="dateFrom" style={{ fontSize: '13px', color: 'var(--ad-secondary)' }}>From</label>
          <input
            id="dateFrom"
            type="date"
            style={{
              border: '1px solid var(--ad-border)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '13px',
              color: 'var(--ad-primary)',
              background: 'white',
              outline: 'none',
            }}
          />
          <label htmlFor="dateTo" style={{ fontSize: '13px', color: 'var(--ad-secondary)' }}>To</label>
          <input
            id="dateTo"
            type="date"
            style={{
              border: '1px solid var(--ad-border)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '13px',
              color: 'var(--ad-primary)',
              background: 'white',
              outline: 'none',
            }}
          />
        </div>
        <button
          type="button"
          style={{
            background: 'var(--ad-accent)',
            color: 'white',
            border: 'none',
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--ad-surface)',
          border: '1px solid var(--ad-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--ad-muted)' }}>
                {['Transaction ID', 'Booking ID', 'Hotel', 'Guest', 'Date', 'Amount', 'Commission', 'Net to Hotel', 'Status', 'Method'].map(col => (
                  <th
                    key={col}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--ad-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                      borderBottom: '1px solid var(--ad-border)',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((bk, i) => {
                const txId = `${bk.id}-PAY`;
                const payStatus = getPaymentStatus(i);
                const method = i % 2 === 0 ? 'Card' : 'Bank Transfer';
                const netToHotel = bk.totalNgn - bk.commissionNgn;
                return (
                  <tr
                    key={bk.id}
                    style={{
                      borderBottom: '1px solid var(--ad-border)',
                      background: 'white',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>{txId}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--ad-primary)', whiteSpace: 'nowrap' }}>{bk.id}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--ad-primary)', fontWeight: 500, minWidth: '160px' }}>{bk.hotelName}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--ad-primary)', whiteSpace: 'nowrap' }}>{bk.guestName}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>{fmtDate(bk.createdAt)}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--ad-primary)', whiteSpace: 'nowrap' }}>{fmtNgn(bk.totalNgn)}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>{fmtNgn(bk.commissionNgn)}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--ad-primary)', whiteSpace: 'nowrap' }}>{fmtNgn(netToHotel)}</td>
                    <td style={{ padding: '12px 16px' }}>{statusBadge(payStatus)}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>{method}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
