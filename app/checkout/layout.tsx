import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Complete your booking',
  description: 'Confirm your hotel reservation and pay securely via Paystack.',
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
