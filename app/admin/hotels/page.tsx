import React from 'react';
import Link from 'next/link';
import { ADMIN_HOTELS } from '../mock';
import type { HotelVerificationStatus, SubscriptionPlan } from '../mock';

export const instant = false;

function fmtNgn(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}m`;
  return `₦${n.toLocaleString()}`;
}

function statusBadge(status: HotelVerificationStatus) {
  const map: Record<HotelVerificationStatus, { bg: string; color: string; label: string }> = {
    pending:   { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
    approved:  { bg: '#dcfce7', color: '#15803d', label: 'Approved' },
    suspended: { bg: '#fee2e2', color: '#b91c1c', label: 'Suspended' },
    rejected:  { bg: '#f3f4f6', color: '#374151', label: 'Rejected' },
  };
  const s = map[status];
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function planBadge(plan: SubscriptionPlan) {
  const map: Record<SubscriptionPlan, { bg: string; color: string }> = {
    starter:      { bg: '#f3f4f6', color: '#374151' },
    professional: { bg: '#dbeafe', color: '#1d4ed8' },
    enterprise:   { bg: '#ede9fe', color: '#6d28d9' },
  };
  const s = map[plan];
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize"
      style={{ background: s.bg, color: s.color }}
    >
      {plan}
    </span>
  );
}

type PageProps = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

export default async function AdminHotelsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status ?? '';
  const query = (params.q ?? '').toLowerCase();

  const tabs: { label: string; value: string }[] = [
    { label: 'All',       value: '' },
    { label: 'Approved',  value: 'approved' },
    { label: 'Pending',   value: 'pending' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Rejected',  value: 'rejected' },
  ];

  const counts: Record<string, number> = {
    '':          ADMIN_HOTELS.length,
    approved:    ADMIN_HOTELS.filter(h => h.verificationStatus === 'approved').length,
    pending:     ADMIN_HOTELS.filter(h => h.verificationStatus === 'pending').length,
    suspended:   ADMIN_HOTELS.filter(h => h.verificationStatus === 'suspended').length,
    rejected:    ADMIN_HOTELS.filter(h => h.verificationStatus === 'rejected').length,
  };

  let filtered = ADMIN_HOTELS;
  if (statusFilter) {
    filtered = filtered.filter(h => h.verificationStatus === statusFilter);
  }
  if (query) {
    filtered = filtered.filter(h => h.name.toLowerCase().includes(query));
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold" style={{ color: 'var(--ad-primary)' }}>Hotels</h1>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--ad-muted)', color: 'var(--ad-secondary)' }}
          >
            {ADMIN_HOTELS.length}
          </span>
        </div>
        <button
          type="button"
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ background: 'var(--ad-accent)' }}
        >
          Add Hotel
        </button>
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1 border-b"
        style={{ borderColor: 'var(--ad-border)' }}
        role="tablist"
        aria-label="Filter hotels by status"
      >
        {tabs.map(tab => {
          const isActive = statusFilter === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/admin/hotels?status=${tab.value}` : '/admin/hotels'}
              role="tab"
              aria-selected={isActive}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                color: isActive ? 'var(--ad-accent)' : 'var(--ad-secondary)',
                borderBottom: isActive ? '2px solid var(--ad-accent)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
              <span
                className="rounded-full px-1.5 py-0.5 text-xs"
                style={{
                  background: isActive ? '#dbeafe' : 'var(--ad-muted)',
                  color: isActive ? 'var(--ad-accent)' : 'var(--ad-secondary)',
                }}
              >
                {counts[tab.value]}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Search bar */}
      <div>
        <input
          type="search"
          placeholder="Search hotels by name…"
          defaultValue={params.q ?? ''}
          className="w-full max-w-sm rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--ad-border)', color: 'var(--ad-primary)' }}
          aria-label="Search hotels"
          readOnly
        />
      </div>

      {/* Table */}
      <div
        className="rounded-xl border shadow-sm"
        style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--ad-muted)' }}>
                {['Hotel Name', 'Owner', 'City', 'Plan', 'Status', 'Bookings', 'Revenue', 'Active', 'Actions'].map(h => (
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
              {filtered.map((hotel, idx) => (
                <tr
                  key={hotel.id}
                  style={{ borderTop: idx === 0 ? undefined : `1px solid var(--ad-border)` }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--ad-primary)' }}>
                    {hotel.name}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ad-secondary)' }}>
                    <div>{hotel.ownerName}</div>
                    <div className="text-xs">{hotel.ownerEmail}</div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ad-secondary)' }}>
                    {hotel.city}, {hotel.state}
                  </td>
                  <td className="px-4 py-3">{planBadge(hotel.subscription)}</td>
                  <td className="px-4 py-3">{statusBadge(hotel.verificationStatus)}</td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--ad-primary)' }}>
                    {hotel.totalBookings}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ad-primary)' }}>
                    {fmtNgn(hotel.totalRevenueNgn)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      style={
                        hotel.isActive
                          ? { background: '#dcfce7', color: '#15803d' }
                          : { background: '#f3f4f6', color: '#6b7280' }
                      }
                    >
                      {hotel.isActive ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {hotel.verificationStatus === 'approved' && (
                      <button
                        type="button"
                        className="rounded border px-2 py-1 text-xs font-medium transition-colors"
                        style={{ borderColor: 'var(--ad-danger)', color: 'var(--ad-danger)' }}
                      >
                        Suspend
                      </button>
                    )}
                    {hotel.verificationStatus === 'pending' && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="rounded px-2 py-1 text-xs font-medium text-white"
                          style={{ background: 'var(--ad-success)' }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded border px-2 py-1 text-xs font-medium"
                          style={{ borderColor: 'var(--ad-danger)', color: 'var(--ad-danger)' }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {hotel.verificationStatus === 'suspended' && (
                      <button
                        type="button"
                        className="rounded border px-2 py-1 text-xs font-medium"
                        style={{ borderColor: 'var(--ad-success)', color: 'var(--ad-success)' }}
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination footer */}
        <div
          className="border-t px-4 py-3 text-xs"
          style={{ borderColor: 'var(--ad-border)', color: 'var(--ad-secondary)' }}
        >
          Showing 1–{filtered.length} of {filtered.length}
        </div>
      </div>
    </div>
  );
}
