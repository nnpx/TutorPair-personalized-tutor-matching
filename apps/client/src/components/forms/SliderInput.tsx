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

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--fg-main)', flex: 1, textAlign: 'right', paddingTop: '2px' }}>
          {leftLabel}
        </span>

        {/* Dedicated Slider + Indicator Track Column */}
        <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: 'var(--radius-full)',
              accentColor: 'var(--color-primary)',
              backgroundColor: 'var(--color-muted)',
              cursor: 'pointer',
              margin: 0,
            }}
          />

          {/* Indicators positioned directly beneath each discrete thumb step */}
          <div style={{ position: 'relative', width: '100%', height: '24px', marginTop: '0.375rem' }}>
            {[1, 2, 3, 4, 5].map((step) => {
              const p = (step - 1) / 4;
              const offsetPx = (0.5 - p) * 18; // 18px thumb diameter
              const offsetSign = offsetPx >= 0 ? `+ ${offsetPx}px` : `- ${Math.abs(offsetPx)}px`;
              const isSelected = value === step;

              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => onChange(step)}
                  style={{
                    position: 'absolute',
                    left: offsetPx === 0 ? '50%' : `calc(${p * 100}% ${offsetSign})`,
                    transform: 'translateX(-50%)',
                    fontSize: '0.8125rem',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? 'var(--color-primary)' : '#9ca3af',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    lineHeight: 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {step}
                </button>
              );
            })}
          </div>
        </div>

        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--fg-main)', flex: 1, textAlign: 'left', paddingTop: '2px' }}>
          {rightLabel}
        </span>
      </div>

      {error && (
        <span style={{ color: 'var(--color-danger)', fontSize: '0.875rem', marginTop: '0.375rem', display: 'block', fontWeight: 600 }}>
          {error}
        </span>
      )}
    </div>
  );
};
