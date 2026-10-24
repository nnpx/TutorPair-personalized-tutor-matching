import React from 'react';
import { SubjectSelector } from './components/SubjectSelector';

export const TutorSubjectsPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <SubjectSelector />
    </div>
  );
};
