'use client';

import React, { useState } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopbar } from './DashboardTopbar';

type DashboardSidebarWrapperProps = {
  children: React.ReactNode;
};

/**
 * Thin client wrapper that owns the mobile sidebar open/close state.
 * Keeps `app/dashboard/layout.tsx` as a server component.
 */
export function DashboardSidebarWrapper({ children }: DashboardSidebarWrapperProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--db-bg)' }}>
      {/* Sidebar */}
      <DashboardSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Right column: topbar + content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar onMenuToggle={() => setMobileOpen(prev => !prev)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
