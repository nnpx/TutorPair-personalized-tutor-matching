import { pgTable, uuid, varchar, text, decimal, integer } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { classFormatEnum, tutorTypeEnum, verificationStatusEnum } from './enums.schema.js';

export const tutors = pgTable('tutors', {
  user_id: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  first_name: varchar('first_name', { length: 100 }).notNull(),
  last_name: varchar('last_name', { length: 100 }).notNull(),
  phone_number: varchar('phone_number', { length: 20 }).notNull(),
  profile_photo: varchar('profile_photo', { length: 500 }),
  description: text('description'),
  tutor_type: tutorTypeEnum('tutor_type').notNull(),
  style_profile: integer('style_profile').array().notNull(),
  personality_profile: integer('personality_profile').array().notNull(),
  hourly_rate: decimal('hourly_rate', { precision: 10, scale: 2 }).notNull(),
  class_format: classFormatEnum('class_format').notNull(),
  verification_status: verificationStatusEnum('verification_status').default('PENDING').notNull(),
  rejection_reason: text('rejection_reason'),
  average_rating: decimal('average_rating', { precision: 3, scale: 2 }).default('0.00').notNull(),
  review_count: integer('review_count').default(0).notNull(),
});

export type Tutor = typeof tutors.$inferSelect;
export type NewTutor = typeof tutors.$inferInsert;
