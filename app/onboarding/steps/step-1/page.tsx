'use client';

import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/app/onboarding/context/OnboardingContext';
import { StepShell } from '@/app/onboarding/components/StepShell';
import { FormField } from '@/app/onboarding/components/FormField';

export default function Step1Page() {
  const router = useRouter();
  const { account, updateAccount, setStep } = useOnboarding();

  const isNextDisabled =
    !account.name.trim() ||
    !account.email.trim() ||
    !account.phone.trim() ||
    !account.password;

  const handleNext = () => {
    setStep(2);
    router.push('/onboarding/steps/step-2');
  };

  return (
    <StepShell
      title="Create Your Account"
      description="Start by setting up your Hotel OS account credentials."
      step={1}
      totalSteps={8}
      onNext={handleNext}
      isNextDisabled={isNextDisabled}
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          label="Full Name"
          placeholder="Jane Doe"
          type="text"
          value={account.name}
          onChange={e => updateAccount({ name: (e.target as HTMLInputElement).value })}
          required
        />
        <FormField
          label="Email Address"
          placeholder="jane@hotel.com"
          type="email"
          value={account.email}
          onChange={e => updateAccount({ email: (e.target as HTMLInputElement).value })}
          required
        />
        <FormField
          label="Phone Number"
          placeholder="+234 801 234 5678"
          type="tel"
          value={account.phone}
          onChange={e => updateAccount({ phone: (e.target as HTMLInputElement).value })}
          required
        />
        <FormField
          label="Password"
          placeholder="Create a strong password"
          type="password"
          value={account.password}
          onChange={e => updateAccount({ password: (e.target as HTMLInputElement).value })}
          required
        />
      </div>
    </StepShell>
  );
}
