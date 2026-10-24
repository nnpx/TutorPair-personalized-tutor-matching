/**
 * NOTE: This is an initial draft / baseline schema.
 * It can be revised, expanded, or modified when developing this specific module in detail.
 */
import { z } from 'zod';
import { TutorType, DayOfWeek } from '../enums/index.js';
import { SliderValueSchema } from './student.schema.js';

export const TutorProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  phone_number: z.string().min(1, 'Phone number is required').max(20),
  line_id: z.string().max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  tutor_type: z.nativeEnum(TutorType),
  // 5 sliders for teaching style
  style_profile: z.array(SliderValueSchema).length(5, 'Style profile requires exactly 5 ratings'),
  // 4 sliders for personality
  personality_profile: z.array(SliderValueSchema).length(4, 'Personality profile requires exactly 4 ratings'),
});

export const UpdateTutorProfileSchema = TutorProfileSchema.partial();

export const TutorSubjectItemSchema = z.object({
  variant_id: z.string().uuid(),
  hourly_rate: z.number().positive('Hourly rate must be greater than 0'),
  grade_levels: z.array(z.string()).optional().nullable(),
  teaching_focus: z.string().max(255).optional().nullable(),
});

export const SetTutorSubjectsSchema = z.object({
  subjects: z.array(TutorSubjectItemSchema),
});

export const TutorAvailabilitySlotSchema = z.object({
  day_of_week: z.nativeEnum(DayOfWeek),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Invalid time format (HH:mm)'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Invalid time format (HH:mm)'),
});

export const SetTutorAvailabilitySchema = z.object({
  availability: z.array(TutorAvailabilitySlotSchema),
});

export type TutorProfileInput = z.infer<typeof TutorProfileSchema>;
export type UpdateTutorProfileInput = z.infer<typeof UpdateTutorProfileSchema>;
export type TutorSubjectItemInput = z.infer<typeof TutorSubjectItemSchema>;
export type SetTutorSubjectsInput = z.infer<typeof SetTutorSubjectsSchema>;
export type TutorAvailabilitySlotInput = z.infer<typeof TutorAvailabilitySlotSchema>;
export type SetTutorAvailabilityInput = z.infer<typeof SetTutorAvailabilitySchema>;
