'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const HeroParallax = dynamic(() => import('./HeroParallax'), {
  ssr: false,
  loading: () => null,
});

export default function HeroParallaxLazy({ children }: { children: React.ReactNode }) {
  return <HeroParallax>{children}</HeroParallax>;
}
