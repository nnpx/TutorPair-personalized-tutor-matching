import { pgTable, uuid, varchar, decimal, integer } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { classFormatEnum, tutorTypePrefEnum } from './enums.schema.js';

export const students = pgTable('students', {
  user_id: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  first_name: varchar('first_name', { length: 100 }).notNull(),
  last_name: varchar('last_name', { length: 100 }).notNull(),
  phone_number: varchar('phone_number', { length: 20 }),
  grade_level: varchar('grade_level', { length: 20 }).notNull(),
  tutor_type_pref: tutorTypePrefEnum('tutor_type_pref').notNull(),
  style_profile: integer('style_profile').array().notNull(),
  personality_profile: integer('personality_profile').array().notNull(),
  budget_max: decimal('budget_max', { precision: 10, scale: 2 }).notNull(),
  class_format_pref: classFormatEnum('class_format_pref').notNull(),
});

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
