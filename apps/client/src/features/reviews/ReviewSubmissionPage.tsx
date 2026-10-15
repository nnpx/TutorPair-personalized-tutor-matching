import React from 'react';
import { Card } from '../../components/ui/Card';

export const ReviewSubmissionPage: React.FC = () => {
  return (
    <Card>
      <h3>Submit Tutor Review</h3>
      {/* TODO: Implement 4-category rating (Knowledge, Preparation, Clarity, Punctuality) and written comment */}
      <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        Rate your confirmed tutor across 4 categories
      </p>
    </Card>
  );
};
