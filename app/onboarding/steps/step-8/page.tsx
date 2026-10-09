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

  // Block submission if any required verification document is missing.
  const hasMissingRequiredDocs = verification.some(doc => doc.required && doc.file === null);
  const isSubmitDisabled = hasMissingRequiredDocs;

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
    <StepShell
      title="Review Your Application"
      description="Check your details before submitting. You can go back to edit any section."
      step={8}
      totalSteps={8}
      onBack={handleBack}
      onNext={submit}
      nextLabel="Submit application"
      isNextDisabled={isSubmitDisabled}
      nextHint={isSubmitDisabled ? 'Upload all required verification documents to submit.' : undefined}
    >
      <div className="flex flex-col gap-5">
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

        {/* Verification — required-but-missing docs are highlighted in red */}
        <SummarySection
          title="Verification Documents"
          items={verification.map(doc => ({
            label: doc.label,
            value: doc.file
              ? doc.file.name
              : doc.required
                ? (
                  <span className="flex items-center gap-1 text-red-600 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    Required — not uploaded
                  </span>
                )
                : 'Skipped',
          }))}
        />

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

        {/* Images */}
        <SummarySection
          title="Images"
          items={images.map(slot => ({
            label: slot.label,
            value: slot.file ? slot.file.name : 'Not uploaded',
          }))}
        />

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
  );
}
