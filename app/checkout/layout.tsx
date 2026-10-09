import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Complete your booking — Hotel OS' };

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
