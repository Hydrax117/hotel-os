'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const BookingConfetti = dynamic(() => import('./BookingConfetti'), {
  ssr: false,
  loading: () => null,
});

/**
 * Mounts the confetti burst overlay, removes itself once the burst is done.
 * Rendered inside a `position: relative` ancestor on the confirmation page.
 */
export default function BookingConfettiWrapper() {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return <BookingConfetti onDone={() => setShow(false)} />;
}
