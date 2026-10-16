'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/app/onboarding/context/OnboardingContext';
import { StepShell } from '@/app/onboarding/components/StepShell';
import { FileUploadSlot } from '@/app/onboarding/components/FileUploadSlot';
import { uploadDocument } from '@/app/lib/supabase';

export default function Step3Page() {
  const router = useRouter();
  const { verification, updateVerification, setStep } = useOnboarding();
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const isUploading = uploadingIds.size > 0;
  const isNextDisabled =
    isUploading || verification.some(doc => doc.required && doc.file === null);

  const handleBack = () => {
    setStep(2);
    router.push('/onboarding/steps/step-2');
  };

  const handleNext = () => {
    setStep(4);
    router.push('/onboarding/steps/step-4');
  };

  const handleFileChange = async (id: string, file: File) => {
    // Add to uploading set to block navigation
    setUploadingIds(prev => new Set(prev).add(id));
    setUploadErrors(prev => { const next = { ...prev }; delete next[id]; return next; });

    try {
      // Upload immediately so the URL is ready for submission later
      await uploadDocument(file, 'application', id);
      // Store the file reference in context so it can be re-uploaded at submission
      // if needed, or used for display purposes
      updateVerification(id, file);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setUploadErrors(prev => ({ ...prev, [id]: message }));
    } finally {
      setUploadingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
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
      isBackDisabled={isUploading}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {verification.map(doc => (
          <div key={doc.id}>
            <FileUploadSlot
              label={doc.label}
              required={doc.required}
              file={doc.file}
              accept=".pdf,.jpg,.jpeg,.png"
              isLoading={uploadingIds.has(doc.id)}
              onChange={file => handleFileChange(doc.id, file)}
            />
            {uploadErrors[doc.id] ? (
              <p className="mt-1 text-xs text-red-600" role="alert">{uploadErrors[doc.id]}</p>
            ) : (
              <p className="mt-1 text-xs text-[var(--ob-secondary)]">
                Stored securely and used only for verification purposes.
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-[var(--ob-secondary)]">
        Accepted formats: PDF, JPG, PNG. Max file size: 10 MB per document.
      </p>
    </StepShell>
  );
}
