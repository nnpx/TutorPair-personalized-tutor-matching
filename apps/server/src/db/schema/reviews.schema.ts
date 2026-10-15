import { pgTable, uuid, integer, decimal, text, timestamp } from 'drizzle-orm/pg-core';
import { students } from './students.schema.js';
import { tutors } from './tutors.schema.js';
import { matchRecommendations } from './matching.schema.js';

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  student_id: uuid('student_id')
    .notNull()
    .references(() => students.user_id, { onDelete: 'cascade' }),
  tutor_id: uuid('tutor_id')
    .notNull()
    .references(() => tutors.user_id, { onDelete: 'cascade' }),
  recommendation_id: uuid('recommendation_id')
    .notNull()
    .references(() => matchRecommendations.id, { onDelete: 'cascade' }),
  rating_knowledge: integer('rating_knowledge').notNull(),
  rating_preparation: integer('rating_preparation').notNull(),
  rating_clarity: integer('rating_clarity').notNull(),
  rating_punctuality: integer('rating_punctuality').notNull(),
  overall_rating: decimal('overall_rating', { precision: 3, scale: 2 }).notNull(),
  comment: text('comment'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
