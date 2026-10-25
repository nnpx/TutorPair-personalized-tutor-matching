import React, { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  variant?: 'danger' | 'default';
  children: React.ReactNode;
  primaryActionText?: string;
  onPrimaryAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title = 'Notification',
  variant = 'default',
  children,
  primaryActionText = 'Close',
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

  return (
    <div
      role="dialog"
      aria-modal="true"
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
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: isDanger ? '2px solid #ef4444' : '2px solid var(--color-border)',
          overflow: 'hidden',
          boxShadow: 'none',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: isDanger ? '#fef2f2' : 'var(--color-muted)',
            borderBottom: isDanger ? '2px solid #fee2e2' : '2px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {isDanger && (
              <span style={{ color: '#ef4444', display: 'inline-flex' }}>
                <AlertCircle size={22} strokeWidth={2.4} />
              </span>
            )}
            <h3
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: isDanger ? '#991b1b' : 'var(--fg-main)',
                margin: 0,
              }}
            >
              {title}
            </h3>
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
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
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
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#ffffff',
            borderTop: '2px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
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
        </div>
      </div>
    </div>
  );
};
