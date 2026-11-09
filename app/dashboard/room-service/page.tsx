'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { getMyHotel } from '../../lib/api/dashboard';
import {
  getHotelVenues,
  getHotelOrders,
  createVenue,
  updateVenue,
  deleteVenue,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleRoomService,
  updateOrderStatus,
  type ServiceVenue,
  type MenuItem,
  type ServiceOrder,
  type ServiceVenueType,
  type ServiceOrderStatus,
} from '../../lib/api/room-service';
import { ApiError } from '../../lib/api/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNgn(n: number) { return '₦' + Number(n).toLocaleString('en-NG'); }

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const VENUE_TYPE_LABELS: Record<ServiceVenueType, string> = {
  RESTAURANT: '🍽 Restaurant',
  BAR: '🍺 Bar',
  CAFE: '☕ Café',
  ROOM_SERVICE: '🛎 Room Service',
  OTHER: '🏨 Other',
};

const ORDER_STATUS_COLORS: Record<ServiceOrderStatus, { bg: string; color: string }> = {
  PENDING:   { bg: '#fef9c3', color: '#92400e' },
  CONFIRMED: { bg: '#dbeafe', color: '#1d4ed8' },
  PREPARING: { bg: '#fef3c7', color: '#b45309' },
  DELIVERED: { bg: '#dcfce7', color: '#15803d' },
  CANCELLED: { bg: '#fee2e2', color: '#dc2626' },
};

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      aria-hidden="true" style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block' }}>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </svg>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <div
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 999, cursor: 'pointer',
          background: checked ? '#3d6b4f' : '#d1d5db',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%', background: 'white',
          transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{label}</span>
    </label>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'orders' | 'venues';

export default function DashboardRoomServicePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [hotelId, setHotelId] = useState('');
  const [roomServiceEnabled, setRoomServiceEnabled] = useState(false);
  const [venues, setVenues] = useState<ServiceVenue[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('orders');
  const [selectedVenue, setSelectedVenue] = useState<ServiceVenue | null>(null);
  const [error, setError] = useState('');

  // Venue form
  const [showVenueForm, setShowVenueForm] = useState(false);
  const [venueForm, setVenueForm] = useState({ name: '', type: 'RESTAURANT' as ServiceVenueType, description: '' });
  const [savingVenue, setSavingVenue] = useState(false);

  // Menu item form
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({ name: '', description: '', category: '', priceNgn: '', isAvailable: true });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState(false);

  // Auth
  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/signin');
  }, [authLoading, user, router]);

  // Load hotel + venues + orders
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const hotel = await getMyHotel();
      if (!hotel) { setError('No hotel found.'); return; }
      setHotelId(hotel.id);
      setRoomServiceEnabled((hotel as typeof hotel & { roomServiceEnabled?: boolean }).roomServiceEnabled ?? false);

      const [v, o] = await Promise.allSettled([
        getHotelVenues(hotel.id),
        getHotelOrders(hotel.id),
      ]);
      if (v.status === 'fulfilled') { setVenues(v.value); if (v.value.length) setSelectedVenue(v.value[0]); }
      if (o.status === 'fulfilled') setOrders(o.value);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) void load(); }, [user, load]);

  // Toggle room service
  async function handleToggle(enabled: boolean) {
    try {
      await toggleRoomService(hotelId, enabled);
      setRoomServiceEnabled(enabled);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to toggle');
    }
  }

  // Save venue
  async function handleSaveVenue(e: React.FormEvent) {
    e.preventDefault();
    setSavingVenue(true);
    try {
      await createVenue(hotelId, venueForm);
      setShowVenueForm(false);
      setVenueForm({ name: '', type: 'RESTAURANT', description: '' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save venue');
    } finally {
      setSavingVenue(false);
    }
  }

  // Toggle venue active
  async function handleToggleVenue(venue: ServiceVenue) {
    try {
      await updateVenue(venue.id, { isActive: !venue.isActive });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update venue');
    }
  }

  // Delete venue
  async function handleDeleteVenue(venueId: string) {
    if (!confirm('Delete this venue and all its menu items?')) return;
    try {
      await deleteVenue(venueId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete venue');
    }
  }

  // Save menu item
  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVenue) return;
    setSavingItem(true);
    const data = {
      name: itemForm.name,
      description: itemForm.description || undefined,
      category: itemForm.category,
      priceNgn: parseFloat(itemForm.priceNgn),
      isAvailable: itemForm.isAvailable,
    };
    try {
      if (editingItemId) {
        await updateMenuItem(editingItemId, data);
      } else {
        await createMenuItem(selectedVenue.id, data);
      }
      setShowItemForm(false);
      setEditingItemId(null);
      setItemForm({ name: '', description: '', category: '', priceNgn: '', isAvailable: true });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save item');
    } finally {
      setSavingItem(false);
    }
  }

  function startEditItem(item: MenuItem) {
    setEditingItemId(item.id);
    setItemForm({
      name: item.name,
      description: item.description ?? '',
      category: item.category,
      priceNgn: String(Number(item.priceNgn)),
      isAvailable: item.isAvailable,
    });
    setShowItemForm(true);
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('Remove this menu item?')) return;
    try {
      await deleteMenuItem(itemId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete item');
    }
  }

  // Update order status
  async function handleOrderStatus(orderId: string, status: ServiceOrderStatus) {
    try {
      await updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update order');
    }
  }

  const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const pastOrders = orders.filter(o => o.status === 'DELIVERED' || o.status === 'CANCELLED');

  if (authLoading || loading) {
    return (
      <div style={{ padding: 32, display: 'flex', alignItems: 'center', gap: 12, color: '#6b7280' }}>
        <Spinner size={24} /> Loading…
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>Room Service</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            Manage venues, menus, and incoming orders from guests.
          </p>
        </div>
        <Toggle
          checked={roomServiceEnabled}
          onChange={v => { void handleToggle(v); }}
          label={roomServiceEnabled ? 'Room service enabled' : 'Room service disabled'}
        />
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>
          {error}
          <button type="button" onClick={() => setError('')} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</button>
        </div>
      )}

      {!roomServiceEnabled && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 12, padding: '16px 20px', marginBottom: 24, fontSize: 14, color: '#92400e' }}>
          Room service is currently <strong>disabled</strong>. Enable it above to start receiving orders from guests.
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 24, gap: 4 }}>
        {(['orders', 'venues'] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
              borderRadius: '8px 8px 0 0',
              background: tab === t ? '#3d6b4f' : 'transparent',
              color: tab === t ? 'white' : '#6b7280',
            }}
          >
            {t === 'orders' ? `Orders${activeOrders.length ? ` (${activeOrders.length})` : ''}` : 'Venues & Menu'}
          </button>
        ))}
      </div>

      {/* ── ORDERS TAB ── */}
      {tab === 'orders' && (
        <div>
          {activeOrders.length === 0 && pastOrders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛎</div>
              <div style={{ fontSize: 16 }}>No orders yet</div>
            </div>
          )}

          {activeOrders.length > 0 && (
            <>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Active orders
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {activeOrders.map(order => (
                  <OrderCard key={order.id} order={order} onStatusChange={handleOrderStatus} />
                ))}
              </div>
            </>
          )}

          {pastOrders.length > 0 && (
            <>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Past orders
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pastOrders.map(order => (
                  <OrderCard key={order.id} order={order} onStatusChange={handleOrderStatus} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── VENUES & MENU TAB ── */}
      {tab === 'venues' && (
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Venue list */}
          <div style={{ flex: '0 0 240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Venues</span>
              <button
                type="button"
                onClick={() => setShowVenueForm(true)}
                style={{
                  background: '#3d6b4f', color: 'white', border: 'none', borderRadius: 6,
                  fontSize: 12, fontWeight: 600, padding: '5px 10px', cursor: 'pointer',
                }}
              >
                + Add
              </button>
            </div>

            {showVenueForm && (
              <form onSubmit={e => { void handleSaveVenue(e); }}
                style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <input
                  required placeholder="Venue name"
                  value={venueForm.name}
                  onChange={e => setVenueForm(v => ({ ...v, name: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}
                />
                <select
                  value={venueForm.type}
                  onChange={e => setVenueForm(v => ({ ...v, type: e.target.value as ServiceVenueType }))}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}
                >
                  {Object.entries(VENUE_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <textarea
                  placeholder="Description (optional)"
                  value={venueForm.description}
                  onChange={e => setVenueForm(v => ({ ...v, description: e.target.value }))}
                  rows={2}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, resize: 'none', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={savingVenue}
                    style={{ flex: 1, background: '#3d6b4f', color: 'white', border: 'none', borderRadius: 6, fontSize: 13, padding: '7px', cursor: savingVenue ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    {savingVenue && <Spinner />} Save
                  </button>
                  <button type="button" onClick={() => setShowVenueForm(false)}
                    style={{ flex: 1, background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, padding: '7px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {venues.map(venue => (
                <div
                  key={venue.id}
                  onClick={() => setSelectedVenue(venue)}
                  style={{
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                    border: '1px solid',
                    borderColor: selectedVenue?.id === venue.id ? '#3d6b4f' : '#e5e7eb',
                    background: selectedVenue?.id === venue.id ? '#f0fdf4' : 'white',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#111' }}>{venue.name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{VENUE_TYPE_LABELS[venue.type]}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); void handleToggleVenue(venue); }}
                      title={venue.isActive ? 'Disable' : 'Enable'}
                      style={{
                        width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 11,
                        background: venue.isActive ? '#dcfce7' : '#f3f4f6',
                        color: venue.isActive ? '#15803d' : '#9ca3af',
                      }}
                    >
                      {venue.isActive ? '✓' : '○'}
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); void handleDeleteVenue(venue.id); }}
                      title="Delete"
                      style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 14, background: '#fee2e2', color: '#dc2626' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              {venues.length === 0 && !showVenueForm && (
                <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>
                  No venues yet. Add one to get started.
                </p>
              )}
            </div>
          </div>

          {/* Menu items */}
          {selectedVenue && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: 0 }}>
                  {selectedVenue.name} — Menu
                </h2>
                <button
                  type="button"
                  onClick={() => { setEditingItemId(null); setItemForm({ name: '', description: '', category: '', priceNgn: '', isAvailable: true }); setShowItemForm(true); }}
                  style={{ background: '#3d6b4f', color: 'white', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, padding: '7px 14px', cursor: 'pointer' }}
                >
                  + Add item
                </button>
              </div>

              {showItemForm && (
                <form onSubmit={e => { void handleSaveItem(e); }}
                  style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: '0 0 14px' }}>
                    {editingItemId ? 'Edit item' : 'New menu item'}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Name *</label>
                      <input
                        required value={itemForm.name}
                        onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Category *</label>
                      <input
                        required placeholder="e.g. Starters, Drinks"
                        value={itemForm.category}
                        onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Price (₦) *</label>
                      <input
                        required type="number" min="1" step="0.01"
                        value={itemForm.priceNgn}
                        onChange={e => setItemForm(f => ({ ...f, priceNgn: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', paddingTop: 20 }}>
                      <Toggle
                        checked={itemForm.isAvailable}
                        onChange={v => setItemForm(f => ({ ...f, isAvailable: v }))}
                        label="Available"
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Description</label>
                    <textarea
                      value={itemForm.description}
                      onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))}
                      rows={2}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" disabled={savingItem}
                      style={{ background: '#3d6b4f', color: 'white', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, padding: '9px 20px', cursor: savingItem ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {savingItem && <Spinner />} {editingItemId ? 'Save changes' : 'Add item'}
                    </button>
                    <button type="button" onClick={() => { setShowItemForm(false); setEditingItemId(null); }}
                      style={{ background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, padding: '9px 20px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Menu items grouped by category */}
              {(() => {
                const byCategory = selectedVenue.menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
                  (acc[item.category] ??= []).push(item);
                  return acc;
                }, {});
                return Object.entries(byCategory).map(([cat, items]) => (
                  <div key={cat} style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{cat}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {items.map(item => (
                        <div key={item.id} style={{
                          background: 'white', border: '1px solid #e5e7eb', borderRadius: 10,
                          padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{item.name}</span>
                              {!item.isAvailable && (
                                <span style={{ fontSize: 11, background: '#f3f4f6', color: '#9ca3af', borderRadius: 999, padding: '1px 6px' }}>Unavailable</span>
                              )}
                            </div>
                            {item.description && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{item.description}</div>}
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#3d6b4f', flexShrink: 0 }}>{fmtNgn(Number(item.priceNgn))}</span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button type="button" onClick={() => startEditItem(item)}
                              style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer', color: '#374151' }}>
                              Edit
                            </button>
                            <button type="button" onClick={() => { void handleDeleteItem(item.id); }}
                              style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer', color: '#dc2626' }}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}

              {selectedVenue.menuItems.length === 0 && !showItemForm && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                  No menu items yet. Add your first item above.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Order card ─────────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onStatusChange,
}: {
  order: ServiceOrder;
  onStatusChange: (id: string, status: ServiceOrderStatus) => void;
}) {
  const sc = ORDER_STATUS_COLORS[order.status];
  const NEXT: Partial<Record<ServiceOrderStatus, ServiceOrderStatus>> = {
    CONFIRMED: 'PREPARING',
    PREPARING: 'DELIVERED',
  };
  const nextStatus = NEXT[order.status];

  return (
    <div style={{
      background: 'white', border: '1px solid #e5e7eb', borderRadius: 12,
      padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
      alignItems: 'flex-start', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
            {order.booking?.guestFirstName} {order.booking?.guestLastName}
          </span>
          <span style={{ fontSize: 11, ...sc, borderRadius: 999, padding: '2px 8px', fontWeight: 600 }}>
            {order.status}
          </span>
          {order.roomNumber && (
            <span style={{ fontSize: 11, background: '#f3f4f6', color: '#6b7280', borderRadius: 999, padding: '2px 8px' }}>
              Room {order.roomNumber}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
          {order.venue?.name} · {new Date(order.createdAt).toLocaleString('en-NG')}
        </div>
        <div style={{ fontSize: 13, color: '#374151' }}>
          {order.items.map(i => `${i.quantity}× ${i.menuItem?.name ?? 'Item'}`).join(', ')}
        </div>
        {order.notes && (
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, fontStyle: 'italic' }}>
            Note: {order.notes}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#3d6b4f' }}>
          ₦{Number(order.totalNgn).toLocaleString('en-NG')}
        </span>
        {nextStatus && (
          <button
            type="button"
            onClick={() => onStatusChange(order.id, nextStatus)}
            style={{
              background: '#3d6b4f', color: 'white', border: 'none', borderRadius: 8,
              fontSize: 12, fontWeight: 600, padding: '6px 14px', cursor: 'pointer',
            }}
          >
            Mark as {nextStatus.charAt(0) + nextStatus.slice(1).toLowerCase()}
          </button>
        )}
        {order.status === 'CONFIRMED' && (
          <button
            type="button"
            onClick={() => onStatusChange(order.id, 'CANCELLED')}
            style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12, cursor: 'pointer', padding: '4px 0' }}
          >
            Cancel order
          </button>
        )}
      </div>
    </div>
  );
}
