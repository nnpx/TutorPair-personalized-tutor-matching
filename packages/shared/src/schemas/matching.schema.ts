import { z } from 'zod';

/**
 * POST /api/matching. Grade, sliders, budget, tutor-type preference and availability are read from
 * the student's saved profile (Module 3), so the only client input is the requested subject variant.
 * Unknown keys are stripped by zod, so a client cannot override profile data.
 */
export const MatchRequestSchema = z.object({
  variant_id: z.string().uuid('Subject variant ID is required'),
});

export const ConfirmTutorSelectionSchema = z.object({
  recommendation_id: z.string().uuid(),
  tutor_id: z.string().uuid(),
});

export type MatchRequestInput = z.infer<typeof MatchRequestSchema>;
export type ConfirmTutorSelectionInput = z.infer<typeof ConfirmTutorSelectionSchema>;
