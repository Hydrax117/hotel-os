'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getMyHotel } from '@/app/lib/api/dashboard';
import { ApiError } from '@/app/lib/api/client';
import {
  resourcesApi,
  uploadResourceImage,
  type Resource,
  type ResourceCategory,
  type ResourceType,
  type Building,
  type ResourceImage,
  type BookingUnit,
  type ResourceOperationalStatus,
  type ResourceMarketplaceVisibility,
} from '@/app/lib/api/resources';

// ── Constants ─────────────────────────────────────────────────────────────────

const BOOKING_UNITS: BookingUnit[] = ['NIGHT', 'HOUR', 'DAY', 'SESSION', 'CUSTOM'];
const BOOKING_UNIT_LABELS: Record<BookingUnit, string> = {
  NIGHT: 'Nightly', HOUR: 'Hourly', DAY: 'Daily', SESSION: 'Session', CUSTOM: 'Custom',
};

const OPERATIONAL_STATUS_LABELS: Record<ResourceOperationalStatus, string> = {
  READY: 'Ready', DIRTY: 'Dirty', OCCUPIED: 'Occupied',
  INSPECTION: 'Inspection', MAINTENANCE: 'Maintenance', OUT_OF_SERVICE: 'Out of Service',
};

const OPERATIONAL_STATUS_COLORS: Record<ResourceOperationalStatus, { bg: string; color: string }> = {
  READY:          { bg: '#dcfce7', color: '#166534' },
  DIRTY:          { bg: '#fef3c7', color: '#92400e' },
  OCCUPIED:       { bg: '#dbeafe', color: '#1e40af' },
  INSPECTION:     { bg: '#f3e8ff', color: '#6b21a8' },
  MAINTENANCE:    { bg: '#fee2e2', color: '#991b1b' },
  OUT_OF_SERVICE: { bg: '#f1f5f9', color: '#475569' },
};

const VISIBILITY_LABELS: Record<ResourceMarketplaceVisibility, string> = {
  PRIVATE: 'Private', UNLISTED: 'Unlisted', PUBLIC: 'Public',
};

// ── Style helpers ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  borderRadius: 8,
  border: '1px solid var(--db-border)',
  background: 'var(--db-bg)',
  color: 'var(--db-primary)',
  padding: '8px 12px',
  fontSize: 14,
  outline: 'none',
  width: '100%',
};

const btnPrimary: React.CSSProperties = {
  background: 'var(--db-accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  background: 'var(--db-muted)',
  color: 'var(--db-secondary)',
  border: '1px solid var(--db-border)',
  borderRadius: 8,
  padding: '8px 16px',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusPill({
  status,
}: {
  status: ResourceOperationalStatus;
}) {
  const { bg, color } = OPERATIONAL_STATUS_COLORS[status];
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', borderRadius: 20,
        padding: '2px 10px', fontSize: 11, fontWeight: 600, background: bg, color,
      }}
    >
      {OPERATIONAL_STATUS_LABELS[status]}
    </span>
  );
}

function ResourceCard({
  resource,
  onStatusChange,
  onArchive,
  onImageAdd,
}: {
  resource: Resource;
  onStatusChange: (id: string, status: ResourceOperationalStatus) => void;
  onArchive: (id: string) => void;
  onImageAdd: (resource: Resource) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const primaryImage = resource.images.find((img) => img.isPrimary) ?? resource.images[0];
  const isArchived = resource.lifecycleStatus === 'ARCHIVED';

  return (
    <div
      style={{
        background: 'var(--db-surface)',
        border: '1px solid var(--db-border)',
        borderRadius: 12,
        overflow: 'hidden',
        opacity: isArchived ? 0.6 : 1,
      }}
    >
      {/* Image strip */}
      <div style={{ position: 'relative', height: 120, background: 'var(--db-muted)' }}>
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={primaryImage.caption ?? resource.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%', height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column', gap: 6,
              color: 'var(--db-secondary)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ fontSize: 11 }}>No photos</span>
          </div>
        )}
        {resource.images.length > 1 && (
          <span
            style={{
              position: 'absolute', bottom: 6, right: 6,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              borderRadius: 4, padding: '2px 6px', fontSize: 10,
            }}
          >
            +{resource.images.length - 1}
          </span>
        )}
        {isArchived && (
          <span
            style={{
              position: 'absolute', top: 6, left: 6,
              background: '#475569', color: '#fff',
              borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 600,
            }}
          >
            Archived
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--db-primary)' }}>{resource.name}</p>
            <p style={{ fontSize: 12, color: 'var(--db-secondary)', marginTop: 2 }}>
              {resource.code} · {resource.category.name}
            </p>
          </div>
          <StatusPill status={resource.operationalStatus} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--db-secondary)', background: 'var(--db-muted)', borderRadius: 4, padding: '2px 8px' }}>
            {BOOKING_UNIT_LABELS[resource.bookingUnit]}
          </span>
          <span style={{ fontSize: 11, color: 'var(--db-secondary)', background: 'var(--db-muted)', borderRadius: 4, padding: '2px 8px' }}>
            {resource.isBookable ? 'Bookable' : 'Non-bookable'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--db-secondary)', background: 'var(--db-muted)', borderRadius: 4, padding: '2px 8px' }}>
            {VISIBILITY_LABELS[resource.marketplaceVisibility]}
          </span>
          {resource.capacity && (
            <span style={{ fontSize: 11, color: 'var(--db-secondary)', background: 'var(--db-muted)', borderRadius: 4, padding: '2px 8px' }}>
              Cap. {resource.capacity}
            </span>
          )}
        </div>

        {/* Expand / actions */}
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--db-secondary)', marginTop: 8, padding: 0 }}
        >
          {expanded ? '▴ Less' : '▾ Actions'}
        </button>

        {expanded && !isArchived && (
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              onClick={() => onImageAdd(resource)}
              style={{ ...btnSecondary, padding: '5px 10px', fontSize: 12 }}
            >
              + Photo
            </button>
            <select
              value={resource.operationalStatus}
              onChange={(e) =>
                onStatusChange(resource.id, e.target.value as ResourceOperationalStatus)
              }
              style={{ ...inputStyle, padding: '5px 8px', fontSize: 12, width: 'auto' }}
            >
              {Object.keys(OPERATIONAL_STATUS_LABELS).map((s) => (
                <option key={s} value={s}>
                  {OPERATIONAL_STATUS_LABELS[s as ResourceOperationalStatus]}
                </option>
              ))}
            </select>
            <button
              onClick={() => onArchive(resource.id)}
              style={{ ...btnSecondary, padding: '5px 10px', fontSize: 12, color: 'var(--db-danger)' }}
            >
              Archive
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Create Resource Modal ─────────────────────────────────────────────────────

type CreateResourceModalProps = {
  hotelId: string;
  categories: ResourceCategory[];
  buildings: Building[];
  onClose: () => void;
  onCreated: (resource: Resource) => void;
};

function CreateResourceModal({
  hotelId,
  categories,
  buildings,
  onClose,
  onCreated,
}: CreateResourceModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const activeCategories = categories.filter((c) => c.isActive);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [categoryId, setCategoryId] = useState(activeCategories[0]?.id ?? '');
  const [description, setDescription] = useState('');
  const [bookingUnit, setBookingUnit] = useState<BookingUnit>('NIGHT');
  const [isBookable, setIsBookable] = useState(true);
  const [visibility, setVisibility] = useState<ResourceMarketplaceVisibility>('PRIVATE');
  const [capacity, setCapacity] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  // Images — users pick files; we upload after resource creation
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Update bookingUnit when category changes
  useEffect(() => {
    const cat = categories.find((c) => c.id === categoryId);
    if (cat) setBookingUnit(cat.defaultBookingUnit);
  }, [categoryId, categories]);

  const selectedBuilding = buildings.find((b) => b.id === buildingId);

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    // Reset the input so the same file can be selected again if needed
    e.target.value = '';
  }

  function removeImagePreview(idx: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  }
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit() {
    if (!name.trim()) { setError('Resource name is required.'); return; }
    if (!code.trim()) { setError('Resource code is required.'); return; }
    if (!categoryId) { setError('Please select a category.'); return; }

    setError('');
    setSubmitting(true);
    try {
      const created = await resourcesApi.createResource(hotelId, {
        name: name.trim(),
        code: code.trim(),
        resourceCategoryId: categoryId,
        description: description.trim() || undefined,
        bookingUnit,
        isBookable,
        marketplaceVisibility: visibility,
        capacity: capacity ? Number(capacity) : undefined,
        buildingId: buildingId || undefined,
        floorId: floorId || undefined,
        internalNotes: internalNotes.trim() || undefined,
      });

      // Upload images if any were selected
      if (imageFiles.length > 0) {
        setUploadStatus(`Uploading ${imageFiles.length} photo${imageFiles.length > 1 ? 's' : ''}…`);
        for (let i = 0; i < imageFiles.length; i++) {
          try {
            const url = await uploadResourceImage(imageFiles[i], created.id);
            await resourcesApi.addImage(created.id, {
              url,
              isPrimary: i === 0, // first image is primary
              sortOrder: i,
            });
          } catch {
            // Don't block the whole operation if one upload fails
          }
        }
        // Reload the resource to get the images
        const withImages = await resourcesApi.getResource(created.id);
        onCreated(withImages);
      } else {
        onCreated(created);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create resource.';
      setError(msg);
    } finally {
      setSubmitting(false);
      setUploadStatus('');
    }
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: 'var(--db-surface)', borderRadius: 16,
          padding: 24, width: '100%', maxWidth: 560,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--db-primary)', marginBottom: 16 }}>
          Create Resource
        </h2>

        {error && (
          <p style={{ color: 'var(--db-danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Name *</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Room 101" />
          </div>

          {/* Code */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Code * (unique in hotel)</label>
            <input style={inputStyle} value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 101" />
          </div>

          {/* Category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Category *</label>
            <select style={inputStyle} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {activeCategories.length === 0 && <option value="">No categories yet</option>}
              {activeCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Booking unit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Booking unit</label>
            <select style={inputStyle} value={bookingUnit} onChange={(e) => setBookingUnit(e.target.value as BookingUnit)}>
              {BOOKING_UNITS.map((u) => (
                <option key={u} value={u}>{BOOKING_UNIT_LABELS[u]}</option>
              ))}
            </select>
          </div>

          {/* Visibility */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Marketplace visibility</label>
            <select style={inputStyle} value={visibility} onChange={(e) => setVisibility(e.target.value as ResourceMarketplaceVisibility)}>
              <option value="PRIVATE">Private (not shown publicly)</option>
              <option value="UNLISTED">Unlisted (link only)</option>
              <option value="PUBLIC">Public</option>
            </select>
          </div>

          {/* Bookable toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Bookable?</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setIsBookable(v)}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    background: isBookable === v ? 'var(--db-accent)' : 'var(--db-muted)',
                    color: isBookable === v ? '#fff' : 'var(--db-secondary)',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          {/* Capacity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Capacity</label>
            <input style={inputStyle} type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 2" />
          </div>

          {/* Building */}
          {buildings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Building</label>
              <select style={inputStyle} value={buildingId} onChange={(e) => { setBuildingId(e.target.value); setFloorId(''); }}>
                <option value="">— None —</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Floor */}
          {selectedBuilding && selectedBuilding.floors.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Floor</label>
              <select style={inputStyle} value={floorId} onChange={(e) => setFloorId(e.target.value)}>
                <option value="">— None —</option>
                {selectedBuilding.floors
                  .slice()
                  .sort((a, b) => a.levelNumber - b.levelNumber)
                  .map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Description</label>
            <textarea
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional public description"
            />
          </div>

          {/* Photos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>
              Photos
              <span style={{ fontWeight: 400, marginLeft: 6 }}>(optional — up to 5)</span>
            </label>
            {/* Previews */}
            {imagePreviews.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {imagePreviews.map((src, idx) => (
                  <div key={idx} style={{ position: 'relative', width: 80, height: 60, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--db-border)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {idx === 0 && (
                      <span style={{ position: 'absolute', bottom: 2, left: 2, background: 'var(--db-accent)', color: '#fff', fontSize: 8, fontWeight: 700, borderRadius: 3, padding: '1px 4px' }}>PRIMARY</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImagePreview(idx)}
                      style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 16, height: 16, fontSize: 10, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            {imageFiles.length < 5 && (
              <label
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer', padding: '8px 14px', borderRadius: 8,
                  border: '1px dashed var(--db-border)', fontSize: 13,
                  color: 'var(--db-secondary)', width: 'fit-content',
                  background: 'var(--db-bg)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                Choose photo{imageFiles.length > 0 ? 's' : ''}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleImagePick}
                />
              </label>
            )}
          </div>

          {/* Internal notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Internal notes (staff only)</label>
            <input style={inputStyle} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="e.g. Corner unit, good light" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={handleSubmit} disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1, flex: 1 }}>
            {submitting ? (uploadStatus || 'Creating…') : 'Create resource'}
          </button>
          <button onClick={onClose} disabled={submitting} style={btnSecondary}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bulk Create Modal ─────────────────────────────────────────────────────────

type BulkCreateModalProps = {
  hotelId: string;
  categories: ResourceCategory[];
  buildings: Building[];
  onClose: () => void;
  onCreated: (resources: Resource[]) => void;
};

function BulkCreateModal({ hotelId, categories, buildings, onClose, onCreated }: BulkCreateModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const activeCategories = categories.filter((c) => c.isActive);

  const [categoryId, setCategoryId] = useState(activeCategories[0]?.id ?? '');
  const [bookingUnit, setBookingUnit] = useState<BookingUnit>('NIGHT');
  const [isBookable, setIsBookable] = useState(true);
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  // Rows: name, code, capacity (string)
  const [rows, setRows] = useState([
    { name: '', code: '', capacity: '' },
    { name: '', code: '', capacity: '' },
    { name: '', code: '', capacity: '' },
  ]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const cat = categories.find((c) => c.id === categoryId);
    if (cat) setBookingUnit(cat.defaultBookingUnit);
  }, [categoryId, categories]);

  const selectedBuilding = buildings.find((b) => b.id === buildingId);

  function updateRow(idx: number, field: 'name' | 'code' | 'capacity', value: string) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { name: '', code: '', capacity: '' }]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit() {
    if (!categoryId) { setError('Please select a category.'); return; }
    const filled = rows.filter((r) => r.name.trim() && r.code.trim());
    if (filled.length === 0) { setError('Enter at least one resource with name and code.'); return; }

    // Validate unique codes in the form
    const codes = filled.map((r) => r.code.trim());
    if (new Set(codes).size !== codes.length) {
      setError('Duplicate codes found in the list. Each code must be unique.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const result = await resourcesApi.bulkCreateResources(hotelId, {
        resourceCategoryId: categoryId,
        bookingUnit,
        isBookable,
        buildingId: buildingId || undefined,
        floorId: floorId || undefined,
        resources: filled.map((r) => ({
          name: r.name.trim(),
          code: r.code.trim(),
          capacity: r.capacity ? Number(r.capacity) : undefined,
        })),
      });
      onCreated(result.created);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Bulk creation failed.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: 'var(--db-surface)', borderRadius: 16, padding: 24,
          width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--db-primary)', marginBottom: 4 }}>
          Bulk Create Resources
        </h2>
        <p style={{ fontSize: 13, color: 'var(--db-secondary)', marginBottom: 16 }}>
          All rows are validated before saving. If any code already exists, nothing is created.
        </p>

        {error && (
          <p style={{ color: 'var(--db-danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>
        )}

        {/* Shared settings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Category *</label>
            <select style={inputStyle} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {activeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Booking unit</label>
            <select style={inputStyle} value={bookingUnit} onChange={(e) => setBookingUnit(e.target.value as BookingUnit)}>
              {BOOKING_UNITS.map((u) => <option key={u} value={u}>{BOOKING_UNIT_LABELS[u]}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Bookable?</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[true, false].map((v) => (
                <button key={String(v)} type="button" onClick={() => setIsBookable(v)}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    background: isBookable === v ? 'var(--db-accent)' : 'var(--db-muted)',
                    color: isBookable === v ? '#fff' : 'var(--db-secondary)', border: 'none', cursor: 'pointer' }}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
          {buildings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Building</label>
              <select style={inputStyle} value={buildingId} onChange={(e) => { setBuildingId(e.target.value); setFloorId(''); }}>
                <option value="">— None —</option>
                {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          {selectedBuilding && selectedBuilding.floors.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Floor</label>
              <select style={inputStyle} value={floorId} onChange={(e) => setFloorId(e.target.value)}>
                <option value="">— None —</option>
                {selectedBuilding.floors.slice().sort((a, b) => a.levelNumber - b.levelNumber).map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Rows */}
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--db-secondary)', marginBottom: 8 }}>Resources</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
          {rows.map((row, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 6, alignItems: 'center' }}>
              <input style={{ ...inputStyle, padding: '6px 10px', fontSize: 13 }} value={row.name} onChange={(e) => updateRow(idx, 'name', e.target.value)} placeholder="Name (e.g. Room 101)" />
              <input style={{ ...inputStyle, padding: '6px 10px', fontSize: 13 }} value={row.code} onChange={(e) => updateRow(idx, 'code', e.target.value)} placeholder="Code (e.g. 101)" />
              <input style={{ ...inputStyle, padding: '6px 10px', fontSize: 13 }} type="number" min={1} value={row.capacity} onChange={(e) => updateRow(idx, 'capacity', e.target.value)} placeholder="Cap." />
              <button onClick={() => removeRow(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--db-secondary)', fontSize: 16, padding: '0 4px' }} disabled={rows.length === 1}>✕</button>
            </div>
          ))}
        </div>
        <button onClick={addRow} style={{ ...btnSecondary, marginTop: 8, padding: '5px 12px', fontSize: 12 }}>
          + Add row
        </button>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={handleSubmit} disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1, flex: 1 }}>
            {submitting ? 'Creating…' : `Create ${rows.filter((r) => r.name.trim() && r.code.trim()).length} resources`}
          </button>
          <button onClick={onClose} disabled={submitting} style={btnSecondary}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Create Category Modal ─────────────────────────────────────────────────────

type CreateCategoryModalProps = {
  hotelId: string;
  resourceTypes: ResourceType[];
  onClose: () => void;
  onCreated: (category: ResourceCategory) => void;
};

function CreateCategoryModal({ hotelId, resourceTypes, onClose, onCreated }: CreateCategoryModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [resourceTypeId, setResourceTypeId] = useState(resourceTypes[0]?.id ?? '');
  const [defaultBookingUnit, setDefaultBookingUnit] = useState<BookingUnit>('NIGHT');
  const [defaultCapacity, setDefaultCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Auto-generate code from name
  useEffect(() => {
    setCode(name.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20));
  }, [name]);

  async function handleSubmit() {
    if (!name.trim()) { setError('Category name is required.'); return; }
    if (!code.trim()) { setError('Category code is required.'); return; }
    if (!resourceTypeId) { setError('Please select a resource type.'); return; }

    setError('');
    setSubmitting(true);
    try {
      const created = await resourcesApi.createCategory(hotelId, {
        name: name.trim(),
        code: code.trim(),
        resourceTypeId,
        description: description.trim() || undefined,
        defaultBookingUnit,
        defaultCapacity: defaultCapacity ? Number(defaultCapacity) : undefined,
      });
      onCreated(created);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create category.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div ref={backdropRef} onClick={handleBackdrop}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--db-surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--db-primary)', marginBottom: 16 }}>New Category</h2>
        {error && <p style={{ color: 'var(--db-danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Name *</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard Room" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Code *</label>
            <input style={inputStyle} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. STD-ROOM" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Resource type *</label>
            <select style={inputStyle} value={resourceTypeId} onChange={(e) => setResourceTypeId(e.target.value)}>
              {resourceTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Default booking unit</label>
            <select style={inputStyle} value={defaultBookingUnit} onChange={(e) => setDefaultBookingUnit(e.target.value as BookingUnit)}>
              {BOOKING_UNITS.map((u) => <option key={u} value={u}>{BOOKING_UNIT_LABELS[u]}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Default capacity</label>
            <input style={inputStyle} type="number" min={1} value={defaultCapacity} onChange={(e) => setDefaultCapacity(e.target.value)} placeholder="e.g. 2" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Description</label>
            <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={handleSubmit} disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1, flex: 1 }}>
            {submitting ? 'Creating…' : 'Create category'}
          </button>
          <button onClick={onClose} disabled={submitting} style={btnSecondary}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Add Image Modal ───────────────────────────────────────────────────────────

function AddImageModal({
  resource,
  onClose,
  onAdded,
}: {
  resource: Resource;
  onClose: () => void;
  onAdded: (image: ResourceImage) => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isPrimary, setIsPrimary] = useState(resource.images.length === 0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<ResourceImage[]>(resource.images);

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleAdd() {
    if (!url.trim()) { setError('Image URL is required.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const added = await resourcesApi.addImage(resource.id, {
        url: url.trim(),
        caption: caption.trim() || undefined,
        isPrimary,
        sortOrder: images.length,
      });
      setImages((prev) => [...prev, added]);
      onAdded(added);
      setUrl('');
      setCaption('');
      setIsPrimary(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to add image.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(imageId: string) {
    try {
      await resourcesApi.deleteImage(resource.id, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setError('Failed to delete image.');
    }
  }

  async function handleSetPrimary(imageId: string) {
    try {
      await resourcesApi.setPrimaryImage(resource.id, imageId);
      setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.id === imageId })));
    } catch {
      setError('Failed to set primary image.');
    }
  }

  return (
    <div ref={backdropRef} onClick={handleBackdrop}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--db-surface)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--db-primary)', marginBottom: 4 }}>
          Photos — {resource.name}
        </h2>
        <p style={{ fontSize: 12, color: 'var(--db-secondary)', marginBottom: 16 }}>
          Paste the public URL of an image uploaded to your Supabase bucket.
        </p>

        {error && <p style={{ color: 'var(--db-danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        {/* Existing images */}
        {images.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
            {images.map((img) => (
              <div key={img.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `2px solid ${img.isPrimary ? 'var(--db-accent)' : 'var(--db-border)'}` }}>
                <img src={img.url} alt={img.caption ?? ''} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                {img.isPrimary && (
                  <span style={{ position: 'absolute', top: 4, left: 4, background: 'var(--db-accent)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 3, padding: '1px 5px' }}>PRIMARY</span>
                )}
                <div style={{ display: 'flex', gap: 4, padding: '5px 6px', background: 'var(--db-surface)' }}>
                  {!img.isPrimary && (
                    <button onClick={() => handleSetPrimary(img.id)} style={{ flex: 1, fontSize: 10, border: 'none', cursor: 'pointer', borderRadius: 4, padding: '3px 0', background: 'var(--db-muted)', color: 'var(--db-secondary)' }}>Set primary</button>
                  )}
                  <button onClick={() => handleDelete(img.id)} style={{ fontSize: 10, border: 'none', cursor: 'pointer', borderRadius: 4, padding: '3px 6px', background: 'var(--db-muted)', color: 'var(--db-danger)' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Image URL *</label>
            <input style={inputStyle} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…supabase.co/storage/v1/object/public/…" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--db-secondary)' }}>Caption</label>
            <input style={inputStyle} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. View from the balcony" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
            <span style={{ color: 'var(--db-primary)' }}>Set as primary image</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={handleAdd} disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1, flex: 1 }}>
            {submitting ? 'Adding…' : 'Add image'}
          </button>
          <button onClick={onClose} style={btnSecondary}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type ActiveModal =
  | { type: 'createResource' }
  | { type: 'bulkCreate' }
  | { type: 'createCategory' }
  | { type: 'addImage'; resource: Resource };

export default function ResourcesPage() {
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterStatus, setFilterStatus] = useState<ResourceOperationalStatus | ''>('');
  const [filterBookable, setFilterBookable] = useState<'all' | 'yes' | 'no'>('all');
  const [filterLifecycle, setFilterLifecycle] = useState<'ACTIVE' | 'ARCHIVED' | 'all'>('ACTIVE');

  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);
  const [activeTab, setActiveTab] = useState<'resources' | 'categories' | 'buildings'>('resources');

  const load = useCallback(async (hid: string) => {
    setLoading(true);
    setError(null);
    try {
      const [types, cats, bldgs, rsvcs] = await Promise.all([
        resourcesApi.getResourceTypes(),
        resourcesApi.getCategories(hid),
        resourcesApi.getBuildings(hid),
        resourcesApi.listResources(hid),
      ]);
      setResourceTypes(types);
      setCategories(cats);
      setBuildings(bldgs);
      setResources(rsvcs);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load resources.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getMyHotel()
      .then((hotel) => {
        if (hotel) {
          setHotelId(hotel.id);
          load(hotel.id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [load]);

  async function handleStatusChange(resourceId: string, status: ResourceOperationalStatus) {
    try {
      const updated = await resourcesApi.updateOperationalStatus(resourceId, { operationalStatus: status });
      setResources((prev) => prev.map((r) => (r.id === resourceId ? updated : r)));
    } catch {
      setError('Failed to update status.');
    }
  }

  async function handleArchive(resourceId: string) {
    if (!confirm('Archive this resource? It will no longer be bookable, but historical reservations are preserved.')) return;
    try {
      const archived = await resourcesApi.archiveResource(resourceId);
      setResources((prev) => prev.map((r) => (r.id === resourceId ? archived : r)));
    } catch {
      setError('Failed to archive resource.');
    }
  }

  // ── Derived / filtered resources

  const filtered = resources.filter((r) => {
    if (filterCategoryId && r.resourceCategoryId !== filterCategoryId) return false;
    if (filterStatus && r.operationalStatus !== filterStatus) return false;
    if (filterBookable === 'yes' && !r.isBookable) return false;
    if (filterBookable === 'no' && r.isBookable) return false;
    if (filterLifecycle !== 'all' && r.lifecycleStatus !== filterLifecycle) return false;
    return true;
  });

  // ── Render

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: 80, borderRadius: 10, background: 'var(--db-muted)', marginBottom: 12 }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 48, gap: 12 }}>
        <p style={{ color: 'var(--db-danger)' }}>{error}</p>
        <button onClick={() => hotelId && load(hotelId)} style={btnPrimary}>Retry</button>
      </div>
    );
  }

  if (!hotelId) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--db-secondary)' }}>
        No hotel found. Set up your property first.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: 'var(--db-primary)' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Resources</h1>
          <p style={{ fontSize: 13, color: 'var(--db-secondary)', marginTop: 2 }}>
            Rooms, lounges, event spaces, facilities — all physical inventory in one place
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setActiveModal({ type: 'createCategory' })} style={{ ...btnSecondary, padding: '8px 14px', fontSize: 13 }}>
            + Category
          </button>
          <button onClick={() => setActiveModal({ type: 'bulkCreate' })} style={{ ...btnSecondary, padding: '8px 14px', fontSize: 13 }}>
            Bulk create
          </button>
          <button onClick={() => setActiveModal({ type: 'createResource' })} style={{ ...btnPrimary, padding: '8px 16px', fontSize: 13 }}>
            + Resource
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
        {[
          { label: 'Total', value: resources.length },
          { label: 'Active', value: resources.filter((r) => r.lifecycleStatus === 'ACTIVE').length },
          { label: 'Bookable', value: resources.filter((r) => r.isBookable && r.lifecycleStatus === 'ACTIVE').length },
          { label: 'Ready', value: resources.filter((r) => r.operationalStatus === 'READY').length },
          { label: 'Categories', value: categories.length },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', borderRadius: 10, padding: '12px 16px' }}>
            <p style={{ fontSize: 11, color: 'var(--db-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'var(--db-muted)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {(['resources', 'categories', 'buildings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: activeTab === tab ? 'var(--db-surface)' : 'transparent',
              color: activeTab === tab ? 'var(--db-primary)' : 'var(--db-secondary)',
              border: 'none', cursor: 'pointer', textTransform: 'capitalize',
              boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Resources tab ─────────────────────────────────────────────────── */}
      {activeTab === 'resources' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <select value={filterCategoryId} onChange={(e) => setFilterCategoryId(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: 13 }}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ResourceOperationalStatus | '')} style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: 13 }}>
              <option value="">All statuses</option>
              {Object.keys(OPERATIONAL_STATUS_LABELS).map((s) => (
                <option key={s} value={s}>{OPERATIONAL_STATUS_LABELS[s as ResourceOperationalStatus]}</option>
              ))}
            </select>
            <select value={filterBookable} onChange={(e) => setFilterBookable(e.target.value as 'all' | 'yes' | 'no')} style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: 13 }}>
              <option value="all">All (bookable + non-bookable)</option>
              <option value="yes">Bookable only</option>
              <option value="no">Non-bookable only</option>
            </select>
            <select value={filterLifecycle} onChange={(e) => setFilterLifecycle(e.target.value as 'ACTIVE' | 'ARCHIVED' | 'all')} style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: 13 }}>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
              <option value="all">All</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', borderRadius: 12, padding: 48, textAlign: 'center' }}>
              <p style={{ color: 'var(--db-secondary)', marginBottom: 12 }}>
                {resources.length === 0
                  ? 'No resources yet. Create a category first, then add resources.'
                  : 'No resources match the current filters.'}
              </p>
              {resources.length === 0 && categories.length === 0 && (
                <button onClick={() => setActiveModal({ type: 'createCategory' })} style={btnPrimary}>
                  Create first category
                </button>
              )}
              {resources.length === 0 && categories.length > 0 && (
                <button onClick={() => setActiveModal({ type: 'createResource' })} style={btnPrimary}>
                  Create first resource
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {filtered.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onStatusChange={handleStatusChange}
                  onArchive={handleArchive}
                  onImageAdd={(r) => setActiveModal({ type: 'addImage', resource: r })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Categories tab ─────────────────────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div>
          {categories.length === 0 ? (
            <div style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', borderRadius: 12, padding: 48, textAlign: 'center' }}>
              <p style={{ color: 'var(--db-secondary)', marginBottom: 12 }}>No categories yet.</p>
              <button onClick={() => setActiveModal({ type: 'createCategory' })} style={btnPrimary}>Create category</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {categories.map((cat) => (
                <div key={cat.id} style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{cat.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--db-secondary)', marginTop: 2 }}>{cat.resourceType.name}</p>
                    </div>
                    <span style={{ fontSize: 10, background: cat.isActive ? '#dcfce7' : '#fee2e2', color: cat.isActive ? '#166534' : '#991b1b', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: 11, background: 'var(--db-muted)', color: 'var(--db-secondary)', borderRadius: 4, padding: '2px 8px' }}>
                      {BOOKING_UNIT_LABELS[cat.defaultBookingUnit]}
                    </span>
                    <span style={{ fontSize: 11, background: 'var(--db-muted)', color: 'var(--db-secondary)', borderRadius: 4, padding: '2px 8px' }}>
                      Code: {cat.code}
                    </span>
                    {cat._count && (
                      <span style={{ fontSize: 11, background: 'var(--db-muted)', color: 'var(--db-secondary)', borderRadius: 4, padding: '2px 8px' }}>
                        {cat._count.resources} resource{cat._count.resources !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {cat.description && (
                    <p style={{ fontSize: 12, color: 'var(--db-secondary)', marginTop: 8, lineHeight: 1.5 }}>{cat.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Buildings tab ─────────────────────────────────────────────────── */}
      {activeTab === 'buildings' && (
        <div>
          {buildings.length === 0 ? (
            <div style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', borderRadius: 12, padding: 48, textAlign: 'center' }}>
              <p style={{ color: 'var(--db-secondary)' }}>
                No buildings defined. Buildings and floors are optional — add them to organize resources by physical location.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {buildings.map((bld) => (
                <div key={bld.id} style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{bld.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--db-secondary)', marginTop: 2 }}>Code: {bld.code}</p>
                    </div>
                    <span style={{ fontSize: 11, background: 'var(--db-muted)', color: 'var(--db-secondary)', borderRadius: 4, padding: '2px 8px' }}>
                      {bld._count?.resources ?? 0} resources
                    </span>
                  </div>
                  {bld.floors.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {bld.floors.slice().sort((a, b) => a.levelNumber - b.levelNumber).map((f) => (
                        <span key={f.id} style={{ fontSize: 11, background: 'var(--db-muted)', color: 'var(--db-secondary)', borderRadius: 4, padding: '2px 10px' }}>
                          {f.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {activeModal?.type === 'createResource' && hotelId && (
        <CreateResourceModal
          hotelId={hotelId}
          categories={categories}
          buildings={buildings}
          onClose={() => setActiveModal(null)}
          onCreated={(resource) => {
            setResources((prev) => [resource, ...prev]);
            setActiveModal(null);
          }}
        />
      )}
      {activeModal?.type === 'bulkCreate' && hotelId && (
        <BulkCreateModal
          hotelId={hotelId}
          categories={categories}
          buildings={buildings}
          onClose={() => setActiveModal(null)}
          onCreated={(newResources) => {
            setResources((prev) => [...newResources, ...prev]);
            setActiveModal(null);
          }}
        />
      )}
      {activeModal?.type === 'createCategory' && hotelId && (
        <CreateCategoryModal
          hotelId={hotelId}
          resourceTypes={resourceTypes}
          onClose={() => setActiveModal(null)}
          onCreated={(cat) => {
            setCategories((prev) => [...prev, cat]);
            setActiveModal(null);
          }}
        />
      )}
      {activeModal?.type === 'addImage' && (
        <AddImageModal
          resource={activeModal.resource}
          onClose={() => setActiveModal(null)}
          onAdded={(image) => {
            setResources((prev) =>
              prev.map((r) =>
                r.id === activeModal.resource.id
                  ? { ...r, images: [...r.images.filter((img) => img.id !== image.id), image] }
                  : r,
              ),
            );
          }}
        />
      )}
    </div>
  );
}
