'use client';

import React, { useEffect, useState } from 'react';

// ── Icons ─────────────────────────────────────────────────────────────────────

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="#16a34a" strokeWidth="2" />
    <polyline points="8 12 11 15 16 9" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const XCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2" />
    <line x1="15" y1="9" x2="9" y2="15" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
    <line x1="9" y1="9" x2="15" y2="15" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const InfoCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="#1d4ed8" strokeWidth="2" />
    <line x1="12" y1="8" x2="12" y2="8" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="12" y1="12" x2="12" y2="16" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

type ToastProps = {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
};

// ── Component ─────────────────────────────────────────────────────────────────

const STYLES: Record<ToastType, { bg: string; color: string; border: string }> = {
  success: { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  error:   { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
  info:    { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircleIcon />,
  error:   <XCircleIcon />,
  info:    <InfoCircleIcon />,
};

export function Toast({ message, type = 'success', onClose, duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const style = STYLES[type];

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      // Give the fade-out animation time before calling onClose
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 12,
        border: `1px solid ${style.border}`,
        background: style.bg,
        color: style.color,
        fontSize: 14,
        fontWeight: 500,
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        maxWidth: 360,
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
      }}
    >
      <span style={{ flexShrink: 0 }}>{ICONS[type]}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: style.color,
          flexShrink: 0,
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          opacity: 0.7,
        }}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

type ToastState = { message: string; type: ToastType } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);

  const show = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const hide = () => setToast(null);

  return { toast, show, hide };
}
