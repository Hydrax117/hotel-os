'use client';

import React from 'react';

// ── Local mock data ───────────────────────────────────────────────────────────

type ConnectedIntegration = {
  id: string;
  name: string;
  category: string;
  logoInitials: string;
  logoColor: string;
  status: 'connected';
  lastSync: string;
  stats: { label: string; value: number }[];
};

type AvailableIntegration = {
  id: string;
  name: string;
  category: string;
  description: string;
  logoInitials: string;
  logoColor: string;
  recommended?: boolean;
};

const CONNECTED: ConnectedIntegration[] = [
  {
    id: 'int-opera',
    name: 'Opera PMS',
    category: 'PMS',
    logoInitials: 'OP',
    logoColor: '#1d4ed8',
    status: 'connected',
    lastSync: '2 minutes ago',
    stats: [
      { label: 'Rooms synced', value: 84 },
      { label: 'Rates synced', value: 12 },
      { label: 'Reservations today', value: 7 },
    ],
  },
];

const AVAILABLE: AvailableIntegration[] = [
  // PMS
  { id: 'avail-opera-cloud', name: 'Opera Cloud', category: 'PMS', description: 'Industry-leading property management from Oracle Hospitality.', logoInitials: 'OC', logoColor: '#dc2626' },
  { id: 'avail-protel', name: 'Protel', category: 'PMS', description: 'Cloud-based PMS with multi-property support.', logoInitials: 'PR', logoColor: '#7c3aed' },
  { id: 'avail-mews', name: 'Mews', category: 'PMS', description: 'Modern cloud PMS built for hospitality teams.', logoInitials: 'MW', logoColor: '#0891b2' },
  { id: 'avail-cloudbeds', name: 'Cloudbeds', category: 'PMS', description: 'All-in-one hospitality platform for independent hotels.', logoInitials: 'CB', logoColor: '#d97706' },
  // Channel Managers
  { id: 'avail-siteminder', name: 'SiteMinder', category: 'Channel Manager', description: 'Connect to 450+ booking channels and OTAs globally.', logoInitials: 'SM', logoColor: '#16a34a' },
  { id: 'avail-rentals-united', name: 'Rentals United', category: 'Channel Manager', description: 'Multi-channel distribution for holiday rentals and hotels.', logoInitials: 'RU', logoColor: '#0f766e' },
  // Payment
  { id: 'avail-paystack', name: 'Paystack', category: 'Payment', description: 'Collect payments from guests via cards, bank transfers and USSD.', logoInitials: 'PS', logoColor: '#3d6b4f', recommended: true },
  { id: 'avail-flutterwave', name: 'Flutterwave', category: 'Payment', description: 'Pan-African payment infrastructure for local and international guests.', logoInitials: 'FW', logoColor: '#f97316' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function CategoryBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        padding: '2px 10px',
        fontSize: 11,
        fontWeight: 500,
        background: 'var(--db-muted)',
        color: 'var(--db-secondary)',
        border: '1px solid var(--db-border)',
      }}
    >
      {label}
    </span>
  );
}

function LogoSquare({ initials, color }: { initials: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 10,
        background: color,
        color: '#fff',
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  return (
    <div style={{ color: 'var(--db-primary)', display: 'flex', flexDirection: 'column', gap: 40 }}>

      {/* Hero banner */}
      <div
        style={{
          borderRadius: 16,
          padding: '32px 40px',
          background: 'var(--db-sidebar-bg)',
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 20px)',
          color: '#fff',
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Connect your hotel systems.
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', maxWidth: 560, lineHeight: 1.6, margin: 0 }}>
          Already using hotel management software? Connect it to Hotel OS and keep your rooms, rates and reservations synchronized automatically.
        </p>
      </div>

      {/* Connected systems */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Connected systems</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {CONNECTED.map(integ => (
            <div
              key={integ.id}
              style={{
                borderRadius: 12,
                border: '1px solid var(--db-border)',
                background: 'var(--db-surface)',
                padding: 20,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 20,
                alignItems: 'flex-start',
              }}
            >
              <LogoSquare initials={integ.logoInitials} color={integ.logoColor} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{integ.name}</span>
                  <CategoryBadge label={integ.category} />
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      borderRadius: 999,
                      padding: '2px 10px',
                      fontSize: 11,
                      fontWeight: 500,
                      background: 'var(--db-success-surface)',
                      color: 'var(--db-success)',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--db-success)', display: 'inline-block' }} />
                    Connected
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--db-secondary)', margin: '0 0 12px' }}>
                  Last sync: {integ.lastSync}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  {integ.stats.map(s => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{s.value}</p>
                      <p style={{ fontSize: 11, color: 'var(--db-secondary)', margin: 0 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button
                style={{
                  borderRadius: 8,
                  border: '1px solid var(--db-danger)',
                  background: 'transparent',
                  color: 'var(--db-danger)',
                  padding: '6px 14px',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              >
                Disconnect
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Available integrations */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Available integrations</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {AVAILABLE.map(integ => (
            <div
              key={integ.id}
              style={{
                borderRadius: 12,
                border: '1px solid var(--db-border)',
                background: 'var(--db-surface)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <LogoSquare initials={integ.logoInitials} color={integ.logoColor} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{integ.name}</span>
                    {integ.recommended && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          background: 'var(--db-accent)',
                          color: '#fff',
                          borderRadius: 999,
                          padding: '1px 7px',
                        }}
                      >
                        Recommended
                      </span>
                    )}
                  </div>
                  <CategoryBadge label={integ.category} />
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--db-secondary)', margin: 0, lineHeight: 1.5 }}>
                {integ.description}
              </p>
              <button
                style={{
                  borderRadius: 8,
                  border: '1px solid var(--db-accent)',
                  background: 'transparent',
                  color: 'var(--db-accent)',
                  padding: '7px 16px',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 500,
                  marginTop: 'auto',
                }}
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>How it works</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {[
            { step: 1, title: 'Connect your PMS', desc: 'Select your system and enter your API credentials. We handle the authentication securely.' },
            { step: 2, title: 'Map your rooms', desc: 'Match your PMS room types to Hotel OS room types so inventory stays in sync.' },
            { step: 3, title: 'Stay in sync', desc: 'Rooms, rates and reservations sync automatically. Changes made in either system update everywhere.' },
          ].map(item => (
            <div
              key={item.step}
              style={{
                borderRadius: 12,
                border: '1px solid var(--db-border)',
                background: 'var(--db-surface)',
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
                  <circle cx="16" cy="16" r="16" fill="var(--db-accent)" />
                  <text x="16" y="21" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">{item.step}</text>
                </svg>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--db-secondary)', margin: 0, lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* API access */}
      <section>
        <div
          style={{
            borderRadius: 12,
            border: '1px solid var(--db-border)',
            background: 'var(--db-surface)',
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Direct API integration</h2>
          <p style={{ fontSize: 13, color: 'var(--db-secondary)', marginBottom: 16 }}>
            Use our REST API to build custom integrations with any system.
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 12,
              padding: '10px 16px',
              borderRadius: 8,
              background: 'var(--db-muted)',
              border: '1px solid var(--db-border)',
              marginBottom: 16,
            }}
          >
            <code style={{ flex: 1, fontSize: 13, fontFamily: 'monospace', color: 'var(--db-primary)', letterSpacing: '0.04em' }}>
              hos_live_••••••••••••••••
            </code>
            {/* Copy button — visual only in server component */}
            <button
              style={{
                borderRadius: 6,
                border: '1px solid var(--db-border)',
                background: 'var(--db-surface)',
                color: 'var(--db-secondary)',
                padding: '4px 10px',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              aria-label="Copy API key"
            >
              {/* Copy icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <a
              href="#"
              style={{
                borderRadius: 8,
                border: '1px solid var(--db-accent)',
                color: 'var(--db-accent)',
                padding: '7px 16px',
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              View API docs
            </a>
            <button
              style={{
                borderRadius: 8,
                border: '1px solid var(--db-border)',
                background: 'var(--db-muted)',
                color: 'var(--db-secondary)',
                padding: '7px 16px',
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Regenerate key
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
