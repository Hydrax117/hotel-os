'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import {
  getAdminUsers,
  suspendUser,
  reactivateUser,
  type AdminUser,
} from '../../lib/api/admin';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function roleBadge(role: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    TRAVELER:    { bg: '#f3f4f6', color: '#374151', label: 'Traveler' },
    traveler:    { bg: '#f3f4f6', color: '#374151', label: 'Traveler' },
    HOTEL_OWNER: { bg: '#dbeafe', color: '#1d4ed8', label: 'Hotel Owner' },
    hotel_owner: { bg: '#dbeafe', color: '#1d4ed8', label: 'Hotel Owner' },
    SUPER_ADMIN: { bg: '#ede9fe', color: '#6d28d9', label: 'Admin' },
    admin:       { bg: '#ede9fe', color: '#6d28d9', label: 'Admin' },
    HOTEL_MANAGER: { bg: '#dbeafe', color: '#1d4ed8', label: 'Manager' },
    HOTEL_STAFF:   { bg: '#f3f4f6', color: '#374151', label: 'Staff' },
  };
  const s = map[role] ?? { bg: '#f3f4f6', color: '#374151', label: role };
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
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

// ── Inner page (needs useSearchParams) ───────────────────────────────────────

function AdminUsersInner() {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const roleFilter = searchParams.get('role') ?? '';

  const tabs: { label: string; value: string; apiRole: string | undefined }[] = [
    { label: 'All',          value: '',           apiRole: undefined },
    { label: 'Travelers',    value: 'TRAVELER',   apiRole: 'TRAVELER' },
    { label: 'Hotel Owners', value: 'HOTEL_OWNER', apiRole: 'HOTEL_OWNER' },
    { label: 'Admins',       value: 'SUPER_ADMIN', apiRole: 'SUPER_ADMIN' },
  ];

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const apiRole = tabs.find(t => t.value === roleFilter)?.apiRole;
    getAdminUsers({ role: apiRole, limit: 20 })
      .then(res => {
        setUsers(res.users);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      })
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  useEffect(() => {
    if (!authLoading && user?.role === 'SUPER_ADMIN') {
      load();
    }
  }, [authLoading, user, load]);

  const handleSuspend = async (id: string) => {
    setActionLoading(id + '-suspend');
    setActionError(null);
    try {
      await suspendUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: false } : u));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to suspend user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (id: string) => {
    setActionLoading(id + '-reactivate');
    setActionError(null);
    try {
      await reactivateUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: true } : u));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to reactivate user');
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading) return <LoadingSkeleton />;

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div style={{ padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--ad-secondary)' }}>Access denied. Super admin role required.</p>
      </div>
    );
  }

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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold" style={{ color: 'var(--ad-primary)' }}>Users</h1>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ background: 'var(--ad-muted)', color: 'var(--ad-secondary)' }}
        >
          {total}
        </span>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}
        >
          {actionError}
        </div>
      )}

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
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() =>
                router.push(tab.value ? `/admin/users?role=${tab.value}` : '/admin/users')
              }
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                color: isActive ? 'var(--ad-accent)' : 'var(--ad-secondary)',
                background: 'transparent',
                border: 'none',
                borderBottomWidth: '2px',
                borderBottomStyle: 'solid',
                borderBottomColor: isActive ? 'var(--ad-accent)' : 'transparent',
                marginBottom: '-1px',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div
        className="rounded-xl border shadow-sm"
        style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
      >
        {isLoading ? (
          <div style={{ padding: 24 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: 40, background: 'var(--ad-muted)', borderRadius: 6, marginBottom: 8 }} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--ad-muted)' }}>
                  {['Name', 'Email', 'Role', 'Joined', 'Bookings', 'Status', 'Actions'].map(h => (
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
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm" style={{ color: 'var(--ad-secondary)' }}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u, idx) => (
                    <tr
                      key={u.id}
                      style={{ borderTop: idx === 0 ? undefined : `1px solid var(--ad-border)` }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--ad-primary)' }}>
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>
                        {u.email}
                      </td>
                      <td className="px-4 py-3">{roleBadge(u.role)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>
                        {fmtDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ color: 'var(--ad-primary)' }}>
                        {u._count?.bookings ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                          style={
                            u.isActive
                              ? { background: '#dcfce7', color: '#15803d' }
                              : { background: '#f3f4f6', color: '#6b7280' }
                          }
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
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
                          {u.isActive ? (
                            <button
                              type="button"
                              disabled={actionLoading === u.id + '-suspend'}
                              onClick={() => handleSuspend(u.id)}
                              className="rounded border px-2 py-1 text-xs font-medium disabled:opacity-50"
                              style={{ borderColor: 'var(--ad-danger)', color: 'var(--ad-danger)' }}
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={actionLoading === u.id + '-reactivate'}
                              onClick={() => handleReactivate(u.id)}
                              className="rounded border px-2 py-1 text-xs font-medium disabled:opacity-50"
                              style={{ borderColor: 'var(--ad-success)', color: 'var(--ad-success)' }}
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Default export with Suspense wrapper ──────────────────────────────────────

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AdminUsersInner />
    </Suspense>
  );
}
