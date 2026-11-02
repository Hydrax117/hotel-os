'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { getMyHotel, getDashboardReservations, type DashboardReservation } from '@/app/lib/api/dashboard';
import { apiClient } from '@/app/lib/api/client';
import { StatusBadge } from '../../components/StatusBadge';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CheckInPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<DashboardReservation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    getMyHotel()
      .then(hotel => {
        if (!hotel) throw new Error('Hotel not found.');
        return getDashboardReservations(hotel.id);
      })
      .then(data => setReservations(data))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load reservations.'))
      .finally(() => setIsLoading(false));
  }, [user]);

  async function handleCheckIn(id: string) {
    setActionLoading(id);
    try {
      await apiClient.patch(`/api/v1/bookings/${id}/status`, { status: 'CHECKED_IN' });
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'checked_in' } : r));
    } catch {
      // silently revert — status badge will show correct state on next reload
    } finally {
      setActionLoading(null);
    }
  }

  const query = searchQuery.trim().toLowerCase();
  const ACTIONABLE = new Set(['confirmed', 'pending', 'checked_in']);
  const displayed = query
    ? reservations.filter(r => ACTIONABLE.has(r.status) && (r.id.toLowerCase().includes(query) || r.guestName.toLowerCase().includes(query)))
    : reservations.filter(r => r.status === 'confirmed' || r.status === 'pending');

  if (isLoading) return <div style={{ padding: 24, color: 'var(--db-secondary)' }}>Loading reservations…</div>;

  if (error) return (
    <div style={{ padding: 24 }}>
      <p style={{ color: 'var(--db-danger)' }}>{error}</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '8px 16px', background: 'var(--db-accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Retry</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6" style={{ color: 'var(--db-primary)' }}>
      <h1 className="text-2xl font-bold">Front Desk — Check In</h1>

      <input
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search by booking ID or guest name..."
        className="w-full max-w-md rounded-lg border px-4 py-2 text-sm outline-none"
        style={{ borderColor: 'var(--db-border)', color: 'var(--db-primary)', background: 'var(--db-surface)' }}
      />

      {displayed.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>No upcoming check-ins found.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {displayed.map(r => {
            const alreadyIn = r.status === 'checked_in';
            return (
              <div key={r.id} className="rounded-xl border p-5" style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">{r.guestName}</p>
                    <p className="text-xs" style={{ color: 'var(--db-secondary)' }}>Booking ID: {r.id}</p>
                    <p className="text-xs" style={{ color: 'var(--db-secondary)' }}>{r.roomTypeName} · Room {r.roomNumber}</p>
                    <p className="text-xs" style={{ color: 'var(--db-secondary)' }}>
                      {formatDate(r.checkIn)} → {formatDate(r.checkOut)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {alreadyIn
                      ? <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: '#dcfce7', color: '#166534' }}>Checked In</span>
                      : <StatusBadge status={r.status} />
                    }
                    <button
                      onClick={() => !alreadyIn && handleCheckIn(r.id)}
                      disabled={alreadyIn || actionLoading === r.id}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                      style={{ background: 'var(--db-accent)', opacity: alreadyIn ? 0.4 : 1, cursor: alreadyIn ? 'not-allowed' : 'pointer' }}
                    >
                      {actionLoading === r.id ? 'Processing…' : 'Confirm Check-in'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
