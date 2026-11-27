'use client';

/**
 * Lazy-loaded wrapper for HeroParticles.
 * dynamic() with ssr:false ensures Three.js never runs during SSR,
 * which avoids the "document is not defined" error.
 */
import dynamic from 'next/dynamic';

const HeroParticles = dynamic(() => import('./HeroParticles'), {
  ssr: false,
  loading: () => null, // nothing shown while the chunk loads — hero image is already visible
});

export default function HeroParticlesLazy() {
  return <HeroParticles />;
}
