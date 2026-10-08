'use client';

import type { SubscriptionPlan } from '../context/OnboardingContext';

type PlanConfig = {
  id: SubscriptionPlan;
  name: string;
  price: string;
  period?: string;
  features: string[];
  recommended?: boolean;
};

type SubscriptionCardProps = {
  plan: PlanConfig;
  selected: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
};

export function SubscriptionCard({ plan, selected, onSelect }: SubscriptionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      className={
        'relative flex flex-col rounded-xl border-2 p-6 text-left transition-all ' +
        (selected
          ? 'border-[var(--ob-accent)] bg-[var(--ob-accent)]/5 shadow-md'
          : 'border-[var(--ob-border)] bg-[var(--ob-surface)] hover:border-[var(--ob-accent)]/40 hover:shadow-sm')
      }
    >
      {plan.recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--ob-accent)] px-3 py-0.5 text-xs font-semibold text-white">
          Recommended
        </span>
      )}
      <div className="mb-4">
        <p className="text-base font-semibold text-[var(--ob-primary)]">{plan.name}</p>
        <p className="mt-1 text-2xl font-bold text-[var(--ob-primary)]">
          {plan.price}
          {plan.period && (
            <span className="text-sm font-normal text-[var(--ob-secondary)]">/{plan.period}</span>
          )}
        </p>
      </div>
      <ul className="flex flex-col gap-2 text-sm text-[var(--ob-secondary)]">
        {plan.features.map(feature => (
          <li key={feature} className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ob-accent)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      {selected && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[var(--ob-accent)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Selected
        </div>
      )}
    </button>
  );
}
