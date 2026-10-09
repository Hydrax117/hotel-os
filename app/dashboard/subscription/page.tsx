import React from 'react';
import { MOCK_HOTEL } from '../mock/data';

// ── Billing history ────────────────────────────────────────────────────────────

type BillingRow = {
  date: string;
  description: string;
  amount: string;
  status: 'Paid' | 'Upcoming';
};

const BILLING_HISTORY: BillingRow[] = [
  { date: 'Oct 15, 2024', description: 'Professional Plan — Monthly', amount: '₦50,000', status: 'Paid' },
  { date: 'Sep 15, 2024', description: 'Professional Plan — Monthly', amount: '₦50,000', status: 'Paid' },
  { date: 'Nov 15, 2024', description: 'Professional Plan — Monthly', amount: '₦50,000', status: 'Upcoming' },
];

// ── StatusPill ────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: 'Paid' | 'Upcoming' }) {
  const style =
    status === 'Paid'
      ? { background: '#dcfce7', color: '#166534' }
      : { background: '#fef3c7', color: '#92400e' };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={style}
    >
      {status}
    </span>
  );
}

// ── Feature list helper ───────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  // Suppress unused variable warning — MOCK_HOTEL is imported as instructed
  void MOCK_HOTEL;

  return (
    <div style={{ padding: '24px 28px' }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--db-primary)' }}>
        Subscription
      </h1>

      {/* Current plan card */}
      <section
        className="rounded-xl border p-6 mb-6"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ background: '#dcfce7', color: '#166534' }}
              >
                Active
              </span>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--db-primary)' }}>
              Professional Plan
            </h2>
            <p className="text-lg font-semibold mt-1" style={{ color: 'var(--db-accent)' }}>
              ₦50,000 / month
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--db-secondary)' }}>
              Next billing date: <strong>November 15, 2024</strong>
            </p>
            <FeatureList
              items={[
                'Up to 10 staff accounts',
                'Booking management',
                'Analytics & reporting',
                'Priority support',
                'Guest communications',
              ]}
            />
          </div>
          <button
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white shrink-0 self-start"
            style={{ background: 'var(--db-accent)' }}
          >
            Manage Subscription
          </button>
        </div>
      </section>

      {/* Plan comparison */}
      <section className="grid sm:grid-cols-2 gap-4 mb-6">
        {/* Starter */}
        <div
          className="rounded-xl border p-5"
          style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
        >
          <h3 className="text-lg font-bold" style={{ color: 'var(--db-primary)' }}>
            Starter
          </h3>
          <p className="text-base font-semibold mt-1" style={{ color: 'var(--db-secondary)' }}>
            ₦20,000 / month
          </p>
          <FeatureList
            items={['3 staff accounts', 'Basic booking', 'Email support']}
          />
          <button
            disabled
            className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium cursor-not-allowed opacity-50"
            style={{ borderColor: 'var(--db-border)', color: 'var(--db-secondary)' }}
          >
            Downgrade
          </button>
        </div>

        {/* Enterprise */}
        <div
          className="rounded-xl border p-5"
          style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
        >
          <h3 className="text-lg font-bold" style={{ color: 'var(--db-primary)' }}>
            Enterprise
          </h3>
          <p className="text-base font-semibold mt-1" style={{ color: 'var(--db-secondary)' }}>
            ₦150,000 / month
          </p>
          <FeatureList
            items={[
              'Unlimited staff',
              'Advanced analytics',
              'Dedicated support',
              'API access',
              'White-label',
            ]}
          />
          <button
            className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: 'var(--db-accent)' }}
          >
            Upgrade to Enterprise
          </button>
        </div>
      </section>

      {/* Billing history */}
      <section
        className="rounded-xl border mb-6"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--db-border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--db-primary)' }}>
            Billing History
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--db-bg)' }}>
              {['Date', 'Description', 'Amount', 'Status', 'Download'].map(col => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--db-secondary)' }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BILLING_HISTORY.map((row, i) => (
              <tr
                key={row.date + i}
                style={{
                  background: i % 2 === 0 ? 'var(--db-surface)' : 'var(--db-bg)',
                  borderTop: '1px solid var(--db-border)',
                }}
              >
                <td className="px-4 py-3" style={{ color: 'var(--db-primary)' }}>
                  {row.date}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>
                  {row.description}
                </td>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--db-primary)' }}>
                  {row.amount}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-4 py-3">
                  <a
                    href="#"
                    className="text-lg"
                    style={{ color: 'var(--db-accent)' }}
                    aria-label={`Download invoice for ${row.date}`}
                  >
                    ↓
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Payment method */}
      <section
        className="rounded-xl border p-5"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--db-primary)' }}>
          Payment Method
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="rounded-md px-2.5 py-1 text-xs font-bold"
              style={{ background: 'var(--db-muted)', color: 'var(--db-primary)' }}
            >
              VISA
            </div>
            <span className="text-sm" style={{ color: 'var(--db-primary)' }}>
              Visa ending in <strong>4242</strong>
            </span>
          </div>
          <a href="#" className="text-sm font-medium" style={{ color: 'var(--db-accent)' }}>
            Update payment method
          </a>
        </div>
      </section>
    </div>
  );
}
