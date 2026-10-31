import { z } from 'zod';
import { UserRole } from '../enums/index.js';

/**
 * Schema for initial user role synchronization during public self-registration.
 * Restricted strictly to STUDENT and TUTOR (ADMIN provisioning must be privileged).
 */
export const SyncUserSchema = z.object({
  role: z.enum([UserRole.STUDENT, UserRole.TUTOR], {
    errorMap: () => ({ message: "Role must be either 'STUDENT' or 'TUTOR'" }),
  }),
});

export type SyncUserInput = z.infer<typeof SyncUserSchema>;

/**
 * Schema for development and automated testing mock authentication.
 */
export const MockLoginSchema = z.object({
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: "Role must be 'STUDENT', 'TUTOR', or 'ADMIN'" }),
  }),
  email: z.string().email('Invalid email address format').optional(),
});

export type MockLoginInput = z.infer<typeof MockLoginSchema>;
