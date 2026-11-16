import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Bookings',
  description: 'View and manage your hotel reservations on Lodgen.',
  robots: { index: false },
};

export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
