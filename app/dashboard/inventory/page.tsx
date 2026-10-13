'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import {
  getMyHotel,
  getDashboardInventory,
  type DashboardRoomInventory,
} from '../../lib/api/dashboard';

// ── Helper ─────────────────────────────────────────────────────────────────────

function formatDateHeader(dateStr: string): { day: string; label: string } {
  const d = new Date(dateStr + 'T00:00:00Z');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    day: days[d.getUTCDay()],
    label: `${d.getUTCDate()} ${months[d.getUTCMonth()]}`,
  };
}

function cellStyle(available: number): React.CSSProperties {
  if (available === 0) {
    return { background: '#fee2e2', color: '#991b1b' };
  }
  if (available < 3) {
    return { background: '#fef3c7', color: '#92400e' };
  }
  return { background: '#dcfce7', color: '#166534' };
}

// ── Types ─────────────────────────────────────────────────────────────────────

type EditCell = { roomTypeId: string; date: string } | null;

// ── Component ─────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [inventory, setInventory] = useState<DashboardRoomInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [editCell, setEditCell]   = useState<EditCell>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/signin');
    }
  }, [authLoading, user, router]);

  // Data fetch — only after auth confirmed
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const hotelData = await getMyHotel();
        if (cancelled) return;
        if (!hotelData) {
          setError('Could not load hotel data. Please try again.');
          setIsLoading(false);
          return;
        }
        const data = await getDashboardInventory(hotelData.id);
        if (!cancelled) setInventory(data);
      } catch {
        if (!cancelled) setError('Failed to load inventory. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [user]);

  // 14-day rolling window starting from the first date
  const dates = inventory[0]?.days.slice(0, 14).map(d => d.date) ?? [];

  function handleCellClick(roomTypeId: string, date: string, currentVal: number) {
    setEditCell({ roomTypeId, date });
    setEditValue(String(currentVal));
  }

  function handleSave(roomTypeId: string, date: string) {
    const num = parseInt(editValue, 10);
    if (!isNaN(num) && num >= 0) {
      setInventory(prev =>
        prev.map(rt => {
          if (rt.roomTypeId !== roomTypeId) return rt;
          return {
            ...rt,
            days: rt.days.map(day => {
              if (day.date !== date) return day;
              return { ...day, available: num };
            }),
          };
        }),
      );
    }
    setEditCell(null);
  }

  function handleKeyDown(e: React.KeyboardEvent, roomTypeId: string, date: string) {
    if (e.key === 'Enter') handleSave(roomTypeId, date);
    if (e.key === 'Escape') setEditCell(null);
  }

  // Auth loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--db-secondary)' }}>
        Loading…
      </div>
    );
  }

  if (!user) return null;

  // Data loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: 'var(--db-secondary)' }}>
        Loading inventory…
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="rounded-xl border p-6 text-center"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)', color: 'var(--db-primary)' }}
      >
        <p className="mb-4" style={{ color: 'var(--db-secondary)' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--db-accent)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Page title */}
      <h1
        className="text-2xl font-bold mb-6"
        style={{ color: 'var(--db-primary)' }}
      >
        Inventory Calendar
      </h1>

      {inventory.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>No inventory data available.</p>
      ) : (
        <>
          {/* Scrollable grid */}
          <div
            className="rounded-xl border overflow-x-auto"
            style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
          >
            <table className="w-full border-collapse" style={{ minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid var(--db-border)` }}>
                  {/* Sticky first column header */}
                  <th
                    className="text-left text-xs font-semibold px-4 py-3"
                    style={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 2,
                      background: 'var(--db-surface)',
                      color: 'var(--db-secondary)',
                      borderRight: '1px solid var(--db-border)',
                      minWidth: '160px',
                    }}
                  >
                    Room Type
                  </th>
                  {dates.map(date => {
                    const { day, label } = formatDateHeader(date);
                    return (
                      <th
                        key={date}
                        className="text-center text-xs font-semibold px-2 py-3"
                        style={{ color: 'var(--db-secondary)', minWidth: '72px' }}
                      >
                        <span className="block">{day}</span>
                        <span className="block">{label}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {inventory.map((rt, rowIdx) => (
                  <tr
                    key={rt.roomTypeId}
                    style={{
                      background: rowIdx % 2 === 0 ? 'var(--db-surface)' : 'var(--db-bg)',
                      borderBottom: '1px solid var(--db-border)',
                    }}
                  >
                    {/* Sticky room type name */}
                    <td
                      className="px-4 py-3 text-sm font-medium"
                      style={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        background: rowIdx % 2 === 0 ? 'var(--db-surface)' : 'var(--db-bg)',
                        color: 'var(--db-primary)',
                        borderRight: '1px solid var(--db-border)',
                        minWidth: '160px',
                      }}
                    >
                      {rt.roomTypeName}
                    </td>

                    {/* Date cells */}
                    {dates.map(date => {
                      const dayData = rt.days.find(d => d.date === date);
                      const available = dayData?.available ?? 0;
                      const isEditing =
                        editCell?.roomTypeId === rt.roomTypeId && editCell?.date === date;

                      return (
                        <td
                          key={date}
                          className="px-2 py-2 text-center"
                          style={{ minWidth: '72px' }}
                        >
                          {isEditing ? (
                            <div className="flex flex-col items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => handleKeyDown(e, rt.roomTypeId, date)}
                                autoFocus
                                className="w-14 rounded border px-1 py-0.5 text-center text-xs"
                                style={{
                                  borderColor: 'var(--db-accent)',
                                  outline: 'none',
                                  color: 'var(--db-primary)',
                                }}
                              />
                              <button
                                onClick={() => handleSave(rt.roomTypeId, date)}
                                className="rounded px-2 py-0.5 text-xs font-medium text-white"
                                style={{ background: 'var(--db-accent)' }}
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleCellClick(rt.roomTypeId, date, available)}
                              className="rounded-md px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80 w-full"
                              style={cellStyle(available)}
                              title="Click to edit"
                            >
                              {available}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm font-medium" style={{ color: 'var(--db-secondary)' }}>
              Legend:
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: '#dcfce7', color: '#166534' }}
            >
              ● Available (3+)
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: '#fef3c7', color: '#92400e' }}
            >
              ● Low (1–2)
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: '#fee2e2', color: '#991b1b' }}
            >
              ● Sold Out
            </span>
          </div>
        </>
      )}
    </div>
  );
}
