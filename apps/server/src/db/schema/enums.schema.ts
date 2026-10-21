import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['STUDENT', 'TUTOR', 'ADMIN']);

export const verificationStatusEnum = pgEnum('verification_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

export const tutorTypeEnum = pgEnum('tutor_type', [
  'UNDERGRADUATE',
  'FREELANCE',
  'INSTITUTIONAL',
]);

export const tutorTypePrefEnum = pgEnum('tutor_type_pref', [
  'UNDERGRADUATE',
  'FREELANCE',
  'INSTITUTIONAL',
  'ANY',
]);

export const subjectCategoryEnum = pgEnum('subject_category', [
  'GENERAL_LEARNING',
  'LANGUAGE_TESTING',
  'UNIVERSITY_ENTRANCE',
]);

export const learningGoalEnum = pgEnum('learning_goal', [
  'SCHOOL_CURRICULUM',
  'COMPETITIONS',
  'STANDARDIZED_EXAMS',
  'PRACTICAL_APPLICATION',
  'A_LEVEL',
  'TPAT',
  'TGAT',
  'GENERAL_SKILLS',
]);

export const documentTypeEnum = pgEnum('document_type', [
  'GRADUATION_CERTIFICATE',
  'ACADEMIC_TRANSCRIPT',
  'CV',
  'SUBJECT_QUALIFICATION',
]);

export const dayOfWeekEnum = pgEnum('day_of_week', [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

export const notificationEventTypeEnum = pgEnum('notification_event_type', [
  'TUTOR_SELECTED',
  'VERIFICATION_APPROVED',
  'VERIFICATION_REJECTED',
  'NEW_REVIEW',
]);

export const emailStatusEnum = pgEnum('email_status', [
  'NONE',
  'PENDING',
  'SENT',
  'FAILED',
]);
