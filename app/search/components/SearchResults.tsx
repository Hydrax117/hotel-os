'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HotelSummary, searchHotels } from '@/app/lib/api/search';
import { SearchFilters } from './SearchFilters';
import { HotelListCard } from './HotelListCard';

// ── Types ─────────────────────────────────────────────────────────────────────

type SearchResultsProps = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="flex flex-col md:flex-row overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        height: '180px',
      }}
    >
      <div className="skeleton md:w-[260px] w-full shrink-0" style={{ height: '100%' }} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="skeleton h-5 w-3/5 rounded" />
        <div className="skeleton h-4 w-2/5 rounded" />
        <div className="skeleton h-4 w-1/4 rounded" />
        <div className="mt-auto flex gap-2">
          <div className="skeleton h-6 w-16 rounded" />
          <div className="skeleton h-6 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconFilter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
);

const IconEmpty = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-border-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export function SearchResults({
  destination,
  checkIn,
  checkOut,
  guests,
}: SearchResultsProps) {
  const [sortBy, setSortBy] = useState('recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [hotels, setHotels] = useState<HotelSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchHotels({ destination, checkIn, checkOut, guests, page, limit: 12 })
      .then(data => {
        if (!cancelled) {
          setHotels(data.hotels);
          setTotal(data.total);
        }
      })
      .catch(err => {
        if (!cancelled) {
          const raw = err instanceof Error ? err.message : '';
          const friendly =
            raw === 'Failed to fetch' || raw.includes('NetworkError') || raw.includes('fetch')
              ? 'Unable to reach the server. Please check your connection and try again.'
              : raw || 'Something went wrong. Please try again.';
          setError(friendly);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [destination, checkIn, checkOut, guests, page, retryCount]);

  // Client-side sort on the fetched page
  const sorted = [...hotels].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':  return a.pricePerNight - b.pricePerNight;
      case 'price-desc': return b.pricePerNight - a.pricePerNight;
      case 'rating':     return b.rating - a.rating;
      case 'most-reviewed': return b.reviewCount - a.reviewCount;
      default: return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });

  const startItem = (page - 1) * 12 + 1;
  const endItem   = Math.min(page * 12, total);

  const resultLabel = loading
    ? 'Searching…'
    : destination
    ? `${total.toLocaleString()} hotel${total !== 1 ? 's' : ''} in ${destination}`
    : `${total.toLocaleString()} hotel${total !== 1 ? 's' : ''}`;

  return (
    <div
      className="mx-auto flex max-w-7xl flex-col gap-0 md:flex-row"
      style={{ padding: '0 1.25rem 3rem', paddingTop: '1.5rem' }}
    >
      {/* ── Filters sidebar ── */}
      <SearchFilters isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} />

      {/* ── Results column ── */}
      <div className="flex flex-1 flex-col gap-5 min-w-0 md:pl-8">

        {/* Header bar */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1
              className="text-xl font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {resultLabel}
            </h1>
            {!loading && !error && destination && (
              <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {checkIn && checkOut ? `${checkIn} → ${checkOut}` : 'All dates'}
                {guests > 1 ? ` · ${guests} guests` : ` · 1 guest`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile filter button */}
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="md:hidden flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                background: 'var(--color-surface)',
              }}
            >
              <IconFilter />
              Filters
            </button>

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm font-medium outline-none cursor-pointer"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                background: 'var(--color-surface)',
              }}
              aria-label="Sort results by"
            >
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price: Low to high</option>
              <option value="price-desc">Price: High to low</option>
              <option value="rating">Highest rated</option>
              <option value="most-reviewed">Most reviewed</option>
            </select>
          </div>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div
            className="flex flex-col items-center gap-4 rounded-2xl py-16 text-center"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
            <button
              type="button"
              onClick={() => { setPage(1); setRetryCount(c => c + 1); }}
              className="rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                background: 'var(--color-surface)',
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && sorted.length === 0 && (
          <div
            className="flex flex-col items-center gap-4 rounded-2xl py-16 text-center"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <IconEmpty />
            <div>
              <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                No hotels found{destination ? ` in ${destination}` : ''}
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Try a different city, adjust your dates, or broaden your search.
              </p>
            </div>
            <Link
              href="/"
              className="text-sm font-medium"
              style={{ color: 'var(--color-brand)' }}
            >
              ← Back to home
            </Link>
          </div>
        )}

        {/* Hotel list */}
        {!loading && !error && sorted.length > 0 && (
          <div className="flex flex-col gap-4">
            {sorted.map(hotel => (
              <HotelListCard
                key={hotel.id}
                id={hotel.id}
                name={hotel.name}
                city={hotel.city}
                state={hotel.state}
                rating={hotel.rating}
                reviewCount={hotel.reviewCount}
                pricePerNight={hotel.pricePerNight}
                amenities={hotel.amenities}
                imageUrl={hotel.imageUrl}
                featured={hotel.featured}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && sorted.length > 0 && (
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-6"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Showing {startItem}–{endItem} of {total.toLocaleString()} hotels
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-surface)',
                }}
              >
                ← Previous
              </button>
              <button
                type="button"
                disabled={page * 12 >= total}
                onClick={() => setPage(p => p + 1)}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-surface)',
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
