'use client';

import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/app/onboarding/context/OnboardingContext';
import { StepShell } from '@/app/onboarding/components/StepShell';
import { FileUploadSlot } from '@/app/onboarding/components/FileUploadSlot';

export default function Step5Page() {
  const router = useRouter();
  const { images, updateImageSlot, setStep } = useOnboarding();

  const handleBack = () => {
    setStep(4);
    router.push('/onboarding/steps/step-4');
  };

  const handleNext = () => {
    setStep(6);
    router.push('/onboarding/steps/step-6');
  };

  const handleFileChange = (id: string, file: File) => {
    const preview = URL.createObjectURL(file);
    updateImageSlot(id, file, preview);
  };

  return (
    <StepShell
      title="Property Images"
      description="Upload photos that showcase your hotel. High-quality images attract more guests."
      step={5}
      totalSteps={8}
      onBack={handleBack}
      onNext={handleNext}
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {images.map(slot => (
          <FileUploadSlot
            key={slot.id}
            label={slot.label}
            accept="image/*"
            file={slot.file}
            preview={slot.preview}
            showPreview
            onChange={file => handleFileChange(slot.id, file)}
          />
        ))}
      </div>
      <p className="mt-4 text-xs text-[var(--ob-secondary)]">
        Accepted formats: JPG, PNG, WEBP. Recommended resolution: 1280 × 960 px or higher.
      </p>
    </StepShell>
  );
}
