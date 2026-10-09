'use client';

import React, { useState } from 'react';
import { MOCK_STAFF } from '../mock/data';
import type { StaffMember, StaffRole } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<StaffRole, string> = {
  owner:        '#292524',
  manager:      '#1e3a5f',
  receptionist: '#166534',
  staff:        '#44403c',
};

const ROLE_LABELS: Record<StaffRole, string> = {
  owner:        'Owner',
  manager:      'Manager',
  receptionist: 'Receptionist',
  staff:        'Staff',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  }) + ' ' + d.toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ── Invite Modal ───────────────────────────────────────────────────────────────

type InviteModalProps = {
  onClose: () => void;
  onInvite: (name: string, email: string, role: StaffRole) => void;
};

function InviteModal({ onClose, onInvite }: InviteModalProps) {
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [role,  setRole]  = useState<StaffRole>('staff');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('All fields are required.');
      return;
    }
    setError('');
    onInvite(name.trim(), email.trim(), role);
  }

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.50)' }}
      onClick={onClose}
    >
      {/* card */}
      <div
        className="relative w-full max-w-md rounded-xl p-6 shadow-xl"
        style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2
          className="mb-4 text-lg font-semibold"
          style={{ color: 'var(--db-primary)' }}
        >
          Invite Staff Member
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label
              className="text-sm font-medium"
              style={{ color: 'var(--db-secondary)' }}
            >
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Amara Obi"
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              style={{
                borderColor: 'var(--db-border)',
                color:       'var(--db-primary)',
                background:  'var(--db-bg)',
              }}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label
              className="text-sm font-medium"
              style={{ color: 'var(--db-secondary)' }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. amara@ekosignature.ng"
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              style={{
                borderColor: 'var(--db-border)',
                color:       'var(--db-primary)',
                background:  'var(--db-bg)',
              }}
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1">
            <label
              className="text-sm font-medium"
              style={{ color: 'var(--db-secondary)' }}
            >
              Role
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as StaffRole)}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
              style={{
                borderColor: 'var(--db-border)',
                color:       'var(--db-primary)',
                background:  'var(--db-bg)',
              }}
            >
              <option value="manager">Manager</option>
              <option value="receptionist">Receptionist</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'var(--db-danger)' }}>{error}</p>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
              style={{
                borderColor: 'var(--db-border)',
                color:       'var(--db-secondary)',
                background:  'transparent',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'var(--db-accent)' }}
            >
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const PERMISSIONS: { label: string; owner: boolean; manager: boolean; receptionist: boolean; staff: boolean }[] = [
  { label: 'View Dashboard',       owner: true,  manager: true,  receptionist: true,  staff: true  },
  { label: 'Manage Reservations',  owner: true,  manager: true,  receptionist: true,  staff: false },
  { label: 'Check In/Out Guests',  owner: true,  manager: true,  receptionist: true,  staff: false },
  { label: 'Manage Staff',         owner: true,  manager: true,  receptionist: false, staff: false },
  { label: 'View Analytics',       owner: true,  manager: true,  receptionist: false, staff: false },
  { label: 'Manage Rooms',         owner: true,  manager: true,  receptionist: false, staff: false },
  { label: 'Manage Billing',       owner: true,  manager: false, receptionist: false, staff: false },
  { label: 'Hotel Settings',       owner: true,  manager: false, receptionist: false, staff: false },
];

export default function StaffPage() {
  const [staffList,      setStaffList]      = useState<StaffMember[]>(MOCK_STAFF);
  const [inviteOpen,     setInviteOpen]     = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  function handleInvite(name: string, email: string, role: StaffRole) {
    const newMember: StaffMember = {
      id:             'staff-new-' + Date.now(),
      name,
      email,
      role,
      status:         'active',
      lastActive:     new Date().toISOString(),
      avatarInitials: getInitials(name),
    };
    setStaffList(prev => [...prev, newMember]);
    setInviteOpen(false);
  }

  function toggleStatus(id: string) {
    setStaffList(prev =>
      prev.map(s =>
        s.id === id
          ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' }
          : s,
      ),
    );
  }

  function removeMember(id: string) {
    setStaffList(prev => prev.filter(s => s.id !== id));
    setConfirmRemoveId(null);
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: 'var(--db-bg)', color: 'var(--db-primary)' }}
    >
      {/* Modal */}
      {inviteOpen && (
        <InviteModal onClose={() => setInviteOpen(false)} onInvite={handleInvite} />
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--db-primary)' }}>
            Staff
          </h1>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--db-muted)', color: 'var(--db-secondary)' }}
          >
            {staffList.length}
          </span>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--db-accent)' }}
        >
          Invite Staff
        </button>
      </div>

      {/* Table */}
      <div
        className="mb-8 overflow-hidden rounded-xl border"
        style={{
          background:   'var(--db-surface)',
          borderColor:  'var(--db-border)',
        }}
      >
        {staffList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>
              No staff members yet. Invite someone to get started.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b text-left text-xs font-semibold uppercase tracking-wide"
                style={{ borderColor: 'var(--db-border)', color: 'var(--db-secondary)' }}
              >
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last Active</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((member, idx) => {
                const isOwner = member.role === 'owner';
                const isEven  = idx % 2 === 0;
                const isConfirmRemove = confirmRemoveId === member.id;

                return (
                  <tr
                    key={member.id}
                    className="border-b transition-colors last:border-0"
                    style={{
                      borderColor: 'var(--db-border)',
                      background:  isEven ? 'var(--db-surface)' : 'var(--db-bg)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--db-muted)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = isEven
                        ? 'var(--db-surface)'
                        : 'var(--db-bg)';
                    }}
                  >
                    {/* Name + Avatar */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: ROLE_COLORS[member.role] }}
                        >
                          {member.avatarInitials}
                        </div>
                        <span className="font-medium" style={{ color: 'var(--db-primary)' }}>
                          {member.name}
                        </span>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                        style={{ background: ROLE_COLORS[member.role] }}
                      >
                        {ROLE_LABELS[member.role]}
                      </span>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3" style={{ color: 'var(--db-secondary)' }}>
                      {member.email}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={
                          member.status === 'active'
                            ? { background: '#dcfce7', color: '#166534' }
                            : { background: '#fee2e2', color: '#991b1b' }
                        }
                      >
                        {member.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Last Active */}
                    <td className="px-5 py-3" style={{ color: 'var(--db-secondary)' }}>
                      {formatDateTime(member.lastActive)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      {isConfirmRemove ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: 'var(--db-secondary)' }}>
                            Confirm remove?
                          </span>
                          <button
                            onClick={() => removeMember(member.id)}
                            className="rounded px-2 py-1 text-xs font-medium text-white"
                            style={{ background: 'var(--db-danger)' }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmRemoveId(null)}
                            className="rounded border px-2 py-1 text-xs font-medium"
                            style={{ borderColor: 'var(--db-border)', color: 'var(--db-secondary)' }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {/* Deactivate / Reactivate */}
                          <button
                            onClick={() => !isOwner && toggleStatus(member.id)}
                            disabled={isOwner}
                            className="rounded border px-2 py-1 text-xs font-medium transition-opacity"
                            style={{
                              borderColor: 'var(--db-border)',
                              color:       isOwner ? 'var(--db-border)' : 'var(--db-secondary)',
                              cursor:      isOwner ? 'not-allowed' : 'pointer',
                              opacity:     isOwner ? 0.4 : 1,
                            }}
                          >
                            {member.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          </button>

                          {/* Remove */}
                          <button
                            onClick={() => !isOwner && setConfirmRemoveId(member.id)}
                            disabled={isOwner}
                            className="rounded border px-2 py-1 text-xs font-medium transition-opacity"
                            style={{
                              borderColor: isOwner ? 'var(--db-border)' : '#fecaca',
                              color:       isOwner ? 'var(--db-border)' : 'var(--db-danger)',
                              cursor:      isOwner ? 'not-allowed' : 'pointer',
                              opacity:     isOwner ? 0.4 : 1,
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Role Permissions Panel */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{
          background:  'var(--db-surface)',
          borderColor: 'var(--db-border)',
        }}
      >
        <div className="border-b px-5 py-4" style={{ borderColor: 'var(--db-border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--db-primary)' }}>
            Role Permissions
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b text-xs font-semibold uppercase tracking-wide"
              style={{ borderColor: 'var(--db-border)', color: 'var(--db-secondary)' }}
            >
              <th className="px-5 py-3 text-left">Permission</th>
              <th className="px-5 py-3 text-center">Owner</th>
              <th className="px-5 py-3 text-center">Manager</th>
              <th className="px-5 py-3 text-center">Receptionist</th>
              <th className="px-5 py-3 text-center">Staff</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((row, idx) => (
              <tr
                key={row.label}
                className="border-b last:border-0"
                style={{
                  borderColor: 'var(--db-border)',
                  background:  idx % 2 === 0 ? 'var(--db-surface)' : 'var(--db-bg)',
                }}
              >
                <td className="px-5 py-3" style={{ color: 'var(--db-primary)' }}>
                  {row.label}
                </td>
                {(['owner', 'manager', 'receptionist', 'staff'] as const).map(role => (
                  <td key={role} className="px-5 py-3 text-center text-base font-bold">
                    {row[role] ? (
                      <span style={{ color: 'var(--db-success)' }}>✓</span>
                    ) : (
                      <span style={{ color: 'var(--db-secondary)' }}>✗</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
