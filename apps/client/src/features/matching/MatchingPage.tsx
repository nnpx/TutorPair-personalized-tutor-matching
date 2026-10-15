import React from 'react';
import { Card } from '../../components/ui/Card';

export const MatchingPage: React.FC = () => {
  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Find Your Ideal Tutor</h2>
      <Card>
        {/* TODO: Implement 3-Step Cascading Subject Dropdowns & 1-5 Preferences Sliders */}
        <p style={{ color: 'var(--text-muted)' }}>
          Step 1: Select Category → Step 2: Select Subject → Step 3: Select Variant
        </p>
      </Card>
    </div>
  );
};

export const MatchHistoryPage: React.FC = () => {
  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Your Matching History</h2>
      <Card>
        {/* TODO: Display past matches and confirmed tutor */}
        <p style={{ color: 'var(--text-muted)' }}>Matching history list</p>
      </Card>
    </div>
  );
};
