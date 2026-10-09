'use client';

import React, { useState, useMemo } from 'react';
import { MOCK_RESERVATIONS } from '../mock/data';
import type { Reservation } from '../types';
import { StatusBadge } from '../components/StatusBadge';

// ── Helper ────────────────────────────────────────────────────────────────────

function formatNgn(n: number): string {
  return '₦' + n.toLocaleString('en-NG');
}

// ── Derived guest type ────────────────────────────────────────────────────────

type GuestSummary = {
  guestName: string;
  guestEmail: string;
  totalBookings: number;
  lastStayDate: string;
  totalSpent: number;
  bookings: Reservation[];
};

function buildGuestList(reservations: Reservation[]): GuestSummary[] {
  const map = new Map<string, GuestSummary>();

  for (const r of reservations) {
    const existing = map.get(r.guestEmail);
    if (!existing) {
      map.set(r.guestEmail, {
        guestName: r.guestName,
        guestEmail: r.guestEmail,
        totalBookings: 1,
        lastStayDate: r.checkOut,
        totalSpent: r.amountNgn,
        bookings: [r],
      });
    } else {
      existing.totalBookings += 1;
      existing.totalSpent += r.amountNgn;
      if (r.checkOut > existing.lastStayDate) {
        existing.lastStayDate = r.checkOut;
      }
      existing.bookings.push(r);
    }
  }

  return Array.from(map.values());
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GuestsPage() {
  const [search, setSearch] = useState('');
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  const allGuests = useMemo(() => buildGuestList(MOCK_RESERVATIONS), []);

  const filteredGuests = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allGuests;
    return allGuests.filter(
      g =>
        g.guestName.toLowerCase().includes(q) ||
        g.guestEmail.toLowerCase().includes(q),
    );
  }, [allGuests, search]);

  function toggleExpand(email: string) {
    setExpandedEmail(prev => (prev === email ? null : email));
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Page title */}
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--db-primary)' }}>
        Guests
      </h1>

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-lg border px-4 py-2 text-sm w-full max-w-sm"
          style={{
            borderColor: 'var(--db-border)',
            background: 'var(--db-surface)',
            color: 'var(--db-primary)',
            outline: 'none',
          }}
        />
      </div>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--db-bg)' }}>
              {['Name', 'Email', 'Total Bookings', 'Last Stay', 'Total Spent'].map(col => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--db-secondary)' }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredGuests.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm"
                  style={{ color: 'var(--db-secondary)' }}
                >
                  No guests found matching &ldquo;{search}&rdquo;
                </td>
              </tr>
            )}
            {filteredGuests.map((guest, i) => {
              const isExpanded = expandedEmail === guest.guestEmail;
              return (
                <React.Fragment key={guest.guestEmail}>
                  <tr
                    onClick={() => toggleExpand(guest.guestEmail)}
                    className="cursor-pointer transition-colors hover:bg-black/[0.02]"
                    style={{
                      background: i % 2 === 0 ? 'var(--db-surface)' : 'var(--db-bg)',
                      borderTop: '1px solid var(--db-border)',
                    }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--db-primary)' }}>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center rounded-full text-xs font-bold w-7 h-7 shrink-0"
                          style={{ background: 'var(--db-muted)', color: 'var(--db-accent)' }}
                        >
                          {guest.guestName
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                        {guest.guestName}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>
                      {guest.guestEmail}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--db-primary)' }}>
                      {guest.totalBookings}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>
                      {guest.lastStayDate}
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--db-primary)' }}>
                      {formatNgn(guest.totalSpent)}
                    </td>
                  </tr>

                  {/* Expanded bookings */}
                  {isExpanded && (
                    <tr
                      style={{
                        background: 'var(--db-muted)',
                        borderTop: '1px solid var(--db-border)',
                      }}
                    >
                      <td colSpan={5} className="px-6 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--db-secondary)' }}>
                          Booking History
                        </p>
                        <table className="w-full text-xs">
                          <thead>
                            <tr>
                              {['Booking ID', 'Room', 'Dates', 'Amount', 'Status'].map(col => (
                                <th
                                  key={col}
                                  className="py-1 pr-4 text-left font-semibold"
                                  style={{ color: 'var(--db-secondary)' }}
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {guest.bookings.map(b => (
                              <tr key={b.id} style={{ borderTop: '1px solid var(--db-border)' }}>
                                <td className="py-2 pr-4 font-mono" style={{ color: 'var(--db-primary)' }}>
                                  {b.id}
                                </td>
                                <td className="py-2 pr-4" style={{ color: 'var(--db-primary)' }}>
                                  {b.roomTypeName} #{b.roomNumber}
                                </td>
                                <td className="py-2 pr-4" style={{ color: 'var(--db-secondary)' }}>
                                  {b.checkIn} → {b.checkOut}
                                </td>
                                <td className="py-2 pr-4 font-semibold" style={{ color: 'var(--db-primary)' }}>
                                  {formatNgn(b.amountNgn)}
                                </td>
                                <td className="py-2">
                                  <StatusBadge status={b.status} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
