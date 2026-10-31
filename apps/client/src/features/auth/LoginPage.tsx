import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useAuthStore } from '../../store/auth.store';
import { UserRole, ApiResponse } from '@tutorpair/shared';
import {
  Sparkles,
  GraduationCap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Terminal,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { queryClient } from '../../services/query-client';
import apiClient from '../../services/api-client';

const GoogleIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
    />
  </svg>
);

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuthStore();

  const modeParam = searchParams.get('mode');
  const roleParam = searchParams.get('role');

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>(() =>
    modeParam === 'register' ? 'register' : 'signin'
  );
  const [selectedRole, setSelectedRole] = useState<UserRole.STUDENT | UserRole.TUTOR>(() =>
    roleParam?.toUpperCase() === 'TUTOR' ? UserRole.TUTOR : UserRole.STUDENT
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Development Mock Tools State
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [mockEmail, setMockEmail] = useState('student@tutorpair.local');

  const routeByRole = (role: UserRole) => {
    if (role === UserRole.STUDENT) {
      navigate('/student/matching');
    } else if (role === UserRole.TUTOR) {
      navigate('/tutor/profile');
    } else if (role === UserRole.ADMIN) {
      navigate('/admin/verifications');
    } else {
      navigate('/');
    }
  };

  // If already authenticated, redirect directly to dashboard
  useEffect(() => {
    if (user) {
      routeByRole(user.role);
    }
  }, [user]);

  // Synchronize active tab and role selection when URL query parameters change
  useEffect(() => {
    if (modeParam === 'register' || modeParam === 'signin') {
      setActiveTab(modeParam);
    }
  }, [modeParam]);

  useEffect(() => {
    if (roleParam?.toUpperCase() === 'TUTOR') {
      setSelectedRole(UserRole.TUTOR);
    } else if (roleParam?.toUpperCase() === 'STUDENT') {
      setSelectedRole(UserRole.STUDENT);
    }
  }, [roleParam]);

  /**
   * Google Authentication Action
   * In local/dev mock mode: Performs mock authentication cycle.
   * In cloud/production: Will trigger Amplify signInWithRedirect({ provider: 'Google' }).
   */
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    queryClient.clear();
    queryClient.removeQueries();

    try {
      // 1. In development, use mock identity simulation
      const email =
        activeTab === 'register'
          ? `${selectedRole.toLowerCase()}-${Date.now()}@tutorpair.local`
          : mockEmail;

      const sub = `google-user-${email.replace(/[^a-zA-Z0-9]/g, '-')}`;

      // Temporarily store user state so api client attaches mock token
      setUser({
        id: sub,
        email,
        role: selectedRole,
      });

      // 2. Synchronize account with backend
      const syncRes = await apiClient.post<
        ApiResponse<{ id: string; email: string; role: UserRole; is_new_user: boolean }>
      >('/api/auth/sync', { role: selectedRole });

      if (syncRes.data.data) {
        const syncedUser = syncRes.data.data;
        setUser({
          id: syncedUser.id,
          email: syncedUser.email,
          role: syncedUser.role,
        });

        routeByRole(syncedUser.role);
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Authentication failed. Please check your credentials or network connection.';
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fast Development Mock Login Bypass
   */
  const handleQuickMockLogin = async (role: UserRole, defaultEmail: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    queryClient.clear();
    queryClient.removeQueries();

    try {
      const sanitizedEmail = mockEmail.trim().toLowerCase() || defaultEmail;
      const res = await apiClient.post<
        ApiResponse<{
          token: string;
          user: { id: string; email: string; role: UserRole };
        }>
      >('/api/auth/mock-login', {
        role,
        email: sanitizedEmail,
      });

      if (res.data.data) {
        const { user } = res.data.data;
        setUser({
          id: user.id,
          email: user.email,
          role: user.role,
        });

        routeByRole(user.role);
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Mock login failed.';
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      hoverEffect={false}
      style={{
        padding: '2.5rem',
        backgroundColor: 'var(--bg-canvas)',
        maxWidth: '28rem',
        width: '100%',
        margin: '0 auto',
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.625rem',
            marginBottom: '1rem',
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
        <h1
          style={{
            fontSize: '1.375rem',
            fontWeight: 800,
            color: 'var(--fg-main)',
            marginBottom: '0.25rem',
          }}
        >
          {activeTab === 'signin' ? 'Sign In to TutorPair' : 'Create an Account'}
        </h1>
        <p style={{ color: '#4b5563', fontSize: '0.875rem', fontWeight: 500 }}>
          {activeTab === 'signin'
            ? 'Access your matchmaking dashboard and tutoring profile'
            : 'Join Thailand’s premier verified tutor matching platform'}
        </p>
      </div>

      {/* Tabs: Sign In vs Create Account */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.375rem',
          backgroundColor: 'var(--color-muted)',
          padding: '0.375rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('signin');
            setErrorMessage(null);
          }}
          style={{
            padding: '0.625rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTab === 'signin' ? 'var(--bg-canvas)' : 'transparent',
            color: activeTab === 'signin' ? 'var(--fg-main)' : '#6b7280',
            fontWeight: 800,
            fontSize: '0.875rem',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <LogIn size={16} strokeWidth={2.4} />
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('register');
            setErrorMessage(null);
          }}
          style={{
            padding: '0.625rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: activeTab === 'register' ? 'var(--bg-canvas)' : 'transparent',
            color: activeTab === 'register' ? 'var(--fg-main)' : '#6b7280',
            fontWeight: 800,
            fontSize: '0.875rem',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <UserPlus size={16} strokeWidth={2.4} />
          Register
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div style={{ marginBottom: '1.25rem' }}>
          <Alert variant="error" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        </div>
      )}

      {/* Register Role Selector Cards */}
      {activeTab === 'register' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              display: 'block',
              fontWeight: 800,
              fontSize: '0.8125rem',
              color: 'var(--fg-main)',
              marginBottom: '0.625rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            I am joining as a:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
            <button
              type="button"
              onClick={() => setSelectedRole(UserRole.STUDENT)}
              style={{
                padding: '1rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor:
                  selectedRole === UserRole.STUDENT ? '#f3e8ff' : 'var(--bg-canvas)',
                border:
                  selectedRole === UserRole.STUDENT
                    ? '2px solid var(--color-primary)'
                    : '2px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.375rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Sparkles
                size={24}
                strokeWidth={2.2}
                color={
                  selectedRole === UserRole.STUDENT
                    ? 'var(--color-primary)'
                    : '#6b7280'
                }
              />
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '0.9375rem',
                  color:
                    selectedRole === UserRole.STUDENT
                      ? 'var(--color-primary)'
                      : 'var(--fg-main)',
                }}
              >
                Student / Parent
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#6b7280', textAlign: 'center' }}>
                Find verified tutors
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole(UserRole.TUTOR)}
              style={{
                padding: '1rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor:
                  selectedRole === UserRole.TUTOR ? '#fff7ed' : 'var(--bg-canvas)',
                border:
                  selectedRole === UserRole.TUTOR
                    ? '2px solid var(--color-secondary)'
                    : '2px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.375rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <GraduationCap
                size={24}
                strokeWidth={2.2}
                color={
                  selectedRole === UserRole.TUTOR
                    ? 'var(--color-secondary)'
                    : '#6b7280'
                }
              />
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '0.9375rem',
                  color:
                    selectedRole === UserRole.TUTOR
                      ? 'var(--color-secondary)'
                      : 'var(--fg-main)',
                }}
              >
                Tutor
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#6b7280', textAlign: 'center' }}>
                Teach & verify profile
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Primary Action Button: Google Authentication */}
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={isLoading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          padding: '0.875rem 1.25rem',
          backgroundColor: 'var(--color-white)',
          color: 'var(--fg-main)',
          fontWeight: 800,
          fontSize: '0.9375rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #e5e7eb',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1,
          boxShadow: 'none',
          transition: 'all 0.15s ease',
        }}
      >
        <GoogleIcon size={20} />
        {isLoading
          ? 'Signing in...'
          : activeTab === 'signin'
            ? 'Continue with Google'
            : `Sign Up with Google as ${selectedRole === UserRole.STUDENT ? 'Student' : 'Tutor'}`}
      </button>

      <p
        style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#6b7280',
          marginTop: '0.875rem',
          lineHeight: 1.4,
        }}
      >
        {activeTab === 'signin'
          ? 'Signing in automatically identifies your account and role.'
          : 'Your account and email will be securely authenticated via Google.'}
      </p>

      {/* Developer Mock Tool Panel (Active in Dev Mode) */}
      {import.meta.env.DEV && (
        <div
          style={{
            marginTop: '2rem',
            borderTop: '2px dashed #d1d5db',
            paddingTop: '1.25rem',
          }}
        >
          <button
            type="button"
            onClick={() => setShowDevPanel(!showDevPanel)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'none',
              border: 'none',
              color: '#4b5563',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '0.25rem 0',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Terminal size={16} strokeWidth={2.4} />
              🛠️ Local Dev Mock Mode (Offline)
            </span>
            {showDevPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showDevPanel && (
            <div
              style={{
                marginTop: '0.75rem',
                backgroundColor: 'var(--color-muted)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #e5e7eb',
              }}
            >
              <div style={{ marginBottom: '0.75rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    marginBottom: '0.375rem',
                  }}
                >
                  Mock Email:
                </label>
                <input
                  type="email"
                  className="flat-input"
                  value={mockEmail}
                  onChange={(e) => setMockEmail(e.target.value)}
                  style={{ fontSize: '0.8125rem', padding: '0.5rem 0.625rem' }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.375rem',
                }}
              >
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    handleQuickMockLogin(UserRole.STUDENT, 'student@tutorpair.local');
                  }}
                  style={{
                    padding: '0.5rem',
                    fontSize: '0.75rem',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={14} /> Student
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    handleQuickMockLogin(UserRole.TUTOR, 'tutor@tutorpair.local');
                  }}
                  style={{
                    padding: '0.5rem',
                    fontSize: '0.75rem',
                    justifyContent: 'center',
                  }}
                >
                  <GraduationCap size={14} /> Tutor
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    handleQuickMockLogin(UserRole.ADMIN, 'admin@tutorpair.local');
                  }}
                  style={{
                    padding: '0.5rem',
                    fontSize: '0.75rem',
                    justifyContent: 'center',
                    backgroundColor: 'var(--color-dark)',
                    color: 'white',
                  }}
                >
                  <ShieldCheck size={14} /> Admin
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Back Link */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <Link
          to="/"
          style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
          }}
        >
          ← Back to Homepage
        </Link>
      </div>
    </Card>
  );
};
