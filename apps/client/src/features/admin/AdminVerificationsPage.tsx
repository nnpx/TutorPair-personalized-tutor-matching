import React from 'react';
import { Card } from '../../components/ui/Card';

export const AdminVerificationsPage: React.FC = () => {
  return (
    <Card>
      <h3>Tutor Verification Queue</h3>
      {/* TODO: Implement tutor verification table with approve/reject actions and document viewer modal */}
      <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        Review pending tutor applications and submitted proof documents
      </p>
    </Card>
  );
};
