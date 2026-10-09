import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hotel — Hotel OS',
};

export default function HotelDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
