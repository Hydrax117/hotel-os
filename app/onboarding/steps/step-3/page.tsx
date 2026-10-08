'use client';

import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/app/onboarding/context/OnboardingContext';
import { StepShell } from '@/app/onboarding/components/StepShell';
import { FileUploadSlot } from '@/app/onboarding/components/FileUploadSlot';

export default function Step3Page() {
  const router = useRouter();
  const { verification, updateVerification, setStep } = useOnboarding();

  // Continue is disabled until every required document has a file uploaded.
  const isNextDisabled = verification.some(doc => doc.required && doc.file === null);

  const handleBack = () => {
    setStep(2);
    router.push('/onboarding/steps/step-2');
  };

  const handleNext = () => {
    setStep(4);
    router.push('/onboarding/steps/step-4');
  };

  return (
    <StepShell
      title="Business Verification"
      description="Upload the required documents to verify your property and business."
      step={3}
      totalSteps={8}
      onBack={handleBack}
      onNext={handleNext}
      isNextDisabled={isNextDisabled}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {verification.map(doc => (
          <FileUploadSlot
            key={doc.id}
            label={doc.label}
            required={doc.required}
            file={doc.file}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={file => updateVerification(doc.id, file)}
          />
        ))}
      </div>
      <p className="mt-4 text-xs text-[var(--ob-secondary)]">
        Accepted formats: PDF, JPG, PNG. Max file size: 10 MB per document.
      </p>
    </StepShell>
  );
}
