'use client';

import React, { useState } from 'react';
import { MOCK_RESERVATIONS } from '../../mock/data';
import { StatusBadge } from '../../components/StatusBadge';
import type { Reservation } from '../../types';

export default function CheckOutPage() {
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS);

  const checkedIn = reservations.filter(r => r.status === 'checked_in');

  function handleCheckOut(id: string) {
    setReservations(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'checked_out' } : r)),
    );
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
    });
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: 'var(--db-bg)', color: 'var(--db-primary)' }}
    >
      {/* Header */}
      <h1 className="mb-6 text-2xl font-bold" style={{ color: 'var(--db-primary)' }}>
        Front Desk — Check Out
      </h1>

      {checkedIn.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>
          No guests currently checked in.
        </p>
      ) : (
        <div
          className="overflow-hidden rounded-xl border"
          style={{
            background:  'var(--db-surface)',
            borderColor: 'var(--db-border)',
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b text-left text-xs font-semibold uppercase tracking-wide"
                style={{ borderColor: 'var(--db-border)', color: 'var(--db-secondary)' }}
              >
                <th className="px-5 py-3">Guest Name</th>
                <th className="px-5 py-3">Room</th>
                <th className="px-5 py-3">Check-in Date</th>
                <th className="px-5 py-3">Expected Check-out</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {checkedIn.map((r, idx) => (
                <tr
                  key={r.id}
                  className="border-b last:border-0 transition-colors"
                  style={{
                    borderColor: 'var(--db-border)',
                    background:  idx % 2 === 0 ? 'var(--db-surface)' : 'var(--db-bg)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--db-muted)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background =
                      idx % 2 === 0 ? 'var(--db-surface)' : 'var(--db-bg)';
                  }}
                >
                  <td className="px-5 py-3 font-medium" style={{ color: 'var(--db-primary)' }}>
                    {r.guestName}
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--db-secondary)' }}>
                    {r.roomTypeName} · {r.roomNumber}
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--db-secondary)' }}>
                    {formatDate(r.checkIn)}
                  </td>
                  <td className="px-5 py-3" style={{ color: 'var(--db-secondary)' }}>
                    {formatDate(r.checkOut)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleCheckOut(r.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                      style={{ background: 'var(--db-accent)' }}
                    >
                      Confirm Check-out
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
