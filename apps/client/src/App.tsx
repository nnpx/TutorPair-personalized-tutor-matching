import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout';
import { StudentLayout } from './layouts/StudentLayout';
import { TutorLayout } from './layouts/TutorLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { LandingPage } from './features/landing/LandingPage';
import { StudentProfilePage } from './features/students/StudentProfilePage';
import { MatchingPage, MatchHistoryPage } from './features/matching/MatchingPage';
import {
  TutorProfilePage,
  TutorOnboardingPage,
} from './features/tutors/TutorPages';
import { AdminVerificationsPage } from './features/admin/AdminVerificationsPage';
import { ReviewSubmissionPage } from './features/reviews/ReviewSubmissionPage';
import { UserRole } from '@tutorpair/shared';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Public / Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Student routes */}
      <Route element={<ProtectedRoute allowedRoles={[UserRole.STUDENT]} />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="/student/matching" replace />} />
          <Route path="matching" element={<MatchingPage />} />
          <Route path="history" element={<MatchHistoryPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="subjects" element={<Navigate to="/student/matching" replace />} />
          <Route path="sliders" element={<Navigate to="/student/profile?tab=sliders" replace />} />
          <Route path="availability" element={<Navigate to="/student/profile?tab=availability" replace />} />
          <Route path="review/:recommendationId" element={<ReviewSubmissionPage />} />
        </Route>
      </Route>

      {/* Tutor routes */}
      <Route element={<ProtectedRoute allowedRoles={[UserRole.TUTOR]} />}>
        <Route path="/tutor" element={<TutorLayout />}>
          <Route index element={<Navigate to="/tutor/profile" replace />} />
          <Route path="onboarding" element={<TutorOnboardingPage />} />
          <Route path="profile" element={<TutorProfilePage />} />
          <Route path="subjects" element={<Navigate to="/tutor/profile?tab=subjects" replace />} />
          <Route path="availability" element={<Navigate to="/tutor/profile?tab=availability" replace />} />
          <Route path="verification" element={<Navigate to="/tutor/profile?tab=documents" replace />} />
          <Route path="documents" element={<Navigate to="/tutor/profile?tab=documents" replace />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/verifications" replace />} />
          <Route path="verifications" element={<AdminVerificationsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
