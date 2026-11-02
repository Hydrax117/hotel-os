'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { getMyHotel } from '@/app/lib/api/dashboard';
import { apiClient } from '@/app/lib/api/client';

type ApiReview = {
  id: string;
  overallRating: number;
  title: string;
  body: string;
  isVerified: boolean;
  hotelResponse: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string } | null;
};

type RatingFilter = 'All' | 1 | 2 | 3 | 4 | 5;

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-base" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ color: n <= rating ? '#f59e0b' : '#d1d5db' }}>
          {n <= rating ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('All');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [respondLoading, setRespondLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    getMyHotel()
      .then(hotel => {
        if (!hotel) throw new Error('Hotel not found.');
        return apiClient.get<ApiReview[] | { reviews: ApiReview[] }>(`/api/v1/hotels/${hotel.id}/reviews`);
      })
      .then(raw => setReviews(Array.isArray(raw) ? raw : raw.reviews ?? []))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load reviews.'))
      .finally(() => setIsLoading(false));
  }, [user]);

  const filtered = ratingFilter === 'All' ? reviews : reviews.filter(r => r.overallRating === ratingFilter);
  const average = reviews.length === 0 ? 0 : reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length;

  async function postResponse(id: string) {
    if (!responseText.trim()) return;
    setRespondLoading(true);
    try {
      await apiClient.post(`/api/v1/reviews/${id}/respond`, { response: responseText.trim() });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, hotelResponse: responseText.trim() } : r));
      setRespondingId(null);
      setResponseText('');
    } catch {
      // show nothing — user can retry
    } finally {
      setRespondLoading(false);
    }
  }

  const RATING_FILTERS: RatingFilter[] = ['All', 5, 4, 3, 2, 1];

  if (isLoading) return <div style={{ padding: 24, color: 'var(--db-secondary)' }}>Loading reviews…</div>;
  if (error) return (
    <div style={{ padding: 24 }}>
      <p style={{ color: 'var(--db-danger)' }}>{error}</p>
      <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: '8px 16px', background: 'var(--db-accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Retry</button>
    </div>
  );

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: 'var(--db-bg)', color: 'var(--db-primary)' }}
    >
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--db-primary)' }}>
            Guest Reviews
          </h1>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--db-muted)', color: 'var(--db-secondary)' }}
          >
            <span style={{ color: '#f59e0b' }}>★</span>
            {average.toFixed(1)}
          </span>
        </div>

        {/* Rating filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {RATING_FILTERS.map(f => (
            <button
              key={String(f)}
              onClick={() => setRatingFilter(f)}
              className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              style={
                ratingFilter === f
                  ? {
                      background:  'var(--db-primary)',
                      color:       'var(--db-surface)',
                      borderColor: 'var(--db-primary)',
                    }
                  : {
                      background:  'var(--db-surface)',
                      color:       'var(--db-secondary)',
                      borderColor: 'var(--db-border)',
                    }
              }
            >
              {f === 'All' ? 'All' : `${f}★`}
            </button>
          ))}
        </div>
      </div>

      {/* Review cards */}
      {filtered.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>
          No reviews match the selected filter.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(review => {
            const guestName = review.user ? `${review.user.firstName} ${review.user.lastName}`.trim() : 'Guest';
            const isResponding = respondingId === review.id;
            return (
              <div
                key={review.id}
                className="rounded-xl border p-5"
                style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
              >
                {/* Top row: name + date */}
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold" style={{ color: 'var(--db-primary)' }}>
                    {guestName}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--db-secondary)' }}>
                    {formatDate(review.createdAt)}
                  </span>
                </div>

                {/* Rating + verified badge */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <StarRating rating={review.overallRating} />
                  {review.isVerified && (
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ background: '#dcfce7', color: '#166534' }}
                    >
                      Verified Stay
                    </span>
                  )}
                </div>

                {/* Review title + body */}
                {review.title && (
                  <p className="mb-1 text-sm font-semibold" style={{ color: 'var(--db-primary)' }}>{review.title}</p>
                )}
                <p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--db-primary)' }}>
                  {review.body}
                </p>

                {/* Hotel response */}
                {review.hotelResponse && (
                  <div
                    className="mb-3 ml-4 rounded-lg border-l-2 py-3 pl-4 pr-3 text-sm leading-relaxed"
                    style={{ borderLeftColor: 'var(--db-accent)', background: 'var(--db-muted)', color: 'var(--db-secondary)' }}
                  >
                    <p className="mb-1 text-xs font-semibold" style={{ color: 'var(--db-accent)' }}>Hotel Response:</p>
                    {review.hotelResponse}
                  </div>
                )}

                {/* Respond section */}
                {!review.hotelResponse && (
                  isResponding ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        rows={3}
                        value={responseText}
                        onChange={e => setResponseText(e.target.value)}
                        placeholder="Write a response to this review..."
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                        style={{ borderColor: 'var(--db-border)', color: 'var(--db-primary)', background: 'var(--db-bg)', resize: 'vertical' }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => void postResponse(review.id)}
                          disabled={respondLoading}
                          className="rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
                          style={{ background: 'var(--db-accent)' }}
                        >
                          {respondLoading ? 'Posting…' : 'Post Response'}
                        </button>
                        <button
                          onClick={() => { setRespondingId(null); setResponseText(''); }}
                          className="rounded-lg border px-4 py-2 text-xs font-medium"
                          style={{ borderColor: 'var(--db-border)', color: 'var(--db-secondary)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setRespondingId(review.id); setResponseText(''); }}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                      style={{ borderColor: 'var(--db-border)', color: 'var(--db-secondary)', background: 'transparent' }}
                    >
                      Respond
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
