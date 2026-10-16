/**
 * NOTE: This is an initial draft / baseline schema.
 * It can be revised, expanded, or modified when developing this specific module in detail.
 */
import { z } from 'zod';
import { UserRole } from '../enums/index.js';

export const SyncUserSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export type SyncUserInput = z.infer<typeof SyncUserSchema>;
