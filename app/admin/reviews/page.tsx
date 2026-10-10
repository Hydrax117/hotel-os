import React from 'react';
import { connection } from 'next/server';

export const instant = false;

// ── Mock data ─────────────────────────────────────────────────────────────────

type ReviewStatus = 'approved' | 'flagged' | 'pending' | 'removed';

type MockReview = {
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

const MOCK_REVIEWS: MockReview[] = [
  { id: 'r1', guestName: 'Emeka Okafor', hotelName: 'Eko Hotels & Suites', rating: 5, title: 'Outstanding service and facilities', body: 'Stayed here for 3 nights and was blown away by the quality of service...', date: '2025-11-10', verified: true, status: 'approved' },
  { id: 'r2', guestName: 'Fatima Bello', hotelName: 'Transcorp Hilton Abuja', rating: 4, title: 'Excellent location, great staff', body: 'The hotel is perfectly situated in the heart of Abuja...', date: '2025-11-08', verified: true, status: 'approved' },
  { id: 'r3', guestName: 'Chidi Nwosu', hotelName: 'Ibom Icon Hotel & Golf Resort', rating: 2, title: 'Disappointing experience', body: 'Expected much more given the price. Room was not clean on arrival...', date: '2025-11-07', verified: true, status: 'flagged' },
  { id: 'r4', guestName: 'Ngozi Adeyemi', hotelName: 'Le Meridien Ogeyi Place', rating: 5, title: 'Perfect stay for business trip', body: 'The conference facilities are top notch and the staff is incredibly professional...', date: '2025-11-05', verified: true, status: 'approved' },
  { id: 'r5', guestName: 'Biodun Lawal', hotelName: 'NICON Luxury Hotel', rating: 3, title: 'Average stay, nothing special', body: 'Room was okay, breakfast was decent. Nothing particularly stood out...', date: '2025-11-04', verified: false, status: 'pending' },
  { id: 'r6', guestName: 'Amara Obi', hotelName: 'Eko Hotels & Suites', rating: 1, title: 'Terrible experience - avoid!', body: 'This is a spam review attempting to manipulate ratings...', date: '2025-11-03', verified: false, status: 'flagged' },
  { id: 'r7', guestName: 'Kemi Afolabi', hotelName: 'Transcorp Hilton Abuja', rating: 5, title: 'Best hotel in Abuja hands down', body: 'I have stayed at many hotels in Abuja but none compare to Transcorp...', date: '2025-11-01', verified: true, status: 'approved' },
  { id: 'r8', guestName: 'Tunde Olawale', hotelName: 'Presidential Hotel Port Harcourt', rating: 4, title: 'Great value for money', body: 'Considering the price, this hotel offers exceptional value...', date: '2025-10-30', verified: true, status: 'pending' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
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

const avgRating = (MOCK_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / MOCK_REVIEWS.length).toFixed(1);
const flaggedCount = MOCK_REVIEWS.filter(r => r.status === 'flagged').length;

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminReviewsPage() {
  await connection();

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
          { label: 'Total Reviews', value: '1,247' },
          { label: 'Avg Rating', value: avgRating + ' ★' },
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
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid var(--ad-border)',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        {TABS.map((tab, i) => (
          <div
            key={tab.key}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: i === 0 ? 600 : 400,
              color: i === 0 ? 'var(--ad-accent)' : 'var(--ad-secondary)',
              borderBottom: i === 0 ? '2px solid var(--ad-accent)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Review cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {MOCK_REVIEWS.map(review => {
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
                        <span
                          style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '999px',
                          }}
                        >
                          ✓ Verified stay
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
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: '1px solid #86efac',
                      color: '#15803d',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: '1px solid #fcd34d',
                      color: '#b45309',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Flag
                  </button>
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: '1px solid #fca5a5',
                      color: '#dc2626',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
