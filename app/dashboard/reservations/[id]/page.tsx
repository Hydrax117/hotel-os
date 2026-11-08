// Server Component — only exports route segment config and renders the client component.
// instant must live here (server scope) — it cannot be in a 'use client' file.
export const instant = false;

import ReservationDetail from './ReservationDetail';

export default function ReservationDetailPage() {
  return <ReservationDetail />;
}
