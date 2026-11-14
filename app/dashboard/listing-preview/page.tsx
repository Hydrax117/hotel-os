'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { getMyHotel, getDashboardResources, type DashboardHotel, type DashboardResource } from '@/app/lib/api/dashboard';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNgn(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG');
}

function availabilityLabel(rt: { availableRooms: number; totalRooms: number }): string {
  const ratio = rt.availableRooms / rt.totalRooms;
  if (ratio > 0.5) return 'Good';
  if (ratio >= 0.2) return 'Limited';
  return 'Low';
}

function availabilityColor(rt: { availableRooms: number; totalRooms: number }): string {
  const ratio = rt.availableRooms / rt.totalRooms;
  if (ratio > 0.5) return 'var(--db-success)';
  if (ratio >= 0.2) return 'var(--db-warning)';
  return 'var(--db-danger)';
}

// ── Star rating SVG ───────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill={i <= Math.floor(rating) ? 'var(--db-star)' : 'var(--db-border)'}
            stroke={i <= Math.floor(rating) ? 'var(--db-star)' : 'var(--db-border)'}
            strokeWidth="1"
          />
        </svg>
      ))}
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--db-star)', marginLeft: 4 }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ListingPreviewPage() {
  const { user } = useAuth();
  const [hotel, setHotel] = useState<DashboardHotel | null>(null);
  const [resources, setResources] = useState<DashboardResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getMyHotel()
      .then(async h => {
        if (!h) return;
        setHotel(h);
        const rooms = await getDashboardResources(h.id).catch(() => []);
        setResources(rooms);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [user]);

  if (isLoading) {
    return <div style={{ padding: 24, color: 'var(--db-secondary)' }}>Loading preview…</div>;
  }

  if (!hotel) {
    return <div style={{ padding: 24, color: 'var(--db-secondary)' }}>Hotel data not available.</div>;
  }

  const totalRooms = resources.length;
  const subscriptionPlan = hotel.subscriptionPlan
    ? hotel.subscriptionPlan.charAt(0).toUpperCase() + hotel.subscriptionPlan.slice(1).toLowerCase()
    : null;

  const policies = [
    { label: 'Check-in',     value: hotel.checkInTime  ?? '14:00' },
    { label: 'Check-out',    value: hotel.checkOutTime ?? '12:00' },
    { label: 'Cancellation', value: '24h before' },
    { label: 'Pets',         value: 'Not allowed' },
  ];

  return (
    <div style={{ color: 'var(--db-primary)', display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Preview banner */}
      <div
        style={{ borderRadius: 12, border: '1px solid var(--db-warning)', background: 'rgba(217,119,6,0.08)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
        role="banner"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
        <p style={{ fontSize: 13, margin: 0, color: 'var(--db-primary)', flex: 1 }}>
          <strong>Preview mode</strong> — this is how your listing appears to travellers.
        </p>
      </div>

      {/* Page header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Listing Preview</h1>
          <p style={{ fontSize: 14, color: 'var(--db-secondary)', margin: 0 }}>This is how travellers see your hotel</p>
        </div>
        <a
          href={`/hotels/${hotel.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ borderRadius: 8, border: '1px solid var(--db-accent)', color: 'var(--db-accent)', padding: '8px 16px', fontSize: 13, fontWeight: 500, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          View live listing
        </a>
      </div>

      {/* Image gallery placeholder */}
      <div
        style={{ borderRadius: 16, overflow: 'hidden', height: 260, background: 'linear-gradient(135deg, #d4a96a 0%, #8b6b42 25%, #3d6b4f 50%, #2d5043 75%, #1a3d2e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}
        aria-label="Image gallery placeholder"
      >
        <div style={{ textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginBottom: 8 }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <p style={{ margin: 0 }}>Hotel gallery</p>
        </div>
      </div>

      {/* Hotel identity */}
      <div style={{ borderRadius: 16, border: '1px solid var(--db-border)', background: 'var(--db-surface)', padding: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{hotel.name}</h2>
            <p style={{ fontSize: 14, color: 'var(--db-secondary)', margin: '0 0 8px' }}>
              {hotel.city}, {hotel.state}, Nigeria
            </p>
            <StarRating rating={0} />
            <p style={{ fontSize: 12, color: 'var(--db-secondary)', marginTop: 4 }}>No reviews yet</p>
          </div>
          {subscriptionPlan && (
            <span style={{ borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600, background: 'var(--db-accent)', color: '#fff' }}>
              {subscriptionPlan}
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, color: 'var(--db-secondary)', lineHeight: 1.7, margin: 0 }}>
          {hotel.name} offers a hospitality experience in {hotel.city}.
          {totalRooms > 0 && ` Featuring ${totalRooms} resource${totalRooms !== 1 ? 's' : ''} across ${new Set(resources.map(r => r.categoryName)).size} categor${new Set(resources.map(r => r.categoryName)).size !== 1 ? 'ies' : 'y'}.`}
        </p>
      </div>

      {/* Resources */}
      {resources.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Available resources</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {resources.filter(r => r.marketplaceVisibility === 'PUBLIC').map(r => (
              <div key={r.id} style={{ borderRadius: 12, border: '1px solid var(--db-border)', background: 'var(--db-surface)', overflow: 'hidden' }}>
                {r.primaryImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.primaryImageUrl} alt={r.name} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ height: 80, background: 'var(--db-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--db-secondary)', fontSize: 11 }}>No photo</div>
                )}
                <div style={{ padding: 14 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{r.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--db-secondary)', marginBottom: 8 }}>{r.categoryName} · {r.resourceTypeName}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {r.capacity && <span style={{ fontSize: 11, background: 'var(--db-muted)', borderRadius: 4, padding: '2px 8px', color: 'var(--db-secondary)' }}>Up to {r.capacity} guests</span>}
                    <span style={{ fontSize: 11, background: 'var(--db-muted)', borderRadius: 4, padding: '2px 8px', color: 'var(--db-secondary)' }}>{r.bookingUnit.charAt(0) + r.bookingUnit.slice(1).toLowerCase()} rate</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {resources.filter(r => r.marketplaceVisibility !== 'PUBLIC').length > 0 && (
            <p style={{ fontSize: 12, color: 'var(--db-secondary)', marginTop: 10 }}>
              {resources.filter(r => r.marketplaceVisibility !== 'PUBLIC').length} resource(s) are private/unlisted and not shown to customers.
            </p>
          )}
        </div>
      )}

      {/* Location */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Location</h2>
        <p style={{ fontSize: 13, color: 'var(--db-secondary)', marginBottom: 12 }}>{hotel.city}, {hotel.state}, Nigeria</p>
        <div style={{ height: 200, borderRadius: 12, background: 'var(--db-muted)', border: '1px solid var(--db-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--db-secondary)' }} aria-label="Map preview placeholder">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ fontSize: 13 }}>Map preview not available</span>
        </div>
      </div>

      {/* Policies */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Policies</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {policies.map(policy => (
            <div key={policy.label} style={{ borderRadius: 10, border: '1px solid var(--db-border)', background: 'var(--db-surface)', padding: '14px 16px' }}>
              <p style={{ fontSize: 11, color: 'var(--db-secondary)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{policy.label}</p>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{policy.value}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
