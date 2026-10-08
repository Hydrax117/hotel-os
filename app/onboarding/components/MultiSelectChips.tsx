'use client';

type Option = {
  value: string;
  label: string;
};

type MultiSelectChipsProps = {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
};

export function MultiSelectChips({ options, selected, onChange, label }: MultiSelectChipsProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <p className="text-sm font-medium text-[var(--ob-primary)]">{label}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={
                'rounded-full border px-3 py-1 text-sm font-medium transition-colors ' +
                (isSelected
                  ? 'border-[var(--ob-accent)] bg-[var(--ob-accent)] text-white'
                  : 'border-[var(--ob-border)] bg-[var(--ob-muted)] text-[var(--ob-primary)] hover:border-[var(--ob-accent)] hover:text-[var(--ob-accent)]')
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
