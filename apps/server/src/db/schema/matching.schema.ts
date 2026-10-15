import { pgTable, uuid, varchar, timestamp, integer, decimal, boolean } from 'drizzle-orm/pg-core';
import { students } from './students.schema.js';
import { tutors } from './tutors.schema.js';

export const matchRequests = pgTable('match_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  student_id: uuid('student_id')
    .notNull()
    .references(() => students.user_id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const matchRecommendations = pgTable('match_recommendations', {
  id: uuid('id').defaultRandom().primaryKey(),
  match_request_id: uuid('match_request_id')
    .notNull()
    .references(() => matchRequests.id, { onDelete: 'cascade' }),
  tutor_id: uuid('tutor_id')
    .notNull()
    .references(() => tutors.user_id, { onDelete: 'cascade' }),
  rank: integer('rank').notNull(),
  score: decimal('score', { precision: 5, scale: 2 }).notNull(),
  is_selected: boolean('is_selected').default(false).notNull(),
});

export type MatchRequest = typeof matchRequests.$inferSelect;
export type NewMatchRequest = typeof matchRequests.$inferInsert;
export type MatchRecommendation = typeof matchRecommendations.$inferSelect;
export type NewMatchRecommendation = typeof matchRecommendations.$inferInsert;
