import React from 'react';
import Link from 'next/link';
import { ADMIN_USERS } from '../mock';
import type { AdminUser } from '../mock';

export const instant = false;

type RoleType = AdminUser['role'];

function roleBadge(role: RoleType) {
  const map: Record<RoleType, { bg: string; color: string; label: string }> = {
    traveler:    { bg: '#f3f4f6', color: '#374151', label: 'Traveler' },
    hotel_owner: { bg: '#dbeafe', color: '#1d4ed8', label: 'Hotel Owner' },
    admin:       { bg: '#ede9fe', color: '#6d28d9', label: 'Admin' },
  };
  const s = map[role];
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

type PageProps = {
  searchParams: Promise<{ role?: string }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const roleFilter = params.role ?? '';

  const tabs: { label: string; value: string }[] = [
    { label: 'All',          value: '' },
    { label: 'Travelers',    value: 'traveler' },
    { label: 'Hotel Owners', value: 'hotel_owner' },
    { label: 'Admins',       value: 'admin' },
  ];

  const counts: Record<string, number> = {
    '':          ADMIN_USERS.length,
    traveler:    ADMIN_USERS.filter(u => u.role === 'traveler').length,
    hotel_owner: ADMIN_USERS.filter(u => u.role === 'hotel_owner').length,
    admin:       ADMIN_USERS.filter(u => u.role === 'admin').length,
  };

  const filtered = roleFilter
    ? ADMIN_USERS.filter(u => u.role === roleFilter)
    : ADMIN_USERS;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold" style={{ color: 'var(--ad-primary)' }}>Users</h1>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ background: 'var(--ad-muted)', color: 'var(--ad-secondary)' }}
        >
          {ADMIN_USERS.length}
        </span>
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1 border-b"
        style={{ borderColor: 'var(--ad-border)' }}
        role="tablist"
        aria-label="Filter users by role"
      >
        {tabs.map(tab => {
          const isActive = roleFilter === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/admin/users?role=${tab.value}` : '/admin/users'}
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

      {/* Table */}
      <div
        className="rounded-xl border shadow-sm"
        style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--ad-muted)' }}>
                {['Name', 'Email', 'Role', 'Joined', 'Bookings', 'Total Spent', 'Status', 'Actions'].map(h => (
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
              {filtered.map((user, idx) => (
                <tr
                  key={user.id}
                  style={{ borderTop: idx === 0 ? undefined : `1px solid var(--ad-border)` }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--ad-primary)' }}>
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>
                    {user.email}
                  </td>
                  <td className="px-4 py-3">{roleBadge(user.role)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>
                    {user.joinedAt}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--ad-primary)' }}>
                    {user.totalBookings}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ad-primary)' }}>
                    {user.totalSpentNgn > 0 ? `₦${user.totalSpentNgn.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      style={
                        user.isActive
                          ? { background: '#dcfce7', color: '#15803d' }
                          : { background: '#f3f4f6', color: '#6b7280' }
                      }
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
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
                        Suspend
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
