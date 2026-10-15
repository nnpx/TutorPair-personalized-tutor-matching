import { z } from 'zod';
import { SubjectCategory, LearningGoal } from '../enums/index.js';

export const SubjectVariantSchema = z.object({
  id: z.string().uuid(),
  subject_id: z.string().uuid(),
  name: z.string(),
  learning_goal: z.nativeEnum(LearningGoal),
  requires_proof: z.boolean(),
});

export const SubjectWithVariantsSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.nativeEnum(SubjectCategory),
  variants: z.array(SubjectVariantSchema),
});

export type SubjectVariantDto = z.infer<typeof SubjectVariantSchema>;
export type SubjectWithVariantsDto = z.infer<typeof SubjectWithVariantsSchema>;
