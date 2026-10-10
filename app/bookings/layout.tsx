import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'My Bookings — Hotel OS',
};

export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
