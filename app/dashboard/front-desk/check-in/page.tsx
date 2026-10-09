'use client';

import React, { useState } from 'react';
import { MOCK_RESERVATIONS } from '../../mock/data';
import { StatusBadge } from '../../components/StatusBadge';
import type { Reservation } from '../../types';

export default function CheckInPage() {
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS);
  const [searchQuery,  setSearchQuery]  = useState('');

  const query = searchQuery.trim().toLowerCase();

  // When there is a search query, filter all reservations by ID or guest name,
  // but exclude terminal statuses so the check-in button is never shown for them.
  // When empty, show only upcoming (confirmed | pending) reservations.
  const ACTIONABLE_STATUSES = new Set(['confirmed', 'pending', 'checked_in']);

  const displayed: Reservation[] = query
    ? reservations.filter(
        r =>
          ACTIONABLE_STATUSES.has(r.status) &&
          (r.id.toLowerCase().includes(query) ||
            r.guestName.toLowerCase().includes(query)),
      )
    : reservations.filter(r => r.status === 'confirmed' || r.status === 'pending');

  function handleCheckIn(id: string) {
    setReservations(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'checked_in' } : r)),
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
        Front Desk — Check In
      </h1>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by booking ID, guest name..."
          className="w-full max-w-md rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2"
          style={{
            borderColor: 'var(--db-border)',
            color:       'var(--db-primary)',
            background:  'var(--db-surface)',
          }}
        />
      </div>

      {/* Results */}
      {displayed.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>
          No matching bookings found.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {displayed.map(reservation => {
            const alreadyCheckedIn = reservation.status === 'checked_in';
            return (
              <div
                key={reservation.id}
                className="rounded-xl border p-5"
                style={{
                  background:  'var(--db-surface)',
                  borderColor: 'var(--db-border)',
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Left: guest info */}
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold" style={{ color: 'var(--db-primary)' }}>
                      {reservation.guestName}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--db-secondary)' }}>
                      Booking ID: {reservation.id}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--db-secondary)' }}>
                      {reservation.roomTypeName} · Room {reservation.roomNumber}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--db-secondary)' }}>
                      Check-in: {formatDate(reservation.checkIn)} &nbsp;→&nbsp; Check-out: {formatDate(reservation.checkOut)}
                    </p>
                  </div>

                  {/* Right: status + action */}
                  <div className="flex flex-col items-end gap-2">
                    {alreadyCheckedIn ? (
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ background: '#dcfce7', color: '#166534' }}
                      >
                        Already Checked In
                      </span>
                    ) : (
                      <StatusBadge status={reservation.status} />
                    )}
                    <button
                      onClick={() => !alreadyCheckedIn && handleCheckIn(reservation.id)}
                      disabled={alreadyCheckedIn}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity"
                      style={{
                        background: 'var(--db-accent)',
                        opacity:    alreadyCheckedIn ? 0.4 : 1,
                        cursor:     alreadyCheckedIn ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Confirm Check-in
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
