'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/lib/auth-context';
import { getMyApplication, type HotelApplication } from '@/app/lib/api/applications';
import { getMyHotel } from '@/app/lib/api/dashboard';
import { logout } from '@/app/lib/api/auth';
import { useRouter } from 'next/navigation';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const ClipboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 22V12h6v10" />
  </svg>
);

const CheckCircleIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14.5 15 10" />
  </svg>
);

const LightbulbIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3 6H9c-1.5-1.5-3-3.5-3-6a6 6 0 0 1 6-6z" />
  </svg>
);

const XCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

// ── Review process steps ──────────────────────────────────────────────────────

const REVIEW_STEPS = [
  {
    icon: <ClipboardIcon />,
    label: 'Application received',
    description: 'We have your hotel details and documents.',
    state: 'done' as const,
  },
  {
    icon: <SearchIcon />,
    label: 'Document verification',
    description: 'Our team is reviewing your business registration and supporting documents.',
    state: 'active' as const,
  },
  {
    icon: <BuildingIcon />,
    label: 'Property assessment',
    description: 'We verify your property details and photos meet our listing standards.',
    state: 'upcoming' as const,
  },
  {
    icon: <CheckCircleIcon />,
    label: 'Approval and activation',
    description: 'Once approved your hotel goes live and you get full dashboard access.',
    state: 'upcoming' as const,
  },
];

// ── Guard — redirect away if not a HOTEL_OWNER ────────────────────────────────

function useReviewGuard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/auth/signin');
      return;
    }
    if (user.role !== 'HOTEL_OWNER') {
      router.replace('/dashboard/overview');
    }
  }, [user, isLoading, router]);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HotelReviewPage() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [application, setApplication] = useState<HotelApplication | null | undefined>(undefined);
  const [checking, setChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  useReviewGuard();

  useEffect(() => {
    getMyApplication()
      .then(a => setApplication(a))
      .catch(() => setApplication(null));
  }, []);

  async function handleSignOut() {
    await logout();
    setUser(null);
    router.replace('/auth/signin');
  }

  async function handleRefresh() {
    setChecking(true);
    setCheckMessage(null);
    const a = await getMyApplication();
    setApplication(a);

    if (a?.status === 'APPROVED') {
      // Check if the hotel has been created
      const hotel = await getMyHotel();
      if (hotel) {
        router.replace('/dashboard/overview');
        return;
      }
      // Hotel not yet created — show subscription message
      setCheckMessage('Your application has been approved! Choose a subscription plan to activate your hotel.');
    } else {
      setCheckMessage('Your application is still under review. We will email you when it has been approved.');
    }
    setChecking(false);
  }

  // Loading state
  if (application === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Loading">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#3d6b4f" strokeWidth="4" />
          <path className="opacity-75" fill="#3d6b4f" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  // No application — redirect to onboarding
  if (application === null) {
    router.replace('/onboarding/steps/step-2');
    return null;
  }

  const hotelName = application.name ?? 'Your hotel';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-geist-sans, Arial, sans-serif)',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 32px',
          borderBottom: '1px solid #e5e7eb',
          background: '#fff',
        }}
      >
        <span style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>
          Hotel<span style={{ color: '#3d6b4f' }}>OS</span>
        </span>
        <button
          onClick={handleSignOut}
          style={{
            fontSize: 13,
            color: '#6b7280',
            background: 'none',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            cursor: 'pointer',
            padding: '6px 14px',
          }}
        >
          Sign out
        </button>
      </header>

      {/* Content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
        }}
      >
        <div style={{ maxWidth: 560, width: '100%' }}>

          {/* ── REJECTED state ── */}
          {application.status === 'REJECTED' && (
            <>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#fee2e2',
                  color: '#b91c1c',
                  borderRadius: 999,
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 24,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}><XCircleIcon /></span>
                Application not approved
              </div>

              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 10, lineHeight: 1.2 }}>
                Your application was not approved
              </h1>
              <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, marginBottom: 24 }}>
                Hi {user?.firstName}, unfortunately your hotel application did not meet our current listing requirements.
                You can review the feedback below and resubmit with the corrections.
              </p>

              {application.adminNotes && (
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #fca5a5',
                    borderRadius: 12,
                    padding: '16px 20px',
                    marginBottom: 28,
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Reviewer feedback
                  </p>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                    {application.adminNotes}
                  </p>
                </div>
              )}

              <button
                onClick={() => router.push('/onboarding/steps/step-2')}
                style={{
                  background: '#3d6b4f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  padding: '10px 24px',
                }}
              >
                Start a new application
              </button>
            </>
          )}

          {/* ── PENDING state ── */}
          {application.status === 'PENDING' && (
            <>
              {/* Status pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#fef9c3',
                  color: '#92400e',
                  borderRadius: 999,
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 24,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#f59e0b',
                    display: 'inline-block',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                />
                Under review
              </div>

              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#111',
                  marginBottom: 10,
                  lineHeight: 1.2,
                }}
              >
                {hotelName} is being reviewed
              </h1>
              <p
                style={{
                  fontSize: 15,
                  color: '#6b7280',
                  lineHeight: 1.7,
                  marginBottom: 36,
                }}
              >
                Hi {user?.firstName}, our team is reviewing your submission. This usually takes
                1&ndash;3 business days. We will notify you by email once your hotel is approved and
                your dashboard is active.
              </p>

              {/* Steps card */}
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 16,
                  padding: '28px',
                  marginBottom: 20,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 20,
                  }}
                >
                  Review process
                </p>

                <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 22 }}>
                  {REVIEW_STEPS.map((step, idx) => {
                    const isDone = step.state === 'done';
                    const isActive = step.state === 'active';

                    return (
                      <li key={idx} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isDone ? '#dcfce7' : isActive ? '#fef9c3' : '#f3f4f6',
                            border: `2px solid ${isDone ? '#86efac' : isActive ? '#fde68a' : '#e5e7eb'}`,
                          }}
                        >
                          {isDone ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <span style={{ color: isDone ? '#16a34a' : isActive ? '#92400e' : '#9ca3af' }}>
                              {step.icon}
                            </span>
                          )}
                        </div>

                        <div style={{ paddingTop: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: isDone ? '#16a34a' : isActive ? '#92400e' : '#9ca3af',
                              }}
                            >
                              {step.label}
                            </span>
                            {isActive && (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  background: '#fef9c3',
                                  color: '#92400e',
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                }}
                              >
                                In progress
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>
                            {step.description}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Support hint */}
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 16,
                  padding: '18px 24px',
                  marginBottom: 28,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                <span style={{ flexShrink: 0, marginTop: 1, color: '#6b7280' }}><LightbulbIcon /></span>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.65 }}>
                  Make sure your contact email is reachable &mdash; we&apos;ll send your approval or any
                  follow-up questions there. Haven&apos;t heard back after 3 business days? Email{' '}
                  <a
                    href="mailto:support@hotelos.com"
                    style={{ color: '#3d6b4f', textDecoration: 'none', fontWeight: 600 }}
                  >
                    support@hotelos.com
                  </a>
                  .
                </p>
              </div>

              {/* Refresh check */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={handleRefresh}
                  disabled={checking}
                  style={{
                    background: 'none',
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    cursor: checking ? 'not-allowed' : 'pointer',
                    color: checking ? '#9ca3af' : '#3d6b4f',
                    fontWeight: 600,
                    fontSize: 13,
                    padding: '8px 20px',
                    transition: 'opacity 0.15s',
                  }}
                >
                  {checking ? 'Checking...' : 'Check approval status'}
                </button>
                {checkMessage && (
                  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 10 }}>{checkMessage}</p>
                )}
              </div>
            </>
          )}

          {/* ── APPROVED state (hotel not yet created or subscription needed) ── */}
          {application.status === 'APPROVED' && (
            <>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#dcfce7',
                  color: '#15803d',
                  borderRadius: 999,
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 24,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}><CheckCircleIcon color="#15803d" /></span>
                Application approved
              </div>

              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 10, lineHeight: 1.2 }}>
                Congratulations, {user?.firstName}!
              </h1>
              <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, marginBottom: 32 }}>
                Your hotel application has been approved. To publish your hotel and start receiving bookings,
                choose a subscription plan and complete payment.
              </p>

              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={handleRefresh}
                  disabled={checking}
                  style={{
                    background: '#3d6b4f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    cursor: checking ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    padding: '10px 24px',
                    marginBottom: 12,
                    opacity: checking ? 0.7 : 1,
                  }}
                >
                  {checking ? 'Checking...' : 'Continue to dashboard'}
                </button>
                {checkMessage && (
                  <p style={{ fontSize: 13, color: '#6b7280', marginTop: 10 }}>{checkMessage}</p>
                )}
              </div>
            </>
          )}

        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
