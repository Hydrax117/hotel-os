'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import {
  getMyHotel,
  getDashboardReservations,
  getDashboardRoomTypes,
  type DashboardReservation,
  type DashboardRoomType,
} from '@/app/lib/api/dashboard';
import { apiClient, ApiError } from '@/app/lib/api/client';
import { StatusBadge } from '../../components/StatusBadge';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
function tomorrow() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ── Walk-in Modal ─────────────────────────────────────────────────────────────

type WalkInModalProps = {
  hotelId: string;
  roomTypes: DashboardRoomType[];
  onClose: () => void;
  onCreated: (reservation: DashboardReservation) => void;
};

function WalkInModal({ hotelId, roomTypes, onClose, onCreated }: WalkInModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id ?? '');
  const [checkIn, setCheckIn]       = useState(today());
  const [checkOut, setCheckOut]     = useState(tomorrow());
  const [guests, setGuests]         = useState('1');
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');
  const [requests, setRequests]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in all required guest fields.'); return;
    }
    if (!roomTypeId) { setError('Please select a room type.'); return; }
    setError(''); setSubmitting(true);
    try {
      const raw = await apiClient.post<{
        id: string; reference?: string; status: string;
        guestFirstName: string; guestLastName: string; guestEmail: string;
        roomType?: { name?: string }; checkIn: string; checkOut: string;
        nights: number; guests: number; totalNgn: number; createdAt: string;
      }>(`/api/v1/bookings/hotel/${hotelId}/walk-in`, {
        roomTypeId, checkIn, checkOut,
        guests: Number(guests),
        guestFirstName: firstName.trim(),
        guestLastName:  lastName.trim(),
        guestEmail:     email.trim(),
        guestPhone:     phone.trim(),
        ...(requests.trim() ? { specialRequests: requests.trim() } : {}),
      });

      const nights = raw.nights ?? Math.round(
        (new Date(raw.checkOut).getTime() - new Date(raw.checkIn).getTime()) / 86_400_000
      );

      onCreated({
        id:           raw.id,
        guestName:    `${raw.guestFirstName} ${raw.guestLastName}`,
        guestEmail:   raw.guestEmail,
        roomTypeName: raw.roomType?.name ?? roomTypes.find(r => r.id === roomTypeId)?.name ?? 'Room',
        roomNumber:   '—',
        checkIn:      raw.checkIn.slice(0, 10),
        checkOut:     raw.checkOut.slice(0, 10),
        nights,
        amountNgn:    Number(raw.totalNgn ?? 0),
        status:       'checked_in',
        createdAt:    raw.createdAt,
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create walk-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--db-border)', background: 'var(--db-bg)', color: 'var(--db-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: 'var(--db-secondary)', display: 'block', marginBottom: 4 };

  return (
    <div ref={backdropRef} onClick={e => { if (e.target === backdropRef.current) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      role="dialog" aria-modal="true" aria-labelledby="walkin-title"
    >
      <div onClick={e => e.stopPropagation()}
        style={{ background: 'var(--db-surface)', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 id="walkin-title" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--db-primary)' }}>Walk-in guest</h2>
            <p style={{ fontSize: 13, color: 'var(--db-secondary)', margin: '4px 0 0' }}>Create a booking and check in immediately — no payment required.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--db-secondary)', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Room + dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Room type <span style={{ color: 'var(--db-accent)' }}>*</span></label>
              <select value={roomTypeId} onChange={e => setRoomTypeId(e.target.value)} style={inp} required>
                {roomTypes.map(r => <option key={r.id} value={r.id}>{r.name} — ₦{r.pricePerNight.toLocaleString()}/night</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Check-in <span style={{ color: 'var(--db-accent)' }}>*</span></label>
              <input type="date" value={checkIn} min={today()} onChange={e => { setCheckIn(e.target.value); if (e.target.value >= checkOut) { const d = new Date(e.target.value); d.setDate(d.getDate()+1); setCheckOut(d.toISOString().slice(0,10)); } }} style={inp} required />
            </div>
            <div>
              <label style={lbl}>Check-out <span style={{ color: 'var(--db-accent)' }}>*</span></label>
              <input type="date" value={checkOut} min={checkIn} onChange={e => setCheckOut(e.target.value)} style={inp} required />
            </div>
            <div>
              <label style={lbl}>Guests <span style={{ color: 'var(--db-accent)' }}>*</span></label>
              <input type="number" value={guests} min={1} max={10} onChange={e => setGuests(e.target.value)} style={inp} required />
            </div>
          </div>

          {/* Guest details */}
          <div style={{ borderTop: '1px solid var(--db-border)', paddingTop: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--db-primary)', margin: '0 0 12px' }}>Guest details</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>First name <span style={{ color: 'var(--db-accent)' }}>*</span></label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Amaka" style={inp} required />
              </div>
              <div>
                <label style={lbl}>Last name <span style={{ color: 'var(--db-accent)' }}>*</span></label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Obi" style={inp} required />
              </div>
              <div>
                <label style={lbl}>Email <span style={{ color: 'var(--db-accent)' }}>*</span></label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="amaka@example.com" style={inp} required />
              </div>
              <div>
                <label style={lbl}>Phone <span style={{ color: 'var(--db-accent)' }}>*</span></label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+2348012345678" style={inp} required />
              </div>
            </div>
          </div>

          <div>
            <label style={lbl}>Special requests <span style={{ fontSize: 12, fontWeight: 400 }}>(optional)</span></label>
            <textarea value={requests} onChange={e => setRequests(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} />
          </div>

          {error && <p style={{ fontSize: 13, color: '#dc2626', background: '#fee2e2', borderRadius: 8, padding: '10px 14px', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{ padding: '9px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, border: '1px solid var(--db-border)', background: 'transparent', color: 'var(--db-primary)', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{ padding: '9px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', background: 'var(--db-accent)', color: 'white', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Checking in…' : 'Check in guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CheckInPage() {
  const { user } = useAuth();

  const [hotelId, setHotelId]           = useState<string | null>(null);
  const [reservations, setReservations] = useState<DashboardReservation[]>([]);
  const [roomTypes, setRoomTypes]       = useState<DashboardRoomType[]>([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showWalkIn, setShowWalkIn]     = useState(false);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    getMyHotel()
      .then(hotel => {
        if (!hotel) throw new Error('Hotel not found.');
        setHotelId(hotel.id);
        return Promise.all([
          getDashboardReservations(hotel.id),
          getDashboardRoomTypes(hotel.id),
        ]);
      })
      .then(([res, rts]) => { setReservations(res); setRoomTypes(rts); })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load data.'))
      .finally(() => setIsLoading(false));
  }, [user]);

  async function handleCheckIn(id: string) {
    setActionLoading(id);
    try {
      await apiClient.patch(`/api/v1/bookings/${id}/status`, { status: 'CHECKED_IN' });
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'checked_in' } : r));
    } catch {
      // status badge will correct on next reload
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
  if (error)     return (
    <div style={{ padding: 24 }}>
      <p style={{ color: 'var(--db-danger)' }}>{error}</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '8px 16px', background: 'var(--db-accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Retry</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6" style={{ color: 'var(--db-primary)' }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Front Desk — Check In</h1>
        {hotelId && roomTypes.length > 0 && (
          <button
            onClick={() => setShowWalkIn(true)}
            style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', background: 'var(--db-accent)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Walk-in guest
          </button>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search by booking ID or guest name…"
        className="w-full max-w-md rounded-lg border px-4 py-2 text-sm outline-none"
        style={{ borderColor: 'var(--db-border)', color: 'var(--db-primary)', background: 'var(--db-surface)' }}
      />

      {/* Reservation list */}
      {displayed.length === 0 ? (
        <div className="rounded-xl border p-10 text-center flex flex-col items-center gap-4" style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}>
          <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>No upcoming check-ins found.</p>
          {hotelId && roomTypes.length > 0 && (
            <button onClick={() => setShowWalkIn(true)} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid var(--db-accent)', background: 'transparent', color: 'var(--db-accent)', cursor: 'pointer' }}>
              + Add walk-in guest
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {displayed.map(r => {
            const alreadyIn = r.status === 'checked_in';
            return (
              <div key={r.id} className="rounded-xl border p-5" style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">{r.guestName}</p>
                    <p className="text-xs" style={{ color: 'var(--db-secondary)' }}>Booking: {r.id}</p>
                    <p className="text-xs" style={{ color: 'var(--db-secondary)' }}>{r.roomTypeName} · Room {r.roomNumber}</p>
                    <p className="text-xs" style={{ color: 'var(--db-secondary)' }}>{formatDate(r.checkIn)} → {formatDate(r.checkOut)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {alreadyIn
                      ? <span style={{ background: '#dcfce7', color: '#166534', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>Checked In</span>
                      : <StatusBadge status={r.status} />
                    }
                    <button
                      onClick={() => !alreadyIn && handleCheckIn(r.id)}
                      disabled={alreadyIn || actionLoading === r.id}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                      style={{ background: 'var(--db-accent)', opacity: alreadyIn ? 0.4 : 1, cursor: alreadyIn ? 'not-allowed' : 'pointer', border: 'none' }}
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

      {/* Walk-in modal */}
      {showWalkIn && hotelId && (
        <WalkInModal
          hotelId={hotelId}
          roomTypes={roomTypes}
          onClose={() => setShowWalkIn(false)}
          onCreated={newRes => setReservations(prev => [newRes, ...prev])}
        />
      )}
    </div>
  );
}
