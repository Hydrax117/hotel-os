'use client';

import { useEffect, useRef, type CSSProperties, type ElementType } from 'react';

type Variant = 'fade-up' | 'fade-in' | 'fade-left' | 'fade-right';

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: Variant;
  delay?: number;
  threshold?: number;
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
}

const INITIAL: Record<Variant, CSSProperties> = {
  'fade-up':    { opacity: 0, transform: 'translateY(32px)' },
  'fade-in':    { opacity: 0, transform: 'scale(0.97)'      },
  'fade-left':  { opacity: 0, transform: 'translateX(-28px)'},
  'fade-right': { opacity: 0, transform: 'translateX(28px)' },
};

const VISIBLE: CSSProperties = { opacity: 1, transform: 'none' };

export function ScrollReveal({
  children,
  variant = 'fade-up',
  delay = 0,
  threshold = 0.15,
  className,
  style,
  as: Tag = 'div',
}: ScrollRevealProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion — reveal immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      Object.assign(el.style, VISIBLE);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            if (ref.current) Object.assign(ref.current.style, VISIBLE);
          }, delay);
          io.disconnect();
        }
      },
      { threshold },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [delay, threshold]);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        ...INITIAL[variant],
        transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
