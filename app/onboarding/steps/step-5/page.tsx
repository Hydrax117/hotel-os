'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/app/onboarding/context/OnboardingContext';
import { StepShell } from '@/app/onboarding/components/StepShell';
import { FileUploadSlot } from '@/app/onboarding/components/FileUploadSlot';
import { uploadImage } from '@/app/lib/supabase';

export default function Step5Page() {
  const router = useRouter();
  const { images, updateImageSlot, setStep } = useOnboarding();
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const isUploading = uploadingIds.size > 0;

  const handleBack = () => {
    setStep(4);
    router.push('/onboarding/steps/step-4');
  };

  const handleNext = () => {
    setStep(6);
    router.push('/onboarding/steps/step-6');
  };

  const handleFileChange = async (id: string, file: File) => {
    setUploadingIds(prev => new Set(prev).add(id));
    setUploadErrors(prev => { const next = { ...prev }; delete next[id]; return next; });

    let url = '';
    try {
      url = await uploadImage(file, 'application', id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image upload failed. Please try again.';
      setUploadErrors(prev => ({ ...prev, [id]: message }));
    } finally {
      // Always store the file reference (url may be empty on error)
      updateImageSlot(id, file, url);
      setUploadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <StepShell
      title="Property Images"
      description="Upload photos that showcase your hotel. High-quality images attract more guests."
      step={5}
      totalSteps={8}
      onBack={handleBack}
      onNext={handleNext}
      isNextDisabled={isUploading}
      isBackDisabled={isUploading}
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {images.map(slot => (
          <div key={slot.id}>
            <FileUploadSlot
              label={slot.label}
              accept="image/*"
              file={slot.file}
              showPreview
              isLoading={uploadingIds.has(slot.id)}
              onChange={file => handleFileChange(slot.id, file)}
            />
            {uploadErrors[slot.id] && (
              <p className="mt-1 text-xs text-red-600" role="alert">{uploadErrors[slot.id]}</p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-[var(--ob-secondary)]">
        Accepted formats: JPG, PNG, WEBP. Recommended resolution: 1280 x 960 px or higher.
      </p>
    </StepShell>
  );
}
