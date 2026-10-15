import React from 'react';
import { Card } from '../../components/ui/Card';

export const StudentProfilePage: React.FC = () => {
  return (
    <Card>
      <h3>Student Profile & Academic Preferences</h3>
      <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        {/* TODO: Implement student profile form using React Hook Form and Zod */}
      </p>
    </Card>
  );
};
