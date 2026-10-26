/**
 * NOTE: This is an initial draft / baseline schema.
 * It can be revised, expanded, or modified when developing this specific module in detail.
 */
import { z } from 'zod';
import { TutorTypePref, DayOfWeek } from '../enums/index.js';

// Slider rating must be an integer between 1 and 5
export const SliderValueSchema = z.number().int().min(1).max(5);

export const StudentProfileSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(100),
  last_name: z.string().trim().min(1, 'Last name is required').max(100),
  phone_number: z.string().trim().min(1, 'Phone number is required').max(20),
  line_id: z.string().max(100).optional().nullable(),
  grade_level: z
    .string()
    .trim()
    .regex(/^G([1-9]|1[0-2])$/, 'Grade level must be between G1 and G12 (e.g. G10)'),
  tutor_type_pref: z.nativeEnum(TutorTypePref),
  // 5 sliders for learning style profile
  style_profile: z.array(SliderValueSchema).length(5, 'Style profile requires exactly 5 ratings'),
  // 4 sliders for personality profile
  personality_profile: z.array(SliderValueSchema).length(4, 'Personality profile requires exactly 4 ratings'),
  budget_max: z.number().positive('Budget must be greater than 0'),
});

export const UpdateStudentProfileSchema = StudentProfileSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided to update profile' }
);

export const StudentAvailabilitySlotSchema = z
  .object({
    day_of_week: z.nativeEnum(DayOfWeek),
    start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Invalid time format (HH:mm)'),
    end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Invalid time format (HH:mm)'),
  })
  .refine((slot) => slot.start_time < slot.end_time, {
    message: 'start_time must be strictly earlier than end_time',
  });

export const SetStudentAvailabilitySchema = z
  .object({
    availability: z.array(StudentAvailabilitySlotSchema).optional(),
    slots: z.array(StudentAvailabilitySlotSchema).optional(),
  })
  .refine((data) => data.availability !== undefined || data.slots !== undefined, {
    message: 'Availability slots array is required',
  })
  .transform((data) => ({
    availability: (data.availability ?? data.slots)!,
  }));

export const SetStudentSubjectsSchema = z.object({
  variant_ids: z
    .array(z.string().uuid('Invalid subject variant UUID'))
    .min(1, 'Please select at least one subject')
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Duplicate subject variants are not allowed',
    }),
});

export type StudentProfileInput = z.infer<typeof StudentProfileSchema>;
export type UpdateStudentProfileInput = z.infer<typeof UpdateStudentProfileSchema>;
export type StudentAvailabilitySlotInput = z.infer<typeof StudentAvailabilitySlotSchema>;
export type SetStudentAvailabilityInput = z.infer<typeof SetStudentAvailabilitySchema>;
export type SetStudentSubjectsInput = z.infer<typeof SetStudentSubjectsSchema>;

