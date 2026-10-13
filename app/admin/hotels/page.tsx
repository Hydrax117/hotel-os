'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import {
  getAdminHotels,
  approveHotel,
  suspendHotel,
  type AdminHotel,
} from '../../lib/api/admin';

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    APPROVED:  { bg: '#dcfce7', color: '#15803d', label: 'Approved' },
    PENDING:   { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
    SUSPENDED: { bg: '#fee2e2', color: '#b91c1c', label: 'Suspended' },
    REJECTED:  { bg: '#f3f4f6', color: '#374151', label: 'Rejected' },
  };
  const key = status.toUpperCase();
  const s = map[key] ?? { bg: '#f3f4f6', color: '#374151', label: status };
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function planBadge(plan: string) {
  const map: Record<string, { bg: string; color: string }> = {
    STARTER:      { bg: '#f3f4f6', color: '#374151' },
    starter:      { bg: '#f3f4f6', color: '#374151' },
    PROFESSIONAL: { bg: '#dbeafe', color: '#1d4ed8' },
    professional: { bg: '#dbeafe', color: '#1d4ed8' },
    ENTERPRISE:   { bg: '#ede9fe', color: '#6d28d9' },
    enterprise:   { bg: '#ede9fe', color: '#6d28d9' },
  };
  const s = map[plan] ?? { bg: '#f3f4f6', color: '#374151' };
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

// ── Inner page (needs useSearchParams, must be inside Suspense) ───────────────

function AdminHotelsInner() {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const statusFilter = searchParams.get('status') ?? '';
  const query = searchParams.get('q') ?? '';

  const [hotels, setHotels] = useState<AdminHotel[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const tabs: { label: string; value: string; apiValue: string | undefined }[] = [
    { label: 'All',       value: '',          apiValue: undefined },
    { label: 'Approved',  value: 'APPROVED',  apiValue: 'APPROVED' },
    { label: 'Pending',   value: 'PENDING',   apiValue: 'PENDING' },
    { label: 'Suspended', value: 'SUSPENDED', apiValue: 'SUSPENDED' },
    { label: 'Rejected',  value: 'REJECTED',  apiValue: 'REJECTED' },
  ];

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const apiStatus = tabs.find(t => t.value === statusFilter)?.apiValue;
    getAdminHotels({
      status: apiStatus,
      q: query || undefined,
      limit: 20,
    })
      .then(res => {
        setHotels(res.hotels);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load hotels');
      })
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, query]);

  useEffect(() => {
    if (!authLoading && user?.role === 'SUPER_ADMIN') {
      load();
    }
  }, [authLoading, user, load]);

  const handleApprove = async (id: string) => {
    setActionLoading(id + '-approve');
    try {
      await approveHotel(id, { status: 'APPROVED' });
      load();
    } catch {
      // ignore — refresh anyway
      load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (id: string) => {
    setActionLoading(id + '-suspend');
    try {
      await suspendHotel(id, 'Suspended by admin');
      load();
    } catch {
      load();
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold" style={{ color: 'var(--ad-primary)' }}>Hotels</h1>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--ad-muted)', color: 'var(--ad-secondary)' }}
          >
            {total}
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
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() =>
                router.push(tab.value ? `/admin/hotels?status=${tab.value}` : '/admin/hotels')
              }
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                color: isActive ? 'var(--ad-accent)' : 'var(--ad-secondary)',
                borderBottom: isActive ? '2px solid var(--ad-accent)' : '2px solid transparent',
                marginBottom: '-1px',
                background: 'transparent',
                border: 'none',
                borderBottomWidth: '2px',
                borderBottomStyle: 'solid',
                borderBottomColor: isActive ? 'var(--ad-accent)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div>
        <input
          type="search"
          placeholder="Search hotels by name…"
          defaultValue={query}
          className="w-full max-w-sm rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--ad-border)', color: 'var(--ad-primary)' }}
          aria-label="Search hotels"
          onChange={e => {
            const val = e.target.value;
            const params = new URLSearchParams(searchParams.toString());
            if (val) {
              params.set('q', val);
            } else {
              params.delete('q');
            }
            router.push(`/admin/hotels?${params.toString()}`);
          }}
        />
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
                  {['Hotel Name', 'Owner', 'City', 'Plan', 'Status', 'Bookings', 'Active', 'Actions'].map(h => (
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
                {hotels.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-sm" style={{ color: 'var(--ad-secondary)' }}>
                      No hotels found.
                    </td>
                  </tr>
                ) : (
                  hotels.map((hotel, idx) => (
                    <tr
                      key={hotel.id}
                      style={{ borderTop: idx === 0 ? undefined : `1px solid var(--ad-border)` }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--ad-primary)' }}>
                        {hotel.name}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--ad-secondary)' }}>
                        {hotel.owner ? (
                          <>
                            <div>{hotel.owner.firstName} {hotel.owner.lastName}</div>
                            <div className="text-xs">{hotel.owner.email}</div>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--ad-secondary)' }}>
                        {hotel.city}, {hotel.state}
                      </td>
                      <td className="px-4 py-3">{planBadge(hotel.subscriptionPlan)}</td>
                      <td className="px-4 py-3">{statusBadge(hotel.verificationStatus)}</td>
                      <td className="px-4 py-3 text-right" style={{ color: 'var(--ad-primary)' }}>
                        {hotel._count?.bookings ?? 0}
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
                        {hotel.verificationStatus.toUpperCase() === 'APPROVED' && (
                          <button
                            type="button"
                            disabled={actionLoading === hotel.id + '-suspend'}
                            onClick={() => handleSuspend(hotel.id)}
                            className="rounded border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                            style={{ borderColor: 'var(--ad-danger)', color: 'var(--ad-danger)' }}
                          >
                            Suspend
                          </button>
                        )}
                        {hotel.verificationStatus.toUpperCase() === 'PENDING' && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={actionLoading === hotel.id + '-approve'}
                              onClick={() => handleApprove(hotel.id)}
                              className="rounded px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                              style={{ background: 'var(--ad-success)' }}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={!!actionLoading}
                              onClick={() => approveHotel(hotel.id, { status: 'REJECTED' }).then(load)}
                              className="rounded border px-2 py-1 text-xs font-medium disabled:opacity-50"
                              style={{ borderColor: 'var(--ad-danger)', color: 'var(--ad-danger)' }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {hotel.verificationStatus.toUpperCase() === 'SUSPENDED' && (
                          <button
                            type="button"
                            disabled={!!actionLoading}
                            onClick={() => approveHotel(hotel.id, { status: 'APPROVED' }).then(load)}
                            className="rounded border px-2 py-1 text-xs font-medium disabled:opacity-50"
                            style={{ borderColor: 'var(--ad-success)', color: 'var(--ad-success)' }}
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination footer */}
        <div
          className="border-t px-4 py-3 text-xs"
          style={{ borderColor: 'var(--ad-border)', color: 'var(--ad-secondary)' }}
        >
          Showing 1–{hotels.length} of {total}
        </div>
      </div>
    </div>
  );
}

// ── Default export with Suspense wrapper (required for useSearchParams) ────────

export default function AdminHotelsPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AdminHotelsInner />
    </Suspense>
  );
}
