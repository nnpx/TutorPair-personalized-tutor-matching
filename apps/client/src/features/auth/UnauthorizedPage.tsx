import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useAuthStore } from '../../store/auth.store';
import { UserRole } from '@tutorpair/shared';
import { ShieldAlert, ArrowLeft, LogOut, LogIn } from 'lucide-react';
import { queryClient } from '../../services/query-client';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleGoDashboard = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === UserRole.STUDENT) {
      navigate('/student/matching');
    } else if (user.role === UserRole.TUTOR) {
      navigate('/tutor/profile');
    } else if (user.role === UserRole.ADMIN) {
      navigate('/admin/verifications');
    } else {
      navigate('/');
    }
  };

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    queryClient.clear();
    queryClient.removeQueries();
    clearUser();
    navigate('/login');
  };

  return (
    <>
      <Card
        hoverEffect={false}
        style={{
          padding: '2.5rem 2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-canvas)',
          maxWidth: '28rem',
          width: '100%',
          margin: '0 auto',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.625rem',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.75rem',
                height: '2.75rem',
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
                fontSize: '1.75rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--fg-main)',
              }}
            >
              Tutor<span style={{ color: 'var(--color-primary)' }}>Pair</span>
            </span>
          </Link>
        </div>

        {/* Visual Icon Badge */}
        <div
          style={{
            width: '4.5rem',
            height: '4.5rem',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <ShieldAlert size={34} strokeWidth={2.4} />
        </div>

        {/* Status Pill Badge */}
        <div style={{ marginBottom: '1rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            403 · Access Denied
          </span>
        </div>

        {/* Heading & Explanation */}
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--fg-main)',
            marginBottom: '0.625rem',
            letterSpacing: '-0.02em',
          }}
        >
          Restricted Resource
        </h1>

        <p
          style={{
            fontSize: '0.9375rem',
            color: '#4b5563',
            lineHeight: 1.5,
            marginBottom: '2rem',
          }}
        >
          {user ? (
            <>
              Your account role{' '}
              <strong style={{ color: 'var(--fg-main)' }}>[{user.role}]</strong> does
              not have permission to view or access this page.
            </>
          ) : (
            'You need to sign in with an authorized account to access this page.'
          )}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {user ? (
            <>
              <Button
                type="button"
                variant="primary"
                onClick={handleGoDashboard}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <ArrowLeft size={18} strokeWidth={2.2} />
                Go to My Dashboard
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLogoutModalOpen(true)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <LogOut size={18} strokeWidth={2.2} />
                Sign in with Another Account
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="primary"
                onClick={() => navigate('/login')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <LogIn size={18} strokeWidth={2.2} />
                Sign In to Continue
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <ArrowLeft size={18} strokeWidth={2.2} />
                Back to Homepage
              </Button>
            </>
          )}
        </div>
      </Card>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Log Out"
        variant="danger"
        maxWidth="420px"
        primaryActionText="Log Out"
        onPrimaryAction={handleLogoutConfirm}
        secondaryActionText="Cancel"
        onSecondaryAction={() => setIsLogoutModalOpen(false)}
      >
        <p style={{ margin: 0, color: 'var(--fg-main, #374151)', fontSize: '0.9375rem' }}>
          Are you sure you want to log out?
        </p>
      </Modal>
    </>
  );
};
