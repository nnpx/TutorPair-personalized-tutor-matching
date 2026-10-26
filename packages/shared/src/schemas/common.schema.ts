import { z } from 'zod';

export const UuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID: must be a valid UUID'),
});

export type UuidParamInput = z.infer<typeof UuidParamSchema>;
