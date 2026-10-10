'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TravelerNav } from '../components/TravelerNav';
import { Footer } from '../components/Footer';
import { SEARCH_MOCK_HOTELS, MockHotel } from '../search/mock';

// ── Types ─────────────────────────────────────────────────────────────────────

type ProfileSection =
  | 'personal'
  | 'security'
  | 'saved'
  | 'payment'
  | 'notifications'
  | 'preferences';

type NotificationKey =
  | 'bookingConfirmations'
  | 'checkinReminders'
  | 'specialOffers'
  | 'newHotels'
  | 'reviewRequests';

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS: { key: ProfileSection; label: string }[] = [
  { key: 'personal', label: 'Personal Info' },
  { key: 'security', label: 'Security' },
  { key: 'saved', label: 'Saved Hotels' },
  { key: 'payment', label: 'Payment Methods' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'preferences', label: 'Preferences' },
];

// ── Saved hotels (from search mock) ──────────────────────────────────────────

const SAVED_IDS = ['eko-hotel-vi', 'transcorp-hilton-abuja', 'ibom-icon-hotel'];
const SAVED_HOTELS: MockHotel[] = SAVED_IDS
  .map(id => SEARCH_MOCK_HOTELS.find(h => h.id === id))
  .filter((h): h is MockHotel => h !== undefined);

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNgn(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG');
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} style={{ display: 'inline-flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? 'var(--tp-gold)' : 'none'} stroke="var(--tp-gold)" strokeWidth="2" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      type="button"
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '999px',
        background: on ? 'var(--tp-accent)' : '#d1d5db',
        border: 'none',
        cursor: 'pointer',
        padding: '3px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: on ? 'flex-end' : 'flex-start',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'white',
          display: 'block',
          transition: 'transform 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

// ── Section: Personal Info ────────────────────────────────────────────────────

function PersonalInfoSection() {
  const [firstName, setFirstName] = useState('Adaeze');
  const [lastName, setLastName] = useState('Okonkwo');
  const [phone, setPhone] = useState('+234 812 345 6789');
  const [dob, setDob] = useState('1992-05-12');
  const [nationality, setNationality] = useState('Nigerian');
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid var(--tp-border)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--tp-primary)',
    background: 'white',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--tp-secondary)',
    display: 'block',
    marginBottom: '6px',
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--tp-primary)', marginBottom: '24px' }}>
        Personal Information
      </h2>

      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px', gap: '12px' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--tp-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
          }}
          aria-label="Profile avatar with initials AO"
        >
          AO
        </div>
        <button
          type="button"
          style={{
            background: 'transparent',
            border: '1px solid var(--tp-border)',
            color: 'var(--tp-secondary)',
            padding: '6px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Change photo
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gap: '16px' }} className="sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" style={labelStyle}>First name</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="lastName" style={labelStyle}>Last name</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label htmlFor="email" style={labelStyle}>Email address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="email"
                type="email"
                value="adaeze@example.com"
                readOnly
                style={{ ...inputStyle, background: 'var(--tp-muted)', color: 'var(--tp-secondary)', paddingRight: '40px' }}
              />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tp-secondary)' }} aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="phone" style={labelStyle}>Phone number</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="dob" style={labelStyle}>Date of birth</label>
            <input
              id="dob"
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="nationality" style={labelStyle}>Nationality</label>
            <input
              id="nationality"
              type="text"
              value={nationality}
              onChange={e => setNationality(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="submit"
            style={{
              background: 'var(--tp-primary)',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save changes
          </button>
          {saved && (
            <span style={{ color: 'var(--tp-accent)', fontSize: '14px', fontWeight: 500 }}>
              ✓ Changes saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Section: Security ─────────────────────────────────────────────────────────

function SecuritySection() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid var(--tp-border)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'var(--tp-primary)',
    background: 'white',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--tp-secondary)',
    display: 'block',
    marginBottom: '6px',
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--tp-primary)', marginBottom: '24px' }}>
        Security
      </h2>

      {/* Change password */}
      <div
        style={{
          background: 'white',
          border: '1px solid var(--tp-border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--tp-primary)', marginBottom: '16px' }}>
          Change Password
        </h3>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
          <div>
            <label htmlFor="currentPw" style={labelStyle}>Current password</label>
            <input id="currentPw" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} style={inputStyle} autoComplete="current-password" />
          </div>
          <div>
            <label htmlFor="newPw" style={labelStyle}>New password</label>
            <input id="newPw" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} style={inputStyle} autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="confirmPw" style={labelStyle}>Confirm new password</label>
            <input id="confirmPw" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} style={inputStyle} autoComplete="new-password" />
          </div>
          <button
            type="button"
            style={{
              background: 'var(--tp-primary)',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            Update password
          </button>
        </form>
      </div>

      {/* Connected accounts */}
      <div
        style={{
          background: 'white',
          border: '1px solid var(--tp-border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--tp-primary)', marginBottom: '16px' }}>
          Connected Accounts
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Google SVG logo */}
            <svg width="24" height="24" viewBox="0 0 24 24" aria-label="Google" role="img">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--tp-primary)' }}>Google</div>
              <div style={{ fontSize: '12px', color: 'var(--tp-accent)' }}>Connected</div>
            </div>
          </div>
          <button
            type="button"
            style={{
              border: '1px solid var(--tp-border)',
              background: 'transparent',
              color: 'var(--tp-secondary)',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Delete account */}
      <div
        style={{
          background: '#fff5f5',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '24px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#dc2626', marginBottom: '8px' }}>
          Delete Account
        </h3>
        <p style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '16px', lineHeight: '1.5' }}>
          Permanently deleting your account will remove all your bookings, reviews, and personal data. This action cannot be undone.
        </p>
        <button
          type="button"
          style={{
            border: '1px solid #dc2626',
            background: 'transparent',
            color: '#dc2626',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Delete account
        </button>
      </div>
    </div>
  );
}

// ── Section: Saved Hotels ─────────────────────────────────────────────────────

function SavedHotelsSection() {
  const [saved, setSaved] = useState<string[]>(SAVED_IDS);

  const hotels = SAVED_HOTELS.filter(h => saved.includes(h.id));

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--tp-primary)', marginBottom: '24px' }}>
        Saved Hotels
      </h2>
      {hotels.length === 0 && (
        <p style={{ color: 'var(--tp-secondary)', fontSize: '14px' }}>No saved hotels.</p>
      )}
      <div style={{ display: 'grid', gap: '16px' }} className="sm:grid-cols-2 lg:grid-cols-3">
        {hotels.map(hotel => (
          <div
            key={hotel.id}
            style={{
              background: 'white',
              border: '1px solid var(--tp-border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            {/* Image placeholder */}
            <div
              style={{
                aspectRatio: '16/9',
                background: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-hidden="true"
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <rect x="4" y="2" width="16" height="20" rx="1" />
                <line x1="9" y1="22" x2="9" y2="12" />
                <line x1="15" y1="22" x2="15" y2="12" />
              </svg>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tp-primary)', marginBottom: '4px' }}>
                {hotel.name}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--tp-secondary)', marginBottom: '8px' }}>
                {hotel.city}, {hotel.state}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <StarRow rating={hotel.rating} />
                <span style={{ fontSize: '13px', color: 'var(--tp-secondary)' }}>({hotel.reviewCount.toLocaleString()})</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--tp-primary)', marginBottom: '12px' }}>
                {fmtNgn(hotel.pricePerNight)}<span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--tp-secondary)' }}>/night</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link
                  href={`/hotels/${hotel.id}`}
                  style={{
                    flex: 1,
                    background: 'var(--tp-accent)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'block',
                  }}
                >
                  View hotel
                </Link>
                <button
                  type="button"
                  onClick={() => setSaved(prev => prev.filter(id => id !== hotel.id))}
                  style={{
                    border: '1px solid var(--tp-border)',
                    background: 'transparent',
                    color: 'var(--tp-secondary)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section: Payment Methods ──────────────────────────────────────────────────

type MockCard = {
  id: string;
  network: 'visa' | 'mastercard';
  last4: string;
  expiry: string;
  isDefault: boolean;
};

const MOCK_CARDS: MockCard[] = [
  { id: 'card-1', network: 'visa', last4: '4242', expiry: '04/26', isDefault: true },
  { id: 'card-2', network: 'mastercard', last4: '8888', expiry: '09/27', isDefault: false },
];

function VisaIcon() {
  return (
    <svg width="40" height="28" viewBox="0 0 40 28" aria-label="Visa" role="img">
      <rect width="40" height="28" rx="4" fill="#1a1f71" />
      <text x="7" y="20" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif" fontStyle="italic">VISA</text>
    </svg>
  );
}

function MastercardIcon() {
  return (
    <svg width="40" height="28" viewBox="0 0 40 28" aria-label="Mastercard" role="img">
      <rect width="40" height="28" rx="4" fill="#252525" />
      <circle cx="15" cy="14" r="9" fill="#eb001b" />
      <circle cx="25" cy="14" r="9" fill="#f79e1b" />
      <path d="M20 8.5a9 9 0 0 1 0 11 9 9 0 0 1 0-11z" fill="#ff5f00" />
    </svg>
  );
}

function PaymentMethodsSection() {
  const [cards, setCards] = useState<MockCard[]>(MOCK_CARDS);

  function removeCard(id: string) {
    setCards(prev => prev.filter(c => c.id !== id));
  }

  function setDefault(id: string) {
    setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })));
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--tp-primary)', marginBottom: '24px' }}>
        Payment Methods
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {cards.map(card => (
          <div
            key={card.id}
            style={{
              background: 'white',
              border: '1px solid var(--tp-border)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            {card.network === 'visa' ? <VisaIcon /> : <MastercardIcon />}
            <div style={{ flex: 1, minWidth: '120px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tp-primary)' }}>
                {card.network === 'visa' ? 'Visa' : 'Mastercard'} •••• {card.last4}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--tp-secondary)' }}>
                Expires {card.expiry}
              </div>
            </div>
            {card.isDefault && (
              <span
                style={{
                  background: 'var(--tp-accent-light)',
                  color: 'var(--tp-accent)',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '999px',
                }}
              >
                Default
              </span>
            )}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              {!card.isDefault && (
                <button
                  type="button"
                  onClick={() => setDefault(card.id)}
                  style={{
                    border: '1px solid var(--tp-border)',
                    background: 'transparent',
                    color: 'var(--tp-secondary)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Set default
                </button>
              )}
              <button
                type="button"
                onClick={() => removeCard(card.id)}
                style={{
                  border: '1px solid #fecaca',
                  background: 'transparent',
                  color: '#dc2626',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        style={{
          border: '1px dashed var(--tp-border)',
          background: 'var(--tp-muted)',
          color: 'var(--tp-secondary)',
          padding: '12px 24px',
          borderRadius: '12px',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add payment method
      </button>
    </div>
  );
}

// ── Section: Notifications ────────────────────────────────────────────────────

const NOTIFICATION_ITEMS: { key: NotificationKey; label: string; description: string }[] = [
  { key: 'bookingConfirmations', label: 'Booking confirmations', description: 'Receive an email when your booking is confirmed.' },
  { key: 'checkinReminders', label: 'Check-in reminders', description: 'Get reminded 24 hours before your check-in.' },
  { key: 'specialOffers', label: 'Special offers', description: 'Receive exclusive deals and promotions.' },
  { key: 'newHotels', label: 'New hotels in my cities', description: 'Be notified when new hotels open in your preferred cities.' },
  { key: 'reviewRequests', label: 'Review requests', description: 'Prompted to leave a review after your stay.' },
];

function NotificationsSection() {
  const [prefs, setPrefs] = useState<Record<NotificationKey, boolean>>({
    bookingConfirmations: true,
    checkinReminders: true,
    specialOffers: false,
    newHotels: false,
    reviewRequests: true,
  });

  function toggle(key: NotificationKey) {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--tp-primary)', marginBottom: '24px' }}>
        Notifications
      </h2>
      <div
        style={{
          background: 'white',
          border: '1px solid var(--tp-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {NOTIFICATION_ITEMS.map((item, i) => (
          <div
            key={item.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '16px 20px',
              borderTop: i > 0 ? '1px solid var(--tp-border)' : 'none',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--tp-primary)', marginBottom: '2px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--tp-secondary)' }}>
                {item.description}
              </div>
            </div>
            <Toggle on={prefs[item.key]} onChange={() => toggle(item.key)} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section: Preferences ──────────────────────────────────────────────────────

const CITY_CHIPS = ['Lagos', 'Abuja', 'Port Harcourt', 'Uyo'];
const AMENITY_CHIPS = ['Pool', 'WiFi', 'Gym', 'Restaurant'];

function PreferencesSection() {
  const [selectedCities, setSelectedCities] = useState<string[]>(['Lagos', 'Abuja']);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['WiFi']);

  function toggleChip(arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) {
    setArr(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  }

  const chipBase: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid var(--tp-border)',
    transition: 'all 0.15s',
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--tp-primary)', marginBottom: '24px' }}>
        Preferences
      </h2>

      {/* Preferred cities */}
      <div
        style={{
          background: 'white',
          border: '1px solid var(--tp-border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tp-primary)', marginBottom: '12px' }}>
          Preferred Cities
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {CITY_CHIPS.map(city => {
            const active = selectedCities.includes(city);
            return (
              <button
                key={city}
                type="button"
                onClick={() => toggleChip(selectedCities, setSelectedCities, city)}
                style={{
                  ...chipBase,
                  background: active ? 'var(--tp-accent)' : 'white',
                  color: active ? 'white' : 'var(--tp-primary)',
                  borderColor: active ? 'var(--tp-accent)' : 'var(--tp-border)',
                }}
                aria-pressed={active}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferred amenities */}
      <div
        style={{
          background: 'white',
          border: '1px solid var(--tp-border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tp-primary)', marginBottom: '12px' }}>
          Preferred Amenities
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {AMENITY_CHIPS.map(amenity => {
            const active = selectedAmenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleChip(selectedAmenities, setSelectedAmenities, amenity)}
                style={{
                  ...chipBase,
                  background: active ? 'var(--tp-accent)' : 'white',
                  color: active ? 'white' : 'var(--tp-primary)',
                  borderColor: active ? 'var(--tp-accent)' : 'var(--tp-border)',
                }}
                aria-pressed={active}
              >
                {active && <span aria-hidden="true">✓ </span>}{amenity}
              </button>
            );
          })}
        </div>
      </div>

      {/* Currency & Language */}
      <div
        style={{
          background: 'white',
          border: '1px solid var(--tp-border)',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--tp-primary)', marginBottom: '16px' }}>
          Display Settings
        </h3>
        <div style={{ display: 'grid', gap: '16px' }} className="sm:grid-cols-2">
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--tp-secondary)', display: 'block', marginBottom: '6px' }}>
              Currency
            </label>
            <div
              style={{
                padding: '10px 14px',
                border: '1px solid var(--tp-border)',
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--tp-secondary)',
                background: 'var(--tp-muted)',
              }}
            >
              NGN (Nigerian Naira)
            </div>
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--tp-secondary)', display: 'block', marginBottom: '6px' }}>
              Language
            </label>
            <div
              style={{
                padding: '10px 14px',
                border: '1px solid var(--tp-border)',
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--tp-primary)',
                background: 'white',
              }}
            >
              English
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState<ProfileSection>('personal');

  function renderSection() {
    switch (activeSection) {
      case 'personal': return <PersonalInfoSection />;
      case 'security': return <SecuritySection />;
      case 'saved': return <SavedHotelsSection />;
      case 'payment': return <PaymentMethodsSection />;
      case 'notifications': return <NotificationsSection />;
      case 'preferences': return <PreferencesSection />;
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tp-bg)' }}>
      <TravelerNav />
      <div style={{ paddingTop: '64px' }} />

      <main>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '40px 16px' }} className="md:px-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: '16px' }}>
            <ol style={{ display: 'flex', alignItems: 'center', gap: '8px', listStyle: 'none', margin: 0, padding: 0, fontSize: '14px', color: 'var(--tp-secondary)' }}>
              <li><Link href="/" style={{ color: 'var(--tp-secondary)', textDecoration: 'none' }}>Home</Link></li>
              <li aria-hidden="true">/</li>
              <li style={{ color: 'var(--tp-primary)', fontWeight: 500 }}>My Profile</li>
            </ol>
          </nav>

          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--tp-primary)', margin: '0 0 24px' }}>
            My Profile
          </h1>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }} className="flex-col lg:flex-row">
            {/* Sidebar nav */}
            <aside
              style={{
                width: '100%',
                background: 'white',
                border: '1px solid var(--tp-border)',
                borderRadius: '12px',
                padding: '8px',
                flexShrink: 0,
              }}
              className="lg:w-60"
              aria-label="Profile sections"
            >
              {NAV_ITEMS.map(item => {
                const isActive = activeSection === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveSection(item.key)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 400,
                      background: isActive ? 'var(--tp-accent-light)' : 'transparent',
                      color: isActive ? 'var(--tp-accent)' : 'var(--tp-primary)',
                      display: 'block',
                      marginBottom: '2px',
                      transition: 'background 0.15s',
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                );
              })}
            </aside>

            {/* Content area */}
            <div
              style={{
                flex: 1,
                background: 'white',
                border: '1px solid var(--tp-border)',
                borderRadius: '12px',
                padding: '32px',
                minWidth: 0,
              }}
            >
              {renderSection()}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
