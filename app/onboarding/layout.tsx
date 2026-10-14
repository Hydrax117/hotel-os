import React from 'react';
import { OnboardingProvider } from './context/OnboardingContext';
import { StepIndicator } from './components/StepIndicator';
import { OnboardingAuthGuard } from './components/OnboardingAuthGuard';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingProvider>
      <OnboardingAuthGuard>
        <div
          className="min-h-screen"
          style={{ background: 'var(--ob-bg)', fontFamily: 'var(--font-geist-sans, Arial, sans-serif)' }}
        >
          <div className="mx-auto flex max-w-6xl flex-col lg:flex-row">
            {/* Sidebar */}
            <aside
              className="shrink-0 border-b border-[var(--ob-border)] px-6 py-8 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:overflow-y-auto lg:border-b-0 lg:border-r"
              style={{ background: 'var(--ob-surface)' }}
            >
              {/* Logo */}
              <div className="mb-8">
                <span className="text-xl font-bold tracking-tight text-[var(--ob-primary)]">
                  Hotel<span className="text-[var(--ob-accent)]">OS</span>
                </span>
                <p className="mt-0.5 text-xs text-[var(--ob-secondary)]">Property Onboarding</p>
              </div>
              <StepIndicator />
            </aside>

            {/* Main content */}
            <main className="flex-1 px-6 py-10 lg:px-12 lg:py-12">
              {children}
            </main>
          </div>
        </div>
      </OnboardingAuthGuard>
    </OnboardingProvider>
  );
}
