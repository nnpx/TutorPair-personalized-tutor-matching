import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums.schema.js';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  cognito_sub: varchar('cognito_sub', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
