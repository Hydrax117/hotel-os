import React from 'react';
import type { Metadata } from 'next';
import { AdminSidebarWrapper } from './components/AdminSidebarWrapper';
import { AdminAuthGuard } from './components/AdminAuthGuard';

export const instant = false;

export const metadata: Metadata = {
  title: 'Lodgen Admin',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminSidebarWrapper>{children}</AdminSidebarWrapper>
    </AdminAuthGuard>
  );
}
