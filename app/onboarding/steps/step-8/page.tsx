'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/app/onboarding/context/OnboardingContext';
import { StepShell } from '@/app/onboarding/components/StepShell';
import { SummarySection } from '@/app/onboarding/components/SummarySection';

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter — ₦25,000/month',
  professional: 'Professional — ₦50,000/month',
  enterprise: 'Enterprise — Custom pricing',
};

export default function Step8Page() {
  const router = useRouter();
  const {
    account,
    property,
    verification,
    propertyInfo,
    images,
    rooms,
    subscription,
    submitted,
    submitting,
    submitError,
    submitStep,
    submit,
    setStep,
  } = useOnboarding();

  // Direct-URL gate: if the user navigated here directly without going through
  // the wizard, account.email and subscription will be empty. Redirect them back
  // to step 1 to avoid submitting a blank application.
  useEffect(() => {
    if (!account.email.trim() || !subscription) {
      router.replace('/onboarding/steps/step-1');
    }
  }, [account.email, subscription, router]);

  const handleBack = () => {
    setStep(7);
    router.push('/onboarding/steps/step-7');
  };

  // Block submission if any required verification document is missing or if already submitting.
  const hasMissingRequiredDocs = verification.some(doc => doc.required && doc.file === null);
  const isSubmitDisabled = hasMissingRequiredDocs || submitting;

  // While the guard effect is still running (or redirect is pending), render nothing.
  if (!account.email.trim() || !subscription) {
    return null;
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--ob-accent)]/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-[var(--ob-accent)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--ob-primary)]">Application Submitted</h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--ob-secondary)]">
            Your application has been received and is{' '}
            <strong className="text-[var(--ob-accent)]">pending verification</strong>. Our team will review
            your details and contact you within 2–3 business days.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--ob-border)] bg-[var(--ob-muted)] px-6 py-4 text-sm text-[var(--ob-secondary)]">
          <p>
            We&apos;ll notify you at <strong className="text-[var(--ob-primary)]">{account.email}</strong> once
            verification is complete.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {submitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm">
          <svg
            className="h-8 w-8 animate-spin text-[var(--ob-accent)]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm font-medium text-[var(--ob-primary)]">{submitStep ?? 'Submitting…'}</p>
        </div>
      )}
      <StepShell
        title="Review Your Application"
        description="Check your details before submitting. You can go back to edit any section."
        step={8}
        totalSteps={8}
        onBack={handleBack}
        onNext={submit}
        nextLabel={submitting ? (submitStep ?? 'Submitting…') : 'Submit application'}
        isNextDisabled={isSubmitDisabled}
        nextHint={hasMissingRequiredDocs && !submitting ? 'Upload all required verification documents to submit.' : undefined}
      >
        <div className="flex flex-col gap-5">
          {submitError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <strong className="block mb-1">Please fix the following before submitting:</strong>
              <ul className="list-disc list-inside flex flex-col gap-1">
                {submitError.split('\n').map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        {/* Account */}
        <SummarySection
          title="Account"
          items={[
            { label: 'Name', value: account.name },
            { label: 'Email', value: account.email },
            { label: 'Phone', value: account.phone },
          ]}
        />

        {/* Property */}
        <SummarySection
          title="Property"
          items={[
            { label: 'Hotel Name', value: property.hotelName },
            { label: 'Description', value: property.description },
            { label: 'Address', value: property.address },
            { label: 'City', value: property.city },
            { label: 'State', value: property.state },
            { label: 'Country', value: property.country },
            { label: 'Latitude', value: property.latitude },
            { label: 'Longitude', value: property.longitude },
          ]}
        />

        {/* Verification Documents — show thumbnail preview for images, file icon for PDFs */}
        <div className="rounded-xl border border-[var(--ob-border)] bg-[var(--ob-surface)] p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--ob-secondary)]">
            Verification Documents
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {verification.map(doc => {
              const isImage = doc.file && doc.file.type.startsWith('image/');
              const previewUrl = isImage && doc.file ? URL.createObjectURL(doc.file) : null;
              return (
                <div key={doc.id} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[var(--ob-secondary)]">
                    {doc.label}{doc.required && <span className="text-red-500 ml-0.5">*</span>}
                  </span>
                  {doc.file ? (
                    isImage && previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt={doc.label}
                        className="h-20 w-full rounded-lg object-cover border border-[var(--ob-border)]"
                        onLoad={() => URL.revokeObjectURL(previewUrl)}
                      />
                    ) : (
                      <div className="flex h-20 items-center justify-center gap-2 rounded-lg border border-[var(--ob-border)] bg-[var(--ob-muted)] px-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 text-[var(--ob-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs text-[var(--ob-secondary)] truncate">{doc.file.name}</span>
                      </div>
                    )
                  ) : (
                    <div className={`flex h-20 items-center justify-center rounded-lg border-2 border-dashed ${doc.required ? 'border-red-300 bg-red-50' : 'border-[var(--ob-border)] bg-[var(--ob-muted)]'}`}>
                      {doc.required ? (
                        <span className="text-xs font-medium text-red-600">Required — not uploaded</span>
                      ) : (
                        <span className="text-xs text-[var(--ob-secondary)]">Skipped</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Property Info */}
        <SummarySection
          title="Property Information"
          items={[
            { label: 'Amenities', value: propertyInfo.amenities.join(', ') || '—' },
            { label: 'Check-in', value: propertyInfo.checkInTime },
            { label: 'Check-out', value: propertyInfo.checkOutTime },
            { label: 'Cancellation Policy', value: propertyInfo.cancellationPolicy },
            { label: 'House Rules', value: propertyInfo.houseRules },
            { label: 'Languages', value: propertyInfo.languages.join(', ') || '—' },
          ]}
        />

        {/* Images — show thumbnails */}
        <div className="rounded-xl border border-[var(--ob-border)] bg-[var(--ob-surface)] p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--ob-secondary)]">
            Images
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map(slot => {
              const previewUrl = slot.preview || (slot.file ? URL.createObjectURL(slot.file) : null);
              return (
                <div key={slot.id} className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[var(--ob-secondary)]">{slot.label}</span>
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt={slot.label}
                      className="h-20 w-full rounded-lg object-cover border border-[var(--ob-border)]"
                    />
                  ) : (
                    <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-[var(--ob-border)] bg-[var(--ob-muted)]">
                      <span className="text-xs text-[var(--ob-secondary)]">Not uploaded</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rooms */}
        <SummarySection
          title="Room Types"
          items={
            rooms.length === 0
              ? [{ label: 'Rooms', value: 'None added' }]
              : rooms.flatMap((room, i) => [
                  { label: `Room ${i + 1} Name`, value: room.name },
                  { label: 'Capacity', value: `${room.capacity} guests` },
                  { label: 'Bed Type', value: room.bedType },
                  { label: 'Bathroom', value: room.bathroomType },
                  { label: 'Total Rooms', value: `${room.totalRooms}` },
                  { label: 'Price/Night', value: `₦${room.pricePerNight.toLocaleString()}` },
                ])
          }
        />

        {/* Subscription */}
        <SummarySection
          title="Subscription"
          items={[
            {
              label: 'Selected Plan',
              value: subscription ? PLAN_LABELS[subscription] : 'None selected',
            },
          ]}
        />
      </div>
    </StepShell>
    </>
  );
}
