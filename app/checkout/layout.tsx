import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Complete your booking — Lodgen' };

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
