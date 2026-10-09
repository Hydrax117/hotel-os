'use client';

import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/app/onboarding/context/OnboardingContext';
import { StepShell } from '@/app/onboarding/components/StepShell';
import { FormField } from '@/app/onboarding/components/FormField';

export default function Step2Page() {
  const router = useRouter();
  const { property, updateProperty, setStep } = useOnboarding();

  const isNextDisabled =
    !property.hotelName.trim() ||
    !property.address.trim() ||
    !property.city.trim() ||
    !property.country.trim();

  const handleBack = () => {
    setStep(1);
    router.push('/onboarding/steps/step-1');
  };

  const handleNext = () => {
    setStep(3);
    router.push('/onboarding/steps/step-3');
  };

  return (
    <StepShell
      title="Your Property"
      description="Tell us about your hotel so guests can find and book it."
      step={2}
      totalSteps={8}
      onBack={handleBack}
      onNext={handleNext}
      isNextDisabled={isNextDisabled}
    >
      <div className="flex flex-col gap-5">
        <FormField
          label="Hotel Name"
          placeholder="e.g. The Grand Lagos"
          value={property.hotelName}
          onChange={e => updateProperty({ hotelName: e.currentTarget.value })}
          required
        />
        <FormField
          as="textarea"
          label="Description"
          placeholder="Describe your property, location highlights, and unique features…"
          value={property.description}
          onChange={e => updateProperty({ description: e.currentTarget.value })}
        />
        <FormField
          label="Street Address"
          placeholder="123 Victoria Island"
          value={property.address}
          onChange={e => updateProperty({ address: e.currentTarget.value })}
          required
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField
            label="City"
            placeholder="Lagos"
            value={property.city}
            onChange={e => updateProperty({ city: e.currentTarget.value })}
            required
          />
          <FormField
            label="State"
            placeholder="Lagos State"
            value={property.state}
            onChange={e => updateProperty({ state: e.currentTarget.value })}
          />
          <FormField
            label="Country"
            placeholder="Nigeria"
            value={property.country}
            onChange={e => updateProperty({ country: e.currentTarget.value })}
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField
            label="Latitude"
            type="number"
            step="any"
            placeholder="6.4541"
            value={property.latitude}
            onChange={e => updateProperty({ latitude: e.currentTarget.value })}
            hint="Optional — helps show your property on a map"
          />
          <FormField
            label="Longitude"
            type="number"
            step="any"
            placeholder="3.3947"
            value={property.longitude}
            onChange={e => updateProperty({ longitude: e.currentTarget.value })}
            hint="Optional — helps show your property on a map"
          />
        </div>
      </div>
    </StepShell>
  );
}
