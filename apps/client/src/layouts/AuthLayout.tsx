import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--background)',
        padding: '1rem',
      }}
    >
      <div style={{ maxWidth: '420px', width: '100%' }}>
        <Outlet />
      </div>
    </div>
  );
};
