'use client';

import React, { useState } from 'react';

// ── Local types ───────────────────────────────────────────────────────────────

type DiscountType = 'percentage' | 'fixed';

type Promotion = {
  id: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  validFrom: string;
  validTo: string;
  conditions: string;
  active: boolean;
  badgeColor: string;
  expired?: boolean;
};

// ── Mock data defined inline ──────────────────────────────────────────────────

const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-001',
    name: 'Early Bird',
    discountType: 'percentage',
    discountValue: 15,
    validFrom: '2025-01-01',
    validTo: '2026-12-31',
    conditions: 'Min. 7 days advance booking',
    active: true,
    badgeColor: '#2563eb',
  },
  {
    id: 'promo-002',
    name: 'Weekend Special',
    discountType: 'percentage',
    discountValue: 10,
    validFrom: '2026-10-01',
    validTo: '2026-12-31',
    conditions: 'Fri–Sun stays only',
    active: true,
    badgeColor: '#7c3aed',
  },
  {
    id: 'promo-003',
    name: 'Long Stay',
    discountType: 'percentage',
    discountValue: 20,
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    conditions: 'Min. 5 nights',
    active: true,
    badgeColor: '#16a34a',
  },
];

const EXPIRED_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-exp-001',
    name: 'New Year Flash',
    discountType: 'percentage',
    discountValue: 25,
    validFrom: '2025-12-28',
    validTo: '2026-01-03',
    conditions: 'All room types',
    active: false,
    badgeColor: '#6b7280',
    expired: true,
  },
  {
    id: 'promo-exp-002',
    name: 'Summer Deal',
    discountType: 'fixed',
    discountValue: 10000,
    validFrom: '2025-07-01',
    validTo: '2025-08-31',
    conditions: 'Deluxe King only',
    active: false,
    badgeColor: '#6b7280',
    expired: true,
  },
];

// ── CSS Toggle component ──────────────────────────────────────────────────────

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
        width: 40,
        height: 22,
        borderRadius: 11,
        background: checked ? 'var(--db-accent)' : 'var(--db-border)',
        border: 'none',
        padding: 2,
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
      aria-label="Toggle promotion active state"
    >
      <span
        style={{
          display: 'block',
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transform: checked ? 'translateX(18px)' : 'translateX(0)',
          transition: 'transform 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDiscount(promo: Promotion): string {
  if (promo.discountType === 'percentage') return `${promo.discountValue}% off`;
  return `₦${promo.discountValue.toLocaleString('en-NG')} off`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>(INITIAL_PROMOTIONS);
  const [formOpen, setFormOpen] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<DiscountType>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState('');
  const [formValidFrom, setFormValidFrom] = useState('');
  const [formValidTo, setFormValidTo] = useState('');
  const [formMinNights, setFormMinNights] = useState('1');
  const [formAdvanceDays, setFormAdvanceDays] = useState('0');
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  function togglePromo(id: string) {
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  }

  function openForm() {
    setFormOpen(true);
    setFormSuccess(false);
    setFormError('');
  }

  function cancelForm() {
    setFormOpen(false);
    resetForm();
  }

  function resetForm() {
    setFormName('');
    setFormDiscountType('percentage');
    setFormDiscountValue('');
    setFormValidFrom('');
    setFormValidTo('');
    setFormMinNights('1');
    setFormAdvanceDays('0');
    setFormError('');
  }

  function savePromo() {
    if (!formName.trim()) { setFormError('Promotion name is required.'); return; }
    if (!formDiscountValue.trim() || isNaN(Number(formDiscountValue))) { setFormError('Enter a valid discount value.'); return; }
    if (!formValidFrom || !formValidTo) { setFormError('Valid from and to dates are required.'); return; }
    const newPromo: Promotion = {
      id: `promo-new-${Date.now()}`,
      name: formName.trim(),
      discountType: formDiscountType,
      discountValue: Number(formDiscountValue),
      validFrom: formValidFrom,
      validTo: formValidTo,
      conditions: `Min. ${formMinNights} nights${formAdvanceDays !== '0' ? `, ${formAdvanceDays} days advance` : ''}`,
      active: true,
      badgeColor: 'var(--db-accent)',
    };
    setPromotions(prev => [newPromo, ...prev]);
    setFormSuccess(true);
    resetForm();
    setTimeout(() => {
      setFormOpen(false);
      setFormSuccess(false);
    }, 1500);
  }

  const inputStyle: React.CSSProperties = {
    borderRadius: 8,
    border: '1px solid var(--db-border)',
    background: 'var(--db-bg)',
    color: 'var(--db-primary)',
    padding: '8px 12px',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  };

  return (
    <div className="flex flex-col gap-8" style={{ color: 'var(--db-primary)' }}>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Promotions</h1>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--db-muted)', color: 'var(--db-secondary)' }}
          >
            {promotions.length}
          </span>
        </div>
        <button
          onClick={openForm}
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ background: 'var(--db-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          + Create promotion
        </button>
      </div>

      {/* Create promotion form */}
      {formOpen && (
        <div
          className="rounded-xl border p-5"
          style={{ background: 'var(--db-surface)', borderColor: 'var(--db-accent)' }}
        >
          <h2 className="mb-4 text-sm font-semibold">New Promotion</h2>
          {formSuccess && (
            <p className="mb-3 text-sm font-medium" style={{ color: 'var(--db-success)' }}>
              Promotion created!
            </p>
          )}
          {formError && (
            <p className="mb-3 text-sm" style={{ color: 'var(--db-danger)' }}>{formError}</p>
          )}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }}>Promotion name *</label>
              <input style={inputStyle} value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Summer Special" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }}>Discount type *</label>
              <div className="flex gap-2">
                {(['percentage', 'fixed'] as DiscountType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setFormDiscountType(t)}
                    className="rounded-full px-4 py-1.5 text-sm font-medium"
                    style={{
                      background: formDiscountType === t ? 'var(--db-accent)' : 'var(--db-muted)',
                      color: formDiscountType === t ? '#fff' : 'var(--db-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {t === 'percentage' ? 'Percentage' : 'Fixed amount'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }}>Discount value *</label>
              <input style={inputStyle} type="number" value={formDiscountValue} onChange={e => setFormDiscountValue(e.target.value)} placeholder={formDiscountType === 'percentage' ? 'e.g. 15' : 'e.g. 5000'} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }}>Min nights</label>
              <select style={inputStyle} value={formMinNights} onChange={e => setFormMinNights(e.target.value)}>
                {[1,2,3,4,5,6,7,14].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }}>Valid from *</label>
              <input style={inputStyle} type="date" value={formValidFrom} onChange={e => setFormValidFrom(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }}>Valid to *</label>
              <input style={inputStyle} type="date" value={formValidTo} onChange={e => setFormValidTo(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--db-secondary)' }}>Advance booking (days)</label>
              <select style={inputStyle} value={formAdvanceDays} onChange={e => setFormAdvanceDays(e.target.value)}>
                {[0,1,2,3,7,14,30,60].map(n => <option key={n} value={n}>{n === 0 ? 'Any time' : `${n} days`}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={savePromo}
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ background: 'var(--db-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Save promotion
            </button>
            <button
              onClick={cancelForm}
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ background: 'var(--db-muted)', color: 'var(--db-secondary)', border: '1px solid var(--db-border)', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active promotions */}
      <div className="flex flex-col gap-4">
        {promotions.map(promo => (
          <div
            key={promo.id}
            className="rounded-xl border p-5"
            style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-base">{promo.name}</span>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ background: promo.badgeColor + '20', color: promo.badgeColor }}
                  >
                    {promo.discountType === 'percentage' ? '% off' : '₦ off'}
                  </span>
                </div>
                <p className="text-3xl font-bold" style={{ color: 'var(--db-accent)' }}>
                  {formatDiscount(promo)}
                </p>
                <p className="text-xs" style={{ color: 'var(--db-secondary)' }}>
                  Valid: {promo.validFrom} — {promo.validTo}
                </p>
                <p className="text-xs" style={{ color: 'var(--db-secondary)' }}>
                  {promo.conditions}
                </p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: 'var(--db-secondary)' }}>
                    {promo.active ? 'Active' : 'Inactive'}
                  </span>
                  <CSSToggle checked={promo.active} onChange={() => togglePromo(promo.id)} id={`toggle-${promo.id}`} />
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg px-3 py-1 text-xs font-medium"
                    style={{ background: 'var(--db-muted)', color: 'var(--db-primary)', border: '1px solid var(--db-border)', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-lg px-3 py-1 text-xs font-medium"
                    style={{ background: 'var(--db-muted)', color: 'var(--db-danger)', border: '1px solid var(--db-border)', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expired promotions */}
      <div>
        <button
          onClick={() => setShowExpired(v => !v)}
          className="flex items-center gap-2 text-sm font-medium mb-4"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--db-secondary)' }}
        >
          <span>{showExpired ? '▾' : '▸'}</span>
          {showExpired ? 'Hide expired' : 'Show expired'}
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
            style={{ background: 'var(--db-muted)', color: 'var(--db-secondary)' }}
          >
            {EXPIRED_PROMOTIONS.length}
          </span>
        </button>
        {showExpired && (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--db-surface)', borderColor: 'var(--db-border)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--db-muted)' }}>
                    <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Name</th>
                    <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Discount</th>
                    <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Valid From</th>
                    <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Valid To</th>
                    <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--db-secondary)' }}>Conditions</th>
                  </tr>
                </thead>
                <tbody>
                  {EXPIRED_PROMOTIONS.map((promo, idx) => (
                    <tr key={promo.id} style={{ background: idx % 2 === 1 ? 'var(--db-muted)' : 'var(--db-surface)' }}>
                      <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>{promo.name}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>{formatDiscount(promo)}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>{promo.validFrom}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>{promo.validTo}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--db-secondary)' }}>{promo.conditions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
