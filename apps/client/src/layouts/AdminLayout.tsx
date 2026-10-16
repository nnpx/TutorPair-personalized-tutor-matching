import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { ShieldCheck, LogOut } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, clearUser } = useAuthStore();
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-muted)' }}>
      {/* Flat Header - Dark Color Block */}
      <header
        style={{
          backgroundColor: 'var(--color-dark)',
          color: 'var(--color-white)',
          padding: '1.25rem 0',
        }}
      >
        <div
          className="container-flat"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-white)',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                }}
              >
                TP
              </span>
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-white)' }}>
                  TutorPair
                </span>
                <span
                  style={{
                    marginLeft: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-white)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  Admin Portal
                </span>
              </div>
            </Link>

            <nav style={{ display: 'flex', gap: '0.5rem' }}>
              <Link
                to="/admin/verifications"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: location.pathname === '/admin/verifications' ? 700 : 600,
                  color: 'var(--color-white)',
                  backgroundColor: location.pathname === '/admin/verifications' ? 'var(--color-primary)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <ShieldCheck size={18} strokeWidth={2.2} />
                Tutor Verifications
              </Link>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#9ca3af' }}>
              {user?.email}
            </span>
            <button
              onClick={clearUser}
              className="flat-btn flat-btn-outline-white flat-btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', border: '2px solid #4b5563' }}
            >
              <LogOut size={16} strokeWidth={2.2} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container-flat" style={{ padding: '2.5rem 1.5rem' }}>
        <Outlet />
      </main>
    </div>
  );
};
