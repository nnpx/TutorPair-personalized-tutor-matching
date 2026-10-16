import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'outline-white' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  style,
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'secondary':
        return 'flat-btn-secondary';
      case 'outline':
        return 'flat-btn-outline';
      case 'outline-white':
        return 'flat-btn-outline-white';
      case 'accent':
        return 'flat-btn-accent';
      case 'danger':
        return 'flat-btn-primary'; // Can style with danger color
      case 'primary':
      default:
        return 'flat-btn-primary';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'flat-btn-sm';
      case 'lg':
        return 'flat-btn-lg';
      case 'md':
      default:
        return '';
    }
  };

  const isDanger = variant === 'danger';
  const customStyle: React.CSSProperties = {
    ...(isDanger ? { backgroundColor: 'var(--color-danger)' } : {}),
    ...(disabled || isLoading ? { opacity: 0.5, cursor: 'not-allowed', transform: 'none' } : {}),
    ...style,
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`flat-btn ${getVariantClass()} ${getSizeClass()} ${className}`}
      style={customStyle}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: '1rem',
              height: '1rem',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.6s linear infinite',
            }}
          />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
