import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Booking — Hotel OS' };

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
