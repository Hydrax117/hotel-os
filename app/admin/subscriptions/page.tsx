'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { getAdminHotels, type AdminHotel } from '../../lib/api/admin';

// ── Types ─────────────────────────────────────────────────────────────────────

type PlanKey = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

// ── Helpers ───────────────────────────────────────────────────────────────────

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const PLAN_FEES: Record<string, number> = {
  STARTER:      15000,
  starter:      15000,
  PROFESSIONAL: 35000,
  professional: 35000,
  ENTERPRISE:   75000,
  enterprise:   75000,
};

const PLAN_STYLES: Record<string, { bg: string; color: string }> = {
  STARTER:      { bg: '#f3f4f6', color: '#374151' },
  starter:      { bg: '#f3f4f6', color: '#374151' },
  PROFESSIONAL: { bg: '#dbeafe', color: '#1d4ed8' },
  professional: { bg: '#dbeafe', color: '#1d4ed8' },
  ENTERPRISE:   { bg: '#ede9fe', color: '#6d28d9' },
  enterprise:   { bg: '#ede9fe', color: '#6d28d9' },
};

function planBadge(plan: string) {
  const s = PLAN_STYLES[plan] ?? { bg: '#f3f4f6', color: '#374151' };
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize"
      style={{ background: s.bg, color: s.color }}
    >
      {plan.toLowerCase()}
    </span>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ padding: '32px 24px' }}>
      <div style={{ height: 28, width: 200, background: 'var(--ad-muted)', borderRadius: 6, marginBottom: 24 }} />
      <div style={{ height: 100, background: 'var(--ad-muted)', borderRadius: 8 }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminSubscriptionsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [hotels, setHotels] = useState<AdminHotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    getAdminHotels({ limit: 100 })
      .then(res => setHotels(res.hotels))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!authLoading && user?.role === 'SUPER_ADMIN') {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  if (authLoading) return <LoadingSkeleton />;

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--ad-secondary)' }}>Access denied. Super admin role required.</p>
      </div>
    );
  }

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--ad-danger)', marginBottom: 12 }}>{error}</p>
        <button
          type="button"
          onClick={load}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--ad-accent)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  const approvedHotels = hotels.filter(
    h => h.verificationStatus.toUpperCase() === 'APPROVED' && h.isActive,
  );

  const plans: PlanKey[] = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

  const planCounts = plans.reduce<Record<PlanKey, number>>(
    (acc, p) => {
      acc[p] = approvedHotels.filter(
        h => h.subscriptionPlan?.toUpperCase() === p,
      ).length;
      return acc;
    },
    { STARTER: 0, PROFESSIONAL: 0, ENTERPRISE: 0 },
  );

  const nextBilling = addDays(30);

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-xl font-bold" style={{ color: 'var(--ad-primary)' }}>
        Subscriptions
      </h1>

      {/* Plan summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map(plan => {
          const count = planCounts[plan];
          const monthlyRevenue = count * (PLAN_FEES[plan] ?? 0);
          const s = PLAN_STYLES[plan];
          return (
            <div
              key={plan}
              className="rounded-xl border p-5 shadow-sm"
              style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold capitalize"
                  style={{ background: s.bg, color: s.color }}
                >
                  {plan.toLowerCase()}
                </span>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--ad-primary)' }}>
                {count}
              </p>
              <p className="text-xs" style={{ color: 'var(--ad-secondary)' }}>active hotels</p>
              <div
                className="mt-3 border-t pt-3"
                style={{ borderColor: 'var(--ad-border)' }}
              >
                <p className="text-xs font-medium" style={{ color: 'var(--ad-secondary)' }}>
                  Monthly Revenue
                </p>
                <p className="text-base font-bold" style={{ color: 'var(--ad-accent)' }}>
                  ₦{monthlyRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscriptions table */}
      <div
        className="rounded-xl border shadow-sm"
        style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
      >
        <div className="border-b px-5 py-4" style={{ borderColor: 'var(--ad-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--ad-primary)' }}>
            Active Subscriptions
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--ad-muted)' }}>
                {['Hotel', 'Plan', 'Monthly Fee', 'Status', 'Next Billing', 'Actions'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--ad-secondary)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hotels
                .filter(h => h.verificationStatus.toUpperCase() === 'APPROVED')
                .map((hotel, idx) => (
                  <tr
                    key={hotel.id}
                    style={{ borderTop: idx === 0 ? undefined : `1px solid var(--ad-border)` }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--ad-primary)' }}>
                      {hotel.name}
                    </td>
                    <td className="px-4 py-3">{planBadge(hotel.subscriptionPlan)}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--ad-primary)' }}>
                      ₦{(PLAN_FEES[hotel.subscriptionPlan] ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {/* NOTE: isActive reflects the hotel account state, not subscription payment currency.
                          A subscriptionActiveUntil/lapsed field is not yet returned by the API.
                          All approved hotels are shown as Active until the endpoint provides that data. */}
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ background: '#dcfce7', color: '#15803d' }}
                      >
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>
                      {nextBilling}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="rounded border px-2 py-1 text-xs font-medium"
                          style={{ borderColor: 'var(--ad-border)', color: 'var(--ad-secondary)' }}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="rounded border px-2 py-1 text-xs font-medium"
                          style={{ borderColor: 'var(--ad-danger)', color: 'var(--ad-danger)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
