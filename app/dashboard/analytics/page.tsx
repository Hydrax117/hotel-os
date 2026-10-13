'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { StatCard } from '../components/StatCard';
import {
  getMyHotel,
  getDashboardReservations,
  getDashboardRoomTypes,
  getDashboardStats,
  type DashboardReservation,
  type DashboardRoomType,
  type DashboardStats,
} from '../../lib/api/dashboard';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNgn(n: number): string {
  return '₦' + n.toLocaleString('en-NG');
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ padding: '32px 24px' }}>
      <div style={{ height: 28, width: 200, background: 'var(--db-muted)', borderRadius: 6, marginBottom: 24 }} />
      <div style={{ height: 80, background: 'var(--db-muted)', borderRadius: 8 }} />
    </div>
  );
}

// ── SVG Bar Chart — Revenue Trend ─────────────────────────────────────────────

function RevenueBarChart({ data }: { data: { date: string; revenueNgn: number }[] }) {
  const maxRevenue = Math.max(...data.map(d => d.revenueNgn), 1);

  const chartLeft   = 40;
  const chartRight  = 680;
  const chartTop    = 10;
  const chartBottom = 130;
  const chartWidth  = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const barWidth    = 44;
  const gap         = 5;
  const totalPerBar = barWidth + gap;

  const guides = [
    { pct: 1,   y: chartTop },
    { pct: 0.5, y: chartTop + chartHeight * 0.5 },
    { pct: 0,   y: chartBottom },
  ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <svg viewBox="0 0 700 160" width="100%" aria-label="Revenue trend bar chart">
      {guides.map(g => {
        const labelVal = formatNgn(Math.round(maxRevenue * g.pct));
        return (
          <g key={g.y}>
            <line x1={chartLeft} y1={g.y} x2={chartRight} y2={g.y} stroke="#e8e4df" strokeWidth="1" />
            <text x={chartLeft - 4} y={g.y + 4} textAnchor="end" fontSize="8" fill="#6b6560">
              {g.pct === 0 ? '0' : labelVal}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const barH = maxRevenue > 0 ? (d.revenueNgn / maxRevenue) * chartHeight : 0;
        const x    = chartLeft + i * totalPerBar + (chartWidth - data.length * totalPerBar) / 2;
        const y    = chartBottom - barH;
        const dt   = new Date(d.date + 'T00:00:00');
        const label = `${months[dt.getMonth()]} ${dt.getDate()}`;
        return (
          <g key={d.date}>
            <rect x={x} y={y} width={barWidth} height={barH} style={{ fill: 'var(--db-accent)' }} rx="2" />
            <text
              x={x + barWidth / 2}
              y={chartBottom + 14}
              textAnchor="end"
              fontSize="8"
              fill="#6b6560"
              transform={`rotate(-45, ${x + barWidth / 2}, ${chartBottom + 14})`}
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Current Occupancy Display ─────────────────────────────────────────────────

function CurrentOccupancyDisplay({ percent }: { percent: number }) {
  const radius    = 40;
  const cx        = 60;
  const cy        = 60;
  const circumference = 2 * Math.PI * radius;
  const offset    = circumference - (percent / 100) * circumference;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg viewBox="0 0 120 120" width={120} height={120} aria-label={`Current occupancy: ${percent}%`}>
        {/* Background track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="var(--db-muted)"
          strokeWidth="10"
        />
        {/* Progress arc */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="var(--db-accent)"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="18" fontWeight="bold" fill="var(--db-primary)">
          {percent}%
        </text>
      </svg>
      <div>
        <p style={{ color: 'var(--db-secondary)', fontSize: 13, margin: 0 }}>Current occupancy rate</p>
        <p style={{ color: 'var(--db-primary)', fontSize: 22, fontWeight: 700, margin: '4px 0 0' }}>
          {percent.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

// ── Bookings by Room Type ─────────────────────────────────────────────────────

function BookingsByRoomType({
  reservations,
  roomTypes,
}: {
  reservations: DashboardReservation[];
  roomTypes: DashboardRoomType[];
}) {
  const counts = roomTypes.map(rt => ({
    name:  rt.name,
    count: reservations.filter(r => r.roomTypeName === rt.name).length,
  }));

  // If no room types from API, group by reservation roomTypeName
  const displayCounts =
    counts.length > 0
      ? counts
      : Array.from(
          reservations.reduce((acc, r) => {
            acc.set(r.roomTypeName, (acc.get(r.roomTypeName) ?? 0) + 1);
            return acc;
          }, new Map<string, number>()),
        ).map(([name, count]) => ({ name, count }));

  const maxCount = Math.max(...displayCounts.map(c => c.count), 1);

  return (
    <div className="flex flex-col gap-3">
      {displayCounts.length === 0 ? (
        <p style={{ color: 'var(--db-secondary)', fontSize: 13 }}>No booking data yet.</p>
      ) : (
        displayCounts.map(({ name, count }) => {
          const widthPct = Math.round((count / maxCount) * 100);
          return (
            <div key={name} className="flex items-center gap-3">
              <span className="text-sm w-36 shrink-0" style={{ color: 'var(--db-primary)' }}>
                {name}
              </span>
              <div className="flex-1 rounded-full overflow-hidden" style={{ background: 'var(--db-muted)', height: '12px' }}>
                <div
                  style={{
                    width:        `${widthPct}%`,
                    height:       '100%',
                    background:   'var(--db-accent)',
                    borderRadius: '9999px',
                    transition:   'width 0.3s ease',
                  }}
                />
              </div>
              <span className="text-sm font-semibold w-8 text-right shrink-0" style={{ color: 'var(--db-primary)' }}>
                {count}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [reservations, setReservations] = useState<DashboardReservation[]>([]);
  const [roomTypes,    setRoomTypes]    = useState<DashboardRoomType[]>([]);
  const [stats,        setStats]        = useState<DashboardStats>({
    occupancyPercent: 0,
    todayRevenueNgn:  0,
    bookingsToday:    0,
    upcomingCheckIns: 0,
    upcomingCheckOuts: 0,
  });
  const [revenueByDay, setRevenueByDay] = useState<{ date: string; revenueNgn: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/signin');
    }
  }, [authLoading, user, router]);

  // Data fetch
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const hotel = await getMyHotel();
        if (cancelled) return;
        if (!hotel) {
          setError('Could not load hotel data. Please try again.');
          setIsLoading(false);
          return;
        }
        const [res, rooms, s] = await Promise.all([
          getDashboardReservations(hotel.id),
          getDashboardRoomTypes(hotel.id),
          getDashboardStats(hotel.id),
        ]);
        if (!cancelled) {
          setReservations(res);
          setRoomTypes(rooms);
          setStats(s);

          // Compute revenue by day here so `new Date()` isn't in a useMemo
          const confirmedRes = res.filter(b =>
            ['confirmed', 'checked_in', 'checked_out'].includes(b.status),
          );
          const cutoffMs = Date.now() - 14 * 24 * 60 * 60 * 1000;
          const dayMap = new Map<string, number>();
          for (const b of confirmedRes) {
            // Use checkOut date so revenue is attributed to when the stay ended
            const d = b.checkOut.slice(0, 10);
            if (new Date(d).getTime() >= cutoffMs) {
              dayMap.set(d, (dayMap.get(d) ?? 0) + b.amountNgn);
            }
          }
          setRevenueByDay(
            Array.from(dayMap.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, revenueNgn]) => ({ date, revenueNgn })),
          );
        }
      } catch {
        if (!cancelled) setError('Failed to load analytics. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [user]);

  // ── Derived analytics ──────────────────────────────────────────────────────

  const confirmed = useMemo(
    () => reservations.filter(b => ['confirmed', 'checked_in', 'checked_out'].includes(b.status)),
    [reservations],
  );

  const cancelled = useMemo(
    () => reservations.filter(b => b.status === 'cancelled'),
    [reservations],
  );

  const totalRevenue = useMemo(
    () => confirmed.reduce((s, b) => s + b.amountNgn, 0),
    [confirmed],
  );

  const totalNights = useMemo(
    () => confirmed.reduce((s, b) => s + (b.nights ?? 0), 0),
    [confirmed],
  );

  const adr = totalNights > 0 ? totalRevenue / totalNights : 0;

  const occupancy = reservations.length > 0
    ? (confirmed.length / reservations.length) * 100
    : stats.occupancyPercent;

  const cancellationRate = reservations.length > 0
    ? (cancelled.length / reservations.length) * 100
    : 0;

  // Auth loading
  if (authLoading) return <LoadingSkeleton />;
  if (!user) return null;

  // Data loading
  if (isLoading) return <LoadingSkeleton />;

  // Error state
  if (error) {
    return (
      <div
        className="rounded-xl border p-6 text-center"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)', color: 'var(--db-primary)' }}
      >
        <p className="mb-4" style={{ color: 'var(--db-secondary)' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--db-accent)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--db-primary)' }}>
        Analytics
      </h1>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Revenue"       value={formatNgn(totalRevenue)} />
        <StatCard label="Current Occupancy"   value={`${occupancy.toFixed(1)}%`} />
        <StatCard label="Total Bookings"      value={String(reservations.length)} />
        <StatCard label="Cancellation Rate"   value={`${cancellationRate.toFixed(1)}%`} />
        <StatCard label="ADR (Avg Daily Rate)" value={formatNgn(Math.round(adr))} />
      </div>

      {/* Revenue bar chart */}
      <section
        className="rounded-xl border p-5 mb-6"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--db-primary)' }}>
          Revenue Trend (Last 14 Days)
        </h2>
        {revenueByDay.length > 0 ? (
          <RevenueBarChart data={revenueByDay} />
        ) : (
          <p style={{ color: 'var(--db-secondary)', fontSize: 13 }}>No revenue data for the last 14 days.</p>
        )}
      </section>

      {/* Current Occupancy */}
      <section
        className="rounded-xl border p-5 mb-6"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--db-primary)' }}>
          Current Occupancy
        </h2>
        <CurrentOccupancyDisplay percent={Math.round(occupancy)} />
      </section>

      {/* Bookings by room type */}
      <section
        className="rounded-xl border p-5"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--db-primary)' }}>
          Bookings by Room Type
        </h2>
        <BookingsByRoomType reservations={reservations} roomTypes={roomTypes} />
      </section>
    </div>
  );
}
