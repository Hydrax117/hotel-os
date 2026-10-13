'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import {
  getMyHotel,
  getDashboardStats,
  getDashboardReservations,
  getDashboardRoomTypes,
  type DashboardHotel,
  type DashboardStats,
  type DashboardReservation,
  type DashboardRoomType,
} from '../../lib/api/dashboard';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNgn(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG');
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [hotel, setHotel]               = useState<DashboardHotel | null>(null);
  const [stats, setStats]               = useState<DashboardStats | null>(null);
  const [reservations, setReservations] = useState<DashboardReservation[]>([]);
  const [roomTypes, setRoomTypes]       = useState<DashboardRoomType[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);

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
        setHotel(hotelData);

        const [statsData, reservationsData, roomTypesData] = await Promise.all([
          getDashboardStats(hotelData.id),
          getDashboardReservations(hotelData.id),
          getDashboardRoomTypes(hotelData.id),
        ]);
        if (cancelled) return;
        setStats(statsData);
        setReservations(reservationsData);
        setRoomTypes(roomTypesData);
      } catch {
        if (!cancelled) setError('Failed to load dashboard data. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [user]);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--db-secondary)' }}>
        Loading…
      </div>
    );
  }

  // Redirect in progress
  if (!user) return null;

  // Data loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--db-secondary)' }}>
        Loading dashboard…
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

  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const upcomingReservations = reservations
    .filter(r => r.status === 'confirmed' || r.status === 'pending')
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    .slice(0, 5);

  function availabilityColor(rt: { availableRooms: number; totalRooms: number }): string {
    const ratio = rt.availableRooms / rt.totalRooms;
    if (ratio > 0.5) return 'var(--db-success)';
    if (ratio >= 0.2) return 'var(--db-warning)';
    return 'var(--db-danger)';
  }

  function availabilityLabel(rt: { availableRooms: number; totalRooms: number }): string {
    const ratio = rt.availableRooms / rt.totalRooms;
    if (ratio > 0.5) return 'Good';
    if (ratio >= 0.2) return 'Limited';
    return 'Low';
  }

  return (
    <div className="flex flex-col gap-8" style={{ color: 'var(--db-primary)' }}>

      {/* ── a) Greeting ── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Good morning, {hotel?.name ?? 'Your Hotel'} 👋
        </h1>
        <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>{dateLabel}</p>
      </div>

      {/* ── b) Stats row ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Today's Occupancy"
          value={`${stats?.occupancyPercent ?? 0}%`}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12L12 3L21 12V20H15V14H9V20H3V12Z" />
            </svg>
          }
        />
        <StatCard
          label="Today's Revenue"
          value={formatNgn(stats?.todayRevenueNgn ?? 0)}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v1m0 8v1M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5M12 16h.01" />
            </svg>
          }
        />
        <StatCard
          label="Bookings Today"
          value={String(stats?.bookingsToday ?? 0)}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <StatCard
          label="Upcoming Check-ins"
          value={String(stats?.upcomingCheckIns ?? 0)}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          }
        />
        <StatCard
          label="Upcoming Check-outs"
          value={String(stats?.upcomingCheckOuts ?? 0)}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          }
        />
      </div>

      {/* ── c) Revenue chart placeholder ── */}
      <div
        className="rounded-xl border p-5"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--db-primary)' }}>Revenue — Last 7 Days</h2>
        <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>Revenue analytics coming soon.</p>
      </div>

      {/* ── d) Upcoming reservations mini-table ── */}
      <div
        className="rounded-xl border"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--db-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--db-primary)' }}>
            Upcoming Reservations
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--db-muted)' }}>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Guest Name</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Room Type</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Check-in</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Check-out</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {upcomingReservations.map((r, idx) => (
                <tr
                  key={r.id}
                  style={{ background: idx % 2 === 1 ? 'var(--db-muted)' : 'var(--db-surface)' }}
                >
                  <td className="px-4 py-3">{r.guestName}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>{r.roomTypeName}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>{r.checkIn}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>{r.checkOut}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
              {upcomingReservations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center" style={{ color: 'var(--db-secondary)' }}>
                    No upcoming reservations
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── e) Room availability summary ── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--db-primary)' }}>
          Room Availability
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {roomTypes.map(rt => {
            const pillColor = availabilityColor(rt);
            const pillLabel = availabilityLabel(rt);
            return (
              <div
                key={rt.id}
                className="rounded-xl border p-4"
                style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-semibold text-sm" style={{ color: 'var(--db-primary)' }}>
                    {rt.name}
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: pillColor + '20', color: pillColor }}
                  >
                    {pillLabel}
                  </span>
                </div>
                <p className="text-xs mb-1" style={{ color: 'var(--db-secondary)' }}>
                  {rt.availableRooms} / {rt.totalRooms} available
                </p>
                <p className="text-xs font-medium" style={{ color: 'var(--db-accent)' }}>
                  {formatNgn(rt.pricePerNight)} / night
                </p>
              </div>
            );
          })}
          {roomTypes.length === 0 && (
            <p className="col-span-2 text-sm" style={{ color: 'var(--db-secondary)' }}>
              No room types found.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
