'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import {
  getAdminStats,
  getAdminBookings,
  getAdminHotels,
  getAdminRevenue,
  type AdminStats,
  type AdminBooking,
  type AdminHotel,
  type RevenueStats,
} from '../../lib/api/admin';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNgn(amount: number): string {
  return '\u20a6' + amount.toLocaleString('en-NG');
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
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

// ── Stat card ─────────────────────────────────────────────────────────────────

type AdminStatCardProps = {
  label: string;
  value: string;
  delta?: string;
  color?: string;
};

function AdminStatCard({ label, value, delta, color }: AdminStatCardProps) {
  return (
    <div
      className="rounded-xl border p-5 shadow-sm"
      style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
    >
      <p className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--ad-secondary)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: color ?? 'var(--ad-primary)' }}>
        {value}
      </p>
      {delta && (
        <p className="mt-1 text-xs" style={{ color: 'var(--ad-secondary)' }}>
          {delta}
        </p>
      )}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [pendingHotels, setPendingHotels] = useState<AdminHotel[]>([]);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    setError(null);

    const today = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    Promise.all([
      getAdminStats(),
      getAdminBookings({ limit: 8 }),
      getAdminHotels({ status: 'PENDING', limit: 5 }),
      getAdminRevenue(thirtyDaysAgo, today),
    ])
      .then(([s, b, h, r]) => {
        setStats(s);
        setBookings(b.bookings);
        setPendingHotels(h.hotels);
        setRevenue(r);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load admin data');
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

  // Revenue chart data
  const chartData = revenue?.dailyRevenue ?? [];
  const maxVal = chartData.length > 0 ? Math.max(...chartData.map(d => d.gmvNgn)) : 0;
  const chartHeight = 80;
  const barWidth = 20;
  const gap = 4;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <AdminStatCard
          label="Total Hotels"
          value={String(stats?.totalHotels ?? 0)}
        />
        <AdminStatCard
          label="Active Hotels"
          value={String(stats?.activeHotels ?? 0)}
        />
        <AdminStatCard
          label="Pending Approvals"
          value={String(stats?.pendingVerifications ?? 0)}
          color={(stats?.pendingVerifications ?? 0) > 0 ? 'var(--ad-warning)' : undefined}
        />
        <AdminStatCard
          label="Total Bookings"
          value={String(stats?.totalBookings ?? 0)}
        />
        <AdminStatCard
          label="GMV"
          value={fmtNgn(stats?.gmvNgn ?? 0)}
        />
        <AdminStatCard
          label="Platform Revenue"
          value={fmtNgn(stats?.platformRevenueNgn ?? 0)}
          color="var(--ad-accent)"
        />
      </div>

      {/* Recent Revenue Chart */}
      {chartData.length > 0 && (
        <div
          className="rounded-xl border p-5 shadow-sm"
          style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
        >
          <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--ad-primary)' }}>
            Revenue (Last 30 Days)
          </h2>
          <svg
            viewBox={`0 0 ${chartData.length * (barWidth + gap)} 110`}
            className="w-full"
            aria-label="Recent revenue bar chart"
            role="img"
          >
            {chartData.map((d, i) => {
              const barH = maxVal > 0 ? Number(((d.gmvNgn / maxVal) * chartHeight).toFixed(1)) : 0;
              const x = i * (barWidth + gap);
              const y = chartHeight - barH + 10;
              return (
                <g key={d.date}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barH}
                    rx="2"
                    fill="var(--ad-accent)"
                    opacity="0.85"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Recent Bookings */}
      <div
        className="rounded-xl border shadow-sm"
        style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
      >
        <div className="border-b px-5 py-4" style={{ borderColor: 'var(--ad-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--ad-primary)' }}>
            Recent Bookings
          </h2>
        </div>
        {bookings.length === 0 ? (
          <p className="px-5 py-6 text-sm" style={{ color: 'var(--ad-secondary)' }}>No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--ad-muted)' }}>
                  {['Booking Ref', 'Hotel', 'Guest', 'Check-in', 'Check-out', 'Amount', 'Status'].map(h => (
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
                {bookings.map((b, idx) => (
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
                      {b.user ? `${b.user.firstName} ${b.user.lastName}`.trim() : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>
                      {fmtDate(b.checkIn)}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>
                      {fmtDate(b.checkOut)}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--ad-primary)' }}>
                      {fmtNgn(Number(b.totalNgn))}
                    </td>
                    <td className="px-4 py-3">{statusBadge(b.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Hotel Verifications */}
      {pendingHotels.length > 0 && (
        <div
          className="rounded-xl border shadow-sm"
          style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
        >
          <div className="border-b px-5 py-4" style={{ borderColor: 'var(--ad-border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--ad-primary)' }}>
              Hotels Pending Verification
              <span
                className="ml-2 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ background: '#fef3c7', color: '#92400e' }}
              >
                {pendingHotels.length}
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--ad-muted)' }}>
                  {['Hotel Name', 'Owner', 'City', 'Submitted', 'Action'].map(h => (
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
                {pendingHotels.map((h, idx) => (
                  <tr
                    key={h.id}
                    style={{ borderTop: idx === 0 ? undefined : `1px solid var(--ad-border)` }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--ad-primary)' }}>{h.name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--ad-secondary)' }}>
                      {h.owner ? `${h.owner.firstName} ${h.owner.lastName}`.trim() : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--ad-secondary)' }}>{h.city}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>
                      {fmtDate(h.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href="/admin/hotels/verification"
                        className="rounded border px-3 py-1 text-xs font-medium transition-colors hover:bg-blue-50"
                        style={{ borderColor: 'var(--ad-accent)', color: 'var(--ad-accent)' }}
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
