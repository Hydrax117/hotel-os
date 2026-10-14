import React from 'react';
import type { Metadata } from 'next';
import { DashboardSidebarWrapper } from './components/DashboardSidebarWrapper';
import { DashboardAuthGuard } from './components/DashboardAuthGuard';

export const metadata: Metadata = {
  title: 'Hotel OS — Dashboard',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGuard>
      <DashboardSidebarWrapper>
        {children}
      </DashboardSidebarWrapper>
    </DashboardAuthGuard>
  );
}
