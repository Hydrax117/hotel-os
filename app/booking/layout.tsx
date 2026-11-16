import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Booking Confirmed',
  description: 'Your Lodgen hotel booking is confirmed. Check your email for details.',
  robots: { index: false },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
