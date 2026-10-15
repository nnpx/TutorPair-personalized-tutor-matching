import { pgTable, uuid, time } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { dayOfWeekEnum } from './enums.schema.js';

export const availabilities = pgTable('availabilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  day_of_week: dayOfWeekEnum('day_of_week').notNull(),
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
});

export type Availability = typeof availabilities.$inferSelect;
export type NewAvailability = typeof availabilities.$inferInsert;
