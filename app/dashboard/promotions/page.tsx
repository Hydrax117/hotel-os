'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/app/lib/api/client';
import { getMyHotel } from '@/app/lib/api/dashboard';

// ── Types ──────────────────────────────────────────────────────────────────────

type DiscountType = 'PERCENTAGE' | 'FIXED';

export type Promotion = {
  id: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  validFrom: string;
  validTo: string;
  minNights: number;
  advanceBookingDays: number;
  active: boolean;
  createdAt: string;
};

// ── API helpers ────────────────────────────────────────────────────────────────
// These call POST/GET /api/v1/hotels/:hotelId/promotions.
// If the backend returns 404 or 501 we surface a "not available" state rather
// than silently losing data in local state.

async function fetchPromotions(hotelId: string): Promise<Promotion[]> {
  const raw = await apiClient.get<Promotion[] | { promotions: Promotion[] }>(
    `/api/v1/hotels/${hotelId}/promotions`,
  );
  return Array.isArray(raw) ? raw : (raw as { promotions: Promotion[] }).promotions ?? [];
}

async function createPromotion(
  hotelId: string,
  payload: Omit<Promotion, 'id' | 'createdAt'>,
): Promise<Promotion> {
  return apiClient.post<Promotion>(`/api/v1/hotels/${hotelId}/promotions`, payload);
}

async function togglePromotion(
  hotelId: string,
  promotionId: string,
  active: boolean,
): Promise<Promotion> {
  return apiClient.patch<Promotion>(
    `/api/v1/hotels/${hotelId}/promotions/${promotionId}`,
    { active },
  );
}

async function deletePromotion(hotelId: string, promotionId: string): Promise<void> {
  return apiClient.delete(`/api/v1/hotels/${hotelId}/promotions/${promotionId}`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDiscount(p: Promotion): string {
  if (p.discountType === 'PERCENTAGE') return `${p.discountValue}% off`;
  return `₦${p.discountValue.toLocaleString('en-NG')} off`;
}

function isExpired(p: Promotion): boolean {
  return new Date(p.validTo) < new Date();
}

// ── CSS Toggle ────────────────────────────────────────────────────────────────

function CSSToggle({
  checked,
  onChange,
  id,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: 40,
        height: 22,
        borderRadius: 11,
        background: checked ? 'var(--db-accent)' : 'var(--db-border)',
        border: 'none',
        padding: 2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
      aria-label="Toggle promotion"
    >
      <span
        style={{
          display: 'block',
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transform: checked ? 'translateX(18px)' : 'translateX(0)',
          transition: 'transform 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // null = not attempted; true = endpoint exists; false = not yet available
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [formDiscountValue, setFormDiscountValue] = useState('');
  const [formValidFrom, setFormValidFrom] = useState('');
  const [formValidTo, setFormValidTo] = useState('');
  const [formMinNights, setFormMinNights] = useState('1');
  const [formAdvanceDays, setFormAdvanceDays] = useState('0');
  const [formError, setFormError] = useState('');

  // ── Load hotel + promotions ───────────────────────────────────────────────

  const load = useCallback(async (hid: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPromotions(hid);
      setPromotions(data);
      setApiAvailable(true);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 404 || status === 501 || status === 405) {
        // Backend endpoint not yet implemented
        setApiAvailable(false);
      } else {
        setError('Failed to load promotions. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getMyHotel().then(hotel => {
      if (hotel) {
        setHotelId(hotel.id);
        load(hotel.id);
      } else {
        setIsLoading(false);
      }
    }).catch(() => setIsLoading(false));
  }, [load]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleToggle(id: string, currentActive: boolean) {
    if (!hotelId) return;
    // Optimistic update
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, active: !currentActive } : p));
    try {
      await togglePromotion(hotelId, id, !currentActive);
    } catch {
      // Revert on failure
      setPromotions(prev => prev.map(p => p.id === id ? { ...p, active: currentActive } : p));
    }
  }

  async function handleDelete(id: string) {
    if (!hotelId) return;
    if (!confirm('Delete this promotion?')) return;
    setPromotions(prev => prev.filter(p => p.id !== id));
    try {
      await deletePromotion(hotelId, id);
    } catch {
      setError('Failed to delete promotion.');
      load(hotelId);
    }
  }

  function resetForm() {
    setFormName('');
    setFormDiscountType('PERCENTAGE');
    setFormDiscountValue('');
    setFormValidFrom('');
    setFormValidTo('');
    setFormMinNights('1');
    setFormAdvanceDays('0');
    setFormError('');
  }

  async function handleSave() {
    if (!hotelId) return;
    if (!formName.trim()) { setFormError('Promotion name is required.'); return; }
    const val = Number(formDiscountValue);
    if (!formDiscountValue || isNaN(val) || val <= 0) {
      setFormError('Enter a valid discount value greater than 0.');
      return;
    }
    if (formDiscountType === 'PERCENTAGE' && val > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }
    if (!formValidFrom || !formValidTo) { setFormError('Both dates are required.'); return; }
    if (formValidFrom >= formValidTo) { setFormError('Valid-to date must be after valid-from.'); return; }

    setFormError('');
    setSubmitting(true);
    try {
      const created = await createPromotion(hotelId, {
        name: formName.trim(),
        discountType: formDiscountType,
        discountValue: val,
        validFrom: formValidFrom,
        validTo: formValidTo,
        minNights: Number(formMinNights),
        advanceBookingDays: Number(formAdvanceDays),
        active: true,
      });
      setPromotions(prev => [created, ...prev]);
      setFormOpen(false);
      resetForm();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      setFormError(msg ?? 'Failed to create promotion.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const active = promotions.filter(p => !isExpired(p));
  const expired = promotions.filter(p => isExpired(p));

  const inputStyle: React.CSSProperties = {
    borderRadius: 8,
    border: '1px solid var(--db-border)',
    background: 'var(--db-bg)',
    color: 'var(--db-primary)',
    padding: '8px 12px',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ height: 28, width: 180, background: 'var(--db-muted)', borderRadius: 6, marginBottom: 24 }} />
        <div style={{ height: 120, background: 'var(--db-muted)', borderRadius: 12 }} />
      </div>
    );
  }

  // Backend endpoint not yet implemented — honest state instead of data loss
  if (apiAvailable === false) {
    return (
      <div className="flex flex-col gap-8" style={{ color: 'var(--db-primary)' }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Promotions</h1>
        </div>
        <div
          className="rounded-xl border p-8 text-center"
          style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--db-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
          </div>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--db-primary)' }}>
            Promotions coming soon
          </h2>
          <p className="text-sm" style={{ color: 'var(--db-secondary)', maxWidth: 420, margin: '0 auto' }}>
            The promotions feature is under development. Once available, you will be able to create
            percentage and fixed discounts, set validity windows, and control minimum-night requirements —
            all synced with the booking engine automatically.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 items-center py-16">
        <p style={{ color: 'var(--db-danger)' }}>{error}</p>
        <button
          onClick={() => hotelId && load(hotelId)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--db-accent)', border: 'none', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8" style={{ color: 'var(--db-primary)' }}>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Promotions</h1>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--db-muted)', color: 'var(--db-secondary)' }}
          >
            {active.length}
          </span>
        </div>
        <button
          onClick={() => { setFormOpen(true); resetForm(); }}
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ background: 'var(--db-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          + Create promotion
        </button>
      </div>

      {/* Create form */}
      {formOpen && (
        <div
          className="rounded-xl border p-5"
          style={{ background: 'var(--db-surface)', borderColor: 'var(--db-accent)' }}
        >
          <h2 className="mb-4 text-sm font-semibold">New Promotion</h2>
          {formError && (
            <p className="mb-3 text-sm" style={{ color: 'var(--db-danger)' }}>{formError}</p>
          )}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }}>Promotion name *</label>
              <input style={inputStyle} value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Weekend Special" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }}>Discount type *</label>
              <div className="flex gap-2">
                {(['PERCENTAGE', 'FIXED'] as DiscountType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setFormDiscountType(t)}
                    className="rounded-full px-4 py-1.5 text-sm font-medium"
                    style={{
                      background: formDiscountType === t ? 'var(--db-accent)' : 'var(--db-muted)',
                      color: formDiscountType === t ? '#fff' : 'var(--db-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {t === 'PERCENTAGE' ? 'Percentage' : 'Fixed (₦)'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }}>
                Discount value * {formDiscountType === 'PERCENTAGE' ? '(%)' : '(₦)'}
              </label>
              <input
                style={inputStyle}
                type="number"
                min={1}
                max={formDiscountType === 'PERCENTAGE' ? 100 : undefined}
                value={formDiscountValue}
                onChange={e => setFormDiscountValue(e.target.value)}
                placeholder={formDiscountType === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 5000'}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }}>Min nights</label>
              <select style={inputStyle} value={formMinNights} onChange={e => setFormMinNights(e.target.value)}>
                {[1, 2, 3, 4, 5, 6, 7, 14].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }}>Valid from *</label>
              <input
                style={inputStyle}
                type="date"
                value={formValidFrom}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setFormValidFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }}>Valid to *</label>
              <input
                style={inputStyle}
                type="date"
                value={formValidTo}
                min={formValidFrom || new Date().toISOString().split('T')[0]}
                onChange={e => setFormValidTo(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }}>Advance booking (days)</label>
              <select style={inputStyle} value={formAdvanceDays} onChange={e => setFormAdvanceDays(e.target.value)}>
                {[0, 1, 2, 3, 7, 14, 30, 60].map(n => (
                  <option key={n} value={n}>{n === 0 ? 'Any time' : `${n} days`}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSave}
              disabled={submitting}
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ background: 'var(--db-accent)', color: '#fff', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? 'Saving…' : 'Save promotion'}
            </button>
            <button
              onClick={() => { setFormOpen(false); resetForm(); }}
              disabled={submitting}
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ background: 'var(--db-muted)', color: 'var(--db-secondary)', border: '1px solid var(--db-border)', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active promotions */}
      {active.length === 0 && !formOpen && (
        <div
          className="rounded-xl border py-12 text-center"
          style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
        >
          <p className="text-sm mb-3" style={{ color: 'var(--db-secondary)' }}>No active promotions yet.</p>
          <button
            onClick={() => { setFormOpen(true); resetForm(); }}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: 'var(--db-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Create your first promotion
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {active.map(promo => (
          <div
            key={promo.id}
            className="rounded-xl border p-5"
            style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-base">{promo.name}</span>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ background: 'var(--db-muted)', color: 'var(--db-secondary)' }}
                  >
                    {promo.discountType === 'PERCENTAGE' ? '% off' : '₦ off'}
                  </span>
                </div>
                <p className="text-3xl font-bold" style={{ color: 'var(--db-accent)' }}>
                  {formatDiscount(promo)}
                </p>
                <p className="text-xs" style={{ color: 'var(--db-secondary)' }}>
                  Valid: {promo.validFrom} — {promo.validTo}
                </p>
                <p className="text-xs" style={{ color: 'var(--db-secondary)' }}>
                  Min {promo.minNights} night{promo.minNights !== 1 ? 's' : ''}
                  {promo.advanceBookingDays > 0 ? ` · ${promo.advanceBookingDays} days advance` : ''}
                </p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--db-secondary)' }}>
                    {promo.active ? 'Active' : 'Inactive'}
                  </span>
                  <CSSToggle
                    checked={promo.active}
                    onChange={() => handleToggle(promo.id, promo.active)}
                    id={`toggle-${promo.id}`}
                  />
                </div>
                <button
                  onClick={() => handleDelete(promo.id)}
                  className="rounded-lg px-3 py-1 text-xs font-medium"
                  style={{ background: 'var(--db-muted)', color: 'var(--db-danger)', border: '1px solid var(--db-border)', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expired promotions */}
      {expired.length > 0 && (
        <div>
          <button
            onClick={() => setShowExpired(v => !v)}
            className="flex items-center gap-2 text-sm font-medium mb-4"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--db-secondary)' }}
          >
            <span>{showExpired ? '▾' : '▸'}</span>
            {showExpired ? 'Hide expired' : 'Show expired'}
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
              style={{ background: 'var(--db-muted)', color: 'var(--db-secondary)' }}
            >
              {expired.length}
            </span>
          </button>
          {showExpired && (
            <div
              className="rounded-xl border overflow-hidden"
              style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--db-muted)' }}>
                      {['Name', 'Discount', 'Valid From', 'Valid To', 'Min Nights'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--db-secondary)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expired.map((promo, idx) => (
                      <tr key={promo.id} style={{ background: idx % 2 === 1 ? 'var(--db-muted)' : 'var(--db-surface)' }}>
                        <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>{promo.name}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>{formatDiscount(promo)}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>{promo.validFrom}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>{promo.validTo}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>{promo.minNights}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
