'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth-context';
import {
  getAdminApplications,
  approveApplication,
  rejectApplication,
  type HotelApplication,
} from '../../../lib/api/applications';

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    PENDING:  { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
    APPROVED: { bg: '#dcfce7', color: '#15803d', label: 'Approved' },
    REJECTED: { bg: '#fee2e2', color: '#b91c1c', label: 'Rejected' },
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

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ padding: '32px 24px' }}>
      <div style={{ height: 28, width: 200, background: 'var(--ad-muted)', borderRadius: 6, marginBottom: 24 }} />
      <div style={{ height: 100, background: 'var(--ad-muted)', borderRadius: 8 }} />
    </div>
  );
}

// ── Reject modal ──────────────────────────────────────────────────────────────

function RejectModal({
  applicationId,
  hotelName,
  onConfirm,
  onCancel,
  loading,
}: {
  applicationId: string;
  hotelName: string;
  onConfirm: (id: string, notes: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [notes, setNotes] = useState('');

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
      }}
    >
      <div
        style={{
          background: 'var(--ad-surface)', borderRadius: 16, padding: 28,
          width: '100%', maxWidth: 440,
          boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
        }}
      >
        <h2 className="text-base font-bold mb-2" style={{ color: 'var(--ad-primary)' }}>
          Reject application
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--ad-secondary)' }}>
          Rejecting <strong>{hotelName}</strong>. Provide feedback so the owner knows what to fix.
        </p>
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--ad-secondary)' }}>
          Reason / feedback
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder="e.g. Documents were unclear, please resubmit with better quality scans."
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
          style={{
            borderColor: 'var(--ad-border)',
            background: 'var(--ad-muted)',
            color: 'var(--ad-primary)',
            resize: 'vertical',
          }}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: 'var(--ad-border)', color: 'var(--ad-secondary)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !notes.trim()}
            onClick={() => onConfirm(applicationId, notes.trim())}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--ad-danger, #dc2626)' }}
          >
            {loading ? 'Rejecting...' : 'Confirm rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HotelVerificationPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [pending, setPending] = useState<HotelApplication[]>([]);
  const [history, setHistory] = useState<HotelApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    Promise.all([
      getAdminApplications({ status: 'PENDING' }),
      getAdminApplications({ status: 'REJECTED' }),
    ])
      .then(([pendingApps, rejectedApps]) => {
        setPending(pendingApps);
        setHistory(rejectedApps.slice(0, 10));
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load verification data.');
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
    setActionError(null);
    try {
      await approveApplication(id);
      setPending(prev => prev.filter(a => a.id !== id));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve application.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async (id: string, notes: string) => {
    setActionLoading(id + '-reject');
    setActionError(null);
    try {
      await rejectApplication(id, notes);
      setPending(prev => prev.filter(a => a.id !== id));
      setRejectModal(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject application.');
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
    <>
      {rejectModal && (
        <RejectModal
          applicationId={rejectModal.id}
          hotelName={rejectModal.name}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectModal(null)}
          loading={actionLoading === rejectModal.id + '-reject'}
        />
      )}

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
            {pending.length} pending
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

        {/* Pending application cards */}
        {pending.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ad-secondary)' }}>
            No applications pending verification.
          </p>
        ) : (
          <div className="space-y-4">
            {pending.map(application => {
              const daysWaiting = Math.floor(
                (now - new Date(application.createdAt).getTime()) / 86400000,
              );
              const ownerName = application.owner
                ? `${application.owner.firstName} ${application.owner.lastName}`.trim()
                : 'Unknown owner';

              return (
                <div
                  key={application.id}
                  className="rounded-xl border p-5 shadow-sm"
                  style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    {/* Application info */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold" style={{ color: 'var(--ad-primary)' }}>
                          {application.name}
                        </h2>
                        {daysWaiting > 3 && (
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ background: '#fef3c7', color: '#92400e' }}
                          >
                            Waiting {daysWaiting} days
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--ad-secondary)' }}>
                        {ownerName}
                        {application.owner?.email && (
                          <span style={{ color: '#9ca3af' }}> &middot; {application.owner.email}</span>
                        )}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--ad-secondary)' }}>
                        {application.city}, {application.state}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--ad-secondary)' }}>
                        Submitted: {application.createdAt.slice(0, 10)}
                      </p>
                    </div>

                    {/* Document links */}
                    {application.documents && application.documents.length > 0 && (
                      <div className="space-y-1.5 min-w-[180px]">
                        <p
                          className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: 'var(--ad-secondary)' }}
                        >
                          Documents
                        </p>
                        {application.documents.map((doc, i) => (
                          <a
                            key={i}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:underline"
                            style={{ color: 'var(--ad-accent, #3d6b4f)' }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            {doc.label || doc.documentType}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 self-start">
                      <button
                        type="button"
                        disabled={actionLoading === application.id + '-approve'}
                        onClick={() => handleApprove(application.id)}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        style={{ background: 'var(--ad-success, #16a34a)' }}
                      >
                        {actionLoading === application.id + '-approve' ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        disabled={!!actionLoading}
                        onClick={() => setRejectModal({ id: application.id, name: application.name })}
                        className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
                        style={{ borderColor: 'var(--ad-danger, #dc2626)', color: 'var(--ad-danger, #dc2626)' }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {/* Image thumbnails */}
                  {application.images && application.images.length > 0 && (
                    <div className="mt-4">
                      <p
                        className="text-xs font-semibold uppercase tracking-wide mb-2"
                        style={{ color: 'var(--ad-secondary)' }}
                      >
                        Photos
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {application.images.map((img, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={img.url}
                            alt={img.caption ?? `Hotel photo ${i + 1}`}
                            style={{
                              height: 72,
                              width: 'auto',
                              borderRadius: 8,
                              border: '1px solid var(--ad-border)',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Room type summary */}
                  {application.rooms && application.rooms.length > 0 && (
                    <div className="mt-4">
                      <p
                        className="text-xs font-semibold uppercase tracking-wide mb-2"
                        style={{ color: 'var(--ad-secondary)' }}
                      >
                        Room types ({application.rooms.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {application.rooms.map((room, i) => (
                          <span
                            key={i}
                            className="rounded-full px-3 py-0.5 text-xs font-medium"
                            style={{ background: 'var(--ad-muted)', color: 'var(--ad-secondary)' }}
                          >
                            {room.name} &middot; {room.bedType} &middot; &#8358;{Number(room.pricePerNight).toLocaleString()}/night
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* History table (recently rejected) */}
        <div
          className="rounded-xl border shadow-sm"
          style={{ background: 'var(--ad-surface)', borderColor: 'var(--ad-border)' }}
        >
          <div className="border-b px-5 py-4" style={{ borderColor: 'var(--ad-border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--ad-primary)' }}>
              Recently Rejected
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--ad-muted)' }}>
                  {['Hotel', 'Owner', 'City', 'Status', 'Rejected on'].map(h => (
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
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-sm"
                      style={{ color: 'var(--ad-secondary)' }}
                    >
                      No rejected applications.
                    </td>
                  </tr>
                ) : (
                  history.map((application, idx) => (
                    <tr
                      key={application.id}
                      style={{ borderTop: idx === 0 ? undefined : '1px solid var(--ad-border)' }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--ad-primary)' }}>
                        {application.name}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--ad-secondary)' }}>
                        {application.owner
                          ? `${application.owner.firstName} ${application.owner.lastName}`.trim()
                          : '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--ad-secondary)' }}>
                        {application.city}
                      </td>
                      <td className="px-4 py-3">{statusBadge(application.status)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--ad-secondary)' }}>
                        {application.updatedAt?.slice(0, 10) ?? '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
