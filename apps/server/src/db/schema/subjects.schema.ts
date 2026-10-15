import { pgTable, uuid, varchar, boolean, primaryKey } from 'drizzle-orm/pg-core';
import { learningGoalEnum, subjectCategoryEnum } from './enums.schema.js';
import { tutors } from './tutors.schema.js';
import { students } from './students.schema.js';

export const subjects = pgTable('subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).unique().notNull(),
  category: subjectCategoryEnum('category').notNull(),
});

export const subjectVariants = pgTable('subject_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  subject_id: uuid('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 150 }).notNull(),
  learning_goal: learningGoalEnum('learning_goal').notNull(),
  requires_proof: boolean('requires_proof').default(false).notNull(),
});

export const tutorSubjects = pgTable(
  'tutor_subjects',
  {
    tutor_id: uuid('tutor_id')
      .notNull()
      .references(() => tutors.user_id, { onDelete: 'cascade' }),
    variant_id: uuid('variant_id')
      .notNull()
      .references(() => subjectVariants.id, { onDelete: 'cascade' }),
    grade_levels: varchar('grade_levels', { length: 20 }).array(),
    teaching_focus: varchar('teaching_focus', { length: 255 }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.tutor_id, table.variant_id] }),
  })
);

export const studentSubjectRequirements = pgTable(
  'student_subject_requirements',
  {
    student_id: uuid('student_id')
      .notNull()
      .references(() => students.user_id, { onDelete: 'cascade' }),
    variant_id: uuid('variant_id')
      .notNull()
      .references(() => subjectVariants.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.student_id, table.variant_id] }),
  })
);

export type Subject = typeof subjects.$inferSelect;
export type SubjectVariant = typeof subjectVariants.$inferSelect;
export type TutorSubject = typeof tutorSubjects.$inferSelect;
export type StudentSubjectRequirement = typeof studentSubjectRequirements.$inferSelect;
