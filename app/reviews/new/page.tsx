'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TravelerNav } from '../../components/TravelerNav';
import { Footer } from '../../components/Footer';
import { SEARCH_MOCK_HOTELS } from '../../search/mock';
import { apiClient, ApiError } from '../../lib/api/client';
import { useAuth } from '../../lib/auth-context';

// ── Types ─────────────────────────────────────────────────────────────────────

type CategoryKey = 'cleanliness' | 'location' | 'service' | 'value' | 'facilities';

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'cleanliness', label: 'Cleanliness' },
  { key: 'location', label: 'Location' },
  { key: 'service', label: 'Service' },
  { key: 'value', label: 'Value' },
  { key: 'facilities', label: 'Facilities' },
];

const RATING_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

// ── Star button ───────────────────────────────────────────────────────────────

function StarButton({
  filled,
  size,
  onClick,
  onMouseEnter,
  onMouseLeave,
  label,
}: {
  filled: boolean;
  size: number;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? 'var(--tp-gold)' : 'none'}
        stroke="var(--tp-gold)"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}
    >
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

// ── Camera icon ───────────────────────────────────────────────────────────────

function IconCamera() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

// ── Inner page (needs useSearchParams) ───────────────────────────────────────

function ReviewFormInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const hotelId = searchParams.get('hotelId') ?? '';
  const bookingId = searchParams.get('bookingId') ?? '';

  const hotel = SEARCH_MOCK_HOTELS.find(h => h.id === hotelId);
  const hotelName = hotel?.name ?? hotelId ?? 'Your Recent Stay';

  // Guard — bookingId is required to submit a verified review
  const missingBooking = !bookingId;

  // Overall rating state
  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Category ratings
  const [categoryRatings, setCategoryRatings] = useState<Record<CategoryKey, number>>({
    cleanliness: 0,
    location: 0,
    service: 0,
    value: 0,
    facilities: 0,
  });
  const [categoryHover, setCategoryHover] = useState<Record<CategoryKey, number>>({
    cleanliness: 0,
    location: 0,
    service: 0,
    value: 0,
    facilities: 0,
  });

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validation
  const bodyValid = body.trim().length >= 50;
  const canSubmit = overallRating > 0 && title.trim().length > 0 && bodyValid && !missingBooking;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !bookingId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await apiClient.post('/api/v1/reviews', {
        bookingId,
        overallRating,
        cleanlinessRating: categoryRatings.cleanliness || overallRating,
        locationRating: categoryRatings.location || overallRating,
        serviceRating: categoryRatings.service || overallRating,
        valueRating: categoryRatings.value || overallRating,
        facilitiesRating: categoryRatings.facilities || overallRating,
        title: title.trim(),
        body: body.trim(),
      });
      router.push('/bookings?reviewed=true');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSubmitError('You have already submitted a review for this stay.');
      } else if (err instanceof ApiError && err.status === 400) {
        setSubmitError(err.message);
      } else if (err instanceof ApiError && err.status === 401) {
        router.push('/auth/signin?redirect=/reviews/new');
      } else {
        setSubmitError('Failed to submit your review. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const effectiveRating = hoverRating || overallRating;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tp-bg)' }}>
      <TravelerNav />
      <div style={{ paddingTop: '64px' }} />

      <main style={{ padding: '40px 16px' }}>
        <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: '16px' }}>
            <ol style={{ display: 'flex', alignItems: 'center', gap: '8px', listStyle: 'none', margin: 0, padding: 0, fontSize: '14px', color: 'var(--tp-secondary)' }}>
              <li><Link href="/" style={{ color: 'var(--tp-secondary)', textDecoration: 'none' }}>Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/bookings" style={{ color: 'var(--tp-secondary)', textDecoration: 'none' }}>My Bookings</Link></li>
              <li aria-hidden="true">/</li>
              <li style={{ color: 'var(--tp-primary)', fontWeight: 500 }}>Leave a Review</li>
            </ol>
          </nav>

          {/* Header */}
          <div
            style={{
              background: 'white',
              border: '1px solid var(--tp-border)',
              borderRadius: '16px',
              padding: '32px',
            }}
          >
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--tp-primary)', margin: '0 0 8px' }}>
              Share your experience
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--tp-secondary)', margin: '0 0 16px' }}>
              {hotelName}
            </p>

            {/* Booking reference chip + verified badge */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
              {bookingId && (
                <span
                  style={{
                    background: 'var(--tp-muted)',
                    color: 'var(--tp-secondary)',
                    fontSize: '13px',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontWeight: 500,
                  }}
                >
                  Ref: {bookingId}
                </span>
              )}
              {bookingId && (
                <span
                  style={{
                    background: '#dcfce7',
                    color: '#15803d',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '999px',
                  }}
                >
                  ✓ Verified stay — {bookingId}
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* (a) Overall rating */}
              <fieldset style={{ border: 'none', padding: 0, margin: '0 0 28px' }}>
                <legend style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tp-primary)', marginBottom: '12px', display: 'block' }}>
                  Overall Rating
                </legend>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <StarButton
                      key={n}
                      size={48}
                      filled={n <= effectiveRating}
                      onClick={() => setOverallRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      label={`Rate ${n} star${n !== 1 ? 's' : ''}`}
                    />
                  ))}
                  {effectiveRating > 0 && (
                    <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--tp-gold)', marginLeft: '8px' }}>
                      {RATING_LABELS[effectiveRating]}
                    </span>
                  )}
                </div>
              </fieldset>

              {/* (b) Category ratings */}
              <fieldset style={{ border: 'none', padding: 0, margin: '0 0 28px' }}>
                <legend style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tp-primary)', marginBottom: '12px', display: 'block' }}>
                  Category Ratings
                </legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {CATEGORIES.map(cat => (
                    <div key={cat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <span style={{ fontSize: '14px', color: 'var(--tp-primary)', minWidth: '90px' }}>
                        {cat.label}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map(n => {
                          const effective = categoryHover[cat.key] || categoryRatings[cat.key];
                          return (
                            <StarButton
                              key={n}
                              size={24}
                              filled={n <= effective}
                              onClick={() => setCategoryRatings(prev => ({ ...prev, [cat.key]: n }))}
                              onMouseEnter={() => setCategoryHover(prev => ({ ...prev, [cat.key]: n }))}
                              onMouseLeave={() => setCategoryHover(prev => ({ ...prev, [cat.key]: 0 }))}
                              label={`Rate ${cat.label} ${n} star${n !== 1 ? 's' : ''}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* (c) Review title */}
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="reviewTitle" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tp-primary)', display: 'block', marginBottom: '8px' }}>
                  Review Title
                </label>
                <input
                  id="reviewTitle"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Summarise your stay in a few words"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid var(--tp-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'var(--tp-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* (d) Review body */}
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="reviewBody" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tp-primary)', display: 'block', marginBottom: '8px' }}>
                  Your Review
                </label>
                <textarea
                  id="reviewBody"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Tell other travelers about your experience (minimum 50 characters)"
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid var(--tp-border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'var(--tp-primary)',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
                <div
                  style={{
                    fontSize: '12px',
                    marginTop: '6px',
                    color: bodyValid ? 'var(--tp-accent)' : 'var(--tp-secondary)',
                  }}
                >
                  {body.trim().length} / 50 min
                </div>
              </div>

              {/* (e) Photo upload */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tp-primary)', marginBottom: '8px' }}>
                  Add Photos (optional)
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      style={{
                        width: '100px',
                        height: '100px',
                        border: '2px dashed var(--tp-border)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--tp-secondary)',
                        cursor: 'pointer',
                        background: 'var(--tp-muted)',
                      }}
                      aria-label={`Upload photo ${i + 1}`}
                      role="button"
                      tabIndex={0}
                    >
                      <IconCamera />
                    </div>
                  ))}
                </div>
              </div>

              {/* Error banner */}
              {submitError && (
                <div
                  role="alert"
                  style={{
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    fontSize: '14px',
                    marginBottom: '16px',
                  }}
                >
                  {submitError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                style={{
                  width: '100%',
                  background: canSubmit ? 'var(--tp-accent)' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: canSubmit && !isSubmitting ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.2s',
                }}
              >
                {isSubmitting && <Spinner />}
                {isSubmitting ? 'Submitting…' : 'Submit review'}
              </button>

              {!canSubmit && (overallRating === 0 || title.trim().length === 0 || !bodyValid) && (
                <p style={{ fontSize: '13px', color: 'var(--tp-secondary)', textAlign: 'center', marginTop: '8px' }}>
                  {overallRating === 0 ? 'Please select an overall rating.' :
                    title.trim().length === 0 ? 'Please enter a review title.' :
                    'Your review must be at least 50 characters.'}
                </p>
              )}
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ── Page with Suspense boundary ───────────────────────────────────────────────

export default function NewReviewPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--tp-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tp-secondary)' }}>Loading…</div>}>
      <ReviewFormInner />
    </Suspense>
  );
}
