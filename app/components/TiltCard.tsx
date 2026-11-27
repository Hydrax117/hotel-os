'use client';

import { useRef, type CSSProperties } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  maxTilt?: number; // degrees
}

/**
 * TiltCard — wraps any child in a CSS perspective tilt that follows the mouse.
 * Resets smoothly on mouse-leave via CSS transition.
 * No effect when prefers-reduced-motion is set.
 */
export function TiltCard({ children, className, style, maxTilt = 10 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5 … 0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5;

    el.style.transition = 'transform 0.1s ease-out';
    el.style.transform  = `perspective(600px) rotateY(${x * maxTilt * 2}deg) rotateX(${-y * maxTilt}deg) scale(1.03)`;
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1)';
    el.style.transform  = 'perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)';
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{ willChange: 'transform', ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}
