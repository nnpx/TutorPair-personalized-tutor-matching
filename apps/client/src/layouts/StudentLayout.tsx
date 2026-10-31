import React, { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { queryClient } from '../services/query-client';
import apiClient from '../services/api-client';
import { useStudentProfile } from '../features/students/hooks/useStudents';
import { Sparkles, History, User, LogOut, Lock } from 'lucide-react';
import { Modal } from '../components/ui';

export const StudentLayout: React.FC = () => {
  const { user, clearUser } = useAuthStore();
  const location = useLocation();
  const { data: profile } = useStudentProfile();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isProfileComplete = Boolean(
    profile &&
    profile.first_name &&
    profile.last_name &&
    profile.grade_level &&
    profile.style_profile &&
    profile.style_profile.length === 5 &&
    profile.personality_profile &&
    profile.personality_profile.length === 4
  );

  // Guard: If onboarding is incomplete, redirect directly from profile to onboarding
  if (!isProfileComplete && location.pathname === '/student/profile') {
    return <Navigate to="/student/onboarding" replace />;
  }

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

  const navItems = [
    { label: 'Find Tutors', path: '/student/matching', icon: Sparkles, locked: false },
    { label: 'Matching History', path: '/student/history', icon: History, locked: false },
    { label: 'My Profile', path: '/student/profile', icon: User, locked: !isProfileComplete },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-muted)' }}>
      {/* Flat Header - Clean White Block, No Shadow */}
      <header
        style={{
          backgroundColor: 'var(--bg-canvas)',
          borderBottom: '2px solid var(--color-border)',
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
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--fg-main)',
                }}
              >
                Tutor<span style={{ color: 'var(--color-primary)' }}>Pair</span>
              </span>
            </Link>

            <nav style={{ display: 'flex', gap: '0.5rem' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                if (item.locked) {
                  return (
                    <div
                      key={item.path}
                      title="Complete your profile to access"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.875rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        color: 'var(--fg-muted)',
                        backgroundColor: 'transparent',
                        cursor: 'not-allowed',
                        opacity: 0.6,
                      }}
                    >
                      <Icon size={18} strokeWidth={2.2} />
                      {item.label}
                      <Lock size={14} style={{ marginLeft: '0.25rem' }} />
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.875rem',
                      fontSize: '0.9375rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: isActive ? 700 : 600,
                      color: isActive ? 'var(--color-white)' : 'var(--fg-main)',
                      backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon size={18} strokeWidth={2.2} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--fg-main)' }}>
              {user?.email}
            </span>
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="flat-btn flat-btn-secondary flat-btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
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
