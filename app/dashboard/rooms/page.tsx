import React from 'react';
import Link from 'next/link';
import { MOCK_ROOM_TYPES } from '../mock/data';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNgn(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG');
}

function availabilityPill(available: number, total: number): { label: string; bg: string; color: string } {
  const ratio = available / total;
  if (ratio > 0.5)  return { label: 'Good',    bg: '#dcfce7', color: '#166534' };
  if (ratio >= 0.2) return { label: 'Limited', bg: '#fef3c7', color: '#92400e' };
  return              { label: 'Low',     bg: '#fee2e2', color: '#991b1b' };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RoomsPage() {
  return (
    <div className="flex flex-col gap-6" style={{ color: 'var(--db-primary)' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Rooms</h1>
        <button
          disabled
          className="rounded-lg border px-4 py-2 text-sm font-medium"
          style={{
            borderColor: 'var(--db-accent)',
            color: 'var(--db-accent)',
            background: 'transparent',
            cursor: 'not-allowed',
            opacity: 0.5,
          }}
        >
          + Add room type
        </button>
      </div>

      {/* ── Room type grid ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {MOCK_ROOM_TYPES.map(rt => {
          const pill = availabilityPill(rt.availableRooms, rt.totalRooms);
          return (
            <div
              key={rt.id}
              className="rounded-xl border shadow-sm transition-shadow hover:shadow-md flex flex-col gap-4 p-5"
              style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
            >
              {/* Name + pill */}
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold" style={{ color: 'var(--db-primary)' }}>
                  {rt.name}
                </h2>
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0"
                  style={{ background: pill.bg, color: pill.color }}
                >
                  {pill.label}
                </span>
              </div>

              {/* Bed + capacity */}
              <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>
                {rt.bedType} · {rt.capacity} {rt.capacity === 1 ? 'guest' : 'guests'}
              </p>

              {/* Availability + price */}
              <div className="flex items-end justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs" style={{ color: 'var(--db-secondary)' }}>Availability</span>
                  <span className="text-sm font-medium">
                    {rt.availableRooms} / {rt.totalRooms} rooms available
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 text-right">
                  <span className="text-xs" style={{ color: 'var(--db-secondary)' }}>Per night</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--db-accent)' }}>
                    {formatNgn(rt.pricePerNight)}
                  </span>
                </div>
              </div>

              {/* View details link */}
              <Link
                href={`/dashboard/rooms/${rt.id}`}
                className="inline-flex items-center text-xs font-medium underline-offset-2 hover:underline mt-auto w-fit"
                style={{ color: 'var(--db-accent)' }}
              >
                View details →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
