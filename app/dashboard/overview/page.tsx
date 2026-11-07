'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import {
  getMyHotel, getDashboardStats, getDashboardReservations, getDashboardRoomTypes,
  type DashboardHotel, type DashboardStats, type DashboardReservation, type DashboardRoomType,
} from '../../lib/api/dashboard';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNgn(n: number) { return '₦' + n.toLocaleString('en-NG'); }
function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ h = 16, w = '100%', radius = 8 }: { h?: number; w?: string | number; radius?: number }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: radius }} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [hotel, setHotel]           = useState<DashboardHotel | null>(null);
  const [stats, setStats]           = useState<DashboardStats | null>(null);
  const [reservations, setRes]      = useState<DashboardReservation[]>([]);
  const [roomTypes, setRoomTypes]   = useState<DashboardRoomType[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/signin');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const hotelData = await getMyHotel();
        if (cancelled) return;
        if (!hotelData) { setError('No hotel found for your account.'); setIsLoading(false); return; }
        setHotel(hotelData);
        const [s, r, rt] = await Promise.allSettled([
          getDashboardStats(hotelData.id),
          getDashboardReservations(hotelData.id),
          getDashboardRoomTypes(hotelData.id),
        ]);
        if (cancelled) return;
        if (s.status === 'fulfilled')  setStats(s.value);
        if (r.status === 'fulfilled')  setRes(r.value);
        if (rt.status === 'fulfilled') setRoomTypes(rt.value);
      } catch {
        if (!cancelled) setError('Failed to load dashboard data. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  if (authLoading || (!hotel && !error && isLoading)) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton h={32} w={280} />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-5 flex flex-col gap-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
              <Skeleton h={12} w="60%" /><Skeleton h={28} w="70%" />
            </div>
          ))}
        </div>
        <Skeleton h={200} radius={16} />
      </div>
    );
  }

  if (!user) return null;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border py-16 text-center"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
        <button onClick={() => window.location.reload()}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: 'var(--color-brand)' }}>
          Retry
        </button>
      </div>
    );
  }

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const upcoming = reservations
    .filter(r => r.status === 'confirmed' || r.status === 'pending')
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    .slice(0, 6);

  function availColor(rt: DashboardRoomType) {
    const ratio = rt.totalRooms > 0 ? rt.availableRooms / rt.totalRooms : 0;
    if (ratio > 0.5) return { bg: 'var(--color-success-bg)', text: 'var(--color-success-text)', label: 'Available' };
    if (ratio >= 0.2) return { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-text)', label: 'Limited' };
    return { bg: 'var(--color-danger-bg)', text: 'var(--color-danger-text)', label: 'Low' };
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ── Greeting ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Good morning, {hotel?.name ?? 'your hotel'} 👋
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{dateLabel}</p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          <Link
            href="/dashboard/reservations"
            className="rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-stone-50"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            View reservations
          </Link>
          <Link
            href="/dashboard/inventory"
            className="rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85"
            style={{ background: 'var(--color-brand)' }}
          >
            Manage calendar
          </Link>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Occupancy" value={`${stats?.occupancyPercent ?? 0}%`}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 12L12 3L21 12V20H15V14H9V20H3V12Z"/></svg>}
          accent={((stats?.occupancyPercent ?? 0) >= 70)}
        />
        <StatCard label="Revenue today" value={fmtNgn(stats?.todayRevenueNgn ?? 0)}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v1m0 8v1M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5M12 16h.01"/></svg>}
        />
        <StatCard label="Bookings today" value={String(stats?.bookingsToday ?? 0)}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        />
        <StatCard label="Check-ins today" value={String(stats?.upcomingCheckIns ?? 0)}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>}
        />
        <StatCard label="Check-outs today" value={String(stats?.upcomingCheckOuts ?? 0)}
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
        />
      </div>

      {/* ── Two-column area ── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">

        {/* Upcoming reservations table */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Upcoming reservations</h2>
            <Link href="/dashboard/reservations" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--color-brand)' }}>
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--color-muted)' }}>
                  {['Guest', 'Room type', 'Check-in', 'Check-out', 'Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {upcoming.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      No upcoming reservations
                    </td>
                  </tr>
                ) : upcoming.map((r, idx) => (
                  <tr
                    key={r.id}
                    className="border-t transition-colors hover:bg-stone-50"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>{r.guestName}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{r.roomTypeName}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>{fmtDate(r.checkIn)}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>{fmtDate(r.checkOut)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Room availability cards */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Room availability</h2>
          {roomTypes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border py-8 text-center" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No room types yet</p>
              <Link href="/dashboard/rooms" className="text-xs font-medium" style={{ color: 'var(--color-brand)' }}>Add rooms →</Link>
            </div>
          ) : roomTypes.map(rt => {
            const c = availColor(rt);
            const pct = rt.totalRooms > 0 ? Math.round((rt.availableRooms / rt.totalRooms) * 100) : 0;
            return (
              <div key={rt.id} className="rounded-2xl border p-4" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{rt.name}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: c.bg, color: c.text }}>{c.label}</span>
                </div>
                {/* Progress bar */}
                <div className="mb-2 h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--color-muted)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.text }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {rt.availableRooms} / {rt.totalRooms} available
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-brand)' }}>
                    {fmtNgn(rt.pricePerNight)}/night
                  </span>
                </div>
              </div>
            );
          })}
          <Link href="/dashboard/rooms" className="text-center text-xs font-medium transition-opacity hover:opacity-70" style={{ color: 'var(--color-brand)' }}>
            Manage rooms →
          </Link>
        </div>
      </div>

      {/* ── Revenue placeholder ── */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Revenue — last 7 days</h2>
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--color-muted)', color: 'var(--color-text-secondary)' }}>
            Chart coming soon
          </span>
        </div>
        <div
          className="flex h-32 items-center justify-center rounded-xl"
          style={{ background: 'var(--color-muted)', border: '1px dashed var(--color-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Revenue analytics will appear here once data is available.
          </p>
        </div>
      </div>
    </div>
  );
}
