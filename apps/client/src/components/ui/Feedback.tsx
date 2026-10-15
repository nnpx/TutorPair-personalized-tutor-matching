import React from 'react';

export const Spinner: React.FC<{ size?: number }> = ({ size = 24 }) => {
  return (
    <div
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: '3px solid var(--border)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}> = ({ children, variant = 'primary' }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'var(--primary-light)', text: 'var(--primary)' },
    success: { bg: '#dcfce7', text: '#15803d' },
    warning: { bg: '#fef3c7', text: '#b45309' },
    danger: { bg: '#fee2e2', text: '#b91c1c' },
  };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.2rem 0.6rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: colors[variant].bg,
        color: colors[variant].text,
      }}
    >
      {children}
    </span>
  );
};
