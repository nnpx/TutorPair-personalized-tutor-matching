import { NotificationBell } from '../features/notifications/NotificationBell';
import React from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useTutorVerification } from '../features/tutors/hooks/useTutors';
import { VerificationStatus } from '@tutorpair/shared';
import { User, LogOut, Lock, LayoutDashboard } from 'lucide-react';

export const TutorLayout: React.FC = () => {
  const { user, clearUser } = useAuthStore();
  const location = useLocation();
  const { data: verification } = useTutorVerification();

  const docs = verification?.documents ?? [];
  const status = verification?.verification_status;
  const isSubmittedOrReviewed =
    status === VerificationStatus.APPROVED ||
    status === VerificationStatus.REJECTED ||
    (status === VerificationStatus.PENDING && docs.length >= 2);

  // Guard: If onboarding is incomplete, prevent direct URL navigation to sub-management tabs
  if (
    !isSubmittedOrReviewed &&
    ['/tutor/subjects', '/tutor/availability', '/tutor/verification', '/tutor/documents'].includes(
      location.pathname
    )
  ) {
    return <Navigate to="/tutor/profile" replace />;
  }

  const isProfileActive =
    (location.pathname === '/tutor/profile' &&
      ['tab=profile', 'tab=subjects', 'tab=availability', 'tab=documents'].some((t) =>
        location.search.includes(t)
      )) ||
    ['/tutor/subjects', '/tutor/availability', '/tutor/verification', '/tutor/documents'].includes(
      location.pathname
    );

  const isDashboardActive =
    location.pathname === '/tutor/profile' && !isProfileActive;

  const navItems = [
    { label: 'Dashboard', path: '/tutor/profile', icon: LayoutDashboard, locked: false, isActive: isDashboardActive },
    { label: 'My Profile', path: '/tutor/profile?tab=profile', icon: User, locked: !isSubmittedOrReviewed, isActive: isProfileActive },
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
                  backgroundColor: 'var(--color-secondary)',
                  color: 'var(--color-white)',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                }}
              >
                TP
              </span>
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-main)' }}>
                  Tutor<span style={{ color: 'var(--color-secondary)' }}>Pair</span>
                </span>
                <span
                  style={{
                    marginLeft: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor: 'var(--color-secondary-tint)',
                    color: 'var(--color-secondary)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  Tutor Portal
                </span>
              </div>
            </Link>

            <nav style={{ display: 'flex', gap: '0.5rem' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.isActive;

                if (item.locked) {
                  return (
                    <div
                      key={item.path}
                      title="Complete onboarding application to unlock this section"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                        color: 'var(--color-muted-text, #9ca3af)',
                        backgroundColor: 'transparent',
                        cursor: 'not-allowed',
                        opacity: 0.65,
                        userSelect: 'none',
                      }}
                    >
                      <Icon size={18} strokeWidth={2.2} />
                      {item.label}
                      <Lock size={13} strokeWidth={2.4} style={{ marginLeft: '0.125rem', opacity: 0.8 }} />
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
                      padding: '0.625rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: isActive ? 700 : 600,
                      color: isActive ? 'var(--color-white)' : 'var(--fg-main)',
                      backgroundColor: isActive ? 'var(--color-secondary)' : 'transparent',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NotificationBell />

            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--fg-main)', marginLeft: '0.25rem' }}>
              {user?.email}
            </span>
            <button
              onClick={clearUser}
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
    </div>
  );
};
