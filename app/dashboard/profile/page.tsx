'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import {
  getMyHotel,
  type DashboardHotel,
} from '../../lib/api/dashboard';

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
            <dt
              className="text-xs font-medium w-40 shrink-0"
              style={{ color: 'var(--db-secondary)' }}
            >
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

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ padding: '32px 24px' }}>
      <div style={{ height: 28, width: 200, background: 'var(--db-muted)', borderRadius: 6, marginBottom: 24 }} />
      <div style={{ height: 80, background: 'var(--db-muted)', borderRadius: 8 }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [hotel,     setHotel]     = useState<DashboardHotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/signin');
    }
  }, [authLoading, user, router]);

  // Data fetch
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const myHotel = await getMyHotel();
        if (cancelled) return;
        if (!myHotel) {
          setError('Could not load hotel data. Please try again.');
          setIsLoading(false);
          return;
        }
        if (!cancelled) setHotel(myHotel);
      } catch {
        if (!cancelled) setError('Failed to load profile. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [user]);

  if (authLoading) return <LoadingSkeleton />;
  if (!user) return null;
  if (isLoading) return <LoadingSkeleton />;

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

  const locationParts = [hotel?.city, hotel?.state].filter(Boolean);
  const locationStr   = locationParts.length > 0 ? locationParts.join(', ') : '—';

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Not published banner */}
      {hotel && hotel.isPublished === false && (
        <div
          className="mb-4 rounded-lg border px-4 py-3 text-sm"
          style={{ background: '#fef3c7', borderColor: '#fbbf24', color: '#92400e' }}
        >
          Your property is not published. Guests cannot find it on the platform yet.
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--db-primary)' }}>
              {hotel?.name ?? '—'}
            </h1>
            {hotel?.verificationStatus === 'PENDING' && (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ background: '#fef3c7', color: '#92400e' }}
              >
                Pending verification
              </span>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--db-secondary)' }}>
            {locationStr}
          </p>
        </div>
        <button
          className="rounded-lg border px-4 py-2 text-sm font-medium"
          style={{ borderColor: 'var(--db-border)', color: 'var(--db-primary)' }}
        >
          Edit Profile
        </button>
      </div>

      {/* Info sections */}
      <div className="flex flex-col gap-4">
        <InfoCard
          title="Property Details"
          rows={[
            { label: 'Name',        value: hotel?.name ?? '—' },
            { label: 'Type',        value: '—' },
            { label: 'Star Rating', value: '—' },
            { label: 'Description', value: '—' },
          ]}
        />

        <InfoCard
          title="Location"
          rows={[
            { label: 'Address', value: '—' },
            { label: 'City',    value: hotel?.city  ?? '—' },
            { label: 'State',   value: hotel?.state ?? '—' },
            { label: 'Country', value: 'Nigeria' },
          ]}
        />

        <InfoCard
          title="Contact"
          rows={[
            { label: 'Phone',   value: '—' },
            { label: 'Email',   value: '—' },
            { label: 'Website', value: '—' },
          ]}
        />

        <InfoCard
          title="Policies"
          rows={[
            { label: 'Check-in Time',        value: hotel?.checkInTime  ?? '—' },
            { label: 'Check-out Time',       value: hotel?.checkOutTime ?? '—' },
            { label: 'Cancellation Policy',  value: '—' },
          ]}
        />

        {/* Subscription info */}
        {hotel?.subscriptionPlan && (
          <InfoCard
            title="Subscription"
            rows={[
              { label: 'Plan',                value: hotel.subscriptionPlan },
              { label: 'Verification Status', value: hotel.verificationStatus ?? '—' },
            ]}
          />
        )}

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
                  background:  'var(--db-muted)',
                  color:       'var(--db-secondary)',
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
