'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth-context';
import { getMyHotel } from '../../lib/api/dashboard';
import {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  type ApiKey,
  type CreatedApiKey,
} from '../../lib/api/apiKeys';
import { ApiError } from '../../lib/api/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtRelative(iso: string | null) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return fmtDate(iso);
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: copied ? 'var(--db-success)' : 'var(--db-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Create key modal ──────────────────────────────────────────────────────────

function CreateKeyModal({
  hotelId,
  onClose,
  onCreated,
}: {
  hotelId: string;
  onClose: () => void;
  onCreated: (key: CreatedApiKey) => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSubmitting(true); setError('');
    try {
      const created = await createApiKey(hotelId, {
        name: name.trim(),
        ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      });
      onCreated(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create API key.');
    } finally {
      setSubmitting(false);
    }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--db-border)', background: 'var(--db-bg)', color: 'var(--db-primary)', fontSize: 14, outline: 'none' };

  return (
    <div ref={backdropRef} onClick={e => { if (e.target === backdropRef.current) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      role="dialog" aria-modal="true" aria-labelledby="create-key-title"
    >
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--db-surface)', borderRadius: 16, width: '100%', maxWidth: 460, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 id="create-key-title" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--db-primary)' }}>Create API key</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--db-secondary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--db-secondary)', display: 'block', marginBottom: 4 }}>
              Key name <span style={{ color: 'var(--db-accent)' }}>*</span>
            </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Opera PMS, Custom integration" style={inp} required />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--db-secondary)', display: 'block', marginBottom: 4 }}>
              Expiry date <span style={{ fontSize: 12, fontWeight: 400 }}>(optional — leave blank for no expiry)</span>
            </label>
            <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} style={inp} />
          </div>
          {error && <p style={{ fontSize: 13, color: '#dc2626', background: '#fee2e2', borderRadius: 8, padding: '10px 14px', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{ padding: '9px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, border: '1px solid var(--db-border)', background: 'transparent', color: 'var(--db-primary)', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ padding: '9px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', background: 'var(--db-accent)', color: 'white', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Creating…' : 'Create key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Reveal modal (show raw key once) ─────────────────────────────────────────

function RevealModal({ apiKey, onClose }: { apiKey: CreatedApiKey; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      role="dialog" aria-modal="true" aria-labelledby="reveal-key-title"
    >
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--db-surface)', borderRadius: 16, width: '100%', maxWidth: 520, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 id="reveal-key-title" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--db-primary)' }}>API key created</h2>
        </div>

        <p style={{ fontSize: 13, color: 'var(--db-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
          Copy this key now — <strong style={{ color: 'var(--db-primary)' }}>it won't be shown again.</strong> Store it somewhere safe like a password manager or secrets manager.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'var(--db-muted)', border: '1px solid var(--db-border)', marginBottom: 20 }}>
          <code style={{ flex: 1, fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--db-primary)' }}>
            {apiKey.rawKey}
          </code>
          <CopyButton text={apiKey.rawKey} />
        </div>

        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: '#92400e', margin: 0 }}>
            ⚠ This key grants full API access to your hotel. Never commit it to version control or share it publicly.
          </p>
        </div>

        <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: 'none', background: 'var(--db-accent)', color: 'white', cursor: 'pointer' }}>
          I've saved the key
        </button>
      </div>
    </div>
  );
}

// ── Available integrations (static) ──────────────────────────────────────────

const AVAILABLE = [
  { id: 'opera-cloud',      name: 'Opera Cloud',      category: 'PMS',             description: 'Industry-leading property management from Oracle Hospitality.',       initials: 'OC', color: '#dc2626' },
  { id: 'mews',             name: 'Mews',             category: 'PMS',             description: 'Modern cloud PMS built for hospitality teams.',                       initials: 'MW', color: '#0891b2' },
  { id: 'cloudbeds',        name: 'Cloudbeds',        category: 'PMS',             description: 'All-in-one hospitality platform for independent hotels.',              initials: 'CB', color: '#d97706' },
  { id: 'siteminder',       name: 'SiteMinder',       category: 'Channel Manager', description: 'Connect to 450+ booking channels and OTAs globally.',                 initials: 'SM', color: '#16a34a' },
  { id: 'rentals-united',   name: 'Rentals United',   category: 'Channel Manager', description: 'Multi-channel distribution for holiday rentals and hotels.',           initials: 'RU', color: '#0f766e' },
  { id: 'flutterwave',      name: 'Flutterwave',      category: 'Payment',         description: 'Pan-African payment infrastructure for local and international guests.', initials: 'FW', color: '#f97316' },
];

function LogoSquare({ initials, color }: { initials: string; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, background: color, color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }} aria-hidden="true">
      {initials}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const { user } = useAuth();

  const [hotelId, setHotelId] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [revealed, setRevealed] = useState<CreatedApiKey | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getMyHotel().then(hotel => {
      if (!hotel) return;
      setHotelId(hotel.id);
      listApiKeys(hotel.id)
        .then(setKeys)
        .finally(() => setLoadingKeys(false));
    });
  }, [user]);

  async function handleRevoke(keyId: string) {
    if (!hotelId) return;
    setRevoking(keyId);
    try {
      await revokeApiKey(hotelId, keyId);
      setKeys(prev => prev.filter(k => k.id !== keyId));
    } finally {
      setRevoking(null);
    }
  }

  return (
    <div style={{ color: 'var(--db-primary)', display: 'flex', flexDirection: 'column', gap: 40 }}>

      {/* Hero */}
      <div style={{ borderRadius: 16, padding: '32px 40px', background: 'var(--db-sidebar-bg)', backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 20px)', color: '#fff' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Connect your hotel systems</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', maxWidth: 560, lineHeight: 1.6, margin: 0 }}>
          Already using hotel management software? Use your API key to keep rooms, rates, and reservations in sync automatically.
        </p>
      </div>

      {/* API Keys section */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>API Keys</h2>
            <p style={{ fontSize: 13, color: 'var(--db-secondary)', margin: '4px 0 0' }}>Use these to authenticate your PMS or custom integration with our REST API.</p>
          </div>
          {hotelId && (
            <button
              onClick={() => setShowCreate(true)}
              style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', background: 'var(--db-accent)', color: 'white', cursor: 'pointer' }}
            >
              + New key
            </button>
          )}
        </div>

        <div style={{ borderRadius: 12, border: '1px solid var(--db-border)', overflow: 'hidden', background: 'var(--db-surface)' }}>
          {loadingKeys ? (
            <div style={{ padding: 24, color: 'var(--db-secondary)', fontSize: 14 }}>Loading keys…</div>
          ) : keys.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--db-secondary)', margin: '0 0 12px' }}>No API keys yet.</p>
              {hotelId && (
                <button onClick={() => setShowCreate(true)} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid var(--db-accent)', background: 'transparent', color: 'var(--db-accent)', cursor: 'pointer' }}>
                  Create your first key
                </button>
              )}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--db-border)', background: 'var(--db-muted)' }}>
                  {['Name', 'Key', 'Last used', 'Created', 'Expires', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--db-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id} style={{ borderBottom: '1px solid var(--db-border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{k.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <code style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--db-secondary)', background: 'var(--db-muted)', padding: '2px 8px', borderRadius: 4 }}>{k.prefix}</code>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--db-secondary)' }}>{fmtRelative(k.lastUsedAt)}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--db-secondary)' }}>{fmtDate(k.createdAt)}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--db-secondary)' }}>{k.expiresAt ? fmtDate(k.expiresAt) : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleRevoke(k.id)}
                        disabled={revoking === k.id}
                        style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: '1px solid var(--db-danger)', background: 'transparent', color: 'var(--db-danger)', cursor: revoking === k.id ? 'not-allowed' : 'pointer', opacity: revoking === k.id ? 0.6 : 1 }}
                      >
                        {revoking === k.id ? 'Revoking…' : 'Revoke'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* How to use the API */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Using the API</h2>
        <div style={{ borderRadius: 12, border: '1px solid var(--db-border)', background: 'var(--db-surface)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--db-secondary)', margin: 0, lineHeight: 1.6 }}>
            Pass your API key in the <code style={{ fontFamily: 'monospace', background: 'var(--db-muted)', padding: '1px 6px', borderRadius: 4 }}>Authorization</code> header of every request:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 8, background: 'var(--db-muted)', border: '1px solid var(--db-border)' }}>
            <code style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', color: 'var(--db-primary)', wordBreak: 'break-all' }}>
              Authorization: ApiKey hos_live_••••••••••••••••
            </code>
            <CopyButton text="Authorization: ApiKey YOUR_API_KEY" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <a href={`${process.env.NEXT_PUBLIC_API_URL ?? 'https://hotel-os-api-52qe.onrender.com'}/api/docs`} target="_blank" rel="noreferrer"
              style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--db-accent)', color: 'var(--db-accent)', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
              View API docs ↗
            </a>
          </div>
        </div>
      </section>

      {/* Available integrations */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Connect a third-party system</h2>
        <p style={{ fontSize: 13, color: 'var(--db-secondary)', marginBottom: 16 }}>Use your API key above to connect any of these platforms.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {AVAILABLE.map(integ => (
            <div key={integ.id} style={{ borderRadius: 12, border: '1px solid var(--db-border)', background: 'var(--db-surface)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <LogoSquare initials={integ.initials} color={integ.color} />
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14, display: 'block' }}>{integ.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--db-secondary)', background: 'var(--db-muted)', border: '1px solid var(--db-border)', borderRadius: 999, padding: '1px 8px' }}>{integ.category}</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--db-secondary)', margin: 0, lineHeight: 1.5 }}>{integ.description}</p>
              <p style={{ fontSize: 12, color: 'var(--db-secondary)', margin: 0, fontStyle: 'italic' }}>Use your Lodgen API key to connect.</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>How it works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { step: 1, title: 'Generate an API key', desc: 'Create a key above and name it after the system you\'re connecting.' },
            { step: 2, title: 'Configure your PMS', desc: 'Add your API key to your PMS or integration tool. Point it at our REST API.' },
            { step: 3, title: 'Stay in sync', desc: 'Rooms, rates and reservations sync automatically. Changes in either system update everywhere.' },
          ].map(item => (
            <div key={item.step} style={{ borderRadius: 12, border: '1px solid var(--db-border)', background: 'var(--db-surface)', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
                  <circle cx="16" cy="16" r="16" fill="var(--db-accent)" />
                  <text x="16" y="21" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">{item.step}</text>
                </svg>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--db-secondary)', margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modals */}
      {showCreate && hotelId && (
        <CreateKeyModal
          hotelId={hotelId}
          onClose={() => setShowCreate(false)}
          onCreated={created => {
            setKeys(prev => [created, ...prev]);
            setShowCreate(false);
            setRevealed(created);
          }}
        />
      )}
      {revealed && (
        <RevealModal apiKey={revealed} onClose={() => setRevealed(null)} />
      )}
    </div>
  );
}
