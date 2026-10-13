'use client';

import React, { useRef, useState } from 'react';
import { uploadImage, extractStoragePath, deleteImage } from '@/app/lib/supabase';
import { saveHotelImage, deleteHotelImage, type HotelImage } from '@/app/lib/api/images';

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  hotelId: string;
  label: string;
  existingImage?: HotelImage | null;
  onUploaded: (img: HotelImage) => void;
  onDeleted: (id: string) => void;
  category: string;
  isPrimary?: boolean;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function ImageUploadSlot({
  hotelId,
  label,
  existingImage,
  onUploaded,
  onDeleted,
  category,
  isPrimary = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Upload flow ───────────────────────────────────────────────────────────

  async function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('10 MB limit exceeded');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('JPEG, PNG or WEBP only');
      return;
    }
    setErrorMsg(null);

    setLoading(true);
    try {
      const url = await uploadImage(file, hotelId, category);
      const saved = await saveHotelImage(hotelId, { url, isPrimary });
      onUploaded(saved);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
      // Reset the input so the same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  // ── Delete flow ───────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!existingImage) return;
    setLoading(true);
    try {
      await deleteImage(extractStoragePath(existingImage.url));
      await deleteHotelImage(hotelId, existingImage.id);
      onDeleted(existingImage.id);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-1">
      <div
        className="relative overflow-hidden rounded-lg"
        style={{ aspectRatio: '4/3' }}
      >
        {existingImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={existingImage.url}
              alt={label}
              className="object-cover w-full h-full rounded-lg"
            />
            {/* Delete overlay */}
            <div className="absolute inset-0 flex items-start justify-end p-1">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                aria-label={`Remove ${label}`}
                className="flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-bold leading-none"
                style={{ background: 'rgba(0,0,0,0.55)' }}
              >
                ×
              </button>
            </div>
          </>
        ) : (
          <div
            role="button"
            aria-label={`Upload ${label}`}
            onClick={() => !loading && inputRef.current?.click()}
            className="flex w-full h-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors"
            style={{
              background:  'var(--db-muted)',
              borderColor: 'var(--db-border)',
              color:       'var(--db-secondary)',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mb-1 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8.5 7.5M12 4l3.5 3.5" />
            </svg>
            <span className="text-xs">{label}</span>
            <label className="sr-only">
              Upload {label}
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleInputChange}
                tabIndex={-1}
              />
            </label>
          </div>
        )}

        {/* Spinner overlay */}
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-lg"
            style={{ background: 'rgba(0,0,0,0.35)' }}
          >
            <svg
              className="h-8 w-8 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-label="Loading"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMsg && (
        <p className="text-xs" style={{ color: '#ef4444' }} role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
