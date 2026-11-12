'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../lib/auth-context';
import type { ServiceOrderStatus } from '../lib/api/room-service';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

type Toast = {
  id: string;
  orderId: string;
  reference?: string;
  status: ServiceOrderStatus;
  venueName?: string;
  timestamp: number;
};

type NotifContextValue = {
  toasts: Toast[];
  dismiss: (id: string) => void;
};

// ── Status display ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ServiceOrderStatus, string> = {
  PENDING:   'Order received',
  CONFIRMED: 'Order confirmed ✅',
  PREPARING: 'Being prepared 👨‍🍳',
  DELIVERED: 'Order delivered 🛎',
  CANCELLED: 'Order cancelled',
};

const STATUS_COLOR: Record<ServiceOrderStatus, { bg: string; border: string; text: string; accent: string }> = {
  PENDING:   { bg: '#fefce8', border: '#fde68a', text: '#78350f', accent: '#d97706' },
  CONFIRMED: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a', accent: '#2563eb' },
  PREPARING: { bg: '#fffbeb', border: '#fde68a', text: '#78350f', accent: '#f59e0b' },
  DELIVERED: { bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d', accent: '#16a34a' },
  CANCELLED: { bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d', accent: '#dc2626' },
};

// ── Context ───────────────────────────────────────────────────────────────────

const NotifContext = createContext<NotifContextValue>({ toasts: [], dismiss: () => {} });

export function useNotifications() {
  return useContext(NotifContext);
}

// ── Toast component ───────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const colors = STATUS_COLOR[toast.status] ?? STATUS_COLOR.PENDING;

  // Auto-dismiss after 8 s (12 s for DELIVERED)
  useEffect(() => {
    const delay = toast.status === 'DELIVERED' ? 12000 : 8000;
    const timer = setTimeout(onDismiss, delay);
    return () => clearTimeout(timer);
  }, [toast.status, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        maxWidth: 360,
        width: '100%',
        animation: 'slide-in 0.25s ease-out',
      }}
    >
      {/* Icon dot */}
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        background: colors.accent, flexShrink: 0, marginTop: 4,
      }} />

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: colors.text, margin: '0 0 2px' }}>
          Room Service Update
        </p>
        <p style={{ fontSize: 13, color: colors.text, margin: '0 0 6px', opacity: 0.85 }}>
          {STATUS_LABEL[toast.status]}
          {toast.venueName ? ` · ${toast.venueName}` : ''}
        </p>
        <Link
          href={`/room-service/orders/${toast.orderId}`}
          style={{ fontSize: 12, fontWeight: 600, color: colors.accent, textDecoration: 'none' }}
          onClick={onDismiss}
        >
          Track order →
        </Link>
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: colors.text, opacity: 0.5, padding: 0, flexShrink: 0,
          fontSize: 18, lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Connect once user is known, disconnect on sign-out
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    // Avoid duplicate connections
    if (socketRef.current?.connected) return;

    const WS_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
    const socket = io(`${WS_URL}/notifications`, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });

    socket.on('connect', () => {
      // Join the user-scoped room so we receive personal notifications
      socket.emit('join-user', { userId: user.id });
    });

    socket.on('order-status-updated', (payload: {
      orderId?: string;
      status?: ServiceOrderStatus;
      venueName?: string;
      reference?: string;
    }) => {
      if (!payload.orderId || !payload.status) return;
      // Don't toast for PENDING (initial state, user already sees confirm page)
      if (payload.status === 'PENDING') return;

      setToasts(prev => {
        // Replace existing toast for the same order (avoid stacking)
        const without = prev.filter(t => t.orderId !== payload.orderId);
        return [
          ...without,
          {
            id: `${payload.orderId}-${Date.now()}`,
            orderId: payload.orderId!,
            status: payload.status!,
            venueName: payload.venueName,
            reference: payload.reference,
            timestamp: Date.now(),
          },
        ];
      });

      // Browser Notification API (if permission granted)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Room Service Update', {
          body: STATUS_LABEL[payload.status!] + (payload.venueName ? ` · ${payload.venueName}` : ''),
          icon: '/favicon-32x32.png',
        });
      }
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, isLoading]);

  return (
    <NotifContext.Provider value={{ toasts, dismiss }}>
      {children}

      {/* Toast tray — bottom-right */}
      {toasts.length > 0 && (
        <div
          aria-label="Notifications"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'flex-end',
          }}
        >
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </NotifContext.Provider>
  );
}
