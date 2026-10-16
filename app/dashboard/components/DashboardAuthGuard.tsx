'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/lib/auth-context';
import { getMyHotel } from '@/app/lib/api/dashboard';
import { getMyApplication } from '@/app/lib/api/applications';

const ALLOWED_ROLES = ['HOTEL_OWNER', 'HOTEL_MANAGER', 'HOTEL_STAFF', 'SUPER_ADMIN'] as const;

// Hotel statuses that mean the hotel exists but is not approved yet
const PENDING_STATUSES = ['PENDING', 'UNDER_REVIEW', 'pending', 'under_review'];

export function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isUnderReviewPage = pathname === '/hotel-review';

  const [hotelChecked, setHotelChecked] = useState(false);
  const [fetchError, setFetchError] = useState(false);

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
      setFetchError(false);
      getMyHotel()
        .then(async hotel => {
          if (hotel === null) {
            // No hotel yet — check if there is an application
            const application = await getMyApplication();

            if (application === null) {
              // No hotel and no application — send to onboarding
              router.replace('/onboarding/steps/step-2');
              return;
            }

            if (application.status === 'PENDING' || application.status === 'REJECTED') {
              // Application exists but pending or rejected — show review page
              if (!isUnderReviewPage) {
                router.replace('/hotel-review');
              } else {
                setHotelChecked(true);
              }
              return;
            }

            if (application.status === 'APPROVED') {
              // Application approved but hotel not yet created — this is a race condition
              // or the hotel creation is still propagating. Show review page which will
              // redirect once the hotel record is visible.
              if (!isUnderReviewPage) {
                router.replace('/hotel-review');
              } else {
                setHotelChecked(true);
              }
              return;
            }

            // Unknown state — send to onboarding
            router.replace('/onboarding/steps/step-2');
            return;
          }

          // Hotel exists — check its verification status
          if (PENDING_STATUSES.includes(hotel.verificationStatus ?? '')) {
            if (!isUnderReviewPage) {
              router.replace('/hotel-review');
            } else {
              setHotelChecked(true);
            }
            return;
          }

          // Hotel is approved
          if (isUnderReviewPage) {
            router.replace('/dashboard/overview');
            return;
          }
          setHotelChecked(true);
        })
        .catch(() => {
          // API error (network, token expired, etc.) — don't redirect to onboarding,
          // show a retry prompt instead so the user is not stuck in a loop
          setFetchError(true);
        });
    } else {
      setHotelChecked(true);
    }
  }, [user, isLoading, router, pathname, isUnderReviewPage]);

  if (isLoading || (!hotelChecked && !fetchError)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Loading">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
        <p style={{ color: 'var(--db-secondary, #6b7280)', fontSize: 14 }}>
          Could not connect to the server. Please check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            background: 'var(--db-accent, #3d6b4f)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user || !(ALLOWED_ROLES as readonly string[]).includes(user.role)) return null;
  return <>{children}</>;
}
