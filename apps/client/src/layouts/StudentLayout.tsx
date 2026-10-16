import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { Sparkles, History, User, LogOut } from 'lucide-react';

export const StudentLayout: React.FC = () => {
  const { user, clearUser } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { label: 'Find Tutors', path: '/student/matching', icon: Sparkles },
    { label: 'Matching History', path: '/student/history', icon: History },
    { label: 'My Profile', path: '/student/profile', icon: User },
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
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-main)' }}>
                  Tutor<span style={{ color: 'var(--color-primary)' }}>Pair</span>
                </span>
                <span
                  style={{
                    marginLeft: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor: 'var(--color-primary-tint)',
                    color: 'var(--color-primary)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  Student
                </span>
              </div>
            </Link>

            <nav style={{ display: 'flex', gap: '0.5rem' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
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
