'use client';

import React, { useEffect, useRef, useState } from 'react';

type FileUploadSlotProps = {
  label: string;
  accept?: string;
  file: File | null;
  /** Pass a static external preview URL (e.g. from context) when showPreview=false. */
  preview?: string | null;
  required?: boolean;
  onChange: (file: File) => void;
  /**
   * When true, the component creates and manages its own object URL for the
   * thumbnail preview, revoking it on unmount or when the file changes.
   * The `preview` prop is ignored when showPreview=true.
   */
  showPreview?: boolean;
};

export function FileUploadSlot({
  label,
  accept,
  file,
  preview,
  required,
  onChange,
  showPreview = false,
}: FileUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  // When showPreview is true this component owns the object URL lifecycle.
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!showPreview) return;

    // Revoke the previous URL before creating a new one.
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (file) {
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setLocalPreview(url);
    } else {
      setLocalPreview(null);
    }

    return () => {
      // Revoke on unmount.
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [file, showPreview]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = files[0];
    if (picked) onChange(picked);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // Decide which preview URL to display.
  const displayPreview = showPreview ? localPreview : (preview ?? null);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-[var(--ob-primary)]">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={
          'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors ' +
          (isDragging
            ? 'border-[var(--ob-accent)] bg-[var(--ob-accent)]/5'
            : 'border-[var(--ob-border)] bg-[var(--ob-muted)] hover:border-[var(--ob-accent)]/60')
        }
        style={{ minHeight: '100px' }}
      >
        {showPreview && displayPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayPreview}
            alt={label}
            className="max-h-24 max-w-full rounded object-contain"
          />
        ) : file ? (
          <div className="flex flex-col items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--ob-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs text-[var(--ob-secondary)] break-all max-w-full">{file.name}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--ob-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8.5 7.5M12 4l3.5 3.5" />
            </svg>
            <span className="text-xs text-[var(--ob-secondary)]">Drop file or click to browse</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleInputChange}
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
