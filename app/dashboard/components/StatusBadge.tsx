'use client';

import React from 'react';
import type { BookingStatus } from '../types';

type StatusBadgeProps = {
  status: BookingStatus;
};

type BadgeStyle = {
  bg: string;
  color: string;
  label: string;
};

const STATUS_MAP: Record<BookingStatus, BadgeStyle> = {
  pending: {
    bg: '#fef3c7',
    color: '#92400e',
    label: 'Pending',
  },
  confirmed: {
    bg: '#dbeafe',
    color: '#1e40af',
    label: 'Confirmed',
  },
  checked_in: {
    bg: '#dcfce7',
    color: '#166534',
    label: 'Checked In',
  },
  checked_out: {
    bg: '#f5f5f4',
    color: '#44403c',
    label: 'Checked Out',
  },
  cancelled: {
    bg: '#fee2e2',
    color: '#991b1b',
    label: 'Cancelled',
  },
  no_show: {
    bg: '#ffedd5',
    color: '#9a3412',
    label: 'No Show',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { bg, color, label } = STATUS_MAP[status];

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}
