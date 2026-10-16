import React from 'react';

export const Spinner: React.FC<{ size?: number; color?: string }> = ({
  size = 28,
  color = 'var(--color-primary)',
}) => {
  return (
    <div
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `3px solid var(--color-muted)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  );
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'white';
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, variant = 'primary', className = '', style }) => {
  const getBadgeClass = () => {
    switch (variant) {
      case 'white':
        return 'flat-badge-white';
      case 'secondary':
        return 'flat-badge-secondary';
      case 'accent':
        return 'flat-badge-accent';
      case 'danger':
        return 'flat-badge-accent'; // or custom danger badge
      case 'primary':
      default:
        return 'flat-badge-primary';
    }
  };

  return (
    <span
      className={`flat-badge ${getBadgeClass()} ${className}`}
      style={{
        ...(variant === 'danger'
          ? { backgroundColor: 'var(--color-danger-tint)', color: 'var(--color-danger)' }
          : {}),
        ...style,
      }}
    >
      {children}
    </span>
  );
};
