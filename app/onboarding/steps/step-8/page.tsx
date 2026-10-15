'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Step8Redirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/onboarding/steps/step-7');
  }, [router]);
  return null;
}
