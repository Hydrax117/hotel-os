import React from 'react';
import { MOCK_HOTEL } from '../mock/data';

// ── Info card helper ──────────────────────────────────────────────────────────

function InfoCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <section
      className="rounded-xl border p-5"
      style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
    >
      <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--db-primary)' }}>
        {title}
      </h2>
      <dl className="flex flex-col gap-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex flex-col sm:flex-row sm:gap-6">
            <dt className="text-xs font-medium w-40 shrink-0" style={{ color: 'var(--db-secondary)' }}>
              {label}
            </dt>
            <dd className="text-sm" style={{ color: 'var(--db-primary)' }}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--db-primary)' }}>
            {MOCK_HOTEL.name}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--db-secondary)' }}>
            Lagos, Lagos State
          </p>
        </div>
        <button
          className="rounded-lg border px-4 py-2 text-sm font-medium"
          style={{ borderColor: 'var(--db-border)', color: 'var(--db-primary)' }}
        >
          Edit Profile
        </button>
      </div>

      {/* Info sections grid */}
      <div className="flex flex-col gap-4">
        <InfoCard
          title="Property Details"
          rows={[
            { label: 'Name', value: MOCK_HOTEL.name },
            { label: 'Type', value: 'Boutique Hotel' },
            { label: 'Star Rating', value: '4 Stars' },
            {
              label: 'Description',
              value: 'A premium hospitality experience in the heart of Lagos...',
            },
          ]}
        />

        <InfoCard
          title="Location"
          rows={[
            { label: 'Address', value: '14 Adeola Odeku Street, Victoria Island' },
            { label: 'City', value: 'Lagos' },
            { label: 'State', value: 'Lagos State' },
            { label: 'Country', value: 'Nigeria' },
          ]}
        />

        <InfoCard
          title="Contact"
          rows={[
            { label: 'Phone', value: '+234 801 234 5678' },
            { label: 'Email', value: 'info@ekosignature.ng' },
            { label: 'Website', value: 'www.ekosignature.ng' },
          ]}
        />

        <InfoCard
          title="Policies"
          rows={[
            { label: 'Check-in Time', value: '2:00 PM' },
            { label: 'Check-out Time', value: '12:00 PM' },
            {
              label: 'Cancellation Policy',
              value: 'Free cancellation up to 48 hours before check-in',
            },
          ]}
        />

        {/* Photos section */}
        <section
          className="rounded-xl border p-5"
          style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--db-primary)' }}>
            Photos
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map(n => (
              <div
                key={n}
                className="flex items-center justify-center rounded-lg border-2 border-dashed text-sm"
                style={{
                  aspectRatio: '4/3',
                  borderColor: 'var(--db-border)',
                  background: 'var(--db-muted)',
                  color: 'var(--db-secondary)',
                }}
              >
                Add photo
              </div>
            ))}
          </div>
        </section>

        {/* Preview link */}
        <div>
          <a
            href="#"
            className="inline-flex items-center gap-1 text-sm font-medium"
            style={{ color: 'var(--db-accent)' }}
          >
            Preview Public Listing
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 2H2v10h10V9M9 2h3v3M12 2L7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
