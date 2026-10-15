import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { tutors } from './tutors.schema.js';
import { subjectVariants } from './subjects.schema.js';
import { documentTypeEnum } from './enums.schema.js';

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  tutor_id: uuid('tutor_id')
    .notNull()
    .references(() => tutors.user_id, { onDelete: 'cascade' }),
  document_type: documentTypeEnum('document_type').notNull(),
  variant_id: uuid('variant_id').references(() => subjectVariants.id, {
    onDelete: 'set null',
  }),
  file_key: varchar('file_key', { length: 500 }).unique().notNull(),
  file_size_kb: integer('file_size_kb').notNull(),
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
