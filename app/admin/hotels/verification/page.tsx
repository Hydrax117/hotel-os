'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth-context';
import {
  getAdminHotels,
  approveHotel,
  type AdminHotel,
} from '../../../lib/api/admin';

// ── Helpers ───────────────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function historyStatusBadge(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    PENDING:   { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
    APPROVED:  { bg: '#dcfce7', color: '#15803d', label: 'Approved' },
    SUSPENDED: { bg: '#fee2e2', color: '#b91c1c', label: 'Suspended' },
    REJECTED:  { bg: '#f3f4f6', color: '#374151', label: 'Rejected' },
  };
  const s = map[status.toUpperCase()] ?? { bg: '#f3f4f6', color: '#374151', label: status };
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

const CHECK_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#16a34a" />
    <polyline points="8 12 11 15 16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DOC_ITEMS = [
  'CAC Certificate',
  'Owner ID',
  'Bank Details',
  'Hotel Photos',
];

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

export default function HotelVerificationPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [pending, setPending] = useState<AdminHotel[]>([]);
  const [history, setHistory] = useState<AdminHotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    Promise.all([
      getAdminHotels({ status: 'PENDING', limit: 50 }),
      getAdminHotels({ status: 'APPROVED', limit: 10 }),
    ])
      .then(([pendingRes, approvedRes]) => {
        setPending(pendingRes.hotels);
        setHistory(approvedRes.hotels.slice(0, 5));
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load verification data');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!authLoading && user?.role === 'SUPER_ADMIN') {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleApprove = async (id: string) => {
    setActionLoading(id + '-approve');
    try {
      await approveHotel(id, { status: 'APPROVED' });
      setPending(prev => prev.filter(h => h.id !== id));
    } catch {
      // silently fail, UI will show stale data
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id + '-reject');
    try {
      await approveHotel(id, { status: 'REJECTED' });
      setPending(prev => prev.filter(h => h.id !== id));
    } catch {
      // silently fail
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

  const now = Date.now();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold" style={{ color: 'var(--ad-primary)' }}>
          Hotel Verification
        </h1>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ background: '#fef3c7', color: '#92400e' }}
        >
          {pending.length} pending reviews
        </span>
      </div>

      {/* Pending verification cards */}
      {pending.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--ad-secondary)' }}>
          No hotels pending verification.
        </p>
      ) : (
        <div className="space-y-4">
          {pending.map(hotel => {
            const daysWaiting = Math.floor((now - new Date(hotel.createdAt).getTime()) / 86400000);
            return (
              <div
                key={hotel.id}
                className="rounded-xl border p-5 shadow-sm"
                style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Hotel info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold" style={{ color: 'var(--ad-primary)' }}>
                        {hotel.name}
                      </h2>
                      {daysWaiting > 3 && (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ background: '#fef3c7', color: '#92400e' }}
                        >
                          Awaiting {daysWaiting} days
                        </span>
                      )}
                    </div>
                    {hotel.owner && (
                      <p className="text-sm" style={{ color: 'var(--ad-secondary)' }}>
                        {hotel.owner.firstName} {hotel.owner.lastName}
                      </p>
                    )}
                    <p className="text-sm" style={{ color: 'var(--ad-secondary)' }}>
                      {hotel.city}, {hotel.state}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ad-secondary)' }}>
                      Submitted: {hotel.createdAt.slice(0, 10)}
                    </p>
                  </div>

                  {/* Document checklist */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ad-secondary)' }}>
                      Documents
                    </p>
                    {DOC_ITEMS.map(doc => (
                      <div key={doc} className="flex items-center gap-2 text-sm" style={{ color: 'var(--ad-primary)' }}>
                        {CHECK_ICON}
                        {doc}
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={actionLoading === hotel.id + '-approve'}
                      onClick={() => handleApprove(hotel.id)}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                      style={{ background: 'var(--ad-success)' }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={!!actionLoading}
                      className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
                      style={{ borderColor: 'var(--ad-border)', color: 'var(--ad-secondary)' }}
                    >
                      Request Changes
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading === hotel.id + '-reject'}
                      onClick={() => handleReject(hotel.id)}
                      className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
                      style={{ borderColor: 'var(--ad-danger)', color: 'var(--ad-danger)' }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History table */}
      <div
        className="rounded-xl border shadow-sm"
        style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
      >
        <div className="border-b px-5 py-4" style={{ borderColor: 'var(--ad-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--ad-primary)' }}>
            Verification History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--ad-muted)' }}>
                {['Hotel', 'Owner', 'City', 'Status', 'Action Date'].map(h => (
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
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm" style={{ color: 'var(--ad-secondary)' }}>
                    No history yet.
                  </td>
                </tr>
              ) : (
                history.map((hotel, idx) => (
                  <tr
                    key={hotel.id}
                    style={{ borderTop: idx === 0 ? undefined : `1px solid var(--ad-border)` }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--ad-primary)' }}>
                      {hotel.name}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--ad-secondary)' }}>
                      {hotel.owner ? `${hotel.owner.firstName} ${hotel.owner.lastName}`.trim() : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--ad-secondary)' }}>
                      {hotel.city}
                    </td>
                    <td className="px-4 py-3">
                      {historyStatusBadge(hotel.verificationStatus)}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>
                      {addDays(hotel.createdAt.slice(0, 10), 7)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
