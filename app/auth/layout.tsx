import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hotel OS — Sign in',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
