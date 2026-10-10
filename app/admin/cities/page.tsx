import React from 'react';
import { connection } from 'next/server';

export const instant = false;

// ── Mock data ─────────────────────────────────────────────────────────────────

type CityRow = {
  city: string;
  state: string;
  hotels: number;
  activeHotels: number;
  travelers: number;
  status: 'Active' | 'Inactive';
};

const CITIES: CityRow[] = [
  { city: 'Lagos', state: 'Lagos State', hotels: 128, activeHotels: 112, travelers: 8420, status: 'Active' },
  { city: 'Abuja', state: 'FCT', hotels: 94, activeHotels: 87, travelers: 6130, status: 'Active' },
  { city: 'Port Harcourt', state: 'Rivers State', hotels: 67, activeHotels: 58, travelers: 3840, status: 'Active' },
  { city: 'Uyo', state: 'Akwa Ibom State', hotels: 31, activeHotels: 24, travelers: 1620, status: 'Active' },
  { city: 'Kano', state: 'Kano State', hotels: 28, activeHotels: 19, travelers: 980, status: 'Active' },
  { city: 'Kaduna', state: 'Kaduna State', hotels: 22, activeHotels: 15, travelers: 740, status: 'Active' },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminCitiesPage() {
  await connection();

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid var(--ad-border)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--ad-primary)',
    background: 'white',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--ad-secondary)',
    display: 'block',
    marginBottom: '6px',
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--ad-primary)', margin: 0 }}>
            Cities
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--ad-secondary)', margin: '6px 0 0' }}>
            Manage hotel coverage across Nigerian cities.
          </p>
        </div>
        <button
          type="button"
          style={{
            background: 'var(--ad-accent)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Add City
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {[
          { label: 'Active Cities', value: String(CITIES.filter(c => c.status === 'Active').length) },
          { label: 'Total Hotels', value: String(CITIES.reduce((s, c) => s + c.hotels, 0)) },
          { label: 'Active Hotels', value: String(CITIES.reduce((s, c) => s + c.activeHotels, 0)) },
        ].map(s => (
          <div
            key={s.label}
            style={{
              background: 'var(--ad-surface)',
              border: '1px solid var(--ad-border)',
              borderRadius: '12px',
              padding: '20px 28px',
              flex: '1 1 0',
              minWidth: '140px',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--ad-secondary)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--ad-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Cities table */}
      <div
        style={{
          background: 'var(--ad-surface)',
          border: '1px solid var(--ad-border)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '32px',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--ad-muted)' }}>
                {['City + State', 'Hotels', 'Active Hotels', 'Travelers', 'Status', 'Actions'].map(col => (
                  <th
                    key={col}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--ad-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--ad-border)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CITIES.map(row => (
                <tr key={row.city} style={{ borderBottom: '1px solid var(--ad-border)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--ad-primary)', fontSize: '14px' }}>{row.city}</div>
                    <div style={{ fontSize: '12px', color: 'var(--ad-secondary)', marginTop: '2px' }}>{row.state}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--ad-primary)', fontWeight: 500 }}>{row.hotels}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--ad-primary)', fontWeight: 500 }}>{row.activeHotels}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--ad-primary)', fontWeight: 500 }}>{row.travelers.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: '999px',
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--ad-border)',
                          color: 'var(--ad-primary)',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={{
                          background: 'transparent',
                          border: '1px solid #fca5a5',
                          color: '#dc2626',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Disable
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add city form */}
      <div
        style={{
          background: 'var(--ad-surface)',
          border: '1px solid var(--ad-border)',
          borderRadius: '12px',
          padding: '28px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ad-primary)', marginBottom: '20px' }}>
          Add New City
        </h2>
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div>
            <label htmlFor="cityName" style={labelStyle}>City Name</label>
            <input id="cityName" type="text" placeholder="e.g. Benin City" style={inputStyle} />
          </div>
          <div>
            <label htmlFor="stateName" style={labelStyle}>State</label>
            <input id="stateName" type="text" placeholder="e.g. Edo State" style={inputStyle} />
          </div>
          <div>
            <label htmlFor="country" style={labelStyle}>Country</label>
            <input id="country" type="text" defaultValue="Nigeria" style={inputStyle} readOnly />
          </div>
        </div>
        <button
          type="button"
          style={{
            marginTop: '20px',
            background: 'var(--ad-accent)',
            color: 'white',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Save City
        </button>
      </div>
    </div>
  );
}
