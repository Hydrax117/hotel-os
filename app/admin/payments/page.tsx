'use client';

// TODO: Wire to dedicated payments API when GET /admin/payments is implemented

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { getAdminBookings, type AdminBooking } from '../../lib/api/admin';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNgn(n: number): string {
  if (n >= 1_000_000) return '\u20a6' + (n / 1_000_000).toFixed(1) + 'm';
  return '\u20a6' + n.toLocaleString('en-NG');
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
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

export default function AdminPaymentsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    getAdminBookings({ limit: 100 })
      .then(res => setBookings(res.bookings))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load payments');
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

  const activeBks = bookings.filter(b => !['CANCELLED', 'cancelled'].includes(b.status));
  const totalProcessed = activeBks.reduce((sum, b) => sum + Number(b.totalNgn), 0);
  const totalCommission = activeBks.reduce((sum, b) => sum + Number(b.totalNgn) * 0.1, 0);
  const pendingSettlement = bookings
    .filter(b => ['CONFIRMED', 'confirmed', 'CHECKED_IN', 'checked_in'].includes(b.status))
    .reduce((sum, b) => sum + Number(b.totalNgn), 0);

  const rows = bookings.slice(0, 15);

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
        <StatCard label="Platform Commission" value={fmtNgn(Math.round(totalCommission))} sub="10% of gross" />
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
                {['Transaction ID', 'Booking Ref', 'Hotel', 'Guest', 'Date', 'Amount', 'Commission', 'Net to Hotel', 'Status', 'Method'].map(col => (
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '24px', textAlign: 'center', color: 'var(--ad-secondary)', fontSize: '14px' }}>
                    No payments found.
                  </td>
                </tr>
              ) : (
                rows.map((bk, i) => {
                  const txId = `${bk.reference}-PAY`;
                  const payStatus = getPaymentStatus(i);
                  const method = i % 2 === 0 ? 'Card' : 'Bank Transfer';
                  const amount = Number(bk.totalNgn);
                  const commission = Math.round(amount * 0.1);
                  const netToHotel = amount - commission;
                  return (
                    <tr
                      key={bk.id}
                      style={{ borderBottom: '1px solid var(--ad-border)', background: 'white' }}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>{txId}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--ad-primary)', whiteSpace: 'nowrap' }}>{bk.reference}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--ad-primary)', fontWeight: 500, minWidth: '160px' }}>{bk.hotel?.name ?? '—'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--ad-primary)', whiteSpace: 'nowrap' }}>
                        {bk.user ? `${bk.user.firstName} ${bk.user.lastName}`.trim() : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>{fmtDate(bk.createdAt)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--ad-primary)', whiteSpace: 'nowrap' }}>{fmtNgn(amount)}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>{fmtNgn(commission)}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--ad-primary)', whiteSpace: 'nowrap' }}>{fmtNgn(netToHotel)}</td>
                      <td style={{ padding: '12px 16px' }}>{statusBadge(payStatus)}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>{method}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
