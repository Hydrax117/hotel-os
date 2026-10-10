import React from 'react';
import { connection } from 'next/server';
import { ADMIN_HOTELS } from '../mock';
import type { SubscriptionPlan } from '../mock';

export const instant = false;

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const PLAN_FEES: Record<SubscriptionPlan, number> = {
  starter:      15000,
  professional: 35000,
  enterprise:   75000,
};

const PLAN_STYLES: Record<SubscriptionPlan, { bg: string; color: string }> = {
  starter:      { bg: '#f3f4f6', color: '#374151' },
  professional: { bg: '#dbeafe', color: '#1d4ed8' },
  enterprise:   { bg: '#ede9fe', color: '#6d28d9' },
};

function planBadge(plan: SubscriptionPlan) {
  const s = PLAN_STYLES[plan];
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize"
      style={{ background: s.bg, color: s.color }}
    >
      {plan}
    </span>
  );
}

export default async function AdminSubscriptionsPage() {
  await connection();
  const approvedHotels = ADMIN_HOTELS.filter(
    h => h.verificationStatus === 'approved' && h.isActive,
  );

  const plans: SubscriptionPlan[] = ['starter', 'professional', 'enterprise'];

  const planCounts = plans.reduce<Record<SubscriptionPlan, number>>(
    (acc, p) => {
      acc[p] = approvedHotels.filter(h => h.subscription === p).length;
      return acc;
    },
    { starter: 0, professional: 0, enterprise: 0 },
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
          const monthlyRevenue = count * PLAN_FEES[plan];
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
                  {plan}
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
              {ADMIN_HOTELS.filter(h => h.verificationStatus === 'approved').map((hotel, idx) => (
                <tr
                  key={hotel.id}
                  style={{ borderTop: idx === 0 ? undefined : `1px solid var(--ad-border)` }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--ad-primary)' }}>
                    {hotel.name}
                  </td>
                  <td className="px-4 py-3">{planBadge(hotel.subscription)}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--ad-primary)' }}>
                    ₦{PLAN_FEES[hotel.subscription].toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
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
