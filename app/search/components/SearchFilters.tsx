'use client';

import React, { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type SearchFiltersProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const RATING_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '4.5', label: '4.5+' },
  { value: '5', label: '5★' },
] as const;

const AMENITY_OPTIONS = [
  'Pool',
  'WiFi',
  'Gym',
  'Restaurant',
  'Bar',
  'Parking',
  'Spa',
  'Breakfast included',
] as const;

const PROPERTY_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'boutique', label: 'Boutique' },
  { value: 'business', label: 'Business' },
  { value: 'resort', label: 'Resort' },
  { value: 'apartment', label: 'Apartment' },
] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

const IconClose = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconCheck = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export function SearchFilters({ isOpen = false, onClose }: SearchFiltersProps) {
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rating, setRating] = useState('any');
  const [amenities, setAmenities] = useState<Set<string>>(new Set());
  const [propertyType, setPropertyType] = useState('all');
  const [freeCancellation, setFreeCancellation] = useState(false);

  const clearAll = () => {
    setMinPrice('');
    setMaxPrice('');
    setRating('any');
    setAmenities(new Set());
    setPropertyType('all');
    setFreeCancellation(false);
  };

  const toggleAmenity = (amenity: string) => {
    const next = new Set(amenities);
    next.has(amenity) ? next.delete(amenity) : next.add(amenity);
    setAmenities(next);
  };

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--tp-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.75rem',
    display: 'block',
  };

  const pillBase: React.CSSProperties = {
    padding: '0.375rem 0.875rem',
    borderRadius: '9999px',
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid var(--tp-border)',
    background: 'transparent',
    color: 'var(--tp-secondary)',
    transition: 'all 0.15s',
  };

  const pillActive: React.CSSProperties = {
    ...pillBase,
    background: '#3d6b4f',
    borderColor: '#3d6b4f',
    color: '#ffffff',
  };

  const inputStyle: React.CSSProperties = {
    border: '1px solid var(--tp-border)',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    width: '100%',
    outline: 'none',
    color: 'var(--tp-primary)',
    background: '#ffffff',
  };

  const sidebarContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
        padding: '1.5rem',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--tp-primary)', margin: 0 }}>
          Filters
        </h2>
        <button
          onClick={clearAll}
          style={{
            fontSize: '0.875rem',
            color: 'var(--tp-accent)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem 0',
          }}
        >
          Clear all
        </button>
      </div>

      {/* Price per night */}
      <section>
        <span style={sectionHeadingStyle}>Price per night</span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.875rem',
                color: 'var(--tp-secondary)',
                pointerEvents: 'none',
              }}
            >
              ₦
            </span>
            <input
              type="number"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              placeholder="0"
              min={0}
              style={{ ...inputStyle, paddingLeft: '1.75rem' }}
              aria-label="Minimum price"
            />
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.875rem',
                color: 'var(--tp-secondary)',
                pointerEvents: 'none',
              }}
            >
              ₦
            </span>
            <input
              type="number"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="500,000"
              min={0}
              style={{ ...inputStyle, paddingLeft: '1.75rem' }}
              aria-label="Maximum price"
            />
          </div>
        </div>
      </section>

      {/* Minimum rating */}
      <section>
        <span style={sectionHeadingStyle}>Minimum rating</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {RATING_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRating(opt.value)}
              style={rating === opt.value ? pillActive : pillBase}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Amenities */}
      <section>
        <span style={sectionHeadingStyle}>Amenities</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {AMENITY_OPTIONS.map(amenity => {
            const checked = amenities.has(amenity);
            return (
              <label
                key={amenity}
                style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}
              >
                <div
                  onClick={() => toggleAmenity(amenity)}
                  role="checkbox"
                  aria-checked={checked}
                  tabIndex={0}
                  onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && toggleAmenity(amenity)}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '3px',
                    border: checked ? 'none' : '1.5px solid var(--tp-border)',
                    background: checked ? '#3d6b4f' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {checked && <IconCheck />}
                </div>
                <span style={{ fontSize: '0.875rem', color: 'var(--tp-primary)' }}>{amenity}</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Property type */}
      <section>
        <span style={sectionHeadingStyle}>Property type</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {PROPERTY_TYPES.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPropertyType(opt.value)}
              style={propertyType === opt.value ? pillActive : pillBase}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Cancellation */}
      <section>
        <span style={sectionHeadingStyle}>Cancellation</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }}>
          <div
            onClick={() => setFreeCancellation(v => !v)}
            role="checkbox"
            aria-checked={freeCancellation}
            tabIndex={0}
            onKeyDown={e =>
              (e.key === ' ' || e.key === 'Enter') && setFreeCancellation(v => !v)
            }
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '3px',
              border: freeCancellation ? 'none' : '1.5px solid var(--tp-border)',
              background: freeCancellation ? '#3d6b4f' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {freeCancellation && <IconCheck />}
          </div>
          <span style={{ fontSize: '0.875rem', color: 'var(--tp-primary)' }}>
            Free cancellation only
          </span>
        </label>
      </section>
    </div>
  );

  // Desktop sidebar
  const desktopSidebar = (
    <aside
      className="hidden md:block"
      style={{
        width: '280px',
        flexShrink: 0,
        background: '#ffffff',
        borderRight: '1px solid var(--tp-border)',
        minHeight: '100%',
      }}
    >
      {sidebarContent}
    </aside>
  );

  // Mobile overlay
  const mobileOverlay = isOpen ? (
    <div
      className="md:hidden"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: '#ffffff',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '1rem 1rem 0',
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--tp-primary)',
            padding: '0.5rem',
          }}
          aria-label="Close filters"
        >
          <IconClose />
        </button>
      </div>
      {sidebarContent}
    </div>
  ) : null;

  return (
    <>
      {desktopSidebar}
      {mobileOverlay}
    </>
  );
}
