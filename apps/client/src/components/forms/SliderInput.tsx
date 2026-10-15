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
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1, textAlign: 'right' }}>
          {leftLabel}
        </span>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          style={{ width: '200px', accentColor: 'var(--primary)', cursor: 'pointer' }}
        />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1, textAlign: 'left' }}>
          {rightLabel}
        </span>
        <span style={{ fontWeight: 700, width: '2rem', textAlign: 'center', color: 'var(--primary)' }}>
          {value}
        </span>
      </div>
      {error && (
        <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
          {error}
        </span>
      )}
    </div>
  );
};
