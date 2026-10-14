'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Step1Page() {
  const router = useRouter();
  useEffect(() => { router.replace('/onboarding/steps/step-2'); }, [router]);
  return null;
}
