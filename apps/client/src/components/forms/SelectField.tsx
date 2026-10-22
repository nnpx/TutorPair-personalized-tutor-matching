import React, { forwardRef } from 'react';
import { FormField } from './FormField';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  required?: boolean;
  isLocked?: boolean;
  error?: string | null;
  helperText?: React.ReactNode;
  options?: SelectOption[];
  containerStyle?: React.CSSProperties;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(({
  label,
  required,
  isLocked,
  error,
  helperText,
  options,
  children,
  containerStyle,
  id,
  name,
  disabled,
  style,
  className = '',
  ...selectProps
}, ref) => {
  const selectId = id || name;

  const baseSelectStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: error ? '2px solid var(--color-danger)' : '2px solid var(--color-border)',
    backgroundColor: disabled ? 'var(--color-muted)' : 'var(--bg-canvas)',
    color: disabled ? '#6b7280' : 'var(--fg-main)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600,
    fontSize: '0.9375rem',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    ...style,
  };

  return (
    <FormField
      htmlFor={selectId}
      label={label}
      required={required}
      isLocked={isLocked || disabled}
      error={error}
      helperText={helperText}
      style={containerStyle}
    >
      <select
        ref={ref}
        id={selectId}
        name={name}
        disabled={disabled}
        className={`flat-select-custom ${className}`}
        style={baseSelectStyle}
        {...selectProps}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    </FormField>
  );
});

SelectField.displayName = 'SelectField';
