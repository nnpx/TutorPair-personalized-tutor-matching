import React, { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'default';
  maxWidth?: string;
  ariaLabel?: string;
  // Custom footer slot (used by Admin)
  footerActions?: React.ReactNode;
  // Standard actions (used by Students / Matching)
  primaryActionText?: string;
  onPrimaryAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title = 'Notification',
  subtitle,
  icon,
  children,
  variant = 'default',
  maxWidth = '520px',
  ariaLabel,
  footerActions,
  primaryActionText,
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  const getBorderColor = () => {
    switch (variant) {
      case 'danger':
        return '#ef4444';
      case 'primary':
        return 'var(--color-primary, #2563eb)';
      case 'secondary':
        return 'var(--color-secondary, #4b5563)';
      default:
        return 'var(--color-border, #e5e7eb)';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="flat-card"
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg, 0.75rem)',
          border: `2px solid ${getBorderColor()}`,
          overflow: 'hidden',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: isDanger ? '#fef2f2' : 'var(--color-muted, #f9fafb)',
            borderBottom: isDanger ? '2px solid #fee2e2' : '2px solid var(--color-border, #e5e7eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            {icon ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
            ) : isDanger ? (
              <span style={{ color: '#ef4444', display: 'inline-flex', flexShrink: 0 }}>
                <AlertCircle size={22} strokeWidth={2.4} />
              </span>
            ) : null}

            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: isDanger ? '#991b1b' : 'var(--color-text-main, #111827)',
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {title}
              </h3>
              {subtitle && (
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0.125rem 0 0 0' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isDanger ? '#991b1b' : '#6b7280',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm, 0.25rem)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={20} strokeWidth={2.4} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '1.5rem',
            fontSize: '0.9375rem',
            color: '#374151',
            lineHeight: 1.55,
          }}
        >
          {children}
        </div>

        {/* Modal Footer */}
        {(footerActions || primaryActionText || secondaryActionText) && (
          <div
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: '#ffffff',
              borderTop: '2px solid var(--color-border, #e5e7eb)',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            {footerActions ? (
              footerActions
            ) : (
              <>
                {secondaryActionText && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (onSecondaryAction) {
                        onSecondaryAction();
                      } else {
                        onClose();
                      }
                    }}
                    style={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      padding: '0 1.25rem',
                      height: '2.5rem',
                    }}
                  >
                    {secondaryActionText}
                  </Button>
                )}

                {primaryActionText && (
                  <Button
                    type="button"
                    variant={isDanger ? 'danger' : 'primary'}
                    onClick={() => {
                      if (onPrimaryAction) {
                        onPrimaryAction();
                      } else {
                        onClose();
                      }
                    }}
                    style={{
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      padding: '0 1.5rem',
                      height: '2.5rem',
                    }}
                  >
                    {primaryActionText}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
