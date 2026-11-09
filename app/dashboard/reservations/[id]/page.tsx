// Server Component — only exports route segment config and renders the client component.
// instant must live here (server scope) — it cannot be in a 'use client' file.
export const instant = false;

import React, { Suspense } from 'react';
import ReservationDetail from './ReservationDetail';

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20" style={{ color: 'var(--db-secondary)' }}>
          Loading reservation…
        </div>
      }
    >
      <ReservationDetail id={id} />
    </Suspense>
  );
}
