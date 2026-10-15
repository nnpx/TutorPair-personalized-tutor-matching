import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema.js';
import { emailStatusEnum, notificationEventTypeEnum } from './enums.schema.js';

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  event_type: notificationEventTypeEnum('event_type').notNull(),
  message: text('message').notNull(),
  is_read: boolean('is_read').default(false).notNull(),
  requires_email: boolean('requires_email').default(false).notNull(),
  email_status: emailStatusEnum('email_status').default('NONE').notNull(),
  email_sent_at: timestamp('email_sent_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
