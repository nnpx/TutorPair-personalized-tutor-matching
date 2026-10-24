import React, { forwardRef } from 'react';
import { FormField } from './FormField';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  required?: boolean;
  isLocked?: boolean;
  error?: string | null;
  helperText?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: React.CSSProperties;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(({
  label,
  required,
  isLocked,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  id,
  name,
  disabled,
  style,
  className = '',
  ...inputProps
}, ref) => {
  const inputId = id || name;

  const baseInputStyle: React.CSSProperties = {
    width: '100%',
    padding: leftIcon ? '0.75rem 1rem 0.75rem 2.625rem' : '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: error ? '2px solid var(--color-danger)' : '2px solid var(--color-border)',
    backgroundColor: disabled ? 'var(--color-muted)' : 'var(--bg-canvas)',
    color: disabled ? '#6b7280' : 'var(--fg-main)',
    cursor: disabled ? 'not-allowed' : 'text',
    fontWeight: 600,
    fontSize: '0.9375rem',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    ...style,
  };

  return (
    <FormField
      htmlFor={inputId}
      label={label}
      required={required}
      isLocked={isLocked || disabled}
      error={error}
      helperText={helperText}
      style={containerStyle}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: '0.875rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: disabled ? '#9ca3af' : 'var(--color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          disabled={disabled}
          className={`flat-input-custom ${className}`}
          style={baseInputStyle}
          {...inputProps}
        />

        {rightIcon && (
          <span
            style={{
              position: 'absolute',
              right: '0.875rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {rightIcon}
          </span>
        )}
      </div>
    </FormField>
  );
});

InputField.displayName = 'InputField';
