'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { StatusBadge } from '../components/StatusBadge';
import {
  getMyHotel,
  getDashboardReservations,
  type DashboardReservation,
} from '../../lib/api/dashboard';
import type { BookingStatus } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNgn(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG');
}

// ── Types ─────────────────────────────────────────────────────────────────────

type StatusFilter = BookingStatus | 'all';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all',         label: 'All'         },
  { value: 'pending',     label: 'Pending'     },
  { value: 'confirmed',   label: 'Confirmed'   },
  { value: 'checked_in',  label: 'Checked In'  },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'cancelled',   label: 'Cancelled'   },
];

const PAGE_SIZE = 10;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [reservations, setReservations] = useState<DashboardReservation[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>('all');
  const [page, setPage]                   = useState(0);
  const [hoveredRow, setHoveredRow]       = useState<string | null>(null);

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
        const data = await getDashboardReservations(hotelData.id);
        if (!cancelled) setReservations(data);
      } catch {
        if (!cancelled) setError('Failed to load reservations. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reservations.filter(r => {
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesSearch =
        !q ||
        r.guestName.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [reservations, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const startIdx   = page * PAGE_SIZE;
  const endIdx     = Math.min(startIdx + PAGE_SIZE, filtered.length);
  const pageRows   = filtered.slice(startIdx, endIdx);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(0);
  }

  function handleStatusChange(val: StatusFilter) {
    setStatusFilter(val);
    setPage(0);
  }

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
        Loading reservations…
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
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Reservations</h1>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ background: 'var(--db-muted)', color: 'var(--db-secondary)' }}
        >
          {reservations.length}
        </span>
      </div>

      {/* ── Search + filter tabs ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <input
          type="search"
          placeholder="Search by guest name or booking ID…"
          value={search}
          onChange={handleSearchChange}
          className="rounded-lg border px-3 py-2 text-sm outline-none w-full lg:w-72"
          style={{
            background: 'var(--db-surface)',
            borderColor: 'var(--db-border)',
            color: 'var(--db-primary)',
          }}
        />

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map(tab => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleStatusChange(tab.value)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  background: isActive ? 'var(--db-accent)' : 'var(--db-muted)',
                  color: isActive ? '#ffffff' : 'var(--db-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--db-muted)' }}>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap" style={{ color: 'var(--db-secondary)' }}>Booking ID</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap" style={{ color: 'var(--db-secondary)' }}>Guest</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap" style={{ color: 'var(--db-secondary)' }}>Room Type</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap" style={{ color: 'var(--db-secondary)' }}>Check-in</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap" style={{ color: 'var(--db-secondary)' }}>Check-out</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap" style={{ color: 'var(--db-secondary)' }}>Nights</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap" style={{ color: 'var(--db-secondary)' }}>Amount (₦)</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap" style={{ color: 'var(--db-secondary)' }}>Status</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap" style={{ color: 'var(--db-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center"
                    style={{ color: 'var(--db-secondary)' }}
                  >
                    No reservations found
                  </td>
                </tr>
              ) : (
                pageRows.map((r, idx) => {
                  const isOdd     = idx % 2 === 1;
                  const isHovered = hoveredRow === r.id;
                  return (
                    <tr
                      key={r.id}
                      onMouseEnter={() => setHoveredRow(r.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        background: isHovered
                          ? 'var(--db-border)'
                          : isOdd
                          ? 'var(--db-muted)'
                          : 'var(--db-surface)',
                        transition: 'background 0.1s',
                      }}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--db-secondary)' }}>
                        {r.id}
                      </td>
                      <td className="px-4 py-3 font-medium">{r.guestName}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>{r.roomTypeName}</td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--db-secondary)' }}>{r.checkIn}</td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--db-secondary)' }}>{r.checkOut}</td>
                      <td className="px-4 py-3 text-center">{r.nights}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatNgn(r.amountNgn)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/reservations/${r.id}`}
                          className="text-xs font-medium underline-offset-2 hover:underline"
                          style={{ color: 'var(--db-accent)' }}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {filtered.length > 0 && (
          <div
            className="flex items-center justify-between border-t px-4 py-3 text-sm"
            style={{ borderColor: 'var(--db-border)' }}
          >
            <span style={{ color: 'var(--db-secondary)' }}>
              Showing {startIdx + 1}–{endIdx} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  borderColor: 'var(--db-border)',
                  background: 'var(--db-surface)',
                  color: page === 0 ? 'var(--db-border)' : 'var(--db-primary)',
                  cursor: page === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  borderColor: 'var(--db-border)',
                  background: 'var(--db-surface)',
                  color: page >= totalPages - 1 ? 'var(--db-border)' : 'var(--db-primary)',
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
