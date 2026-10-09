'use client';

import React, { useState } from 'react';
import { MOCK_COMPLAINTS } from '../mock/data';
import type { Complaint } from '../types';

type StatusFilter = 'All' | 'Open' | 'In Progress' | 'Resolved';

const PRIORITY_STYLES: Record<Complaint['priority'], { bg: string; color: string }> = {
  High:   { bg: '#fee2e2', color: '#991b1b' },
  Medium: { bg: '#fef3c7', color: '#92400e' },
  Low:    { bg: '#dcfce7', color: '#166534' },
};

const STATUS_STYLES: Record<Complaint['status'], { bg: string; color: string }> = {
  'Open':        { bg: '#fee2e2', color: '#991b1b' },
  'In Progress': { bg: '#fef3c7', color: '#92400e' },
  'Resolved':    { bg: '#dcfce7', color: '#166534' },
};

export default function ComplaintsPage() {
  const [complaints,  setComplaints]  = useState<Complaint[]>(MOCK_COMPLAINTS);
  const [filter,      setFilter]      = useState<StatusFilter>('All');
  const [expandedId,  setExpandedId]  = useState<string | null>(null);

  const filtered = filter === 'All'
    ? complaints
    : complaints.filter(c => c.status === filter);

  function toggleExpand(id: string) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  function updateStatus(id: string, status: Complaint['status']) {
    setComplaints(prev =>
      prev.map(c => (c.id === id ? { ...c, status } : c)),
    );
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
    });
  }

  const STATUS_FILTERS: StatusFilter[] = ['All', 'Open', 'In Progress', 'Resolved'];

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: 'var(--db-bg)', color: 'var(--db-primary)' }}
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--db-primary)' }}>
          Complaints
        </h1>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ background: 'var(--db-muted)', color: 'var(--db-secondary)' }}
        >
          {complaints.length}
        </span>
      </div>

      {/* Filter */}
      <div className="mb-5 flex items-center gap-2">
        <label className="text-sm font-medium" style={{ color: 'var(--db-secondary)' }}>
          Status:
        </label>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as StatusFilter)}
          className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2"
          style={{
            borderColor: 'var(--db-border)',
            color:       'var(--db-primary)',
            background:  'var(--db-surface)',
          }}
        >
          {STATUS_FILTERS.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--db-secondary)' }}>
          No complaints match the selected filter.
        </p>
      ) : (
        <div
          className="overflow-hidden rounded-xl border"
          style={{
            background:  'var(--db-surface)',
            borderColor: 'var(--db-border)',
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b text-left text-xs font-semibold uppercase tracking-wide"
                style={{ borderColor: 'var(--db-border)', color: 'var(--db-secondary)' }}
              >
                <th className="px-5 py-3">Guest Name</th>
                <th className="px-5 py-3">Room</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => {
                const isExpanded = expandedId === c.id;
                const isEven     = idx % 2 === 0;
                const pStyle     = PRIORITY_STYLES[c.priority];
                const sStyle     = STATUS_STYLES[c.status];

                return (
                  <React.Fragment key={c.id}>
                    {/* Main row */}
                    <tr
                      className="border-b cursor-pointer transition-colors"
                      style={{
                        borderColor: 'var(--db-border)',
                        background:  isExpanded ? 'var(--db-muted)' : isEven ? 'var(--db-surface)' : 'var(--db-bg)',
                      }}
                      onClick={() => toggleExpand(c.id)}
                      onMouseEnter={e => {
                        if (!isExpanded)
                          (e.currentTarget as HTMLElement).style.background = 'var(--db-muted)';
                      }}
                      onMouseLeave={e => {
                        if (!isExpanded)
                          (e.currentTarget as HTMLElement).style.background =
                            isEven ? 'var(--db-surface)' : 'var(--db-bg)';
                      }}
                    >
                      <td className="px-5 py-3 font-medium" style={{ color: 'var(--db-primary)' }}>
                        {c.guestName}
                      </td>
                      <td className="px-5 py-3" style={{ color: 'var(--db-secondary)' }}>
                        {c.roomNumber}
                      </td>
                      <td className="px-5 py-3" style={{ color: 'var(--db-secondary)' }}>
                        {formatDate(c.date)}
                      </td>
                      <td className="px-5 py-3" style={{ color: 'var(--db-secondary)' }}>
                        {c.category}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ background: pStyle.bg, color: pStyle.color }}
                        >
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ background: sStyle.bg, color: sStyle.color }}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr
                        style={{
                          background: 'var(--db-muted)',
                          borderBottom: `1px solid var(--db-border)`,
                        }}
                      >
                        <td colSpan={6} className="px-5 py-4">
                          <p
                            className="mb-4 text-sm leading-relaxed"
                            style={{ color: 'var(--db-primary)' }}
                          >
                            {c.description}
                          </p>
                          <div className="flex gap-2">
                            {c.status === 'Open' && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  updateStatus(c.id, 'In Progress');
                                }}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                                style={{ background: 'var(--db-warning)' }}
                              >
                                Mark In Progress
                              </button>
                            )}
                            {(c.status === 'Open' || c.status === 'In Progress') && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  updateStatus(c.id, 'Resolved');
                                }}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                                style={{ background: 'var(--db-success)' }}
                              >
                                Mark Resolved
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
