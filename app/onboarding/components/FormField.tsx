'use client';

import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type FormFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  as?: 'input' | 'textarea';
} & (
  | ({ as?: 'input' } & InputProps)
  | ({ as: 'textarea' } & TextareaProps)
);

export function FormField({ label, required, error, hint, as: Tag = 'input', ...props }: FormFieldProps) {
  const id = (props as InputProps).id ?? label.toLowerCase().replace(/\s+/g, '-');

  const baseClass =
    'w-full rounded-lg border px-3 py-2 text-sm text-[var(--ob-primary)] ' +
    'placeholder:text-[var(--ob-secondary)] ' +
    'border-[var(--ob-border)] bg-[var(--ob-surface)] ' +
    'focus:outline-none focus:ring-2 focus:ring-[var(--ob-accent)] focus:border-transparent ' +
    'transition-colors ' +
    (error ? 'border-red-400 focus:ring-red-400' : '');

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-[var(--ob-primary)]">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {Tag === 'textarea' ? (
        <textarea
          id={id}
          rows={4}
          className={`${baseClass} resize-y`}
          {...(props as TextareaProps)}
        />
      ) : (
        <input
          id={id}
          className={baseClass}
          {...(props as InputProps)}
        />
      )}
      {hint && !error && (
        <p className="text-xs text-[var(--ob-secondary)]">{hint}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
