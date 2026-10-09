import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in — Hotel OS',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
