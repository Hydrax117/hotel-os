import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Booking — Lodgen' };

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
