'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { getAdminStats, type AdminStats } from '../../lib/api/admin';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNgn(n: number): string {
  if (n >= 1_000_000) return '₦' + (n / 1_000_000).toFixed(1) + 'm';
  return '₦' + n.toLocaleString('en-NG');
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

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function IconBarChart() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <line x1="9" y1="22" x2="9" y2="12" /><line x1="15" y1="22" x2="15" y2="12" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="7" r="4" /><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
      <circle cx="19" cy="7" r="2" /><path d="M22 21v-1a2 2 0 0 0-2-2h-2" />
    </svg>
  );
}

function IconDollar() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IconCreditCard() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ── Report cards data ─────────────────────────────────────────────────────────

type ReportCard = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const REPORT_CARDS: ReportCard[] = [
  { id: 'bookings', title: 'Bookings Summary', description: 'Monthly breakdown of all bookings and revenue', icon: <IconBarChart /> },
  { id: 'hotels', title: 'Hotel Performance', description: 'Occupancy, ADR and RevPAR by hotel', icon: <IconBuilding /> },
  { id: 'travelers', title: 'Traveler Activity', description: 'Registration, bookings and retention by traveler', icon: <IconUsers /> },
  { id: 'finance', title: 'Financial Reconciliation', description: 'Commission, settlements and platform revenue', icon: <IconDollar /> },
  { id: 'subscriptions', title: 'Subscription Revenue', description: 'Monthly recurring revenue by plan', icon: <IconCreditCard /> },
  { id: 'cities', title: 'City Performance', description: 'Hotel supply and demand by city', icon: <IconMap /> },
];

// ── Recent reports data ───────────────────────────────────────────────────────

type RecentReport = {
  name: string;
  generatedBy: string;
  date: string;
  format: 'PDF' | 'CSV';
};

const RECENT_REPORTS: RecentReport[] = [
  { name: 'Bookings Summary — October 2025', generatedBy: 'Super Admin', date: '2025-11-01', format: 'PDF' },
  { name: 'Hotel Performance — Q3 2025', generatedBy: 'Super Admin', date: '2025-10-28', format: 'CSV' },
  { name: 'Financial Reconciliation — October 2025', generatedBy: 'Super Admin', date: '2025-10-25', format: 'PDF' },
  { name: 'Traveler Activity — October 2025', generatedBy: 'Super Admin', date: '2025-10-20', format: 'CSV' },
  { name: 'City Performance — Q3 2025', generatedBy: 'Super Admin', date: '2025-10-15', format: 'PDF' },
  { name: 'Subscription Revenue — October 2025', generatedBy: 'Super Admin', date: '2025-10-10', format: 'CSV' },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    getAdminStats()
      .then(setStats)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
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
          style={{
            background: 'var(--ad-accent)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--ad-primary)', margin: 0 }}>
          Reports
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--ad-secondary)', margin: '6px 0 0' }}>
          Generate and schedule platform analytics reports.
        </p>
      </div>

      {/* Platform stats cards — sourced from GET /api/v1/admin/stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {[
          { label: 'Total GMV', value: fmtNgn(stats?.gmvNgn ?? 0) },
          { label: 'Platform Revenue', value: fmtNgn(stats?.platformRevenueNgn ?? 0) },
          { label: 'Active Hotels', value: String(stats?.activeHotels ?? 0) },
          { label: 'Total Travelers', value: String(stats?.totalTravelers ?? 0) },
        ].map(s => (
          <div
            key={s.label}
            style={{
              background: 'var(--ad-surface)',
              border: '1px solid var(--ad-border)',
              borderRadius: '12px',
              padding: '20px 24px',
              flex: '1 1 0',
              minWidth: '150px',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--ad-secondary)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--ad-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Report cards grid */}
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ad-primary)', marginBottom: '16px' }}>
        Available Reports
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
          marginBottom: '36px',
        }}
      >
        {REPORT_CARDS.map(card => (
          <div
            key={card.id}
            style={{
              background: 'var(--ad-surface)',
              border: '1px solid var(--ad-border)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                background: '#eff6ff',
                color: 'var(--ad-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ad-primary)', marginBottom: '4px' }}>
                {card.title}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ad-secondary)' }}>
                {card.description}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
              <button
                type="button"
                style={{
                  background: 'var(--ad-accent)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Generate report
              </button>
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ad-accent)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Schedule
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent generated reports */}
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ad-primary)', marginBottom: '16px' }}>
        Recent Reports
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
                {['Report Name', 'Generated By', 'Date', 'Format', 'Download'].map(col => (
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
              {RECENT_REPORTS.map((report, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--ad-border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--ad-primary)' }}>{report.name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--ad-secondary)' }}>{report.generatedBy}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>{report.date}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        background: report.format === 'PDF' ? '#fee2e2' : '#dcfce7',
                        color: report.format === 'PDF' ? '#dc2626' : '#15803d',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {report.format}
                    </span>
                  </td>
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
                      <IconDownload />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
