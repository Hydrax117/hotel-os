'use client';

import React from 'react';
import type { BookingStatus } from '../types';

type StatusBadgeProps = {
  status: BookingStatus;
  size?: 'sm' | 'md';
};

const STATUS_CONFIG: Record<BookingStatus, { bg: string; color: string; dot: string; label: string }> = {
  pending:     { bg: 'var(--color-warning-bg)',  color: 'var(--color-warning-text)',  dot: '#d97706', label: 'Pending'     },
  confirmed:   { bg: 'var(--color-info-bg)',     color: 'var(--color-info-text)',     dot: '#2563eb', label: 'Confirmed'   },
  checked_in:  { bg: 'var(--color-success-bg)',  color: 'var(--color-success-text)',  dot: '#16a34a', label: 'Checked In'  },
  checked_out: { bg: 'var(--color-muted)',       color: 'var(--color-text-secondary)',dot: '#78716c', label: 'Checked Out' },
  cancelled:   { bg: 'var(--color-danger-bg)',   color: 'var(--color-danger-text)',   dot: '#dc2626', label: 'Cancelled'   },
  no_show:     { bg: '#ffedd5',                  color: '#c2410c',                    dot: '#f97316', label: 'No Show'     },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  const px  = size === 'sm' ? '6px 10px' : '4px 10px';
  const fs  = size === 'sm' ? '11px' : '12px';

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-medium"
      style={{ background: cfg.bg, color: cfg.color, padding: px, fontSize: fs }}
    >
      <span
        className="rounded-full shrink-0"
        style={{ width: 6, height: 6, background: cfg.dot }}
        aria-hidden="true"
      />
      {cfg.label}
    </span>
  );
}
