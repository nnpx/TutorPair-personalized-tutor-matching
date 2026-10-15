import React from 'react';
import { Card } from '../../components/ui/Card';

export const TutorProfilePage: React.FC = () => {
  return (
    <Card>
      <h3>Tutor Profile & Teaching Information</h3>
      {/* TODO: Implement tutor profile setup (subjects, rates, teaching style) */}
      <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        Tutor profile configuration form
      </p>
    </Card>
  );
};

export const TutorDocumentsPage: React.FC = () => {
  return (
    <Card>
      <h3>Verification Documents</h3>
      {/* TODO: Implement S3 presigned URL upload component for CV, transcripts, and subject proofs */}
      <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        Upload CV, academic transcript, and certificates (max 10MB per file)
      </p>
    </Card>
  );
};
