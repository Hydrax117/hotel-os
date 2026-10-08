'use client';

import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/app/onboarding/context/OnboardingContext';
import { StepShell } from '@/app/onboarding/components/StepShell';
import { SubscriptionCard } from '@/app/onboarding/components/SubscriptionCard';
import type { SubscriptionPlan } from '@/app/onboarding/context/OnboardingContext';

const PLANS: {
  id: SubscriptionPlan;
  name: string;
  price: string;
  period?: string;
  features: string[];
  recommended?: boolean;
}[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₦25,000',
    period: 'month',
    features: [
      'Up to 20 rooms',
      'Basic booking management',
      'Guest messaging',
      'Standard support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '₦50,000',
    period: 'month',
    recommended: true,
    features: [
      'Up to 100 rooms',
      'Advanced analytics',
      'Channel manager integration',
      'Priority support',
      'Custom promotions',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    features: [
      'Unlimited rooms',
      'Full feature suite',
      'Dedicated account manager',
      'SLA guarantee',
      'White-label option',
      'API access',
    ],
  },
];

export default function Step7Page() {
  const router = useRouter();
  const { subscription, setSubscription, setStep } = useOnboarding();

  const handleBack = () => {
    setStep(6);
    router.push('/onboarding/steps/step-6');
  };

  const handleNext = () => {
    setStep(8);
    router.push('/onboarding/steps/step-8');
  };

  return (
    <StepShell
      title="Choose a Plan"
      description="Select the subscription that best fits your property's needs."
      step={7}
      totalSteps={8}
      onBack={handleBack}
      onNext={handleNext}
      isNextDisabled={subscription === null}
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {PLANS.map(plan => (
          <SubscriptionCard
            key={plan.id}
            plan={plan}
            selected={subscription === plan.id}
            onSelect={setSubscription}
          />
        ))}
      </div>
    </StepShell>
  );
}
