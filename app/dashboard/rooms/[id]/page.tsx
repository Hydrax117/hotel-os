// Server Component — exports route segment config only.
export const instant = false;

import React, { Suspense } from 'react';
import RoomDetail from './RoomDetail';

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20" style={{ color: 'var(--db-secondary)' }}>
          Loading room…
        </div>
      }
    >
      <RoomDetail id={id} />
    </Suspense>
  );
}
