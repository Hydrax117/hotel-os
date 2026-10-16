'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import {
  getMyHotel,
  type DashboardHotel,
  publishHotel,
  unpublishHotel,
} from '../../lib/api/dashboard';
import { ImageUploadSlot } from '@/app/components/ImageUploadSlot';
import { getHotelImages, type HotelImage } from '@/app/lib/api/images';

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
  const [images,    setImages]    = useState<HotelImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError,   setPublishError]   = useState<string | null>(null);

  async function handlePublishToggle(publish: boolean) {
    if (!hotel) return;
    setPublishLoading(true);
    setPublishError(null);
    try {
      const updated = publish ? await publishHotel(hotel.id) : await unpublishHotel(hotel.id);
      setHotel(prev => prev ? { ...prev, isPublished: updated.isPublished } : prev);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Action failed. Please try again.';
      setPublishError(message);
    } finally {
      setPublishLoading(false);
    }
  }

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

        // Fetch images — silently ignore errors to not block the profile load
        try {
          const imgs = await getHotelImages(myHotel.id);
          if (!cancelled) setImages(imgs);
        } catch {
          // ignore
        }
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
      {/* Publish status banner */}
      {hotel && hotel.isPublished === false && (
        <div
          className="mb-4 rounded-xl border p-5"
          style={{
            background: '#fffbeb',
            borderColor: '#fbbf24',
            borderLeftWidth: '4px',
          }}
        >
          <div className="flex items-start gap-3">
            {/* Eye-off icon */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#92400e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ flexShrink: 0, marginTop: 2 }}
            >
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
                Your hotel is not visible to travellers yet
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>
                Publish it to start receiving bookings.
              </p>
              <div className="mt-3 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <button
                  onClick={() => handlePublishToggle(true)}
                  disabled={publishLoading}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: '#16a34a' }}
                >
                  {publishLoading ? (
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                  Publish Hotel
                </button>
                {publishError && (
                  <p className="text-xs" style={{ color: '#991b1b' }}>
                    {publishError}
                  </p>
                )}
              </div>
            </div>
          </div>
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
            {hotel?.isPublished === true && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ background: '#dcfce7', color: '#166534' }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Published
              </span>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--db-secondary)' }}>
            {locationStr}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hotel?.isPublished === true && (
            <button
              onClick={() => handlePublishToggle(false)}
              disabled={publishLoading}
              className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60"
              style={{ borderColor: 'var(--db-border)', color: 'var(--db-secondary)' }}
            >
              {publishLoading ? 'Updating...' : 'Unpublish'}
            </button>
          )}
          <button
            className="rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: 'var(--db-border)', color: 'var(--db-primary)' }}
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Publish/Unpublish error (for header unpublish action) */}
      {hotel?.isPublished === true && publishError && (
        <p className="mb-3 text-xs" style={{ color: '#991b1b' }}>{publishError}</p>
      )}

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
            {(() => {
              const CATEGORIES = ['exterior', 'lobby', 'rooms', 'other'] as const;
              const slotCount = Math.max(4, images.length + 1);
              return Array.from({ length: slotCount }).map((_, i) => (
                <ImageUploadSlot
                  key={i}
                  hotelId={hotel!.id}
                  label={CATEGORIES[i % 4] ?? 'photo'}
                  category={CATEGORIES[i % 4] ?? 'photo'}
                  existingImage={images[i] ?? null}
                  onUploaded={img =>
                    setImages(prev => {
                      const next = [...prev];
                      next[i] = img;
                      return next;
                    })
                  }
                  onDeleted={id => setImages(prev => prev.filter(x => x.id !== id))}
                  isPrimary={i === 0}
                />
              ));
            })()}
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
