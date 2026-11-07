'use client';

import React from 'react';

type StatCardProps = {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  icon?: React.ReactNode;
  accent?: boolean;
};

export function StatCard({ label, value, delta, deltaPositive, icon, accent }: StatCardProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border p-5"
      style={{
        background: accent ? 'var(--color-brand)' : 'var(--color-surface)',
        borderColor: accent ? 'transparent' : 'var(--color-border)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium"
          style={{ color: accent ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)' }}
        >
          {label}
        </span>
        {icon && (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: accent ? 'rgba(255,255,255,0.12)' : 'var(--color-muted)',
              color: accent ? '#fff' : 'var(--color-brand)',
            }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <span
        className="text-2xl font-bold tracking-tight"
        style={{ color: accent ? '#fff' : 'var(--color-text-primary)' }}
      >
        {value}
      </span>

      {/* Delta */}
      {delta !== undefined && (
        <span
          className="flex items-center gap-1 text-xs font-medium"
          style={{
            color: accent
              ? 'rgba(255,255,255,0.75)'
              : deltaPositive
              ? 'var(--color-success-text)'
              : 'var(--color-danger-text)',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"
            style={{ transform: deltaPositive ? 'rotate(0deg)' : 'rotate(180deg)' }}>
            <path d="M6 1L11 9H1L6 1Z"/>
          </svg>
          {delta}
        </span>
      )}
    </div>
  );
}
