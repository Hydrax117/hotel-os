'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import {
  getMyHotel,
  getDashboardRoomTypes,
  updateRoomTypePricing,
  type DashboardHotel,
  type DashboardRoomType,
} from '../../lib/api/dashboard';
import { ApiError } from '../../lib/api/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNgn(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG');
}

// ── Local types ───────────────────────────────────────────────────────────────

type Season = 'standard' | 'peak' | 'low';

type RateRowState = {
  roomTypeId: string;
  price: number;
  minStay: number;
  weekendRate?: number;
  weekendEnabled: boolean;
  saving: boolean;
};

type EditDraft = {
  price: string;
  minStay: number;
  weekendRate: string;
  weekendEnabled: boolean;
};

const SEASONS: { value: Season; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'peak',     label: 'Peak Season' },
  { value: 'low',      label: 'Low Season' },
];

// Price multipliers per season (applied to base price for display only)
const SEASON_MULTIPLIER: Record<Season, number> = {
  standard: 1,
  peak: 1.3,
  low: 0.75,
};

function buildRatesFromRoomTypes(roomTypes: DashboardRoomType[], season: Season): RateRowState[] {
  const mult = SEASON_MULTIPLIER[season];
  return roomTypes.map(rt => ({
    roomTypeId: rt.id,
    price: Math.round(rt.pricePerNight * mult),
    minStay: 1,
    weekendEnabled: false,
    weekendRate: undefined,
    saving: false,
  }));
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ padding: '8px 0' }}>
      {[1, 2, 3].map(i => (
        <div
          key={i}
          style={{ height: 56, background: 'var(--db-muted)', borderRadius: 8, marginBottom: 8 }}
        />
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RatesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [hotel, setHotel] = useState<DashboardHotel | null>(null);
  const [roomTypes, setRoomTypes] = useState<DashboardRoomType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeSeason, setActiveSeason] = useState<Season>('standard');
  const [ratesBySeason, setRatesBySeason] = useState<Record<Season, RateRowState[]>>({
    standard: [],
    peak: [],
    low: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [bulkPercent, setBulkPercent] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState(false);

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/signin');
    }
  }, [authLoading, user, router]);

  // Load hotel + room types
  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const myHotel = await getMyHotel();
      if (!myHotel) throw new Error('Hotel not found.');
      setHotel(myHotel);
      const rts = await getDashboardRoomTypes(myHotel.id);
      setRoomTypes(rts);
      setRatesBySeason({
        standard: buildRatesFromRoomTypes(rts, 'standard'),
        peak:     buildRatesFromRoomTypes(rts, 'peak'),
        low:      buildRatesFromRoomTypes(rts, 'low'),
      });
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load room types.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { void loadData(); }, [loadData]);

  const rows = ratesBySeason[activeSeason];

  function showToast(msg: string, isError = false) {
    setToast(msg);
    setToastIsError(isError);
    setTimeout(() => setToast(null), 3000);
  }

  function startEdit(row: RateRowState) {
    setEditingId(row.roomTypeId);
    setDraft({
      price: String(row.price),
      minStay: row.minStay,
      weekendRate: row.weekendRate != null ? String(row.weekendRate) : '',
      weekendEnabled: row.weekendEnabled,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit(roomTypeId: string) {
    if (!draft || !hotel) return;
    const newPrice = parseInt(draft.price, 10);
    if (isNaN(newPrice) || newPrice <= 0) {
      showToast('Price must be a positive number.', true);
      return;
    }
    const newWeekend = draft.weekendEnabled && draft.weekendRate !== ''
      ? parseInt(draft.weekendRate, 10)
      : undefined;

    // Mark row as saving
    setRatesBySeason(prev => ({
      ...prev,
      [activeSeason]: prev[activeSeason].map(r =>
        r.roomTypeId === roomTypeId ? { ...r, saving: true } : r
      ),
    }));

    try {
      // Only update the base price when on standard season — peak/low are display multipliers
      if (activeSeason === 'standard') {
        await updateRoomTypePricing(hotel.id, roomTypeId, { pricePerNight: newPrice });
      }
      // Update local state for all seasons
      setRatesBySeason(prev => {
        const updated: Record<Season, RateRowState[]> = { ...prev };
        (['standard', 'peak', 'low'] as Season[]).forEach(season => {
          const mult = SEASON_MULTIPLIER[season];
          updated[season] = prev[season].map(r =>
            r.roomTypeId === roomTypeId
              ? {
                  ...r,
                  price: activeSeason === season
                    ? (isNaN(newPrice) ? r.price : newPrice)
                    : Math.round((isNaN(newPrice) ? r.price : newPrice) /
                        SEASON_MULTIPLIER[activeSeason] * mult),
                  minStay: draft.minStay,
                  weekendEnabled: draft.weekendEnabled,
                  weekendRate: newWeekend,
                  saving: false,
                }
              : r
          );
        });
        return updated;
      });
      setEditingId(null);
      setDraft(null);
      showToast('Rate saved successfully');
    } catch (err) {
      // Clear saving state on error
      setRatesBySeason(prev => ({
        ...prev,
        [activeSeason]: prev[activeSeason].map(r =>
          r.roomTypeId === roomTypeId ? { ...r, saving: false } : r
        ),
      }));
      showToast(err instanceof ApiError ? err.message : 'Failed to save rate.', true);
    }
  }

  async function applyBulkUplift() {
    const pct = parseFloat(bulkPercent);
    if (isNaN(pct) || !hotel) return;
    const multiplier = 1 + pct / 100;

    // For standard season: update all room types via API in parallel
    const updates = rows.map(async r => {
      const newPrice = Math.round(r.price * multiplier);
      if (activeSeason === 'standard') {
        await updateRoomTypePricing(hotel.id, r.roomTypeId, { pricePerNight: newPrice });
      }
      return { roomTypeId: r.roomTypeId, newPrice };
    });

    try {
      const results = await Promise.all(updates);
      const priceMap = Object.fromEntries(results.map(r => [r.roomTypeId, r.newPrice]));

      setRatesBySeason(prev => ({
        ...prev,
        [activeSeason]: prev[activeSeason].map(r => ({
          ...r,
          price: priceMap[r.roomTypeId] ?? Math.round(r.price * multiplier),
          weekendRate: r.weekendRate != null ? Math.round(r.weekendRate * multiplier) : undefined,
        })),
      }));
      setBulkPercent('');
      showToast(`Bulk update applied: ${pct >= 0 ? '+' : ''}${pct}%`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Bulk update failed.', true);
    }
  }

  const roomTypeMap = Object.fromEntries(roomTypes.map(rt => [rt.id, rt]));

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col gap-8" style={{ color: 'var(--db-primary)' }}>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Rates</h1>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-4" style={{ color: 'var(--db-primary)' }}>
        <h1 className="text-2xl font-bold tracking-tight">Rates</h1>
        <div
          className="rounded-xl border p-6 text-center"
          style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
        >
          <p className="mb-4 text-sm" style={{ color: 'var(--db-secondary)' }}>{loadError}</p>
          <button
            onClick={() => void loadData()}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--db-accent)', border: 'none', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-4" style={{ color: 'var(--db-primary)' }}>
        <h1 className="text-2xl font-bold tracking-tight">Rates</h1>
        <div
          className="rounded-xl border p-10 text-center"
          style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>
            No room types found. Add room types from the Rooms page first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8" style={{ color: 'var(--db-primary)' }}>

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg"
          style={{ background: toastIsError ? 'var(--db-danger)' : 'var(--db-success)', color: '#fff' }}
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Rates</h1>
        <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>Room type rates</p>
      </div>

      {/* Season pill tabs */}
      <div className="flex flex-wrap gap-2">
        {SEASONS.map(s => {
          const isActive = activeSeason === s.value;
          return (
            <button
              key={s.value}
              onClick={() => setActiveSeason(s.value)}
              className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                background: isActive ? 'var(--db-accent)' : 'var(--db-muted)',
                color: isActive ? '#fff' : 'var(--db-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Rates table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--db-muted)' }}>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Room Type</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Price / Night</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Min Stay (nights)</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Weekend Rate</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const rt = roomTypeMap[row.roomTypeId];
                const isEditing = editingId === row.roomTypeId;
                return (
                  <tr
                    key={row.roomTypeId}
                    style={{ background: idx % 2 === 1 ? 'var(--db-muted)' : 'var(--db-surface)' }}
                  >
                    {/* Room Type Name + Bed Badge */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">{rt?.name ?? row.roomTypeId}</span>
                        {rt && (
                          <span
                            className="inline-block w-fit rounded-full px-2 py-0.5 text-xs"
                            style={{ background: 'var(--db-muted)', color: 'var(--db-secondary)', border: '1px solid var(--db-border)' }}
                          >
                            {rt.bedType}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      {isEditing && draft ? (
                        <input
                          type="number"
                          value={draft.price}
                          onChange={e => setDraft(d => d ? { ...d, price: e.target.value } : d)}
                          className="rounded-lg border px-2 py-1 text-sm w-28"
                          style={{ borderColor: 'var(--db-border)', background: 'var(--db-bg)', color: 'var(--db-primary)' }}
                          aria-label="Price per night"
                        />
                      ) : (
                        <span className="text-base font-bold" style={{ color: 'var(--db-primary)' }}>
                          {formatNgn(row.price)}
                        </span>
                      )}
                    </td>

                    {/* Min Stay */}
                    <td className="px-4 py-3">
                      {isEditing && draft ? (
                        <select
                          value={draft.minStay}
                          onChange={e => setDraft(d => d ? { ...d, minStay: parseInt(e.target.value, 10) } : d)}
                          className="rounded-lg border px-2 py-1 text-sm"
                          style={{ borderColor: 'var(--db-border)', background: 'var(--db-bg)', color: 'var(--db-primary)' }}
                          aria-label="Minimum stay nights"
                        >
                          {[1,2,3,4,5,6,7].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      ) : (
                        <span>{row.minStay} night{row.minStay > 1 ? 's' : ''}</span>
                      )}
                    </td>

                    {/* Weekend Rate */}
                    <td className="px-4 py-3">
                      {isEditing && draft ? (
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={draft.weekendEnabled}
                              onChange={e => setDraft(d => d ? { ...d, weekendEnabled: e.target.checked } : d)}
                              aria-label="Different weekend rate"
                            />
                            <span style={{ color: 'var(--db-secondary)' }}>Different weekend rate</span>
                          </label>
                          {draft.weekendEnabled && (
                            <input
                              type="number"
                              value={draft.weekendRate}
                              onChange={e => setDraft(d => d ? { ...d, weekendRate: e.target.value } : d)}
                              placeholder="Weekend price"
                              className="rounded-lg border px-2 py-1 text-sm w-28"
                              style={{ borderColor: 'var(--db-border)', background: 'var(--db-bg)', color: 'var(--db-primary)' }}
                              aria-label="Weekend price"
                            />
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--db-secondary)' }}>
                          {row.weekendEnabled && row.weekendRate != null
                            ? formatNgn(row.weekendRate)
                            : <span className="text-xs">—</span>
                          }
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => void saveEdit(row.roomTypeId)}
                              disabled={row.saving}
                              className="rounded-lg px-3 py-1 text-xs font-medium"
                              style={{
                                background: row.saving ? 'var(--db-muted)' : 'var(--db-accent)',
                                color: row.saving ? 'var(--db-secondary)' : '#fff',
                                border: 'none',
                                cursor: row.saving ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {row.saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="rounded-lg px-3 py-1 text-xs font-medium"
                              style={{ background: 'var(--db-muted)', color: 'var(--db-secondary)', border: '1px solid var(--db-border)', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(row)}
                              className="rounded-lg px-3 py-1 text-xs font-medium"
                              style={{ background: 'var(--db-muted)', color: 'var(--db-primary)', border: '1px solid var(--db-border)', cursor: 'pointer' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => showToast(`Applied to all seasons`)}
                              className="rounded-lg px-3 py-1 text-xs font-medium"
                              style={{ background: 'var(--db-muted)', color: 'var(--db-secondary)', border: '1px solid var(--db-border)', cursor: 'pointer' }}
                            >
                              Apply to all seasons
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk update */}
      <div
        className="rounded-xl border p-5"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2 className="mb-3 text-sm font-semibold">Bulk price update</h2>
        <p className="mb-4 text-xs" style={{ color: 'var(--db-secondary)' }}>
          Apply a percentage increase or decrease to all room types in the current season.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={bulkPercent}
              onChange={e => setBulkPercent(e.target.value)}
              placeholder="e.g. 10 or -5"
              className="rounded-lg border px-3 py-2 text-sm w-32"
              style={{ borderColor: 'var(--db-border)', background: 'var(--db-bg)', color: 'var(--db-primary)' }}
              aria-label="Percentage change"
            />
            <span className="text-sm" style={{ color: 'var(--db-secondary)' }}>%</span>
          </div>
          <button
            onClick={() => void applyBulkUplift()}
            disabled={bulkPercent === ''}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{
              background: bulkPercent !== '' ? 'var(--db-accent)' : 'var(--db-muted)',
              color: bulkPercent !== '' ? '#fff' : 'var(--db-secondary)',
              border: 'none',
              cursor: bulkPercent !== '' ? 'pointer' : 'not-allowed',
            }}
          >
            Apply to all room types
          </button>
        </div>
      </div>

      {/* Note */}
      <p className="text-xs" style={{ color: 'var(--db-secondary)' }}>
        💡 For date-specific rates, use the Inventory Calendar.
      </p>

    </div>
  );
}
