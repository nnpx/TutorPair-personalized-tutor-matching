import React from 'react';
import { AlertCircle, Lock } from 'lucide-react';

export interface FormFieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  isLocked?: boolean;
  error?: string | null;
  helperText?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  isLocked = false,
  error,
  helperText,
  children,
  className = '',
  style,
}) => {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {label && (
        <label
          htmlFor={htmlFor}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: 'var(--fg-main)',
            marginBottom: '0.375rem',
          }}
        >
          <span>{label}</span>
          {required && (
            <span style={{ color: 'var(--color-danger)', fontWeight: 800 }} aria-hidden="true">
              *
            </span>
          )}
          {isLocked && (
            <Lock size={12} color="#6b7280" style={{ flexShrink: 0 }} aria-label="Field is locked" />
          )}
        </label>
      )}

      {children}

      {error ? (
        <span
          role="alert"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: 'var(--color-danger)',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginTop: '0.375rem',
          }}
        >
          <AlertCircle size={13} strokeWidth={2.4} style={{ flexShrink: 0 }} />
          {error}
        </span>
      ) : helperText ? (
        <span
          style={{
            color: '#6b7280',
            fontSize: '0.75rem',
            marginTop: '0.25rem',
            lineHeight: 1.35,
          }}
        >
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
