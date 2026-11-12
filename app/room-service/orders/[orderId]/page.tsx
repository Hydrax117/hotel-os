'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TravelerNav } from '../../../components/TravelerNav';
import { Footer } from '../../../components/Footer';
import { useAuth } from '../../../lib/auth-context';
import {
  getOrder,
  type ServiceOrder,
  type ServiceOrderStatus,
} from '../../../lib/api/room-service';
import { ApiError } from '../../../lib/api/client';
import { io } from 'socket.io-client';

// ── Status config ─────────────────────────────────────────────────────────────

type StepDef = {
  key: ServiceOrderStatus;
  label: string;
  icon: string;
  description: string;
};

const STEPS: StepDef[] = [
  { key: 'PENDING',    label: 'Order placed',   icon: '📋', description: 'Your order has been received and is awaiting confirmation.' },
  { key: 'CONFIRMED',  label: 'Confirmed',      icon: '✅', description: 'The venue has confirmed your order.' },
  { key: 'PREPARING',  label: 'Preparing',      icon: '👨‍🍳', description: 'Your order is being prepared.' },
  { key: 'DELIVERED',  label: 'Delivered',      icon: '🛎',  description: 'Your order has been delivered. Enjoy!' },
];

const STATUS_ORDER: ServiceOrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERED'];

function getStepIndex(status: ServiceOrderStatus): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

const STATUS_COLOR: Record<ServiceOrderStatus, { bg: string; text: string }> = {
  PENDING:   { bg: '#fef9c3', text: '#92400e' },
  CONFIRMED: { bg: '#dbeafe', text: '#1d4ed8' },
  PREPARING: { bg: '#fef3c7', text: '#d97706' },
  DELIVERED: { bg: '#dcfce7', text: '#15803d' },
  CANCELLED: { bg: '#fee2e2', text: '#b91c1c' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNgn(n: number) {
  return '₦' + Number(n).toLocaleString('en-NG');
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NG', {
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3d6b4f" strokeWidth="2"
      style={{ animation: 'spin 0.8s linear infinite', display: 'block' }}>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

// ── Progress stepper ─────────────────────────────────────────────────────────

function StatusStepper({ status }: { status: ServiceOrderStatus }) {
  if (status === 'CANCELLED') {
    return (
      <div style={{
        background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12,
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 24 }}>❌</span>
        <div>
          <p style={{ fontWeight: 700, color: '#b91c1c', margin: 0 }}>Order cancelled</p>
          <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 0' }}>
            This order was cancelled. Contact the venue if you need assistance.
          </p>
        </div>
      </div>
    );
  }

  const currentIdx = getStepIndex(status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {STEPS.map((step, idx) => {
        const done    = idx < currentIdx;
        const active  = idx === currentIdx;
        const upcoming = idx > currentIdx;
        const isLast  = idx === STEPS.length - 1;

        return (
          <div key={step.key} style={{ display: 'flex', gap: 16 }}>
            {/* Timeline column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
              {/* Circle */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                background: done ? '#dcfce7' : active ? '#3d6b4f' : '#f3f4f6',
                border: `2px solid ${done ? '#86efac' : active ? '#3d6b4f' : '#e5e7eb'}`,
                transition: 'all 0.3s',
              }}>
                {done ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span style={{ filter: upcoming ? 'grayscale(1) opacity(0.4)' : 'none' }}>
                    {step.icon}
                  </span>
                )}
              </div>
              {/* Connector line */}
              {!isLast && (
                <div style={{
                  width: 2, flex: 1, minHeight: 24,
                  background: done ? '#86efac' : '#e5e7eb',
                  transition: 'background 0.3s',
                  margin: '4px 0',
                }} />
              )}
            </div>

            {/* Text */}
            <div style={{ paddingBottom: isLast ? 0 : 24, paddingTop: 8 }}>
              <p style={{
                fontWeight: active ? 700 : 600,
                fontSize: 15,
                color: upcoming ? '#9ca3af' : active ? '#111' : '#16a34a',
                margin: '0 0 3px',
              }}>
                {step.label}
                {active && (
                  <span style={{
                    marginLeft: 8, fontSize: 11, fontWeight: 600,
                    background: '#fef9c3', color: '#92400e',
                    padding: '2px 8px', borderRadius: 999,
                  }}>
                    Current
                  </span>
                )}
              </p>
              <p style={{ fontSize: 13, color: upcoming ? '#d1d5db' : '#6b7280', margin: 0 }}>
                {step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function OrderTrackingInner() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const orderId = typeof params.orderId === 'string' ? params.orderId : '';

  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveStatus, setLiveStatus] = useState<ServiceOrderStatus | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/auth/signin?redirect=/room-service/orders/${orderId}`);
    }
  }, [authLoading, user, router, orderId]);

  // Fetch order
  const fetchOrder = useCallback(() => {
    if (!orderId) return;
    setLoading(true);
    getOrder(orderId)
      .then(o => {
        setOrder(o);
        setLiveStatus(o.status);
      })
      .catch(err => {
        setError(err instanceof ApiError ? err.message : 'Failed to load order.');
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Real-time status via Socket.IO
  useEffect(() => {
    if (!order?.venue) return;

    const WS_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
    const socket = io(`${WS_URL}/notifications`, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      // Join the hotel room so we receive its events
      if (order.bookingId) {
        socket.emit('join-order', { orderId: order.id });
      }
    });

    socket.on('order-status-updated', (payload: { orderId: string; status: ServiceOrderStatus }) => {
      if (payload.orderId === order.id) {
        setLiveStatus(payload.status);
      }
    });

    return () => { socket.disconnect(); };
  }, [order]);

  const displayStatus = liveStatus ?? order?.status ?? 'PENDING';

  // ── Render states ───────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--tp-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Spinner />
        <p style={{ color: 'var(--tp-secondary)', fontSize: 14 }}>Loading order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--tp-bg)' }}>
        <TravelerNav />
        <div style={{ paddingTop: 64 }} />
        <main style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--tp-primary)', marginBottom: 10 }}>
            Order not found
          </h1>
          <p style={{ color: 'var(--tp-secondary)', marginBottom: 28 }}>
            {error || 'This order does not exist or you do not have permission to view it.'}
          </p>
          <Link
            href="/bookings"
            style={{
              background: '#3d6b4f', color: 'white', padding: '11px 24px',
              borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Back to My Bookings
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const statusColors = STATUS_COLOR[displayStatus] ?? STATUS_COLOR.PENDING;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--tp-bg)' }}>
      <TravelerNav />
      <div style={{ paddingTop: 64 }} />

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px 64px' }}>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: 24 }}>
          <ol style={{ display: 'flex', alignItems: 'center', gap: 8, listStyle: 'none', margin: 0, padding: 0, fontSize: 13, color: 'var(--tp-secondary)' }}>
            <li><Link href="/bookings" style={{ color: 'var(--tp-secondary)', textDecoration: 'none' }}>My Bookings</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href={`/room-service?bookingId=${order.bookingId}&hotelId=${order.venue?.name ?? ''}`} style={{ color: 'var(--tp-secondary)', textDecoration: 'none' }}>Room Service</Link></li>
            <li aria-hidden="true">/</li>
            <li style={{ color: 'var(--tp-primary)', fontWeight: 500 }}>Track Order</li>
          </ol>
        </nav>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--tp-primary)', margin: '0 0 6px' }}>
              Track your order
            </h1>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
              Ref: {order.reference} · {fmtTime(order.createdAt)}
            </p>
          </div>
          <span style={{
            display: 'inline-block',
            background: statusColors.bg, color: statusColors.text,
            borderRadius: 999, padding: '5px 14px',
            fontSize: 13, fontWeight: 700,
            flexShrink: 0,
          }}>
            {displayStatus.charAt(0) + displayStatus.slice(1).toLowerCase()}
          </span>
        </div>

        {/* Live status indicator */}
        {displayStatus !== 'DELIVERED' && displayStatus !== 'CANCELLED' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 10, padding: '10px 16px', marginBottom: 24,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0,
              animation: 'pulse-green 1.5s ease-in-out infinite',
            }} />
            <p style={{ fontSize: 13, color: '#15803d', margin: 0 }}>
              Live updates enabled — this page updates automatically when your order status changes.
            </p>
          </div>
        )}

        {/* Status stepper */}
        <div style={{
          background: 'white', border: '1px solid var(--tp-border)',
          borderRadius: 16, padding: 24, marginBottom: 20,
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--tp-primary)', margin: '0 0 20px' }}>
            Order status
          </h2>
          <StatusStepper status={displayStatus} />
        </div>

        {/* Order summary */}
        <div style={{
          background: 'white', border: '1px solid var(--tp-border)',
          borderRadius: 16, padding: 24, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--tp-primary)', margin: 0 }}>
              Order summary
            </h2>
            {order.venue && (
              <span style={{ fontSize: 13, color: 'var(--tp-secondary)' }}>
                {order.venue.name}
              </span>
            )}
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {order.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--tp-primary)' }}>
                    {item.quantity}× {item.menuItem?.name ?? 'Item'}
                  </span>
                  {item.menuItem?.category && (
                    <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>
                      {item.menuItem.category}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tp-primary)' }}>
                  {fmtNgn(Number(item.lineTotal))}
                </span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--tp-border)', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
              <span>Total</span>
              <span style={{ color: 'var(--tp-accent)' }}>{fmtNgn(Number(order.totalNgn))}</span>
            </div>
          </div>

          {/* Notes / room number */}
          {(order.notes || order.roomNumber) && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--tp-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {order.roomNumber && (
                <p style={{ fontSize: 13, color: 'var(--tp-secondary)', margin: 0 }}>
                  <strong>Room:</strong> {order.roomNumber}
                </p>
              )}
              {order.notes && (
                <p style={{ fontSize: 13, color: 'var(--tp-secondary)', margin: 0 }}>
                  <strong>Notes:</strong> {order.notes}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link
            href="/bookings"
            style={{
              background: '#3d6b4f', color: 'white', padding: '11px 24px',
              borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Back to My Bookings
          </Link>
          <button
            type="button"
            onClick={fetchOrder}
            style={{
              border: '1px solid var(--tp-border)', background: 'white',
              color: 'var(--tp-primary)', padding: '11px 24px',
              borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Refresh status
          </button>
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes pulse-green {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

export default function OrderTrackingPage() {
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
      <OrderTrackingInner />
    </Suspense>
  );
}
