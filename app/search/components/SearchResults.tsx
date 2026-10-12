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
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load hotels');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [destination, checkIn, checkOut, guests, page]);

  // Client-side sort on the fetched page
  const sorted = [...hotels].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.pricePerNight - b.pricePerNight;
      case 'price-desc':
        return b.pricePerNight - a.pricePerNight;
      case 'rating':
        return b.rating - a.rating;
      case 'most-reviewed':
        return b.reviewCount - a.reviewCount;
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });

  const startItem = (page - 1) * 12 + 1;
  const endItem = Math.min(page * 12, total);

  const resultLabel = destination
    ? `${total} hotel${total !== 1 ? 's' : ''} in ${destination}`
    : `${total} hotel${total !== 1 ? 's' : ''}`;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
      {/* Two-column layout */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
        {/* Sidebar filters */}
        <SearchFilters
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
        />

        {/* Results column */}
        <div style={{ flex: 1, minWidth: 0, paddingLeft: '1.5rem' }}>
          {/* Results header */}
          <div
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            style={{ marginBottom: '1.25rem' }}
          >
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--tp-primary)', margin: 0 }}
            >
              {loading ? 'Searching…' : resultLabel}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Mobile filters button */}
              <button
                className="md:hidden"
                onClick={() => setFiltersOpen(true)}
                style={{
                  border: '1px solid var(--tp-border)',
                  background: '#ffffff',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: 'var(--tp-primary)',
                  fontWeight: 500,
                }}
              >
                Filters
              </button>

              {/* Sort dropdown */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  border: '1px solid var(--tp-border)',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  background: '#ffffff',
                  cursor: 'pointer',
                  color: 'var(--tp-primary)',
                  outline: 'none',
                }}
                aria-label="Sort results by"
              >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price: Low to high</option>
                <option value="price-desc">Price: High to low</option>
                <option value="rating">Rating</option>
                <option value="most-reviewed">Most reviewed</option>
              </select>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 1rem',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '1rem', color: 'var(--tp-secondary)' }}>
                Loading hotels…
              </p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 1rem',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: '1rem',
                  color: 'var(--tp-secondary)',
                  marginBottom: '1.25rem',
                }}
              >
                {error}
              </p>
              <button
                onClick={() => {
                  setPage(1);
                  setError(null);
                  setLoading(true);
                }}
                style={{
                  border: '1px solid var(--tp-border)',
                  background: '#ffffff',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: 'var(--tp-primary)',
                  fontWeight: 500,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && sorted.length === 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 1rem',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: '1.125rem',
                  color: 'var(--tp-secondary)',
                  marginBottom: '1.25rem',
                }}
              >
                No hotels found{destination ? ` in ${destination}` : ''}.
              </p>
              <Link
                href="/"
                style={{
                  color: 'var(--tp-accent)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                ← Back to home
              </Link>
            </div>
          )}

          {/* Hotel list */}
          {!loading && !error && sorted.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  featured={hotel.featured}
                />
              ))}
            </div>
          )}

          {/* Pagination footer */}
          {!loading && !error && sorted.length > 0 && (
            <div
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              style={{
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--tp-border)',
              }}
            >
              <span style={{ fontSize: '0.875rem', color: 'var(--tp-secondary)' }}>
                Showing {startItem}–{endItem} of {total} hotels
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{
                    border: '1px solid var(--tp-border)',
                    background: '#ffffff',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.4 : 1,
                    color: 'var(--tp-primary)',
                  }}
                >
                  Previous
                </button>
                <button
                  disabled={page * 12 >= total}
                  onClick={() => setPage(p => p + 1)}
                  style={{
                    border: '1px solid var(--tp-border)',
                    background: '#ffffff',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: page * 12 >= total ? 'not-allowed' : 'pointer',
                    opacity: page * 12 >= total ? 0.4 : 1,
                    color: 'var(--tp-primary)',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
