import React from 'react';
import Link from 'next/link';
import { PLATFORM_STATS, ADMIN_BOOKINGS, ADMIN_HOTELS } from '../mock';
import type { AdminBooking } from '../mock';

function fmtNgn(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}m`;
  return `₦${n.toLocaleString()}`;
}

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
      <p
        className="text-2xl font-bold"
        style={{ color: color ?? 'var(--ad-primary)' }}
      >
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

function statusBadge(status: AdminBooking['status']) {
  const styles: Record<AdminBooking['status'], { bg: string; color: string; label: string }> = {
    confirmed:    { bg: '#dbeafe', color: '#1d4ed8', label: 'Confirmed' },
    checked_in:   { bg: '#dcfce7', color: '#15803d', label: 'Checked In' },
    checked_out:  { bg: '#f3f4f6', color: '#374151', label: 'Checked Out' },
    cancelled:    { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' },
  };
  const s = styles[status];
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

export default function AdminOverviewPage() {
  const recentBookings = ADMIN_BOOKINGS.slice(-8).reverse();
  const pendingHotels = ADMIN_HOTELS.filter(h => h.verificationStatus === 'pending');

  // SVG bar chart — last 7 bookings
  const chartBookings = ADMIN_BOOKINGS.slice(-7);
  const maxVal = Math.max(...chartBookings.map(b => b.totalNgn));
  const chartHeight = 80;
  const barWidth = 60;
  const gap = 26;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <AdminStatCard
          label="Total Hotels"
          value={String(PLATFORM_STATS.totalHotels)}
          delta="+3 this month"
        />
        <AdminStatCard
          label="Active Hotels"
          value={String(PLATFORM_STATS.activeHotels)}
        />
        <AdminStatCard
          label="Pending Approvals"
          value={String(PLATFORM_STATS.pendingApprovals)}
          color={PLATFORM_STATS.pendingApprovals > 0 ? 'var(--ad-warning)' : undefined}
        />
        <AdminStatCard
          label="Total Bookings"
          value={String(PLATFORM_STATS.totalBookings)}
        />
        <AdminStatCard
          label="GMV"
          value={fmtNgn(PLATFORM_STATS.gmvNgn)}
        />
        <AdminStatCard
          label="Platform Revenue"
          value={fmtNgn(PLATFORM_STATS.platformRevenueNgn)}
          color="var(--ad-accent)"
        />
      </div>

      {/* Recent Revenue Chart */}
      <div
        className="rounded-xl border p-5 shadow-sm"
        style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
      >
        <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--ad-primary)' }}>
          Recent Revenue
        </h2>
        <svg
          viewBox={`0 0 ${chartBookings.length * (barWidth + gap)} 110`}
          className="w-full"
          aria-label="Recent revenue bar chart"
          role="img"
        >
          {chartBookings.map((b, i) => {
            const barH = maxVal > 0 ? Number(((b.totalNgn / maxVal) * chartHeight).toFixed(1)) : 0;
            const x = i * (barWidth + gap);
            const y = chartHeight - barH + 10;
            const idSuffix = b.id.slice(-4);
            return (
              <g key={b.id}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx="4"
                  fill="var(--ad-accent)"
                  opacity="0.85"
                />
                <text
                  x={x + barWidth / 2}
                  y={105}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--ad-secondary)"
                >
                  {idSuffix}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--ad-muted)' }}>
                {['Booking ID', 'Hotel', 'Guest', 'Check-in', 'Check-out', 'Amount', 'Commission', 'Status'].map(h => (
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
              {recentBookings.map((b, idx) => (
                <tr
                  key={b.id}
                  style={{ borderTop: idx === 0 ? undefined : `1px solid var(--ad-border)` }}
                >
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--ad-secondary)' }}>{b.id}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--ad-primary)' }}>{b.hotelName}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--ad-primary)' }}>{b.guestName}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>{b.checkIn}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>{b.checkOut}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--ad-primary)' }}>
                    ₦{b.totalNgn.toLocaleString()}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ad-secondary)' }}>
                    ₦{b.commissionNgn.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{statusBadge(b.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                    <td className="px-4 py-3" style={{ color: 'var(--ad-secondary)' }}>{h.ownerName}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--ad-secondary)' }}>{h.city}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>{h.submittedAt}</td>
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
