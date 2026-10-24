import React from 'react';
import { CheckCircle2, AlertCircle, Clock, Info, X } from 'lucide-react';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  onClose,
  className = '',
  style,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: 'var(--color-secondary-tint)',
          borderColor: 'var(--color-secondary)',
          color: 'var(--color-secondary-hover, #059669)',
          defaultIcon: <CheckCircle2 size={18} strokeWidth={2.4} style={{ flexShrink: 0 }} />,
        };
      case 'error':
        return {
          backgroundColor: 'var(--color-danger-tint)',
          borderColor: 'var(--color-danger)',
          color: 'var(--color-danger)',
          defaultIcon: <AlertCircle size={18} strokeWidth={2.4} style={{ flexShrink: 0 }} />,
        };
      case 'warning':
        return {
          backgroundColor: 'var(--color-accent-tint)',
          borderColor: 'var(--color-accent)',
          color: 'var(--color-accent-hover, #d97706)',
          defaultIcon: <Clock size={18} strokeWidth={2.4} style={{ flexShrink: 0 }} />,
        };
      case 'info':
      default:
        return {
          backgroundColor: 'var(--color-primary-tint)',
          borderColor: 'var(--color-primary)',
          color: 'var(--color-primary-hover, #2563eb)',
          defaultIcon: <Info size={18} strokeWidth={2.4} style={{ flexShrink: 0 }} />,
        };
    }
  };

  const config = getVariantStyles();
  const renderedIcon = icon !== undefined ? icon : config.defaultIcon;

  return (
    <div
      role="alert"
      className={className}
      style={{
        display: 'flex',
        alignItems: title ? 'flex-start' : 'center',
        gap: '0.625rem',
        padding: '0.875rem 1rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: config.backgroundColor,
        border: `1px solid ${config.borderColor}`,
        color: config.color,
        fontWeight: 600,
        fontSize: '0.9375rem',
        lineHeight: 1.5,
        ...style,
      }}
    >
      {renderedIcon}
      <div style={{ flex: 1 }}>
        {title && (
          <div style={{ fontWeight: 800, marginBottom: '0.2rem', color: config.color }}>
            {title}
          </div>
        )}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close alert"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            opacity: 0.8,
            padding: '0.2rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
};
