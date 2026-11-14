'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * The old Rooms page (RoomType-based) has been replaced by the
 * resource-based inventory system. Redirect to /dashboard/resources.
 */
export default function RoomsPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard/resources'); }, [router]);
  return null;
}
