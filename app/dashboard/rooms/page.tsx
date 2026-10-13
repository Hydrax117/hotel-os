'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import {
  getMyHotel,
  getDashboardRoomTypes,
  type DashboardRoomType,
} from '../../lib/api/dashboard';

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
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [roomTypes, setRoomTypes] = useState<DashboardRoomType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/signin');
    }
  }, [authLoading, user, router]);

  // Data fetch — only after auth confirmed
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const hotelData = await getMyHotel();
        if (cancelled) return;
        if (!hotelData) {
          setError('Could not load hotel data. Please try again.');
          setIsLoading(false);
          return;
        }
        const data = await getDashboardRoomTypes(hotelData.id);
        if (!cancelled) setRoomTypes(data);
      } catch {
        if (!cancelled) setError('Failed to load rooms. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [user]);

  // Auth loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--db-secondary)' }}>
        Loading…
      </div>
    );
  }

  if (!user) return null;

  // Data loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--db-secondary)' }}>
        Loading rooms…
      </div>
    );
  }

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
      {roomTypes.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>No room types found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {roomTypes.map(rt => {
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
      )}
    </div>
  );
}
