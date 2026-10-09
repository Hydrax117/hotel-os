// Allow blocking prerender (required because layout uses usePathname() + dynamic params)
export const instant = false;

import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MOCK_ROOM_TYPES } from '../../mock/data';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNgn(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG');
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const room = MOCK_ROOM_TYPES.find(rt => rt.id === id);
  if (!room) notFound();

  return (
    <div className="flex flex-col gap-6" style={{ color: 'var(--db-primary)' }}>

      {/* ── Back link ── */}
      <Link
        href="/dashboard/rooms"
        className="inline-flex items-center gap-1.5 text-sm hover:underline underline-offset-2 w-fit"
        style={{ color: 'var(--db-secondary)' }}
      >
        ← Back to Rooms
      </Link>

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{room.name}</h1>
            {/* Active pill */}
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: '#dcfce7', color: '#166534' }}
            >
              Active
            </span>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--db-accent)' }}>
            {formatNgn(room.pricePerNight)} / night
          </p>
        </div>

        {/* Edit button */}
        <button
          className="rounded-lg border px-4 py-2 text-sm font-medium"
          style={{
            borderColor: 'var(--db-border)',
            color: 'var(--db-primary)',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          Edit
        </button>
      </div>

      {/* ── Info grid 2×2 ── */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Bed Type',        value: room.bedType },
          { label: 'Capacity',        value: `${room.capacity} ${room.capacity === 1 ? 'guest' : 'guests'}` },
          { label: 'Total Rooms',     value: String(room.totalRooms) },
          { label: 'Available Today', value: String(room.availableRooms) },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-xl border p-4 flex flex-col gap-1"
            style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
          >
            <span className="text-xs" style={{ color: 'var(--db-secondary)' }}>{item.label}</span>
            <span className="text-lg font-semibold">{item.value}</span>
          </div>
        ))}
      </div>

      {/* ── Photos section ── */}
      <div
        className="rounded-xl border p-5 flex flex-col gap-4"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: 'var(--db-primary)' }}>Photos</h2>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className="flex items-center justify-center rounded-lg border-2 border-dashed aspect-video"
              style={{
                borderColor: 'var(--db-border)',
                background: 'var(--db-muted)',
              }}
            >
              <span className="text-xs" style={{ color: 'var(--db-secondary)' }}>Upload photo</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Description section ── */}
      <div
        className="rounded-xl border p-5 flex flex-col gap-4"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: 'var(--db-primary)' }}>Description</h2>
        <div
          className="rounded-lg border p-3"
          style={{
            borderColor: 'var(--db-border)',
            background: 'var(--db-muted)',
            minHeight: '80px',
            color: 'var(--db-secondary)',
            fontSize: '0.875rem',
          }}
        >
          No description added yet. Click Edit to add a description.
        </div>
      </div>

    </div>
  );
}
