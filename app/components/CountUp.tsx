'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  end: number;
  duration?: number; // ms
  suffix?: string;
  prefix?: string;
}

/**
 * CountUp — animates from 0 to `end` when the element scrolls into view.
 * Uses requestAnimationFrame for a smooth easeOutQuart curve.
 */
export function CountUp({ end, duration = 1600, suffix = '', prefix = '' }: CountUpProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion — just show the final value immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(end);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          io.disconnect();

          const startTime = performance.now();

          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutQuart
            const eased = 1 - Math.pow(1 - progress, 4);
            setValue(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}
