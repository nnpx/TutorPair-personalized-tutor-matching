import { ArrowLeft } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

interface BackLinkProps {
  to: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export const BackLink: React.FC<BackLinkProps> = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      fontSize: '0.875rem',
      fontWeight: 700,
      color: '#4b5563',
      textDecoration: 'none',
      padding: '0.45rem 0.875rem',
      borderRadius: 'var(--radius-md)',
      backgroundColor: '#ffffff',
      border: '2px solid var(--color-border)',
      transition: 'all 0.15s ease',
    }}
  >
    <ArrowLeft size={16} strokeWidth={2.4} /> {children}
  </Link>
);
