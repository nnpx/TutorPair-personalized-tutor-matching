import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth.store';
import { UserRole } from '@tutorpair/shared';
import { LogIn, Sparkles, ShieldCheck, GraduationCap } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
  const [email, setEmail] = useState('student@tutorpair.local');

  const handleRoleSelect = (role: UserRole, defaultEmail: string) => {
    setSelectedRole(role);
    setEmail(defaultEmail);
  };

  const handleMockLogin = () => {
    // Local development quick mock login bypass
    setUser({
      id: `mock-${selectedRole.toLowerCase()}-id`,
      email,
      role: selectedRole,
    });

    if (selectedRole === UserRole.STUDENT) {
      navigate('/student/matching');
    } else if (selectedRole === UserRole.TUTOR) {
      navigate('/tutor/profile');
    } else {
      navigate('/admin/verifications');
    }
  };

  return (
    <Card style={{ padding: '2.5rem', backgroundColor: 'var(--bg-canvas)' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '3rem',
              height: '3rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-white)',
              fontWeight: 800,
              fontSize: '1.5rem',
            }}
          >
            TP
          </span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--fg-main)' }}>
            Tutor<span style={{ color: 'var(--color-primary)' }}>Pair</span>
          </span>
        </Link>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--fg-main)', marginBottom: '0.5rem' }}>
          Welcome Back
        </h2>
        <p style={{ color: '#4b5563', fontSize: '0.9375rem', fontWeight: 500 }}>
          Select your role to sign into the platform
        </p>
      </div>

      {/* Role Picker Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => handleRoleSelect(UserRole.STUDENT, 'student@tutorpair.local')}
          style={{
            padding: '0.875rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: selectedRole === UserRole.STUDENT ? 'var(--color-primary)' : 'var(--color-muted)',
            color: selectedRole === UserRole.STUDENT ? 'var(--color-white)' : 'var(--fg-main)',
            fontWeight: 700,
            fontSize: '0.875rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.375rem',
            transition: 'all 0.2s ease',
          }}
        >
          <Sparkles size={20} strokeWidth={2.2} />
          Student
        </button>
        <button
          type="button"
          onClick={() => handleRoleSelect(UserRole.TUTOR, 'tutor@tutorpair.local')}
          style={{
            padding: '0.875rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: selectedRole === UserRole.TUTOR ? 'var(--color-secondary)' : 'var(--color-muted)',
            color: selectedRole === UserRole.TUTOR ? 'var(--color-white)' : 'var(--fg-main)',
            fontWeight: 700,
            fontSize: '0.875rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.375rem',
            transition: 'all 0.2s ease',
          }}
        >
          <GraduationCap size={20} strokeWidth={2.2} />
          Tutor
        </button>
        <button
          type="button"
          onClick={() => handleRoleSelect(UserRole.ADMIN, 'admin@tutorpair.local')}
          style={{
            padding: '0.875rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: selectedRole === UserRole.ADMIN ? 'var(--color-dark)' : 'var(--color-muted)',
            color: selectedRole === UserRole.ADMIN ? 'var(--color-white)' : 'var(--fg-main)',
            fontWeight: 700,
            fontSize: '0.875rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.375rem',
            transition: 'all 0.2s ease',
          }}
        >
          <ShieldCheck size={20} strokeWidth={2.2} />
          Admin
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          Account Email
        </label>
        <input
          type="email"
          className="flat-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
        />
      </div>

      <Button
        type="button"
        onClick={handleMockLogin}
        variant={selectedRole === UserRole.TUTOR ? 'secondary' : 'primary'}
        style={{
          width: '100%',
          marginBottom: '1rem',
          ...(selectedRole === UserRole.TUTOR ? { backgroundColor: 'var(--color-secondary)', color: 'white' } : {}),
          ...(selectedRole === UserRole.ADMIN ? { backgroundColor: 'var(--color-dark)', color: 'white' } : {}),
        }}
      >
        <LogIn size={20} strokeWidth={2.2} />
        Sign In as {selectedRole}
      </Button>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <Link to="/" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}>
          ← Back to Homepage
        </Link>
      </div>
    </Card>
  );
};
