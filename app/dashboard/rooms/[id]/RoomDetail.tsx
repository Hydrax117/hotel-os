'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { apiClient, ApiError } from '../../../lib/api/client';
import { updateRoomTypePricing, getMyHotel } from '../../../lib/api/dashboard';

// ── Types ─────────────────────────────────────────────────────────────────────

type RawRoomType = {
  id: string;
  name: string;
  description?: string;
  bedType: string;
  capacity: number;
  sizeSqm?: number;
  pricePerNight: number;
  totalRooms: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNgn(n: number) {
  return '₦' + Number(n).toLocaleString('en-NG');
}

// ── Edit modal ────────────────────────────────────────────────────────────────

type EditModalProps = {
  room: RawRoomType;
  hotelId: string;
  onClose: () => void;
  onSaved: (updated: Partial<RawRoomType>) => void;
};

function EditModal({ room, hotelId, onClose, onSaved }: EditModalProps) {
  const [name, setName]           = useState(room.name);
  const [price, setPrice]         = useState(String(room.pricePerNight));
  const [totalRooms, setTotal]    = useState(String(room.totalRooms));
  const [description, setDesc]    = useState(room.description ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseFloat(price);
    const t = parseInt(totalRooms, 10);
    if (!name.trim())    { setError('Name is required.'); return; }
    if (!p || p <= 0)    { setError('Price must be greater than 0.'); return; }
    if (!t || t < 1)     { setError('Total rooms must be at least 1.'); return; }

    setSubmitting(true); setError('');
    try {
      await updateRoomTypePricing(hotelId, room.id, {
        name: name.trim(),
        pricePerNight: p,
        totalRooms: t,
      });
      // Also update description via a separate PATCH if changed
      if (description !== (room.description ?? '')) {
        await apiClient.patch(`/api/v1/hotels/${hotelId}/room-types/${room.id}`, {
          description: description.trim() || null,
        });
      }
      onSaved({ name: name.trim(), pricePerNight: p, totalRooms: t, description: description.trim() || undefined });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save changes.');
    } finally {
      setSubmitting(false);
    }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--db-border)', background: 'var(--db-bg)', color: 'var(--db-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: 'var(--db-secondary)', display: 'block', marginBottom: 4 };

  return (
    <div onClick={e => { if (e.currentTarget === e.target) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      role="dialog" aria-modal="true" aria-labelledby="edit-room-title"
    >
      <div onClick={e => e.stopPropagation()}
        style={{ background: 'var(--db-surface)', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 id="edit-room-title" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--db-primary)' }}>Edit room type</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--db-secondary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Room name <span style={{ color: 'var(--db-accent)' }}>*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} style={inp} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Price / night (₦) <span style={{ color: 'var(--db-accent)' }}>*</span></label>
              <input type="number" min={0} step={500} value={price} onChange={e => setPrice(e.target.value)} style={inp} required />
            </div>
            <div>
              <label style={lbl}>Total rooms <span style={{ color: 'var(--db-accent)' }}>*</span></label>
              <input type="number" min={1} value={totalRooms} onChange={e => setTotal(e.target.value)} style={inp} required />
            </div>
          </div>
          <div>
            <label style={lbl}>Description <span style={{ fontSize: 12, fontWeight: 400 }}>(optional)</span></label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} />
          </div>

          {error && <p style={{ fontSize: 13, color: '#dc2626', background: '#fee2e2', borderRadius: 8, padding: '10px 14px', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{ padding: '9px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, border: '1px solid var(--db-border)', background: 'transparent', color: 'var(--db-primary)', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{ padding: '9px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', background: 'var(--db-accent)', color: 'white', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RoomDetail({ id }: { id: string }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [hotelId, setHotelId]   = useState<string | null>(null);
  const [room, setRoom]         = useState<RawRoomType | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState('');
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/signin');
  }, [authLoading, user, router]);

  const fetchRoom = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError('');
    try {
      // Get hotelId from /hotels/my first
      const hotel = await getMyHotel();
      if (!hotel) { setError('Hotel not found.'); setLoading(false); return; }
      setHotelId(hotel.id);
      const data = await apiClient.get<RawRoomType>(
        `/api/v1/hotels/${hotel.id}/room-types/${id}`
      );
      setRoom(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load room details.');
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => { fetchRoom(); }, [fetchRoom]);

  if (authLoading || (!user && !authLoading)) return null;

  if (isLoading) {
    return <div className="flex items-center justify-center py-20" style={{ color: 'var(--db-secondary)' }}>Loading room…</div>;
  }

  if (error || !room) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p style={{ color: 'var(--db-secondary)' }}>{error || 'Room not found.'}</p>
        <Link href="/dashboard/rooms" className="text-sm underline" style={{ color: 'var(--db-accent)' }}>
          ← Back to Rooms
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" style={{ color: 'var(--db-primary)' }}>

      {/* Back */}
      <Link href="/dashboard/rooms" className="inline-flex items-center gap-1.5 text-sm hover:underline underline-offset-2 w-fit" style={{ color: 'var(--db-secondary)' }}>
        ← Back to Rooms
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{room.name}</h1>
            <span style={{ background: room.isActive ? '#dcfce7' : '#fee2e2', color: room.isActive ? '#166534' : '#dc2626', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
              {room.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--db-accent)' }}>
            {fmtNgn(room.pricePerNight)} / night
          </p>
        </div>
        <button
          onClick={() => setShowEdit(true)}
          className="rounded-lg border px-4 py-2 text-sm font-medium"
          style={{ borderColor: 'var(--db-border)', color: 'var(--db-primary)', background: 'transparent', cursor: 'pointer' }}
        >
          Edit
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Bed Type',        value: room.bedType },
          { label: 'Capacity',        value: `${room.capacity} ${room.capacity === 1 ? 'guest' : 'guests'}` },
          { label: 'Total Rooms',     value: String(room.totalRooms) },
          { label: 'Size',            value: room.sizeSqm ? `${room.sizeSqm} m²` : '—' },
        ].map(item => (
          <div key={item.label} className="rounded-xl border p-4 flex flex-col gap-1" style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}>
            <span className="text-xs" style={{ color: 'var(--db-secondary)' }}>{item.label}</span>
            <span className="text-lg font-semibold">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="rounded-xl border p-5 flex flex-col gap-3" style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Description</h2>
          <button onClick={() => setShowEdit(true)} className="text-xs underline-offset-2 hover:underline" style={{ color: 'var(--db-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
        </div>
        {room.description ? (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--db-secondary)' }}>{room.description}</p>
        ) : (
          <p className="text-sm" style={{ color: 'var(--db-secondary)', fontStyle: 'italic' }}>
            No description added yet.{' '}
            <button onClick={() => setShowEdit(true)} style={{ color: 'var(--db-accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', fontStyle: 'normal', textDecoration: 'underline' }}>Add one</button>
          </p>
        )}
      </div>

      {/* Photos placeholder */}
      <div className="rounded-xl border p-5 flex flex-col gap-4" style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}>
        <h2 className="text-sm font-semibold">Photos</h2>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="flex items-center justify-center rounded-lg border-2 border-dashed aspect-video" style={{ borderColor: 'var(--db-border)', background: 'var(--db-muted)' }}>
              <span className="text-xs" style={{ color: 'var(--db-secondary)' }}>Upload photo</span>
            </div>
          ))}
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && hotelId && (
        <EditModal
          room={room}
          hotelId={hotelId}
          onClose={() => setShowEdit(false)}
          onSaved={updates => setRoom(prev => prev ? { ...prev, ...updates } : prev)}
        />
      )}
    </div>
  );
}
