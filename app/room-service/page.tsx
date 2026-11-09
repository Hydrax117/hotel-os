'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TravelerNav } from '../components/TravelerNav';
import { Footer } from '../components/Footer';
import { useAuth } from '../lib/auth-context';
import {
  getPublicVenues,
  placeOrder,
  type ServiceVenue,
  type MenuItem,
  type ServiceVenueType,
} from '../lib/api/room-service';
import { ApiError } from '../lib/api/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNgn(n: number) {
  return '₦' + Number(n).toLocaleString('en-NG');
}

const VENUE_ICONS: Record<ServiceVenueType, string> = {
  RESTAURANT: '🍽',
  BAR: '🍺',
  CAFE: '☕',
  ROOM_SERVICE: '🛎',
  OTHER: '🏨',
};

// ── Cart ──────────────────────────────────────────────────────────────────────

type CartItem = {
  menuItem: MenuItem;
  quantity: number;
};

function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  function addItem(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (existing) {
        return prev.map(c =>
          c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  }

  function removeItem(itemId: string) {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === itemId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter(c => c.menuItem.id !== itemId);
      return prev.map(c =>
        c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c,
      );
    });
  }

  function clearCart() { setCart([]); }

  const total = cart.reduce((sum, c) => sum + Number(c.menuItem.priceNgn) * c.quantity, 0);
  const count = cart.reduce((sum, c) => sum + c.quantity, 0);

  return { cart, addItem, removeItem, clearCart, total, count };
}

// ── Components ────────────────────────────────────────────────────────────────

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      aria-hidden="true" style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

function MenuItemCard({
  item,
  qty,
  onAdd,
  onRemove,
}: {
  item: MenuItem;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--tp-border)', borderRadius: 12,
      padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      gap: 12,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tp-primary)', marginBottom: 4 }}>
          {item.name}
        </div>
        {item.description && (
          <div style={{ fontSize: 12, color: 'var(--tp-secondary)', marginBottom: 6 }}>
            {item.description}
          </div>
        )}
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tp-accent)' }}>
          {fmtNgn(Number(item.priceNgn))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {qty > 0 ? (
          <>
            <button
              type="button" onClick={onRemove}
              aria-label={`Remove one ${item.name}`}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1px solid var(--tp-border)', background: 'white',
                color: 'var(--tp-primary)', fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >−</button>
            <span style={{ fontWeight: 700, fontSize: 15, minWidth: 20, textAlign: 'center' }}>{qty}</span>
          </>
        ) : null}
        <button
          type="button" onClick={onAdd}
          aria-label={`Add ${item.name} to order`}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--tp-accent)', border: 'none',
            color: 'white', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >+</button>
      </div>
    </div>
  );
}

// ── Main inner component ──────────────────────────────────────────────────────

function RoomServiceInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const bookingId = searchParams.get('bookingId') ?? '';
  const hotelId = searchParams.get('hotelId') ?? '';

  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<ServiceVenue[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<ServiceVenue | null>(null);
  const [notes, setNotes] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState('');

  const { cart, addItem, removeItem, clearCart, total, count } = useCart();

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/signin?redirect=/room-service');
  }, [authLoading, user, router]);

  // Load venues
  useEffect(() => {
    if (!hotelId) return;
    getPublicVenues(hotelId)
      .then(res => {
        setEnabled(res.enabled);
        setVenues(res.venues);
        if (res.venues.length > 0) setSelectedVenue(res.venues[0]);
      })
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false));
  }, [hotelId]);

  async function handlePlaceOrder() {
    if (!selectedVenue || cart.length === 0 || !bookingId) return;
    setOrdering(true);
    setOrderError('');
    try {
      const result = await placeOrder({
        bookingId,
        venueId: selectedVenue.id,
        items: cart.map(c => ({ menuItemId: c.menuItem.id, quantity: c.quantity })),
        notes: notes.trim() || undefined,
        roomNumber: roomNumber.trim() || undefined,
        callbackUrl: `${window.location.origin}/room-service/confirm`,
      });
      clearCart();
      window.location.href = result.paymentUrl;
    } catch (err) {
      setOrderError(err instanceof ApiError ? err.message : 'Failed to place order');
      setOrdering(false);
    }
  }

  // Group menu items by category
  const menuByCategory = selectedVenue
    ? selectedVenue.menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
        (acc[item.category] ??= []).push(item);
        return acc;
      }, {})
    : {};

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--tp-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!bookingId || !hotelId) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--tp-bg)' }}>
        <TravelerNav />
        <div style={{ paddingTop: 64 }} />
        <main style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--tp-secondary)' }}>Invalid room service link.</p>
          <Link href="/bookings" style={{ color: 'var(--tp-accent)', fontWeight: 600, textDecoration: 'none' }}>
            ← Back to bookings
          </Link>
        </main>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--tp-bg)' }}>
        <TravelerNav />
        <div style={{ paddingTop: 64 }} />
        <main style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--tp-primary)', marginBottom: 12 }}>
            Room service not available
          </h2>
          <p style={{ color: 'var(--tp-secondary)', marginBottom: 24 }}>
            This hotel has not enabled room service ordering yet.
          </p>
          <Link href="/bookings" style={{ color: 'var(--tp-accent)', fontWeight: 600, textDecoration: 'none' }}>
            ← Back to bookings
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tp-bg)' }}>
      <TravelerNav />
      <div style={{ paddingTop: 64 }} />

      <main style={{ padding: '32px 16px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: 20 }}>
            <ol style={{ display: 'flex', alignItems: 'center', gap: 8, listStyle: 'none', margin: 0, padding: 0, fontSize: 14, color: 'var(--tp-secondary)' }}>
              <li><Link href="/bookings" style={{ color: 'var(--tp-secondary)', textDecoration: 'none' }}>My Bookings</Link></li>
              <li aria-hidden="true">/</li>
              <li style={{ color: 'var(--tp-primary)', fontWeight: 500 }}>Room Service</li>
            </ol>
          </nav>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--tp-primary)', margin: '0 0 6px' }}>
            Room Service
          </h1>
          <p style={{ fontSize: 14, color: 'var(--tp-secondary)', margin: '0 0 24px' }}>
            Order food, drinks, and more directly to your room.
          </p>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Left column: venue tabs + menu */}
            <div style={{ flex: '1 1 480px', minWidth: 0 }}>

              {/* Venue selector */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                {venues.map(venue => (
                  <button
                    key={venue.id}
                    type="button"
                    onClick={() => { setSelectedVenue(venue); clearCart(); }}
                    style={{
                      padding: '8px 16px', borderRadius: 999, fontSize: 14, fontWeight: 500,
                      border: '1px solid',
                      borderColor: selectedVenue?.id === venue.id ? 'var(--tp-accent)' : 'var(--tp-border)',
                      background: selectedVenue?.id === venue.id ? 'var(--tp-accent)' : 'white',
                      color: selectedVenue?.id === venue.id ? 'white' : 'var(--tp-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {VENUE_ICONS[venue.type]} {venue.name}
                  </button>
                ))}
              </div>

              {selectedVenue && (
                <>
                  {selectedVenue.description && (
                    <p style={{ fontSize: 13, color: 'var(--tp-secondary)', marginBottom: 20 }}>
                      {selectedVenue.description}
                    </p>
                  )}

                  {Object.entries(menuByCategory).map(([category, items]) => (
                    <div key={category} style={{ marginBottom: 28 }}>
                      <h2 style={{
                        fontSize: 13, fontWeight: 700, color: '#9ca3af',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        marginBottom: 12,
                      }}>
                        {category}
                      </h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {items.map(item => (
                          <MenuItemCard
                            key={item.id}
                            item={item}
                            qty={cart.find(c => c.menuItem.id === item.id)?.quantity ?? 0}
                            onAdd={() => addItem(item)}
                            onRemove={() => removeItem(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {Object.keys(menuByCategory).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--tp-secondary)' }}>
                      No items available in this venue right now.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right column: order summary */}
            <div style={{ flex: '0 0 300px', position: 'sticky', top: 80 }}>
              <div style={{
                background: 'white', border: '1px solid var(--tp-border)', borderRadius: 16,
                padding: 24,
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--tp-primary)', margin: '0 0 16px' }}>
                  Your order {count > 0 && <span style={{ fontSize: 12, background: 'var(--tp-accent)', color: 'white', borderRadius: 999, padding: '2px 8px', marginLeft: 6 }}>{count}</span>}
                </h3>

                {cart.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--tp-secondary)', textAlign: 'center', padding: '16px 0' }}>
                    Add items from the menu
                  </p>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      {cart.map(c => (
                        <div key={c.menuItem.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: 'var(--tp-primary)' }}>
                            {c.quantity}× {c.menuItem.name}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--tp-primary)' }}>
                            {fmtNgn(Number(c.menuItem.priceNgn) * c.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid var(--tp-border)', paddingTop: 12, marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
                        <span>Total</span>
                        <span style={{ color: 'var(--tp-accent)' }}>{fmtNgn(total)}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    <div style={{ marginBottom: 12 }}>
                      <label htmlFor="orderNotes" style={{ fontSize: 12, fontWeight: 600, color: 'var(--tp-primary)', display: 'block', marginBottom: 4 }}>
                        Special requests (optional)
                      </label>
                      <textarea
                        id="orderNotes"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                        placeholder="e.g. No onions, extra ice…"
                        style={{
                          width: '100%', padding: '8px 10px',
                          border: '1px solid var(--tp-border)', borderRadius: 8,
                          fontSize: 13, color: 'var(--tp-primary)', resize: 'none',
                          fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Room number */}
                    <div style={{ marginBottom: 16 }}>
                      <label htmlFor="roomNumber" style={{ fontSize: 12, fontWeight: 600, color: 'var(--tp-primary)', display: 'block', marginBottom: 4 }}>
                        Room number (optional)
                      </label>
                      <input
                        id="roomNumber"
                        type="text"
                        value={roomNumber}
                        onChange={e => setRoomNumber(e.target.value)}
                        placeholder="e.g. 204"
                        style={{
                          width: '100%', padding: '8px 10px',
                          border: '1px solid var(--tp-border)', borderRadius: 8,
                          fontSize: 13, color: 'var(--tp-primary)', outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {orderError && (
                      <div role="alert" style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 12 }}>
                        {orderError}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => { void handlePlaceOrder(); }}
                      disabled={ordering}
                      style={{
                        width: '100%', padding: '13px',
                        background: ordering ? '#9ca3af' : 'var(--tp-accent)',
                        color: 'white', border: 'none', borderRadius: 10,
                        fontSize: 14, fontWeight: 700,
                        cursor: ordering ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      {ordering && <Spinner />}
                      {ordering ? 'Redirecting…' : `Pay ${fmtNgn(total)}`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function RoomServicePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--tp-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3d6b4f" strokeWidth="2"
          style={{ animation: 'spin 0.8s linear infinite' }}>
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </svg>
      </div>
    }>
      <RoomServiceInner />
    </Suspense>
  );
}
