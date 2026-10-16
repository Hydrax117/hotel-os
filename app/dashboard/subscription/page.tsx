'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMyHotel, type DashboardHotel } from '@/app/lib/api/dashboard';
import { initializeSubscriptionPayment } from '@/app/lib/api/subscriptions';

// ── Plan catalogue ─────────────────────────────────────────────────────────────

type PlanKey = 'starter' | 'professional' | 'enterprise';

type PlanDef = {
  label: string;
  price: string;
  priceNum: string;
  monthlyAmount: number | null; // null = custom / contact sales
  features: string[];
  recommended?: boolean;
};

const PLANS: Record<PlanKey, PlanDef> = {
  starter: {
    label:         'Starter',
    price:         '₦25,000/month',
    priceNum:      '₦25,000',
    monthlyAmount: 25000,
    features: [
      'Up to 20 rooms',
      'Basic booking management',
      'Guest messaging',
      'Standard support',
    ],
  },
  professional: {
    label:         'Professional',
    price:         '₦50,000/month',
    priceNum:      '₦50,000',
    monthlyAmount: 50000,
    recommended:   true,
    features: [
      'Up to 100 rooms',
      'Advanced analytics',
      'Channel manager integration',
      'Priority support',
      'Custom promotions',
    ],
  },
  enterprise: {
    label:         'Enterprise',
    price:         'Custom pricing',
    priceNum:      'Custom',
    monthlyAmount: null,
    features: [
      'Unlimited rooms',
      'Full feature suite',
      'Dedicated account manager',
      'SLA guarantee',
      'White-label option',
      'API access',
    ],
  },
};

const PLAN_KEYS: PlanKey[] = ['starter', 'professional', 'enterprise'];

// ── Small helpers ─────────────────────────────────────────────────────────────

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getPlanDef(key: string): PlanDef | undefined {
  return PLANS[key.toLowerCase() as PlanKey];
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
      <svg
        className="animate-spin h-8 w-8"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-label="Loading"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5 mt-3">
      {items.map(item => (
        <li key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--db-secondary)' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="7" fill="#dcfce7" />
            <path d="M4 7l2 2 4-4" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {item}
        </li>
      ))}
    </ul>
  );
}

// ── State A — Plan selection ──────────────────────────────────────────────────

type SelectionStep = 'select' | 'confirm' | 'success';

function PlanSelection({ hotel }: { hotel: DashboardHotel }) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [step, setStep] = useState<SelectionStep>('select');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleSelectPlan(key: PlanKey) {
    setSelectedPlan(key);
    setErrorMsg(null);
  }

  function handleProceed() {
    if (!selectedPlan) return;
    setStep('confirm');
    setErrorMsg(null);
  }

  function handleContactSales() {
    setSelectedPlan('enterprise');
    setStep('confirm');
    setErrorMsg(null);
  }

  async function handleConfirm() {
    if (!selectedPlan) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { authorizationUrl, reference } = await initializeSubscriptionPayment(
        hotel.id,
        selectedPlan.toUpperCase(),
      );
      sessionStorage.setItem('pending_sub_ref', reference);
      sessionStorage.setItem('pending_sub_hotel', hotel.id);
      window.location.href = authorizationUrl;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not start payment. Please try again.';
      setErrorMsg(message);
      setLoading(false);
    }
    // Do not setLoading(false) on success — page is navigating away
  }

  if (step === 'success') {
    return (
      <div
        className="rounded-xl border p-8 text-center"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <div className="flex justify-center mb-4">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <circle cx="24" cy="24" r="24" fill="#dcfce7" />
            <path d="M14 24l8 8 12-12" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--db-primary)' }}>
          Plan activated!
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--db-secondary)' }}>
          Your dashboard is now fully unlocked.
        </p>
        <button
          onClick={() => router.push('/dashboard/overview')}
          className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
          style={{ background: 'var(--db-accent)' }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (step === 'confirm' && selectedPlan) {
    const plan = PLANS[selectedPlan];
    const isEnterprise = selectedPlan === 'enterprise';
    return (
      <div
        className="rounded-xl border p-8 max-w-md mx-auto"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--db-primary)' }}>
          Confirm your plan
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--db-secondary)' }}>
          {isEnterprise
            ? `You will be redirected to Paystack to complete your ₦150,000/month Enterprise plan payment securely.`
            : `You will be redirected to Paystack to complete your ${plan.priceNum}/month payment securely.`}
        </p>
        {errorMsg && (
          <p className="text-sm mb-4 rounded-lg px-4 py-2" style={{ background: '#fee2e2', color: '#991b1b' }}>
            {errorMsg}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-60"
            style={{ background: 'var(--db-accent)' }}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {isEnterprise ? 'Confirm' : 'Proceed to Payment'}
          </button>
          <button
            onClick={() => { setStep('select'); setErrorMsg(null); }}
            disabled={loading}
            className="rounded-lg border px-5 py-2.5 text-sm font-medium disabled:opacity-60"
            style={{ borderColor: 'var(--db-border)', color: 'var(--db-secondary)' }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // step === 'select'
  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--db-primary)' }}>
        Choose your plan
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--db-secondary)' }}>
        Select a subscription plan to unlock your full dashboard.
      </p>

      {errorMsg && (
        <p className="text-sm mb-4 rounded-lg px-4 py-2" style={{ background: '#fee2e2', color: '#991b1b' }}>
          {errorMsg}
        </p>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {PLAN_KEYS.map(key => {
          const plan = PLANS[key];
          const isSelected = selectedPlan === key;
          return (
            <div
              key={key}
              onClick={() => handleSelectPlan(key)}
              className="rounded-xl border p-5 cursor-pointer transition-all relative"
              style={{
                background: 'var(--db-surface)',
                borderColor: isSelected ? 'var(--db-accent)' : 'var(--db-border)',
                borderWidth: isSelected ? '2px' : '1px',
                boxShadow: isSelected ? '0 0 0 2px var(--db-accent)22' : undefined,
              }}
              role="button"
              aria-pressed={isSelected}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleSelectPlan(key)}
            >
              {plan.recommended && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-semibold text-white"
                  style={{ background: 'var(--db-accent)' }}
                >
                  Recommended
                </span>
              )}
              <h3 className="text-base font-bold" style={{ color: 'var(--db-primary)' }}>
                {plan.label}
              </h3>
              <p className="text-sm font-semibold mt-1" style={{ color: 'var(--db-accent)' }}>
                {plan.price}
              </p>
              <FeatureList items={plan.features} />
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={selectedPlan === 'enterprise' ? handleContactSales : handleProceed}
          disabled={!selectedPlan}
          className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--db-accent)' }}
        >
          {selectedPlan === 'enterprise' ? 'Contact Sales' : 'Get Started'}
        </button>
      </div>
    </div>
  );
}

// ── State B — Active subscription ─────────────────────────────────────────────

function ActiveSubscription({ hotel }: { hotel: DashboardHotel }) {
  const currentKey = (hotel.subscriptionPlan ?? '').toLowerCase() as PlanKey;
  const currentPlan = getPlanDef(currentKey);

  const otherPlans = PLAN_KEYS.filter(k => k !== currentKey);

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--db-primary)' }}>
        Subscription
      </h2>

      {/* Current plan card */}
      <section
        className="rounded-xl border p-6 mb-6"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mb-2"
              style={{ background: '#dcfce7', color: '#166534' }}
            >
              Active
            </span>
            <h3 className="text-2xl font-bold" style={{ color: 'var(--db-primary)' }}>
              {currentPlan ? currentPlan.label : capitalize(hotel.subscriptionPlan ?? '')} Plan
            </h3>
            <p className="text-lg font-semibold mt-1" style={{ color: 'var(--db-accent)' }}>
              {currentPlan ? currentPlan.price : '—'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--db-secondary)' }}>
              Next billing date: <em>— billing date not available —</em>
            </p>
            {currentPlan && <FeatureList items={currentPlan.features} />}
          </div>
        </div>
      </section>

      {/* Plan comparison */}
      {otherPlans.length > 0 && (
        <section className="mb-6">
          <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--db-primary)' }}>
            Other plans
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {otherPlans.map(key => {
              const plan = PLANS[key];
              const isUpgrade = PLAN_KEYS.indexOf(key) > PLAN_KEYS.indexOf(currentKey);
              return (
                <div
                  key={key}
                  className="rounded-xl border p-5"
                  style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
                >
                  <h4 className="text-lg font-bold" style={{ color: 'var(--db-primary)' }}>
                    {plan.label}
                  </h4>
                  <p className="text-base font-semibold mt-1" style={{ color: 'var(--db-secondary)' }}>
                    {plan.price}
                  </p>
                  <FeatureList items={plan.features} />
                  <button
                    disabled
                    title="Coming soon"
                    className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium opacity-50 cursor-not-allowed"
                    style={{ borderColor: 'var(--db-border)', color: 'var(--db-secondary)' }}
                  >
                    {isUpgrade ? 'Upgrade' : 'Downgrade'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Billing history */}
      <section
        className="rounded-xl border mb-6"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--db-border)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'var(--db-primary)' }}>
            Billing History
          </h3>
        </div>
        <div className="px-5 py-8 text-center">
          <p className="text-sm" style={{ color: 'var(--db-muted)' }}>
            Billing history will appear here once your first invoice is generated.
          </p>
        </div>
      </section>

      {/* Payment method */}
      <section
        className="rounded-xl border p-5"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--db-primary)' }}>
          Payment Method
        </h3>
        <p className="text-sm mb-3" style={{ color: 'var(--db-secondary)' }}>
          No payment method saved yet. Add one to enable auto-renewal.
        </p>
        <button
          disabled
          className="rounded-lg border px-4 py-2 text-sm font-medium opacity-50 cursor-not-allowed"
          style={{ borderColor: 'var(--db-border)', color: 'var(--db-secondary)' }}
        >
          Add payment method
        </button>
      </section>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const [hotel, setHotel] = useState<DashboardHotel | null | undefined>(undefined);

  useEffect(() => {
    getMyHotel()
      .then(result => setHotel(result))
      .catch(() => setHotel(null));
  }, []);

  return (
    <div style={{ padding: '24px 28px' }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--db-primary)' }}>
        Subscription
      </h1>

      {hotel === undefined && <Spinner />}

      {hotel === null && (
        <div
          className="rounded-xl border p-6 text-center"
          style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
        >
          <p className="text-sm" style={{ color: '#991b1b' }}>
            Unable to load subscription data. Please refresh.
          </p>
        </div>
      )}

      {hotel && !hotel.subscriptionPlan && <PlanSelection hotel={hotel} />}

      {hotel && hotel.subscriptionPlan && <ActiveSubscription hotel={hotel} />}
    </div>
  );
}
