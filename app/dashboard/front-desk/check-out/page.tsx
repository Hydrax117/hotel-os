'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { getMyHotel, getDashboardReservations, type DashboardReservation } from '@/app/lib/api/dashboard';
import { apiClient } from '@/app/lib/api/client';
import { StatusBadge } from '../../components/StatusBadge';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CheckOutPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<DashboardReservation[]>([]);
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

  async function handleCheckOut(id: string) {
    setActionLoading(id);
    try {
      await apiClient.patch(`/api/v1/bookings/${id}/status`, { status: 'CHECKED_OUT' });
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'checked_out' } : r));
    } catch {
      // silently revert
    } finally {
      setActionLoading(null);
    }
  }

  const checkedIn = reservations.filter(r => r.status === 'checked_in');

  if (isLoading) return <div style={{ padding: 24, color: 'var(--db-secondary)' }}>Loading reservations…</div>;

  if (error) return (
    <div style={{ padding: 24 }}>
      <p style={{ color: 'var(--db-danger)' }}>{error}</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '8px 16px', background: 'var(--db-accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Retry</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6" style={{ color: 'var(--db-primary)' }}>
      <h1 className="text-2xl font-bold">Front Desk — Check Out</h1>

      {checkedIn.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>No guests currently checked in.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border" style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide" style={{ borderColor: 'var(--db-border)', color: 'var(--db-secondary)' }}>
                <th className="px-5 py-3">Guest</th>
                <th className="px-5 py-3">Room</th>
                <th className="px-5 py-3">Check-in</th>
                <th className="px-5 py-3">Check-out</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {checkedIn.map((r, idx) => (
                <tr key={r.id} className="border-b last:border-0" style={{ borderColor: 'var(--db-border)', background: idx % 2 === 0 ? 'var(--db-surface)' : 'var(--db-bg)' }}>
                  <td className="px-5 py-3 font-medium">{r.guestName}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--db-secondary)' }}>{r.roomTypeName} · {r.roomNumber}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--db-secondary)' }}>{formatDate(r.checkIn)}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--db-secondary)' }}>{formatDate(r.checkOut)}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleCheckOut(r.id)}
                      disabled={actionLoading === r.id}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                      style={{ background: 'var(--db-accent)' }}
                    >
                      {actionLoading === r.id ? 'Processing…' : 'Confirm Check-out'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
