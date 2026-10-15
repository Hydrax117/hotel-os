'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { getMyHotel } from '@/app/lib/api/dashboard';

const ALLOWED_ROLES = ['HOTEL_OWNER', 'HOTEL_MANAGER', 'HOTEL_STAFF', 'SUPER_ADMIN'] as const;

// Verification statuses that mean the hotel exists but isn't approved yet
const PENDING_STATUSES = ['PENDING', 'UNDER_REVIEW', 'pending', 'under_review'];

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isUnderReviewPage = pathname === '/hotel-review';

  // null = not checked yet, false = no hotel, DashboardHotel = has hotel
  const [hotelChecked, setHotelChecked] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/auth/signin');
      return;
    }

    if (!(ALLOWED_ROLES as readonly string[]).includes(user.role)) {
      router.replace('/');
      return;
    }

    // Only HOTEL_OWNER can be in an incomplete-onboarding or pending-review state.
    // Managers and staff are assigned to a hotel by the owner, so they always have one.
    if (user.role === 'HOTEL_OWNER') {
      getMyHotel().then(hotel => {
        if (!hotel) {
          router.replace('/onboarding/steps/step-2');
        } else if (PENDING_STATUSES.includes(hotel.verificationStatus ?? '')) {
          // Hotel exists but is awaiting admin approval — show the review page.
          if (!isUnderReviewPage) {
            router.replace('/hotel-review');
          } else {
            setHotelChecked(true);
          }
        } else {
          // Hotel is approved — if somehow on the under-review page, bounce to overview
          if (isUnderReviewPage) {
            router.replace('/dashboard/overview');
            return;
          }

          // Hotel is approved but has no subscription plan yet — gate to subscription page
          if (!hotel.subscriptionPlan) {
            if (pathname === '/dashboard/subscription') {
              setHotelChecked(true);
            } else {
              router.replace('/dashboard/subscription');
            }
            return;
          }

          setHotelChecked(true);
        }
      });
    } else {
      setHotelChecked(true);
    }
  }, [user, isLoading, router, pathname, isUnderReviewPage]);

  if (isLoading || !hotelChecked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Loading">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  if (!user || !(ALLOWED_ROLES as readonly string[]).includes(user.role)) return null;
  return <>{children}</>;
}
