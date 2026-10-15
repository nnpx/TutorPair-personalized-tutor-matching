import { z } from 'zod';
import { UserRole } from '../enums/index.js';

export const SyncUserSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export type SyncUserInput = z.infer<typeof SyncUserSchema>;
