'use client';

// TODO: Wire to dedicated payouts API when GET /admin/payouts is implemented

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { getAdminBookings, type AdminBooking } from '../../lib/api/admin';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNgn(n: number): string {
  if (n >= 1_000_000) return '\u20a6' + (n / 1_000_000).toFixed(1) + 'm';
  return '\u20a6' + n.toLocaleString('en-NG');
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

// ── Payout row shape (derived from bookings) ──────────────────────────────────

type PayoutRow = {
  id: string;
  hotel: string;
  amount: number;
  requestDate: string;
  status: 'pending' | 'processing';
};

type SettledRow = {
  date: string;
  hotel: string;
  amount: number;
  reference: string;
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPayoutsPage() {
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
        setError(err instanceof Error ? err.message : 'Failed to load payout data');
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

  // Derive payout data from bookings
  const checkedOut = bookings.filter(b => ['CHECKED_OUT', 'checked_out'].includes(b.status));
  const confirmed = bookings.filter(b => ['CONFIRMED', 'confirmed', 'CHECKED_IN', 'checked_in'].includes(b.status));

  const available = checkedOut.reduce((sum, b) => {
    const amt = Number(b.totalNgn);
    return sum + (amt - amt * 0.1);
  }, 0);

  const pending = confirmed.reduce((sum, b) => {
    const amt = Number(b.totalNgn);
    return sum + (amt - amt * 0.1);
  }, 0);

  const settled = checkedOut.reduce((sum, b) => sum + Number(b.totalNgn), 0);

  // Pending payout requests: confirmed bookings as payout rows
  const payoutRequests: PayoutRow[] = confirmed.slice(0, 10).map((b, i) => ({
    id: `PO-${String(i + 1).padStart(3, '0')}`,
    hotel: b.hotel?.name ?? '—',
    amount: Math.round((Number(b.totalNgn)) * 0.9),
    requestDate: b.createdAt.slice(0, 10),
    status: i % 3 === 2 ? 'processing' : 'pending',
  }));

  // Settled payouts: checked_out bookings
  const settledPayouts: SettledRow[] = checkedOut.slice(0, 10).map((b, i) => ({
    date: b.checkOut.slice(0, 10),
    hotel: b.hotel?.name ?? '—',
    amount: Math.round(Number(b.totalNgn) * 0.9),
    reference: `REF-${80000 + i}`,
  }));

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--ad-primary)', margin: 0 }}>
            Payouts
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--ad-secondary)', margin: '6px 0 0' }}>
            Manage hotel payout settlements.
          </p>
        </div>
        <button
          type="button"
          style={{
            background: 'var(--ad-success)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Process Payouts
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <StatCard label="Available" value={fmtNgn(Math.round(available))} sub="Ready to disburse" />
        <StatCard label="Pending" value={fmtNgn(Math.round(pending))} sub="Awaiting processing" />
        <StatCard label="Settled" value={fmtNgn(Math.round(settled))} sub="All time payouts" />
      </div>

      {/* Payout requests table */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ad-primary)', marginBottom: '16px' }}>
          Payout Requests
        </h2>
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
                  {['Hotel', 'Amount', 'Request Date', 'Status', 'Actions'].map(col => (
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
                        borderBottom: '1px solid var(--ad-border)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payoutRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--ad-secondary)', fontSize: '14px' }}>
                      No payout requests.
                    </td>
                  </tr>
                ) : (
                  payoutRequests.map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--ad-border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--ad-primary)' }}>{row.hotel}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--ad-primary)', whiteSpace: 'nowrap' }}>{fmtNgn(row.amount)}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>{row.requestDate}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            background: row.status === 'pending' ? '#fef3c7' : '#dbeafe',
                            color: row.status === 'pending' ? '#b45309' : '#1d4ed8',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: '999px',
                            textTransform: 'capitalize',
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {row.status === 'pending' && (
                          <button
                            type="button"
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--ad-accent)',
                              color: 'var(--ad-accent)',
                              padding: '6px 14px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Process
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Settled payouts history */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ad-primary)', marginBottom: '16px' }}>
          Settlement History
        </h2>
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
                  {['Date', 'Hotel', 'Amount', 'Reference', 'Download'].map(col => (
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
                        borderBottom: '1px solid var(--ad-border)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {settledPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--ad-secondary)', fontSize: '14px' }}>
                      No settled payouts yet.
                    </td>
                  </tr>
                ) : (
                  settledPayouts.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--ad-border)' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>{row.date}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--ad-primary)' }}>{row.hotel}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--ad-primary)', whiteSpace: 'nowrap' }}>{fmtNgn(row.amount)}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--ad-secondary)' }}>{row.reference}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          type="button"
                          style={{
                            background: 'var(--ad-muted)',
                            border: '1px solid var(--ad-border)',
                            color: 'var(--ad-primary)',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
