import { pgTable, uuid, text, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { notifications } from './notifications.schema.js';
/** Delivery metadata is separate from the tutor-visible notification. */
export const emailDeliveries = pgTable('email_deliveries', {
  notification_id: uuid('notification_id').notNull().references(() => notifications.id, { onDelete: 'cascade' }),
  mode: text('mode').notNull(),
  attempt_count: integer('attempt_count').notNull().default(0),
  next_attempt_at: timestamp('next_attempt_at', { withTimezone: true }).notNull().defaultNow(),
  owner: uuid('owner'),
  lease_expires_at: timestamp('lease_expires_at', { withTimezone: true }),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  last_error: text('last_error'),
}, table => [primaryKey({ columns: [table.notification_id, table.mode] })]);
