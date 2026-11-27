'use client';

import React from 'react';
import { useEffect, useRef } from 'react';

/**
 * HeroParallax
 * Wraps the hero section's background image in a subtle mouse-parallax effect.
 * On desktop  — image shifts ±18px relative to cursor position.
 * On mobile   — gyroscope drives the same shift (falls back gracefully).
 * prefers-reduced-motion — effect is disabled entirely.
 *
 * Usage: wrap the hero <Image> in this component.
 * The component renders a <div> that is absolutely positioned inset-0,
 * so the parent must be position:relative (the hero <section> already is).
 */
export default function HeroParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const MAX_SHIFT = 18; // px — how far the image moves at screen edge
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;

    // ── Mouse ────────────────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      // Normalise to -1 … +1, then scale
      targetX = ((e.clientX - cx) / cx) * -MAX_SHIFT;
      targetY = ((e.clientY - cy) / cy) * -MAX_SHIFT;
    };

    // ── Gyroscope (mobile) ───────────────────────────────────────────────────
    const onDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      // gamma = left/right tilt (-90…90), beta = front/back tilt (-180…180)
      targetX = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, (e.gamma / 30) * -MAX_SHIFT));
      targetY = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, ((e.beta - 45) / 30) * -MAX_SHIFT));
    };

    // ── Lerp loop ────────────────────────────────────────────────────────────
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      // Ease factor: 0.07 gives a smooth ~200 ms lag
      currentX = lerp(currentX, targetX, 0.07);
      currentY = lerp(currentY, targetY, 0.07);
      el.style.transform = `translate(${currentX}px, ${currentY}px) scale(1.06)`;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('deviceorientation', onDeviceOrientation);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'absolute',
        // Oversized so the ±18px shift never reveals a gap at the edges
        inset: '-24px',
        willChange: 'transform',
        // Start slightly scaled so scale(1.06) in the loop doesn't jump
        transform: 'scale(1.06)',
      }}
    >
      {children}
    </div>
  );
}
