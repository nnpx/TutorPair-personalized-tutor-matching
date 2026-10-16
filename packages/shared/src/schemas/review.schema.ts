/**
 * NOTE: This is an initial draft / baseline schema.
 * It can be revised, expanded, or modified when developing this specific module in detail.
 */
import { z } from 'zod';
import { SliderValueSchema } from './student.schema.js';

export const CreateReviewSchema = z.object({
  tutor_id: z.string().uuid(),
  recommendation_id: z.string().uuid(),
  rating_knowledge: SliderValueSchema,
  rating_preparation: SliderValueSchema,
  rating_clarity: SliderValueSchema,
  rating_punctuality: SliderValueSchema,
  comment: z.string().max(2000).optional().nullable(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
