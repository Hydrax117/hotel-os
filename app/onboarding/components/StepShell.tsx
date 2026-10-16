'use client';

import React from 'react';

type StepShellProps = {
  title: string;
  description?: string;
  step: number;
  totalSteps: number;
  onBack?: () => void;
  onNext: () => void | Promise<void>;
  nextLabel?: string;
  isNextDisabled?: boolean;
  isBackDisabled?: boolean;
  nextHint?: string;
  children: React.ReactNode;
};

export function StepShell({
  title,
  description,
  step,
  totalSteps,
  onBack,
  onNext,
  nextLabel = 'Continue',
  isNextDisabled = false,
  isBackDisabled = false,
  nextHint,
  children,
}: StepShellProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--ob-secondary)]">
          Step {step} of {totalSteps}
        </p>
        <h1 className="text-2xl font-bold text-[var(--ob-primary)]">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--ob-secondary)]">{description}</p>
        )}
      </div>

      {/* Content */}
      <div>{children}</div>

      {/* Navigation */}
      <div className="flex flex-col gap-2 border-t border-[var(--ob-border)] pt-6">
        {nextHint && isNextDisabled && (
          <p className="text-right text-xs text-amber-600">{nextHint}</p>
        )}
        <div className="flex items-center justify-between">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              disabled={isBackDisabled}
              className={
                'rounded-lg border border-[var(--ob-border)] px-5 py-2.5 text-sm font-medium text-[var(--ob-primary)] transition-colors ' +
                (isBackDisabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-[var(--ob-muted)]')
              }
            >
              Back
            </button>
          ) : (
            <div /> /* spacer */
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled}
            className={
              'rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-colors ' +
              (isNextDisabled
                ? 'cursor-not-allowed bg-[var(--ob-secondary)] opacity-50'
                : 'bg-[var(--ob-accent)] hover:opacity-90')
            }
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
