'use client';

import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/app/onboarding/context/OnboardingContext';
import { StepShell } from '@/app/onboarding/components/StepShell';
import { FormField } from '@/app/onboarding/components/FormField';
import { MultiSelectChips } from '@/app/onboarding/components/MultiSelectChips';
import { AMENITY_OPTIONS } from '@/app/onboarding/constants/amenities';
import { LANGUAGE_OPTIONS } from '@/app/onboarding/constants/languages';

export default function Step4Page() {
  const router = useRouter();
  const { propertyInfo, updatePropertyInfo, setStep } = useOnboarding();

  // Check-in and check-out times are the only required fields on this step.
  const isNextDisabled =
    !propertyInfo.checkInTime || !propertyInfo.checkOutTime;

  const handleBack = () => {
    setStep(3);
    router.push('/onboarding/steps/step-3');
  };

  const handleNext = () => {
    setStep(5);
    router.push('/onboarding/steps/step-5');
  };

  return (
    <StepShell
      title="Property Information"
      description="Help guests understand what your hotel offers."
      step={4}
      totalSteps={8}
      onBack={handleBack}
      onNext={handleNext}
      isNextDisabled={isNextDisabled}
    >
      <div className="flex flex-col gap-8">
        {/* Amenities */}
        <MultiSelectChips
          label="Amenities"
          options={AMENITY_OPTIONS}
          selected={propertyInfo.amenities}
          onChange={amenities => updatePropertyInfo({ amenities })}
        />

        {/* Check-in / Check-out */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField
            label="Check-in Time"
            type="time"
            value={propertyInfo.checkInTime}
            onChange={e => updatePropertyInfo({ checkInTime: e.currentTarget.value })}
            required
          />
          <FormField
            label="Check-out Time"
            type="time"
            value={propertyInfo.checkOutTime}
            onChange={e => updatePropertyInfo({ checkOutTime: e.currentTarget.value })}
            required
          />
        </div>

        {/* Cancellation Policy */}
        <FormField
          as="textarea"
          label="Cancellation Policy"
          placeholder="Describe your cancellation terms, e.g. free cancellation up to 48 hours before check-in…"
          value={propertyInfo.cancellationPolicy}
          onChange={e => updatePropertyInfo({ cancellationPolicy: e.currentTarget.value })}
        />

        {/* House Rules */}
        <FormField
          as="textarea"
          label="House Rules"
          placeholder="e.g. No smoking, Quiet hours after 10 PM, No parties…"
          value={propertyInfo.houseRules}
          onChange={e => updatePropertyInfo({ houseRules: e.currentTarget.value })}
        />

        {/* Languages Spoken */}
        <MultiSelectChips
          label="Languages Spoken by Staff"
          options={LANGUAGE_OPTIONS}
          selected={propertyInfo.languages}
          onChange={languages => updatePropertyInfo({ languages })}
        />
      </div>
    </StepShell>
  );
}
