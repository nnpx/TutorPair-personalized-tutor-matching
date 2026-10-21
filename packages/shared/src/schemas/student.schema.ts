/**
 * NOTE: This is an initial draft / baseline schema.
 * It can be revised, expanded, or modified when developing this specific module in detail.
 */
import { z } from 'zod';
import { TutorTypePref } from '../enums/index.js';

// Slider rating must be an integer between 1 and 5
export const SliderValueSchema = z.number().int().min(1).max(5);

export const StudentProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  phone_number: z.string().max(20).optional().nullable(),
  grade_level: z.string().min(1, 'Grade level is required').max(20),
  tutor_type_pref: z.nativeEnum(TutorTypePref),
  // 5 sliders for learning style profile
  style_profile: z.array(SliderValueSchema).length(5, 'Style profile requires exactly 5 ratings'),
  // 4 sliders for personality profile
  personality_profile: z.array(SliderValueSchema).length(4, 'Personality profile requires exactly 4 ratings'),
  budget_max: z.number().positive('Budget must be greater than 0'),
});

export const UpdateStudentProfileSchema = StudentProfileSchema.partial();

export type StudentProfileInput = z.infer<typeof StudentProfileSchema>;
export type UpdateStudentProfileInput = z.infer<typeof UpdateStudentProfileSchema>;
