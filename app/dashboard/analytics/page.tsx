import React from 'react';
import { MOCK_REVENUE_DAYS, MOCK_RESERVATIONS, MOCK_ROOM_TYPES } from '../mock/data';
import { StatCard } from '../components/StatCard';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatNgn(n: number): string {
  return '₦' + n.toLocaleString('en-NG');
}

// ── Derived stats ─────────────────────────────────────────────────────────────

const totalRevenue = MOCK_REVENUE_DAYS.reduce((s, d) => s + d.revenueNgn, 0);
const avgOccupancy =
  MOCK_REVENUE_DAYS.reduce((s, d) => s + d.occupancyPercent, 0) / MOCK_REVENUE_DAYS.length;
const totalBookings = MOCK_REVENUE_DAYS.reduce((s, d) => s + d.bookings, 0);
const cancelledCount = MOCK_RESERVATIONS.filter(r => r.status === 'cancelled').length;
const cancellationRate = (cancelledCount / MOCK_RESERVATIONS.length) * 100;
const adr = totalRevenue / (totalBookings || 1);

// ── SVG Bar Chart — Revenue Trend ─────────────────────────────────────────────

function RevenueBarChart() {
  const data = MOCK_REVENUE_DAYS.slice(-14);
  const maxRevenue = Math.max(...data.map(d => d.revenueNgn));

  // Chart area: x 40–680, y 10–130
  const chartLeft = 40;
  const chartRight = 680;
  const chartTop = 10;
  const chartBottom = 130;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  const barWidth = 44;
  const gap = 5;
  const totalPerBar = barWidth + gap;

  // Y-axis guide lines at 0%, 50%, 100%
  const guides = [
    { pct: 1, y: chartTop },
    { pct: 0.5, y: chartTop + chartHeight * 0.5 },
    { pct: 0, y: chartBottom },
  ];

  return (
    <svg viewBox="0 0 700 160" width="100%" aria-label="Revenue trend bar chart">
      {/* Y-axis guide lines + labels */}
      {guides.map(g => {
        const labelVal = formatNgn(Math.round(maxRevenue * g.pct));
        return (
          <g key={g.y}>
            <line
              x1={chartLeft}
              y1={g.y}
              x2={chartRight}
              y2={g.y}
              stroke="#e8e4df"
              strokeWidth="1"
            />
            <text
              x={chartLeft - 4}
              y={g.y + 4}
              textAnchor="end"
              fontSize="8"
              fill="#6b6560"
            >
              {g.pct === 0 ? '0' : labelVal}
            </text>
          </g>
        );
      })}

      {/* Bars + X labels */}
      {data.map((d, i) => {
        const barH = maxRevenue > 0 ? (d.revenueNgn / maxRevenue) * chartHeight : 0;
        const x = chartLeft + i * totalPerBar + (chartWidth - data.length * totalPerBar) / 2;
        const y = chartBottom - barH;

        // Date label e.g. "Oct 1"
        const dt = new Date(d.date + 'T00:00:00');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const label = `${months[dt.getMonth()]} ${dt.getDate()}`;

        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              style={{ fill: 'var(--db-accent)' }}
              rx="2"
            />
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

// ── SVG Line Chart — Occupancy Trend ─────────────────────────────────────────

function OccupancyLineChart() {
  const data = MOCK_REVENUE_DAYS;

  // Chart area: x 40–680, y 10–100. Scale: 0%=y100, 100%=y10
  const chartLeft = 40;
  const chartRight = 680;
  const chartTop = 10;
  const chartBottom = 100;
  const chartHeight = chartBottom - chartTop;
  const chartWidth = chartRight - chartLeft;

  const step = chartWidth / (data.length - 1);

  function toXY(i: number, pct: number) {
    const x = chartLeft + i * step;
    const y = chartBottom - (pct / 100) * chartHeight;
    return { x, y };
  }

  const points = data.map((d, i) => toXY(i, d.occupancyPercent));
  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  const guides = [
    { label: '100%', y: chartTop },
    { label: '50%', y: chartTop + chartHeight * 0.5 },
    { label: '0%', y: chartBottom },
  ];

  return (
    <svg viewBox="0 0 700 120" width="100%" aria-label="Occupancy trend line chart">
      {/* Guide lines + Y labels */}
      {guides.map(g => (
        <g key={g.label}>
          <line
            x1={chartLeft}
            y1={g.y}
            x2={chartRight}
            y2={g.y}
            stroke="#e8e4df"
            strokeWidth="1"
          />
          <text
            x={chartLeft - 4}
            y={g.y + 4}
            textAnchor="end"
            fontSize="9"
            fill="#6b6560"
          >
            {g.label}
          </text>
        </g>
      ))}

      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        style={{ stroke: 'var(--db-accent)' }}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} style={{ fill: 'var(--db-accent)' }} />
      ))}
    </svg>
  );
}

// ── Bookings by Room Type ─────────────────────────────────────────────────────

function BookingsByRoomType() {
  const counts = MOCK_ROOM_TYPES.map(rt => ({
    name: rt.name,
    count: MOCK_RESERVATIONS.filter(r => r.roomTypeName === rt.name).length,
  }));
  const maxCount = Math.max(...counts.map(c => c.count), 1);

  return (
    <div className="flex flex-col gap-3">
      {counts.map(({ name, count }) => {
        const widthPct = Math.round((count / maxCount) * 100);
        return (
          <div key={name} className="flex items-center gap-3">
            <span
              className="text-sm w-36 shrink-0"
              style={{ color: 'var(--db-primary)' }}
            >
              {name}
            </span>
            <div
              className="flex-1 rounded-full overflow-hidden"
              style={{ background: 'var(--db-muted)', height: '12px' }}
            >
              <div
                style={{
                  width: `${widthPct}%`,
                  height: '100%',
                  background: 'var(--db-accent)',
                  borderRadius: '9999px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <span
              className="text-sm font-semibold w-8 text-right shrink-0"
              style={{ color: 'var(--db-primary)' }}
            >
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  return (
    <div style={{ padding: '24px 28px' }}>
      <h1
        className="text-2xl font-bold mb-6"
        style={{ color: 'var(--db-primary)' }}
      >
        Analytics
      </h1>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Revenue" value={formatNgn(totalRevenue)} />
        <StatCard label="Avg Occupancy" value={`${avgOccupancy.toFixed(1)}%`} />
        <StatCard label="Total Bookings" value={String(totalBookings)} />
        <StatCard label="Cancellation Rate" value={`${cancellationRate.toFixed(1)}%`} />
        <StatCard label="ADR (Avg Daily Rate)" value={formatNgn(Math.round(adr))} />
      </div>

      {/* Revenue bar chart */}
      <section
        className="rounded-xl border p-5 mb-6"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2
          className="text-base font-semibold mb-4"
          style={{ color: 'var(--db-primary)' }}
        >
          Revenue Trend (Last 14 Days)
        </h2>
        <RevenueBarChart />
      </section>

      {/* Occupancy line chart */}
      <section
        className="rounded-xl border p-5 mb-6"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2
          className="text-base font-semibold mb-4"
          style={{ color: 'var(--db-primary)' }}
        >
          Occupancy Trend (30 Days)
        </h2>
        <OccupancyLineChart />
      </section>

      {/* Bookings by room type */}
      <section
        className="rounded-xl border p-5"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2
          className="text-base font-semibold mb-4"
          style={{ color: 'var(--db-primary)' }}
        >
          Bookings by Room Type
        </h2>
        <BookingsByRoomType />
      </section>
    </div>
  );
}
