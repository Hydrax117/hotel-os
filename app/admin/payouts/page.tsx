import React from 'react';
import { connection } from 'next/server';
import { ADMIN_BOOKINGS } from '../mock';

export const instant = false;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNgn(n: number): string {
  if (n >= 1_000_000) return '₦' + (n / 1_000_000).toFixed(1) + 'm';
  return '₦' + n.toLocaleString('en-NG');
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

// ── Mock payout requests ──────────────────────────────────────────────────────

type PayoutRequest = {
  id: string;
  hotel: string;
  amount: number;
  requestDate: string;
  bank: string;
  status: 'pending' | 'processing';
};

const PAYOUT_REQUESTS: PayoutRequest[] = [
  { id: 'PO-001', hotel: 'Eko Signature Hotel', amount: 202500, requestDate: '2025-02-10', bank: 'GTBank •••• 1234', status: 'pending' },
  { id: 'PO-002', hotel: 'Transcorp Hilton Annex', amount: 76500, requestDate: '2025-02-09', bank: 'Access Bank •••• 5678', status: 'pending' },
  { id: 'PO-003', hotel: 'Abuja Continental', amount: 522000, requestDate: '2025-02-08', bank: 'Zenith Bank •••• 9012', status: 'processing' },
  { id: 'PO-004', hotel: 'Lekki Boutique Hotel', amount: 144000, requestDate: '2025-02-07', bank: 'First Bank •••• 3456', status: 'pending' },
  { id: 'PO-005', hotel: 'Port Harcourt Grandeur', amount: 171000, requestDate: '2025-02-06', bank: 'UBA •••• 7890', status: 'pending' },
];

type SettledPayout = {
  date: string;
  hotel: string;
  amount: number;
  reference: string;
};

const SETTLED_PAYOUTS: SettledPayout[] = [
  { date: '2025-02-01', hotel: 'Eko Signature Hotel', amount: 180000, reference: 'REF-82931' },
  { date: '2025-01-28', hotel: 'Transcorp Hilton Annex', amount: 63750, reference: 'REF-82741' },
  { date: '2025-01-25', hotel: 'Abuja Continental', amount: 265000, reference: 'REF-82551' },
  { date: '2025-01-22', hotel: 'Surulere Park Hotel', amount: 58500, reference: 'REF-82361' },
  { date: '2025-01-20', hotel: 'Calabar Heritage Inn', amount: 198000, reference: 'REF-82171' },
  { date: '2025-01-18', hotel: 'Kano Royal Suites', amount: 87000, reference: 'REF-81981' },
  { date: '2025-01-15', hotel: 'Enugu Mountain View', amount: 42500, reference: 'REF-81791' },
  { date: '2025-01-12', hotel: 'Port Harcourt Grandeur', amount: 142500, reference: 'REF-81601' },
  { date: '2025-01-10', hotel: 'Ibadan Crown Suites', amount: 52000, reference: 'REF-81411' },
  { date: '2025-01-08', hotel: 'Lekki Boutique Hotel', amount: 116250, reference: 'REF-81221' },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminPayoutsPage() {
  await connection();

  const checkedOut = ADMIN_BOOKINGS.filter(b => b.status === 'checked_out');
  const available = checkedOut.reduce((sum, b) => sum + (b.totalNgn - b.commissionNgn), 0);

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
        <StatCard label="Available" value={fmtNgn(4_800_000)} sub="Ready to disburse" />
        <StatCard label="Pending" value={fmtNgn(1_200_000)} sub="Awaiting processing" />
        <StatCard label="Settled" value={fmtNgn(48_600_000)} sub="All time payouts" />
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
                  {['Hotel', 'Amount', 'Request Date', 'Bank', 'Status', 'Actions'].map(col => (
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
                {PAYOUT_REQUESTS.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--ad-border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--ad-primary)' }}>{row.hotel}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--ad-primary)', whiteSpace: 'nowrap' }}>{fmtNgn(row.amount)}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>{row.requestDate}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>{row.bank}</td>
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
                ))}
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
                {SETTLED_PAYOUTS.map((row, i) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
