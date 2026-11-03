import { z } from 'zod';

// Notification endpoints take identity from authentication, never client-supplied fields.
export const NotificationQuerySchema = z.object({}).strict();
export const NotificationBodySchema = z.object({}).strict().default({});
