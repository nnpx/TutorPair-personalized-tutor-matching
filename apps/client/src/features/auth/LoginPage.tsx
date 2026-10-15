import React from 'react';
import { Card } from '../../components/ui/Card';

export const LoginPage: React.FC = () => {
  return (
    <Card>
      <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Login to TutorPair</h2>
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.5rem' }}>
        Sign in with your Cognito account or Google OAuth.
      </p>
      {/* TODO: Implement Cognito / Google OAuth login form */}
    </Card>
  );
};
