'use client';

import React from 'react';

type StatCardProps = {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  icon?: React.ReactNode;
};

export function StatCard({ label, value, delta, deltaPositive, icon }: StatCardProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl border p-5"
      style={{
        background: 'var(--db-surface)',
        borderColor: 'var(--db-border)',
      }}
    >
      {/* Top row: label + icon */}
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--db-secondary)' }}
        >
          {label}
        </span>
        {icon && (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'var(--db-muted)', color: 'var(--db-accent)' }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <span
        className="text-2xl font-bold tracking-tight"
        style={{ color: 'var(--db-primary)' }}
      >
        {value}
      </span>

      {/* Delta */}
      {delta !== undefined && (
        <span
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: deltaPositive ? 'var(--db-success)' : 'var(--db-danger)' }}
        >
          {/* Up/down arrow */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
            aria-hidden="true"
            style={{
              transform: deltaPositive ? 'rotate(0deg)' : 'rotate(180deg)',
            }}
          >
            <path d="M6 1L11 9H1L6 1Z" />
          </svg>
          {delta}
        </span>
      )}
    </div>
  );
}
