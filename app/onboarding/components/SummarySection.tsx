'use client';

import type React from 'react';

type SummaryItem = {
  label: string;
  value: string | React.ReactNode;
};

type SummarySectionProps = {
  title: string;
  items: SummaryItem[];
};

export function SummarySection({ title, items }: SummarySectionProps) {
  return (
    <div className="rounded-xl border border-[var(--ob-border)] bg-[var(--ob-surface)] p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--ob-secondary)]">
        {title}
      </h3>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium text-[var(--ob-secondary)]">{item.label}</dt>
            <dd className="text-sm text-[var(--ob-primary)]">
              {item.value || <span className="text-[var(--ob-secondary)] italic">—</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
