'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getMyHotel, getDashboardInventory, type DashboardResourceAvailability } from '../../lib/api/dashboard';

function formatHeader(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return { day: days[d.getUTCDay()], label: `${d.getUTCDate()} ${months[d.getUTCMonth()]}` };
}

function cellStyle(available: boolean): React.CSSProperties {
  return available
    ? { background: '#dcfce7', color: '#166534' }
    : { background: '#fee2e2', color: '#991b1b' };
}

export default function InventoryPage() {
  const [data, setData] = useState<DashboardResourceAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const hotel = await getMyHotel();
      if (!hotel) { setLoading(false); return; }
      setData(await getDashboardInventory(hotel.id));
    } catch {
      setError('Failed to load availability data.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return (
    <div style={{ color: 'var(--db-primary)' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Availability Calendar</h1>
      {[1,2].map(i => <div key={i} style={{ height: 80, background: 'var(--db-muted)', borderRadius: 8, marginBottom: 12 }} />)}
    </div>
  );

  const visibleDays = data[0]?.days?.slice(0, 14) ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: 'var(--db-primary)' }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Availability Calendar</h1>
        <p style={{ fontSize: 13, color: 'var(--db-secondary)', marginTop: 4 }}>
          14-day availability for each bookable resource. Green = available, red = blocked or booked.
        </p>
      </div>

      {error && <p style={{ color: 'var(--db-danger)' }}>{error}</p>}

      {data.length === 0 ? (
        <div style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--db-secondary)' }}>
            No bookable resources yet.{' '}
            <a href="/dashboard/resources" style={{ color: 'var(--db-accent)', textDecoration: 'underline' }}>Add resources</a>.
          </p>
        </div>
      ) : (
        <div style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', borderRadius: 12, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--db-muted)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--db-secondary)', minWidth: 140 }}>Resource</th>
                {visibleDays.map(d => {
                  const h = formatHeader(d.date);
                  return (
                    <th key={d.date} style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 500, color: 'var(--db-secondary)', minWidth: 44 }}>
                      <div style={{ fontSize: 10, color: 'var(--db-secondary)' }}>{h.day}</div>
                      <div style={{ fontSize: 11 }}>{h.label}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {data.map((row, ri) => (
                <tr key={row.resourceId} style={{ background: ri % 2 ? 'var(--db-muted)' : 'var(--db-surface)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                    <div style={{ fontSize: 13 }}>{row.resourceName}</div>
                    <div style={{ fontSize: 10, color: 'var(--db-secondary)' }}>{row.resourceId.slice(0, 8)}…</div>
                  </td>
                  {row.days.slice(0, 14).map(d => (
                    <td key={d.date} style={{ padding: 4, textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', width: 28, height: 24, borderRadius: 4, fontSize: 10,
                        fontWeight: 600, lineHeight: '24px', textAlign: 'center',
                        ...cellStyle(d.available),
                      }}>
                        {d.available ? '✓' : '✗'}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: 12, color: 'var(--db-secondary)' }}>
        To block dates for maintenance, use the <a href="/dashboard/resources" style={{ color: 'var(--db-accent)', textDecoration: 'underline' }}>Resources page</a> → expand a resource → Availability Blocks.
      </p>
    </div>
  );
}
