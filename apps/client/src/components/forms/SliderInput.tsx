import React from 'react';

interface SliderInputProps {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

export const SliderInput: React.FC<SliderInputProps> = ({
  label,
  leftLabel,
  rightLabel,
  value,
  onChange,
  error,
}) => {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <label style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--fg-main)' }}>
          {label}
        </label>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-white)',
            fontWeight: 800,
            fontSize: '1.125rem',
          }}
        >
          {value}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--fg-main)', flex: 1, textAlign: 'right' }}>
          {leftLabel}
        </span>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          style={{
            width: '240px',
            height: '10px',
            borderRadius: 'var(--radius-full)',
            accentColor: 'var(--color-primary)',
            backgroundColor: 'var(--color-muted)',
            cursor: 'pointer',
          }}
        />
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--fg-main)', flex: 1, textAlign: 'left' }}>
          {rightLabel}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.75rem', paddingLeft: '1rem' }}>
        {[1, 2, 3, 4, 5].map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: value === step ? 'var(--color-primary)' : '#9ca3af',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {step}
          </button>
        ))}
      </div>

      {error && (
        <span style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginTop: '0.375rem', display: 'block', fontWeight: 600 }}>
          {error}
        </span>
      )}
    </div>
  );
};
