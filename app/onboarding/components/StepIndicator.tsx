'use client';

import { useOnboarding } from '../context/OnboardingContext';

const STEPS = [
  { number: 1, label: 'Account' },
  { number: 2, label: 'Property' },
  { number: 3, label: 'Verification' },
  { number: 4, label: 'Property Info' },
  { number: 5, label: 'Images' },
  { number: 6, label: 'Rooms' },
  { number: 7, label: 'Subscription' },
  { number: 8, label: 'Review' },
];

export function StepIndicator() {
  const { currentStep } = useOnboarding();

  return (
    <nav aria-label="Onboarding progress">
      <ol className="flex flex-col gap-1">
        {STEPS.map(step => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <li key={step.number}>
              <div
                className={
                  'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ' +
                  (isActive
                    ? 'bg-[var(--ob-accent)]/10'
                    : 'hover:bg-[var(--ob-muted)]')
                }
              >
                {/* Step number / checkmark */}
                <div
                  className={
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ' +
                    (isCompleted
                      ? 'bg-[var(--ob-accent)] text-white'
                      : isActive
                        ? 'border-2 border-[var(--ob-accent)] bg-transparent text-[var(--ob-accent)]'
                        : 'border-2 border-[var(--ob-border)] bg-transparent text-[var(--ob-secondary)]')
                  }
                >
                  {isCompleted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                {/* Label */}
                <span
                  className={
                    'text-sm ' +
                    (isActive
                      ? 'font-semibold text-[var(--ob-accent)]'
                      : isCompleted
                        ? 'font-medium text-[var(--ob-primary)]'
                        : 'text-[var(--ob-secondary)]')
                  }
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
