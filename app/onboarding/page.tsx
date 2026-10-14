import { redirect } from 'next/navigation';

export default function OnboardingPage() {
  redirect('/onboarding/steps/step-2');
}
