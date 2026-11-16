import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Sign in', template: '%s | Lodgen' },
  description: 'Sign in or create a Lodgen account to book hotels across Nigeria.',
  robots: { index: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
