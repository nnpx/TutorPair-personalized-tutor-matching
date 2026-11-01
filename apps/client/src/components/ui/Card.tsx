import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  tint?: 'white' | 'blue' | 'emerald' | 'amber' | 'muted';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  tint = 'white',
  hoverEffect = true,
  className = '',
  style,
  ...props
}) => {
  const getTintClass = () => {
    switch (tint) {
      case 'blue':
        return 'flat-card-tint-blue';
      case 'emerald':
        return 'flat-card-tint-emerald';
      case 'amber':
        return 'flat-card-tint-amber';
      case 'muted':
        return 'flat-card-muted';
      case 'white':
      default:
        return '';
    }
  };

  return (
    <div
      className={`flat-card ${getTintClass()} ${!hoverEffect ? 'flat-card-no-hover' : ''} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};
