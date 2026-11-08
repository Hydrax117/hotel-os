'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import {
  getMyHotel,
  getDashboardRoomTypes,
  type DashboardRoomType,
} from '../../lib/api/dashboard';
import { createRoomType, type CreateRoomTypePayload } from '../../lib/api/onboarding';
import { ApiError } from '../../lib/api/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNgn(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG');
}

function availabilityPill(available: number, total: number) {
  const ratio = total > 0 ? available / total : 1;
  if (ratio > 0.5)  return { label: 'Good',    bg: '#dcfce7', color: '#166534' };
  if (ratio >= 0.2) return { label: 'Limited', bg: '#fef3c7', color: '#92400e' };
  return              { label: 'Low',     bg: '#fee2e2', color: '#991b1b' };
}

const BED_TYPES = ['King', 'Queen', 'Double', 'Twin', 'Single', 'Bunk', 'Sofa bed'];

// ── Add Room Type Modal ───────────────────────────────────────────────────────

type AddRoomModalProps = {
  hotelId: string;
  onClose: () => void;
  onCreated: (room: DashboardRoomType) => void;
};

function AddRoomModal({ hotelId, onClose, onCreated }: AddRoomModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [bedType, setBedType]         = useState('King');
  const [capacity, setCapacity]       = useState('2');
  const [sizeSqm, setSizeSqm]         = useState('');
  const [pricePerNight, setPrice]     = useState('');
  const [totalRooms, setTotalRooms]   = useState('1');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Validate
    if (!name.trim())          { setError('Room name is required.'); return; }
    if (!bedType)              { setError('Bed type is required.'); return; }
    const cap = parseInt(capacity, 10);
    if (!cap || cap < 1)       { setError('Capacity must be at least 1.'); return; }
    const price = parseFloat(pricePerNight);
    if (!price || price <= 0)  { setError('Price per night is required.'); return; }
    const rooms = parseInt(totalRooms, 10);
    if (!rooms || rooms < 1)   { setError('Total rooms must be at least 1.'); return; }

    const payload: CreateRoomTypePayload = {
      name: name.trim(),
      bedType,
      capacity: cap,
      pricePerNight: price,
      totalRooms: rooms,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(sizeSqm ? { sizeSqm: parseFloat(sizeSqm) } : {}),
    };

    setSubmitting(true);
    try {
      await createRoomType(hotelId, payload);
      // Fetch fresh list so we get the full DashboardRoomType shape back
      const fresh = await getDashboardRoomTypes(hotelId);
      const created = fresh.find(r => r.name === payload.name) ?? fresh[fresh.length - 1];
      onCreated(created);
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create room type. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--db-border)',
    background: 'var(--db-bg)',
    color: 'var(--db-primary)',
    fontSize: '14px',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--db-secondary)',
    marginBottom: '4px',
    display: 'block',
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        style={{
          background: 'var(--db-surface)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 id="modal-title" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--db-primary)', margin: 0 }}>
            Add room type
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--db-secondary)', padding: '4px', lineHeight: 1 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Name */}
          <div>
            <label htmlFor="rt-name" style={labelStyle}>Room name <span style={{ color: 'var(--db-accent)' }}>*</span></label>
            <input
              id="rt-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Deluxe King Room"
              style={inputStyle}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="rt-desc" style={labelStyle}>Description <span style={{ color: 'var(--db-secondary)', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              id="rt-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Spacious room with city view and king-sized bed"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
            />
          </div>

          {/* Bed type + capacity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="rt-bed" style={labelStyle}>Bed type <span style={{ color: 'var(--db-accent)' }}>*</span></label>
              <select
                id="rt-bed"
                value={bedType}
                onChange={e => setBedType(e.target.value)}
                style={inputStyle}
                required
              >
                {BED_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="rt-capacity" style={labelStyle}>Max guests <span style={{ color: 'var(--db-accent)' }}>*</span></label>
              <input
                id="rt-capacity"
                type="number"
                min={1}
                max={10}
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Size + total rooms */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="rt-size" style={labelStyle}>Size (m²) <span style={{ color: 'var(--db-secondary)', fontWeight: 400 }}>(optional)</span></label>
              <input
                id="rt-size"
                type="number"
                min={1}
                step="0.5"
                value={sizeSqm}
                onChange={e => setSizeSqm(e.target.value)}
                placeholder="e.g. 35"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="rt-total" style={labelStyle}>Total rooms <span style={{ color: 'var(--db-accent)' }}>*</span></label>
              <input
                id="rt-total"
                type="number"
                min={1}
                value={totalRooms}
                onChange={e => setTotalRooms(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label htmlFor="rt-price" style={labelStyle}>Price per night (₦) <span style={{ color: 'var(--db-accent)' }}>*</span></label>
            <input
              id="rt-price"
              type="number"
              min={0}
              step="500"
              value={pricePerNight}
              onChange={e => setPrice(e.target.value)}
              placeholder="e.g. 45000"
              style={inputStyle}
              required
            />
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontSize: '13px', color: '#dc2626', background: '#fee2e2', borderRadius: '8px', padding: '10px 14px', margin: 0 }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '9px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 500,
                border: '1px solid var(--db-border)', background: 'transparent',
                color: 'var(--db-primary)', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '9px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                border: 'none', background: 'var(--db-accent)', color: 'white',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Creating…' : 'Create room type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RoomsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [hotelId, setHotelId]     = useState<string | null>(null);
  const [roomTypes, setRoomTypes] = useState<DashboardRoomType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/signin');
  }, [authLoading, user, router]);

  // Data fetch
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const hotelData = await getMyHotel();
        if (cancelled) return;
        if (!hotelData) { setError('Could not load hotel data. Please try again.'); setIsLoading(false); return; }
        setHotelId(hotelData.id);
        const data = await getDashboardRoomTypes(hotelData.id);
        if (!cancelled) setRoomTypes(data);
      } catch {
        if (!cancelled) setError('Failed to load rooms. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [user]);

  if (authLoading) return <div className="flex items-center justify-center py-20" style={{ color: 'var(--db-secondary)' }}>Loading…</div>;
  if (!user) return null;

  if (isLoading) return <div className="flex items-center justify-center py-20" style={{ color: 'var(--db-secondary)' }}>Loading rooms…</div>;

  if (error) {
    return (
      <div className="rounded-xl border p-6 text-center" style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}>
        <p className="mb-4 text-sm" style={{ color: 'var(--db-secondary)' }}>{error}</p>
        <button onClick={() => window.location.reload()} className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: 'var(--db-accent)' }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" style={{ color: 'var(--db-primary)' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rooms</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--db-secondary)' }}>
            {roomTypes.length} room type{roomTypes.length !== 1 ? 's' : ''} · {roomTypes.reduce((s, r) => s + r.totalRooms, 0)} total rooms
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85"
          style={{ background: 'var(--db-accent)', border: 'none', cursor: 'pointer' }}
        >
          + Add room type
        </button>
      </div>

      {/* ── Room type grid ── */}
      {roomTypes.length === 0 ? (
        <div
          className="rounded-xl border p-10 flex flex-col items-center gap-4 text-center"
          style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
        >
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--db-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--db-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4v16"/><path d="M22 4v16"/><path d="M2 8h20"/><path d="M2 16h20"/>
              <path d="M6 8v8"/><path d="M18 8v8"/><rect x="6" y="8" width="12" height="4" rx="1"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--db-primary)' }}>No room types yet</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--db-secondary)' }}>Add your first room type to make your hotel bookable.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: 'var(--db-accent)', border: 'none', cursor: 'pointer' }}
          >
            + Add room type
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {roomTypes.map(rt => {
            const pill = availabilityPill(rt.availableRooms, rt.totalRooms);
            return (
              <div
                key={rt.id}
                className="rounded-xl border shadow-sm transition-shadow hover:shadow-md flex flex-col gap-4 p-5"
                style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
              >
                {/* Name + pill */}
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold" style={{ color: 'var(--db-primary)' }}>{rt.name}</h2>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0" style={{ background: pill.bg, color: pill.color }}>
                    {pill.label}
                  </span>
                </div>

                {/* Bed + capacity */}
                <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>
                  {rt.bedType} · {rt.capacity} {rt.capacity === 1 ? 'guest' : 'guests'}
                </p>

                {/* Availability + price */}
                <div className="flex items-end justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs" style={{ color: 'var(--db-secondary)' }}>Availability</span>
                    <span className="text-sm font-medium">{rt.availableRooms} / {rt.totalRooms} rooms</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-right">
                    <span className="text-xs" style={{ color: 'var(--db-secondary)' }}>Per night</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--db-accent)' }}>{formatNgn(rt.pricePerNight)}</span>
                  </div>
                </div>

                {/* View details */}
                <Link
                  href={`/dashboard/rooms/${rt.id}`}
                  className="inline-flex items-center text-xs font-medium underline-offset-2 hover:underline mt-auto w-fit"
                  style={{ color: 'var(--db-accent)' }}
                >
                  View details →
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add room type modal ── */}
      {showModal && hotelId && (
        <AddRoomModal
          hotelId={hotelId}
          onClose={() => setShowModal(false)}
          onCreated={newRoom => setRoomTypes(prev => [...prev, newRoom])}
        />
      )}
    </div>
  );
}
