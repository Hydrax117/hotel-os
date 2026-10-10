'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MOCK_HOTEL } from '../mock/data';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'general' | 'notifications' | 'security' | 'billing';

const TABS: { value: Tab; label: string }[] = [
  { value: 'general',       label: 'General'       },
  { value: 'notifications', label: 'Notifications' },
  { value: 'security',      label: 'Security'      },
  { value: 'billing',       label: 'Billing'       },
];

// ── CSS Toggle ────────────────────────────────────────────────────────────────

function CSSToggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? 'var(--db-accent)' : 'var(--db-border)',
        border: 'none',
        padding: 3,
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: 'block',
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

// ── Input style ───────────────────────────────────────────────────────────────

const inputCls = 'rounded-lg border px-3 py-2 text-sm outline-none';
const inputStyle: React.CSSProperties = {
  borderColor: 'var(--db-border)',
  background: 'var(--db-bg)',
  color: 'var(--db-primary)',
};

// ── Sub-tabs ──────────────────────────────────────────────────────────────────

function GeneralTab() {
  const [name, setName]   = useState(MOCK_HOTEL.name);
  const [email, setEmail] = useState('info@ekosignature.ng');
  const [phone, setPhone] = useState('+234 812 345 6789');
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        className="rounded-xl border p-5"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2 className="mb-4 text-sm font-semibold">Hotel details</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }} htmlFor="hotel-name">Hotel display name</label>
            <input id="hotel-name" className={inputCls} style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }} htmlFor="business-email">Business email</label>
            <input id="business-email" className={inputCls} style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }} htmlFor="phone">Phone number</label>
            <input id="phone" className={inputCls} style={inputStyle} type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }} htmlFor="timezone">Time zone</label>
            <select id="timezone" className={inputCls} style={inputStyle}>
              <option>WAT - West Africa Time (UTC+1)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }} htmlFor="currency">Currency</label>
            <input id="currency" className={inputCls} style={{ ...inputStyle, opacity: 0.6 }} value="NGN — Nigerian Naira" disabled />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }} htmlFor="language">Language</label>
            <input id="language" className={inputCls} style={{ ...inputStyle, opacity: 0.6 }} value="English" disabled />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={save}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: 'var(--db-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Save changes
          </button>
          {saved && (
            <span className="text-sm" style={{ color: 'var(--db-success)' }}>Saved!</span>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const NOTIF_ITEMS = [
    { id: 'new-reservation',  label: 'New reservation',   desc: 'Get notified when a new booking is made',         defaultOn: true  },
    { id: 'booking-cancelled', label: 'Booking cancelled', desc: 'Get notified when a guest cancels',                defaultOn: true  },
    { id: 'checkin-reminder', label: 'Check-in reminder',  desc: '24-hour reminder before each guest check-in',     defaultOn: true  },
    { id: 'new-review',       label: 'New review',          desc: 'Get notified when a guest leaves a review',       defaultOn: true  },
    { id: 'staff-activity',   label: 'Staff activity',      desc: 'Track staff logins and dashboard actions',        defaultOn: false },
    { id: 'weekly-report',    label: 'Weekly report',       desc: 'Receive a weekly summary every Monday',           defaultOn: true  },
    { id: 'payment-received', label: 'Payment received',    desc: 'Get notified when a payout is processed',         defaultOn: true  },
  ];

  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_ITEMS.map(n => [n.id, n.defaultOn]))
  );

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
    >
      {NOTIF_ITEMS.map((item, idx) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-4 px-5 py-4"
          style={{
            borderBottom: idx < NOTIF_ITEMS.length - 1 ? '1px solid var(--db-border)' : 'none',
          }}
        >
          <div>
            <p className="text-sm font-medium">{item.label}</p>
            <p className="text-xs" style={{ color: 'var(--db-secondary)' }}>{item.desc}</p>
          </div>
          <CSSToggle
            checked={toggles[item.id]}
            onChange={v => setToggles(t => ({ ...t, [item.id]: v }))}
            id={`notif-${item.id}`}
          />
        </div>
      ))}
    </div>
  );
}

function SecurityTab() {
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [pwSaved, setPwSaved]       = useState(false);
  const [pwError, setPwError]       = useState('');

  const MOCK_SESSIONS = [
    { id: 's1', device: 'Chrome on macOS',  location: 'Lagos, Nigeria',    lastActive: 'Now',          current: true  },
    { id: 's2', device: 'Safari on iPhone', location: 'Lagos, Nigeria',    lastActive: '3 hours ago',  current: false },
  ];

  function updatePassword() {
    if (!currentPw || !newPw || !confirmPw) { setPwError('All fields are required.'); return; }
    if (newPw !== confirmPw) { setPwError('New passwords do not match.'); return; }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    setPwError('');
    setPwSaved(true);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setTimeout(() => setPwSaved(false), 2500);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Change password */}
      <div
        className="rounded-xl border p-5"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2 className="mb-4 text-sm font-semibold">Change password</h2>
        {pwError && <p className="mb-3 text-sm" style={{ color: 'var(--db-danger)' }}>{pwError}</p>}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }} htmlFor="current-pw">Current password</label>
            <input id="current-pw" className={inputCls} style={inputStyle} type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }} htmlFor="new-pw">New password</label>
            <input id="new-pw" className={inputCls} style={inputStyle} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }} htmlFor="confirm-pw">Confirm new password</label>
            <input id="confirm-pw" className={inputCls} style={inputStyle} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={updatePassword}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: 'var(--db-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Update password
          </button>
          {pwSaved && <span className="text-sm" style={{ color: 'var(--db-success)' }}>Password updated!</span>}
        </div>
      </div>

      {/* Two-factor authentication */}
      <div
        className="rounded-xl border p-5"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2 className="mb-4 text-sm font-semibold">Two-factor authentication</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mb-2"
              style={{ background: '#fee2e2', color: '#991b1b' }}
            >
              Not enabled
            </span>
            <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>
              Add an extra layer of security to your account with two-factor authentication.
            </p>
          </div>
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ border: '1px solid var(--db-accent)', background: 'transparent', color: 'var(--db-accent)', cursor: 'pointer' }}
          >
            Enable 2FA
          </button>
        </div>
      </div>

      {/* Active sessions */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--db-border)' }}>
          <h2 className="text-sm font-semibold">Active sessions</h2>
        </div>
        {MOCK_SESSIONS.map((session, idx) => (
          <div
            key={session.id}
            className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
            style={{ borderBottom: idx < MOCK_SESSIONS.length - 1 ? '1px solid var(--db-border)' : 'none' }}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{session.device}</span>
                {session.current && (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: '#dcfce7', color: '#166534' }}
                  >
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs" style={{ color: 'var(--db-secondary)' }}>
                {session.location} · Last active: {session.lastActive}
              </p>
            </div>
            {!session.current && (
              <button
                className="rounded-lg px-3 py-1 text-xs font-medium"
                style={{ border: '1px solid var(--db-danger)', color: 'var(--db-danger)', background: 'transparent', cursor: 'pointer' }}
              >
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingTab() {
  const BILLING_HISTORY = [
    { date: '2026-10-01', description: 'Professional Plan — October 2026',  amount: '₦45,000', status: 'Paid' },
    { date: '2026-09-01', description: 'Professional Plan — September 2026', amount: '₦45,000', status: 'Paid' },
    { date: '2026-08-01', description: 'Professional Plan — August 2026',    amount: '₦45,000', status: 'Paid' },
  ];

  const planDisplay = MOCK_HOTEL.subscription.charAt(0).toUpperCase() + MOCK_HOTEL.subscription.slice(1);

  return (
    <div className="flex flex-col gap-6">
      {/* Current plan */}
      <div
        className="rounded-xl border p-5"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2 className="mb-4 text-sm font-semibold">Current plan</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-bold">{planDisplay}</p>
            <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>₦45,000 / month · Renews Nov 1, 2026</p>
          </div>
          <Link
            href="/dashboard/subscription"
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: 'var(--db-accent)', color: '#fff', textDecoration: 'none', display: 'inline-block' }}
          >
            Manage subscription
          </Link>
        </div>
      </div>

      {/* Payment method */}
      <div
        className="rounded-xl border p-5"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <h2 className="mb-4 text-sm font-semibold">Payment method</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-bold"
              style={{ background: '#1d4ed8', color: '#fff', minWidth: 40 }}
            >
              VISA
            </span>
            <span className="text-sm">Visa ending in 4242</span>
          </div>
          <button
            className="rounded-lg px-3 py-2 text-sm font-medium"
            style={{ border: '1px solid var(--db-border)', background: 'var(--db-muted)', color: 'var(--db-primary)', cursor: 'pointer' }}
          >
            Update
          </button>
        </div>
      </div>

      {/* Billing history */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--db-border)' }}>
          <h2 className="text-sm font-semibold">Billing history</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--db-muted)' }}>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Date</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Description</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Amount</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {BILLING_HISTORY.map((row, idx) => (
                <tr key={row.date} style={{ background: idx % 2 === 1 ? 'var(--db-muted)' : 'var(--db-surface)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>{row.date}</td>
                  <td className="px-4 py-3">{row.description}</td>
                  <td className="px-4 py-3 font-medium">{row.amount}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ background: '#dcfce7', color: '#166534' }}
                    >
                      {row.status}
                    </span>
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  return (
    <div className="flex flex-col gap-8" style={{ color: 'var(--db-primary)' }}>

      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      {/* Tabs */}
      <div
        className="flex flex-wrap gap-0 border-b"
        style={{ borderColor: 'var(--db-border)' }}
        role="tablist"
        aria-label="Settings tabs"
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.value)}
              className="px-4 py-3 text-sm font-medium transition-colors"
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--db-accent)' : '2px solid transparent',
                color: isActive ? 'var(--db-primary)' : 'var(--db-secondary)',
                cursor: 'pointer',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div role="tabpanel">
        {activeTab === 'general'       && <GeneralTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'security'      && <SecurityTab />}
        {activeTab === 'billing'       && <BillingTab />}
      </div>

    </div>
  );
}
