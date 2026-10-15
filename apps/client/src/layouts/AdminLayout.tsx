import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export const AdminLayout: React.FC = () => {
  const { user, clearUser } = useAuthStore();

  return (
    <div>
      <header
        style={{
          backgroundColor: '#1e293b',
          color: '#ffffff',
          padding: '1rem 0',
        }}
      >
        <div
          className="container"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#38bdf8', fontWeight: 700 }}>
              TutorPair Admin
            </h2>
            <nav style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/admin/verifications" style={{ color: '#ffffff' }}>
                Tutor Verifications
              </Link>
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{user?.email}</span>
            <button
              onClick={clearUser}
              style={{
                background: 'none',
                border: '1px solid #475569',
                color: '#ffffff',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius)',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="container" style={{ padding: '2rem 1rem' }}>
        <Outlet />
      </main>
    </div>
  );
};
