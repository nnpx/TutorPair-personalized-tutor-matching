import React from 'react';
import { Button, type ButtonProps } from './Button';
import { Sparkles } from 'lucide-react';

export interface SaveButtonProps extends Omit<ButtonProps, 'children'> {
  label?: string;
  icon?: React.ReactNode;
  showIcon?: boolean;
  fullWidth?: boolean;
}

export const SaveButton: React.FC<SaveButtonProps> = ({
  label = 'Save Changes',
  icon,
  showIcon = true,
  fullWidth = true,
  variant = 'primary',
  type = 'submit',
  isLoading = false,
  disabled = false,
  style,
  ...rest
}) => {
  const renderedIcon = icon !== undefined ? icon : <Sparkles size={20} strokeWidth={2.4} />;

  return (
    <Button
      type={type}
      variant={variant}
      isLoading={isLoading}
      disabled={disabled || isLoading}
      style={{
        width: fullWidth ? '100%' : 'auto',
        height: '3.75rem',
        fontSize: '1.125rem',
        fontWeight: 800,
        ...style,
      }}
      {...rest}
    >
      {showIcon && renderedIcon}
      {label}
    </Button>
  );
};
