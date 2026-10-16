/**
 * NOTE: This is an initial draft / baseline schema.
 * It can be revised, expanded, or modified when developing this specific module in detail.
 */
import { z } from 'zod';
import { ClassFormat, TutorTypePref, DayOfWeek } from '../enums/index.js';
import { SliderValueSchema } from './student.schema.js';

export const AvailabilitySlotSchema = z.object({
  day_of_week: z.nativeEnum(DayOfWeek),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Invalid time format (HH:mm)'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Invalid time format (HH:mm)'),
});

export const MatchRequestSchema = z.object({
  variant_id: z.string().uuid('Subject variant ID is required'),
  grade_level: z.string().optional().nullable(),
  style_profile: z.array(SliderValueSchema).length(5, 'Style profile requires 5 ratings'),
  personality_profile: z.array(SliderValueSchema).length(4, 'Personality profile requires 4 ratings'),
  budget_max: z.number().positive('Budget must be greater than 0'),
  class_format_pref: z.nativeEnum(ClassFormat),
  tutor_type_pref: z.nativeEnum(TutorTypePref),
  availabilities: z.array(AvailabilitySlotSchema).optional().default([]),
});

export const ConfirmTutorSelectionSchema = z.object({
  recommendation_id: z.string().uuid(),
  tutor_id: z.string().uuid(),
});

export type AvailabilitySlotInput = z.infer<typeof AvailabilitySlotSchema>;
export type MatchRequestInput = z.infer<typeof MatchRequestSchema>;
export type ConfirmTutorSelectionInput = z.infer<typeof ConfirmTutorSelectionSchema>;
