'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getMyHotel, getDashboardResources, type DashboardResource } from '../../lib/api/dashboard';
import { ApiError } from '../../lib/api/client';

function formatNgn(n: number) { return '₦' + n.toLocaleString('en-NG'); }

const UNIT: Record<string, string> = {
  NIGHT: '/night', HOUR: '/hour', DAY: '/day', SESSION: '/session', CUSTOM: '',
};

export default function RatesPage() {
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [resources, setResources] = useState<DashboardResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const hotel = await getMyHotel();
      if (!hotel) { setLoading(false); return; }
      setHotelId(hotel.id);
      setResources(await getDashboardResources(hotel.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return (
    <div style={{ color: 'var(--db-primary)' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Rates</h1>
      {[1,2,3].map(i => <div key={i} style={{ height: 56, background: 'var(--db-muted)', borderRadius: 8, marginBottom: 8 }} />)}
    </div>
  );

  const bookable = resources.filter(r => r.isBookable && r.lifecycleStatus === 'ACTIVE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: 'var(--db-primary)' }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Rates</h1>
        <p style={{ fontSize: 13, color: 'var(--db-secondary)', marginTop: 4 }}>
          Pricing per resource. Rate plans coming soon — set a base price below.
        </p>
      </div>
      {error && <p style={{ color: 'var(--db-danger)' }}>{error}</p>}

      {bookable.length === 0 ? (
        <div style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--db-secondary)' }}>
            No bookable resources found. Add resources from the{' '}
            <a href="/dashboard/resources" style={{ color: 'var(--db-accent)', textDecoration: 'underline' }}>Resources page</a>.
          </p>
        </div>
      ) : (
        <div style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--db-muted)' }}>
                  {['Resource', 'Category', 'Type', 'Unit', 'Price'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--db-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookable.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 ? 'var(--db-muted)' : 'var(--db-surface)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      {r.primaryImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.primaryImageUrl} alt="" style={{ width: 36, height: 28, objectFit: 'cover', borderRadius: 4, marginRight: 8, verticalAlign: 'middle', display: 'inline-block' }} />
                      )}
                      {r.name}
                      <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--db-secondary)', background: 'var(--db-muted)', borderRadius: 4, padding: '1px 6px' }}>{r.code}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--db-secondary)' }}>{r.categoryName}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--db-secondary)' }}>{r.resourceTypeName}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--db-secondary)' }}>{UNIT[r.bookingUnit] ?? r.bookingUnit}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, color: 'var(--db-secondary)', fontStyle: 'italic' }}>
                        Rate plans coming soon
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p style={{ fontSize: 12, color: 'var(--db-secondary)' }}>
        💡 Rate plans (nightly, hourly, seasonal pricing) are on the roadmap.
        You can manage resources and their attributes from the{' '}
        <a href="/dashboard/resources" style={{ color: 'var(--db-accent)', textDecoration: 'underline' }}>Resources page</a>.
      </p>
    </div>
  );
}
