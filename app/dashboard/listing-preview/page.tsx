import React from 'react';
import { MOCK_HOTEL, MOCK_ROOM_TYPES } from '../mock/data';

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

// ── Static amenities ──────────────────────────────────────────────────────────

const AMENITIES = [
  { label: 'WiFi',          icon: '📶' },
  { label: 'Pool',          icon: '🏊' },
  { label: 'Restaurant',    icon: '🍽️' },
  { label: 'Parking',       icon: '🅿️' },
  { label: 'Gym',           icon: '🏋️' },
  { label: 'AC',            icon: '❄️' },
  { label: 'Room Service',  icon: '🛎️' },
  { label: 'Bar',           icon: '🍷' },
];

const POLICIES = [
  { label: 'Check-in',    value: '2:00 PM'      },
  { label: 'Check-out',   value: '12:00 PM'     },
  { label: 'Cancellation', value: '24h before'  },
  { label: 'Pets',        value: 'Not allowed'  },
];

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
  const planDisplay = MOCK_HOTEL.subscription.charAt(0).toUpperCase() + MOCK_HOTEL.subscription.slice(1);

  return (
    <div style={{ color: 'var(--db-primary)', display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Sticky Preview Banner */}
      <div
        style={{
          borderRadius: 12,
          border: '1px solid var(--db-warning)',
          background: 'rgba(217, 119, 6, 0.08)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
        role="banner"
      >
        <span style={{ fontSize: 16 }}>📋</span>
        <p style={{ fontSize: 13, margin: 0, color: 'var(--db-primary)', flex: 1 }}>
          <strong>Preview mode</strong> — this is how your listing appears to travelers. Changes made in your dashboard will be reflected here.
        </p>
      </div>

      {/* Page header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Listing Preview</h1>
          <p style={{ fontSize: 14, color: 'var(--db-secondary)', margin: 0 }}>This is how travelers see your hotel</p>
        </div>
        <a
          href="#"
          style={{
            borderRadius: 8,
            border: '1px solid var(--db-accent)',
            color: 'var(--db-accent)',
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          View live listing
        </a>
      </div>

      {/* Image gallery placeholder */}
      <div
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          height: 260,
          background: 'linear-gradient(135deg, #d4a96a 0%, #8b6b42 25%, #3d6b4f 50%, #2d5043 75%, #1a3d2e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.7)',
          fontSize: 14,
        }}
        aria-label="Image gallery placeholder"
      >
        <div style={{ textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginBottom: 8 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p style={{ margin: 0 }}>Hotel gallery</p>
        </div>
      </div>

      {/* Hotel identity */}
      <div
        style={{
          borderRadius: 16,
          border: '1px solid var(--db-border)',
          background: 'var(--db-surface)',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{MOCK_HOTEL.name}</h2>
            <p style={{ fontSize: 14, color: 'var(--db-secondary)', margin: '0 0 8px' }}>
              📍 {MOCK_HOTEL.city}, {MOCK_HOTEL.state}, Nigeria
            </p>
            <StarRating rating={4.5} />
          </div>
          <span
            style={{
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
              background: 'var(--db-accent)',
              color: '#fff',
            }}
          >
            {planDisplay}
          </span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--db-secondary)', lineHeight: 1.7, margin: 0 }}>
          {MOCK_HOTEL.name} offers a premium hospitality experience in the heart of {MOCK_HOTEL.city}. 
          Featuring {MOCK_ROOM_TYPES.reduce((s, rt) => s + rt.totalRooms, 0)} thoughtfully designed rooms across {MOCK_ROOM_TYPES.length} room categories, 
          our hotel combines modern comforts with warm Nigerian hospitality. Whether you&apos;re here for business or leisure, 
          we ensure an unforgettable stay.
        </p>
      </div>

      {/* Amenities */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Amenities</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 10,
          }}
        >
          {AMENITIES.map(amenity => (
            <div
              key={amenity.label}
              style={{
                borderRadius: 10,
                background: 'var(--db-muted)',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
              }}
            >
              <span aria-hidden="true">{amenity.icon}</span>
              <span>{amenity.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Room types */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Room types</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {MOCK_ROOM_TYPES.map(rt => {
            const avColor = availabilityColor(rt);
            const avLabel = availabilityLabel(rt);
            return (
              <div
                key={rt.id}
                style={{
                  borderRadius: 12,
                  border: '1px solid var(--db-border)',
                  background: 'var(--db-surface)',
                  padding: 20,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{rt.name}</span>
                  <span
                    style={{
                      borderRadius: 999,
                      padding: '2px 10px',
                      fontSize: 11,
                      fontWeight: 500,
                      background: avColor + '20',
                      color: avColor,
                    }}
                  >
                    {avLabel}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--db-secondary)' }}>🛏 {rt.bedType}</span>
                  <span style={{ fontSize: 12, color: 'var(--db-secondary)' }}>👤 {rt.capacity} guests</span>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--db-accent)', margin: 0 }}>
                  {formatNgn(rt.pricePerNight)} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--db-secondary)' }}>/ night</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Location */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Location</h2>
        <p style={{ fontSize: 13, color: 'var(--db-secondary)', marginBottom: 12 }}>
          {MOCK_HOTEL.name}, Victoria Island, {MOCK_HOTEL.city}, {MOCK_HOTEL.state}, Nigeria
        </p>
        <div
          style={{
            height: 200,
            borderRadius: 12,
            background: 'var(--db-muted)',
            border: '1px solid var(--db-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: 'var(--db-secondary)',
          }}
          aria-label="Map preview placeholder"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span style={{ fontSize: 13 }}>Map preview not available</span>
        </div>
      </div>

      {/* Policies */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Policies</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          {POLICIES.map(policy => (
            <div
              key={policy.label}
              style={{
                borderRadius: 10,
                border: '1px solid var(--db-border)',
                background: 'var(--db-surface)',
                padding: '14px 16px',
              }}
            >
              <p style={{ fontSize: 11, color: 'var(--db-secondary)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {policy.label}
              </p>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{policy.value}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
