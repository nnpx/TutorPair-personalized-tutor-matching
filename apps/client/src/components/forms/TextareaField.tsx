import React, { forwardRef } from 'react';
import { FormField } from './FormField';

export interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  required?: boolean;
  isLocked?: boolean;
  error?: string | null;
  helperText?: React.ReactNode;
  showCharCount?: boolean;
  containerStyle?: React.CSSProperties;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(({
  label,
  required,
  isLocked,
  error,
  helperText,
  showCharCount = false,
  containerStyle,
  id,
  name,
  disabled,
  rows = 4,
  maxLength,
  value,
  style,
  className = '',
  ...textareaProps
}, ref) => {
  const textareaId = id || name;
  const currentLength = typeof value === 'string' ? value.length : 0;

  const baseTextareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-md)',
    border: error ? '2px solid var(--color-danger)' : '2px solid var(--color-border)',
    backgroundColor: disabled ? 'var(--color-muted)' : 'var(--bg-canvas)',
    color: disabled ? '#6b7280' : 'var(--fg-main)',
    cursor: disabled ? 'not-allowed' : 'text',
    fontWeight: 500,
    fontSize: '0.9375rem',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    ...style,
  };

  const combinedHelperText = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <span>{helperText}</span>
      {showCharCount && maxLength && (
        <span style={{ color: '#9ca3af', fontSize: '0.75rem', marginLeft: 'auto' }}>
          {currentLength} / {maxLength}
        </span>
      )}
    </div>
  );

  return (
    <FormField
      htmlFor={textareaId}
      label={label}
      required={required}
      isLocked={isLocked || disabled}
      error={error}
      helperText={showCharCount || helperText ? combinedHelperText : null}
      style={containerStyle}
    >
      <textarea
        ref={ref}
        id={textareaId}
        name={name}
        rows={rows}
        maxLength={maxLength}
        value={value}
        disabled={disabled}
        className={`flat-textarea-custom ${className}`}
        style={baseTextareaStyle}
        {...textareaProps}
      />
    </FormField>
  );
});

TextareaField.displayName = 'TextareaField';
