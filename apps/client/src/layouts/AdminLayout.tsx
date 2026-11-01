import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { queryClient } from '../services/query-client';
import apiClient from '../services/api-client';
import { LogOut } from 'lucide-react';
import { Modal } from '../components/ui';

export const AdminLayout: React.FC = () => {
  const { user, clearUser } = useAuthStore();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Ignore network errors
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
      queryClient.clear();
      queryClient.removeQueries();
      clearUser();
    }
  };

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
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#9ca3af' }}>
              {user?.email}
            </span>
            <button
              onClick={() => setIsLogoutModalOpen(true)}
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

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Log Out"
        variant="danger"
        maxWidth="420px"
        primaryActionText={isLoggingOut ? 'Logging out...' : 'Log Out'}
        onPrimaryAction={handleLogoutConfirm}
        secondaryActionText="Cancel"
        onSecondaryAction={() => setIsLogoutModalOpen(false)}
      >
        <p style={{ margin: 0, color: 'var(--fg-main, #374151)', fontSize: '0.9375rem' }}>
          Are you sure you want to log out?
        </p>
      </Modal>
    </div>
  );
};
