import React from 'react';

export const instant = false;

// ── Mock audit log ─────────────────────────────────────────────────────────────

type AuditAction =
  | 'Hotel approved'
  | 'Hotel suspended'
  | 'Payout processed'
  | 'User suspended'
  | 'Subscription changed'
  | 'Booking cancelled'
  | 'Review removed'
  | 'System event';

type AuditLog = {
  id: string;
  timestamp: string;
  admin: string;
  action: AuditAction;
  target: string;
  details: string;
  ip: string;
};

const AUDIT_LOGS: AuditLog[] = [
  { id: 'al-001', timestamp: '2025-11-10 09:14:32', admin: 'Super Admin', action: 'Hotel approved', target: 'Transcorp Hilton Annex', details: 'Verification documents reviewed and accepted', ip: '105.112.44.21' },
  { id: 'al-002', timestamp: '2025-11-10 08:52:11', admin: 'Super Admin', action: 'Payout processed', target: 'Eko Signature Hotel', details: '₦450,000 transferred to GTBank •••• 1234', ip: '105.112.44.21' },
  { id: 'al-003', timestamp: '2025-11-09 16:33:44', admin: 'Super Admin', action: 'Hotel suspended', target: 'XYZ Guesthouse Lagos', details: 'Multiple guest complaints unresolved', ip: '105.112.44.21' },
  { id: 'al-004', timestamp: '2025-11-09 14:20:08', admin: 'Super Admin', action: 'User suspended', target: 'user@example.com', details: 'Fraudulent booking activity detected', ip: '105.112.44.21' },
  { id: 'al-005', timestamp: '2025-11-09 11:05:19', admin: 'Super Admin', action: 'Subscription changed', target: 'Abuja Continental', details: 'Plan upgraded: starter → professional', ip: '105.112.44.21' },
  { id: 'al-006', timestamp: '2025-11-09 09:38:00', admin: 'Super Admin', action: 'Hotel approved', target: 'Benin Palace Hotel', details: 'All required documents verified', ip: '105.112.44.21' },
  { id: 'al-007', timestamp: '2025-11-08 17:45:22', admin: 'System', action: 'System event', target: 'Platform', details: 'Scheduled maintenance completed successfully', ip: '127.0.0.1' },
  { id: 'al-008', timestamp: '2025-11-08 15:12:39', admin: 'Super Admin', action: 'Review removed', target: 'Eko Hotels & Suites', details: 'Spam review removed — policy violation', ip: '105.112.44.21' },
  { id: 'al-009', timestamp: '2025-11-08 13:04:55', admin: 'Super Admin', action: 'Booking cancelled', target: 'HOS-10010', details: 'Admin override — guest request', ip: '105.112.44.21' },
  { id: 'al-010', timestamp: '2025-11-08 11:30:17', admin: 'Super Admin', action: 'Payout processed', target: 'Port Harcourt Grandeur', details: '₦171,000 transferred to UBA •••• 7890', ip: '105.112.44.21' },
  { id: 'al-011', timestamp: '2025-11-07 16:50:03', admin: 'Super Admin', action: 'Hotel suspended', target: 'Sokoto Oasis Hotel', details: 'Failure to meet quality standards after review period', ip: '105.112.44.21' },
  { id: 'al-012', timestamp: '2025-11-07 14:22:41', admin: 'Super Admin', action: 'Hotel approved', target: 'Calabar Heritage Inn', details: 'Passed inspection — approved for listing', ip: '105.112.44.21' },
  { id: 'al-013', timestamp: '2025-11-07 10:15:28', admin: 'Super Admin', action: 'User suspended', target: 'spammer@test.com', details: 'Multiple fraudulent reviews detected', ip: '105.112.44.21' },
  { id: 'al-014', timestamp: '2025-11-06 15:44:09', admin: 'System', action: 'System event', target: 'Database', details: 'Automated backup completed — 2.4GB', ip: '127.0.0.1' },
  { id: 'al-015', timestamp: '2025-11-06 13:08:52', admin: 'Super Admin', action: 'Subscription changed', target: 'Lekki Boutique Hotel', details: 'Plan upgraded: professional → enterprise', ip: '105.112.44.21' },
  { id: 'al-016', timestamp: '2025-11-06 10:30:14', admin: 'Super Admin', action: 'Hotel approved', target: 'Makurdi Gateway Hotel', details: 'Documentation complete, property verified on-site', ip: '105.112.44.21' },
  { id: 'al-017', timestamp: '2025-11-05 17:00:00', admin: 'Super Admin', action: 'Review removed', target: 'Transcorp Hilton Abuja', details: 'Defamatory content removed — legal request', ip: '105.112.44.21' },
  { id: 'al-018', timestamp: '2025-11-05 14:55:30', admin: 'Super Admin', action: 'Booking cancelled', target: 'HOS-10007', details: 'Hotel requested cancellation — maintenance', ip: '105.112.44.21' },
  { id: 'al-019', timestamp: '2025-11-05 11:20:48', admin: 'Super Admin', action: 'Payout processed', target: 'Abuja Continental', details: '₦522,000 transferred to Zenith Bank •••• 9012', ip: '105.112.44.21' },
  { id: 'al-020', timestamp: '2025-11-04 09:00:00', admin: 'System', action: 'System event', target: 'Platform', details: 'Subscription renewal reminders sent — 14 hotels', ip: '127.0.0.1' },
];

// ── Action color coding ────────────────────────────────────────────────────────

function getActionStyle(action: AuditAction): React.CSSProperties {
  const map: Partial<Record<AuditAction, React.CSSProperties>> = {
    'Hotel approved':       { borderLeft: '4px solid var(--ad-success)' },
    'Hotel suspended':      { borderLeft: '4px solid var(--ad-danger)' },
    'User suspended':       { borderLeft: '4px solid var(--ad-danger)' },
    'Payout processed':     { borderLeft: '4px solid var(--ad-accent)' },
    'Subscription changed': { borderLeft: '4px solid var(--ad-warning)' },
    'System event':         { borderLeft: '4px solid #9ca3af' },
    'Review removed':       { borderLeft: '4px solid var(--ad-warning)' },
    'Booking cancelled':    { borderLeft: '4px solid var(--ad-danger)' },
  };
  return map[action] ?? {};
}

function ActionBadge({ action }: { action: AuditAction }) {
  const colorMap: Partial<Record<AuditAction, { bg: string; color: string }>> = {
    'Hotel approved':       { bg: '#dcfce7', color: '#15803d' },
    'Hotel suspended':      { bg: '#fee2e2', color: '#dc2626' },
    'User suspended':       { bg: '#fee2e2', color: '#dc2626' },
    'Payout processed':     { bg: '#dbeafe', color: '#1d4ed8' },
    'Subscription changed': { bg: '#fef3c7', color: '#b45309' },
    'System event':         { bg: '#f3f4f6', color: '#6b7280' },
    'Review removed':       { bg: '#fef3c7', color: '#b45309' },
    'Booking cancelled':    { bg: '#fee2e2', color: '#dc2626' },
  };
  const s = colorMap[action] ?? { bg: '#f3f4f6', color: '#374151' };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: '11px',
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: '4px',
        whiteSpace: 'nowrap',
      }}
    >
      {action}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminAuditPage() {
  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--ad-primary)', margin: 0 }}>
            Audit Logs
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--ad-secondary)', margin: '6px 0 0' }}>
            Full trail of all admin actions and system events.
          </p>
        </div>
        <button
          type="button"
          style={{
            background: 'var(--ad-muted)',
            border: '1px solid var(--ad-border)',
            color: 'var(--ad-primary)',
            padding: '9px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {[
          { label: 'Total Events', value: String(AUDIT_LOGS.length) },
          { label: 'Events Today', value: '3' },
        ].map(s => (
          <div
            key={s.label}
            style={{
              background: 'var(--ad-surface)',
              border: '1px solid var(--ad-border)',
              borderRadius: '12px',
              padding: '20px 28px',
              minWidth: '160px',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--ad-secondary)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--ad-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div
        style={{
          background: 'var(--ad-surface)',
          border: '1px solid var(--ad-border)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        {/* Date range */}
        <label htmlFor="auditFrom" style={{ fontSize: '13px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>From</label>
        <input
          id="auditFrom"
          type="date"
          style={{ border: '1px solid var(--ad-border)', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', color: 'var(--ad-primary)', background: 'white', outline: 'none' }}
        />
        <label htmlFor="auditTo" style={{ fontSize: '13px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>To</label>
        <input
          id="auditTo"
          type="date"
          style={{ border: '1px solid var(--ad-border)', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', color: 'var(--ad-primary)', background: 'white', outline: 'none' }}
        />

        {/* Action type select */}
        <select
          aria-label="Filter by action type"
          style={{ border: '1px solid var(--ad-border)', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', color: 'var(--ad-primary)', background: 'white', outline: 'none' }}
        >
          <option value="">All actions</option>
          <option value="hotel_approved">Hotel approved</option>
          <option value="hotel_suspended">Hotel suspended</option>
          <option value="booking_cancelled">Booking cancelled</option>
          <option value="user_suspended">User suspended</option>
          <option value="payout_processed">Payout processed</option>
          <option value="system">System event</option>
        </select>

        {/* User filter */}
        <input
          type="text"
          placeholder="Filter by user…"
          aria-label="Filter by user"
          style={{ border: '1px solid var(--ad-border)', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', color: 'var(--ad-primary)', background: 'white', outline: 'none', minWidth: '160px' }}
        />
      </div>

      {/* Audit log table */}
      <div
        style={{
          background: 'var(--ad-surface)',
          border: '1px solid var(--ad-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--ad-muted)' }}>
                {['Timestamp', 'Admin', 'Action', 'Target', 'Details', 'IP Address'].map(col => (
                  <th
                    key={col}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--ad-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--ad-border)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOGS.map(log => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: '1px solid var(--ad-border)',
                    ...getActionStyle(log.action),
                  }}
                >
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>
                    {log.timestamp}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--ad-primary)', whiteSpace: 'nowrap' }}>
                    {log.admin}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <ActionBadge action={log.action} />
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--ad-primary)', minWidth: '160px' }}>
                    {log.target}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--ad-secondary)', minWidth: '240px', lineHeight: '1.4' }}>
                    {log.details}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>
                    {log.ip}
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
