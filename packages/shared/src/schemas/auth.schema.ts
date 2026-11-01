import { z } from 'zod';
import { UserRole } from '../enums/index.js';

/**
 * Schema for initial user role synchronization during public self-registration.
 * Restricted strictly to STUDENT and TUTOR (ADMIN provisioning must be privileged).
 * Uses .strict() to reject any unexpected or injected properties.
 */
export const SyncUserSchema = z
  .object({
    role: z.enum([UserRole.STUDENT, UserRole.TUTOR], {
      errorMap: () => ({ message: "Role must be either 'STUDENT' or 'TUTOR'" }),
    }),
  })
  .strict({
    message: 'Unexpected property in request body',
  });

export type SyncUserInput = z.infer<typeof SyncUserSchema>;

/**
 * Schema for development and automated testing mock authentication.
 * Uses .strict() to reject unexpected parameters and validates email format.
 */
export const MockLoginSchema = z
  .object({
    role: z.nativeEnum(UserRole, {
      errorMap: () => ({ message: "Role must be 'STUDENT', 'TUTOR', or 'ADMIN'" }),
    }),
    email: z
      .string({ invalid_type_error: 'Email must be a string' })
      .trim()
      .email('Invalid email address format')
      .optional()
      .or(z.literal('')),
  })
  .strict({
    message: 'Unexpected property in request body',
  });

export type MockLoginInput = z.infer<typeof MockLoginSchema>;
