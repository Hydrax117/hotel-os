'use client';

// TODO: Wire to GET /api/v1/reviews when admin reviews endpoint is implemented

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';

// ── Types ─────────────────────────────────────────────────────────────────────

type ReviewStatus = 'approved' | 'flagged' | 'pending' | 'removed';

type AdminReview = {
  id: string;
  guestName: string;
  hotelName: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  status: ReviewStatus;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '\u2026' : text;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} style={{ display: 'inline-flex', gap: '1px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= rating ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="1.5" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

type TabKey = 'all' | 'pending' | 'approved' | 'flagged' | 'removed';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending moderation' },
  { key: 'approved', label: 'Approved' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'removed', label: 'Removed' },
];

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ padding: '32px 24px' }}>
      <div style={{ height: 28, width: 200, background: 'var(--ad-muted)', borderRadius: 6, marginBottom: 24 }} />
      <div style={{ height: 100, background: 'var(--ad-muted)', borderRadius: 8 }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminReviewsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [reviews] = useState<AdminReview[]>([]);

  // Intentionally always empty — wired once GET /api/v1/admin/reviews is available
  useEffect(() => {
    // TODO: fetch reviews from API when endpoint is implemented
  }, []);

  if (authLoading) return <LoadingSkeleton />;

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--ad-secondary)' }}>Access denied. Super admin role required.</p>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
  const flaggedCount = reviews.filter(r => r.status === 'flagged').length;

  const filteredReviews: AdminReview[] = activeTab === 'all'
    ? reviews
    : reviews.filter(r => r.status === activeTab);

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--ad-primary)', margin: 0 }}>
          Reviews
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--ad-secondary)', margin: '6px 0 0' }}>
          Moderate guest reviews and maintain content quality.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {[
          { label: 'Total Reviews', value: String(reviews.length) },
          { label: 'Avg Rating', value: avgRating + ' \u2605' },
          { label: 'Flagged', value: String(flaggedCount) },
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
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ad-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div
        role="tablist"
        aria-label="Filter reviews by status"
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--ad-border)',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        {TABS.map(tab => {
          const isActive = tab.key === activeTab;
          const count = tab.key === 'all' ? reviews.length : reviews.filter(r => r.status === tab.key).length;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--ad-accent)' : 'var(--ad-secondary)',
                background: 'transparent',
                border: 'none',
                borderBottomWidth: '2px',
                borderBottomStyle: 'solid',
                borderBottomColor: isActive ? 'var(--ad-accent)' : 'transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                marginBottom: '-1px',
              }}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Review cards */}
      {filteredReviews.length === 0 ? (
        <p style={{ color: 'var(--ad-secondary)', fontSize: '14px' }}>No reviews yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredReviews.map(review => {
            const isFlagged = review.status === 'flagged';
            return (
              <div
                key={review.id}
                style={{
                  background: 'var(--ad-surface)',
                  border: '1px solid var(--ad-border)',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  borderLeft: isFlagged ? '4px solid var(--ad-warning)' : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  {/* Left: avatar + info */}
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', minWidth: 0 }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--ad-accent)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    >
                      {getInitials(review.guestName)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ad-primary)' }}>{review.guestName}</span>
                        {review.verified && (
                          <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px' }}>
                            \u2713 Verified stay
                          </span>
                        )}
                        <span
                          style={{
                            background: isFlagged ? '#fef3c7' : review.status === 'approved' ? '#dcfce7' : '#f3f4f6',
                            color: isFlagged ? '#b45309' : review.status === 'approved' ? '#15803d' : '#6b7280',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            textTransform: 'capitalize',
                          }}
                        >
                          {review.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--ad-secondary)', marginBottom: '6px' }}>
                        {review.hotelName} · {review.date}
                      </div>
                      <StarRow rating={review.rating} />
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ad-primary)', marginTop: '8px', marginBottom: '4px' }}>
                        {review.title}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--ad-secondary)', lineHeight: '1.5' }}>
                        {truncate(review.body, 100)}
                      </div>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                    <button type="button" style={{ background: 'transparent', border: '1px solid #86efac', color: '#15803d', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      Approve
                    </button>
                    <button type="button" style={{ background: 'transparent', border: '1px solid #fcd34d', color: '#b45309', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      Flag
                    </button>
                    <button type="button" style={{ background: 'transparent', border: '1px solid #fca5a5', color: '#dc2626', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
