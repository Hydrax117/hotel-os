import React from 'react';
import type { Metadata } from 'next';
import { AdminSidebarWrapper } from './components/AdminSidebarWrapper';

export const instant = false;

export const metadata: Metadata = {
  title: 'Hotel OS Admin',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminSidebarWrapper>{children}</AdminSidebarWrapper>;
}
