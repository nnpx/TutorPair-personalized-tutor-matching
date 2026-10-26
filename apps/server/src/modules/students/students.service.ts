import {
  StudentProfileInput,
  UpdateStudentProfileInput,
  SetStudentAvailabilityInput,
  StudentProfileDto,
  StudentAvailabilitySlotDto,
  StudentWithAvailabilityDto,
  StudentSubjectItemDto,
} from '@tutorpair/shared';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../common/errors/http-errors.js';
import { studentsRepository } from './students.repository.js';

export const studentsService = {
  async getProfile(userId: string): Promise<StudentProfileDto> {
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const student = await studentsRepository.findProfileByUserId(userId);
    if (!student) {
      throw new NotFoundError('Student profile not found');
    }
    return student;
  },

  async createProfile(userId: string, input: StudentProfileInput): Promise<StudentProfileDto> {
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    if (!input) {
      throw new BadRequestError('Student profile payload is required');
    }

    const existing = await studentsRepository.findProfileByUserId(userId);
    if (existing) {
      throw new ConflictError('Student profile already exists for this user');
    }

    if (!input.first_name || !input.first_name.trim()) {
      throw new BadRequestError('First name is required');
    }

    if (!input.last_name || !input.last_name.trim()) {
      throw new BadRequestError('Last name is required');
    }

    if (!input.phone_number || !input.phone_number.trim()) {
      throw new BadRequestError('Phone number is required');
    }

    if (!input.grade_level || !/^G([1-9]|1[0-2])$/.test(input.grade_level.trim())) {
      throw new BadRequestError('Grade level must be between G1 and G12 (e.g. G10)');
    }

    if (!Array.isArray(input.style_profile) || input.style_profile.length !== 5) {
      throw new BadRequestError('Style profile requires exactly 5 ratings');
    }

    if (
      input.style_profile.some(
        (val) => typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 5
      )
    ) {
      throw new BadRequestError('Style profile ratings must each be an integer between 1 and 5');
    }

    if (!Array.isArray(input.personality_profile) || input.personality_profile.length !== 4) {
      throw new BadRequestError('Personality profile requires exactly 4 ratings');
    }

    if (
      input.personality_profile.some(
        (val) => typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 5
      )
    ) {
      throw new BadRequestError('Personality profile ratings must each be an integer between 1 and 5');
    }

    if (
      typeof input.budget_max !== 'number' ||
      isNaN(input.budget_max) ||
      input.budget_max <= 0
    ) {
      throw new BadRequestError('Budget must be greater than 0');
    }

    return await studentsRepository.createProfile(userId, {
      ...input,
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      phone_number: input.phone_number.trim(),
      grade_level: input.grade_level.trim(),
    });
  },

  async updateProfile(userId: string, input: UpdateStudentProfileInput): Promise<StudentProfileDto> {
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    if (!input || Object.keys(input).length === 0) {
      throw new BadRequestError('At least one field must be provided to update profile');
    }

    const existing = await studentsRepository.findProfileByUserId(userId);
    if (!existing) {
      throw new NotFoundError('Student profile not found');
    }

    if (input.first_name !== undefined && (!input.first_name || !input.first_name.trim())) {
      throw new BadRequestError('First name cannot be empty');
    }

    if (input.last_name !== undefined && (!input.last_name || !input.last_name.trim())) {
      throw new BadRequestError('Last name cannot be empty');
    }

    if (input.phone_number !== undefined && (!input.phone_number || !input.phone_number.trim())) {
      throw new BadRequestError('Phone number cannot be empty');
    }

    if (
      input.grade_level !== undefined &&
      (!input.grade_level || !/^G([1-9]|1[0-2])$/.test(input.grade_level.trim()))
    ) {
      throw new BadRequestError('Grade level must be between G1 and G12 (e.g. G10)');
    }

    if (input.style_profile !== undefined) {
      if (!Array.isArray(input.style_profile) || input.style_profile.length !== 5) {
        throw new BadRequestError('Style profile requires exactly 5 ratings');
      }
      if (
        input.style_profile.some(
          (val) => typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 5
        )
      ) {
        throw new BadRequestError('Style profile ratings must each be an integer between 1 and 5');
      }
    }

    if (input.personality_profile !== undefined) {
      if (!Array.isArray(input.personality_profile) || input.personality_profile.length !== 4) {
        throw new BadRequestError('Personality profile requires exactly 4 ratings');
      }
      if (
        input.personality_profile.some(
          (val) => typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 5
        )
      ) {
        throw new BadRequestError('Personality profile ratings must each be an integer between 1 and 5');
      }
    }

    if (
      input.budget_max !== undefined &&
      (typeof input.budget_max !== 'number' || isNaN(input.budget_max) || input.budget_max <= 0)
    ) {
      throw new BadRequestError('Budget must be greater than 0');
    }

    const sanitizedInput: UpdateStudentProfileInput = {
      ...input,
      ...(input.first_name !== undefined ? { first_name: input.first_name.trim() } : {}),
      ...(input.last_name !== undefined ? { last_name: input.last_name.trim() } : {}),
      ...(input.phone_number !== undefined ? { phone_number: input.phone_number.trim() } : {}),
      ...(input.grade_level !== undefined ? { grade_level: input.grade_level.trim() } : {}),
    };

    const updated = await studentsRepository.updateProfile(userId, sanitizedInput);
    if (!updated) {
      throw new NotFoundError('Student profile not found after update');
    }

    return updated;
  },

  async getAvailability(userId: string): Promise<StudentAvailabilitySlotDto[]> {
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const student = await studentsRepository.findProfileByUserId(userId);
    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    return await studentsRepository.findAvailabilityByUserId(userId);
  },

  async setAvailability(
    userId: string,
    input: SetStudentAvailabilityInput
  ): Promise<StudentAvailabilitySlotDto[]> {
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const student = await studentsRepository.findProfileByUserId(userId);
    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    const slots =
      input?.availability ??
      (input as unknown as { slots?: StudentAvailabilitySlotDto[] })?.slots;

    if (!slots || !Array.isArray(slots)) {
      throw new BadRequestError('Availability slots array is required');
    }

    // Validate bounds, required fields, and time logic
    for (const slot of slots) {
      if (!slot.day_of_week || !slot.start_time || !slot.end_time) {
        throw new BadRequestError(
          'Incomplete availability slot: day_of_week, start_time, and end_time are required'
        );
      }
      if (slot.start_time >= slot.end_time) {
        throw new BadRequestError(
          `Invalid time slot for ${slot.day_of_week}: start_time (${slot.start_time}) must be earlier than end_time (${slot.end_time})`
        );
      }
    }

    // Validate no overlapping slots on the same day
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = slots[i];
        const b = slots[j];

        if (a.day_of_week === b.day_of_week) {
          if (a.start_time < b.end_time && b.start_time < a.end_time) {
            throw new BadRequestError(
              `Overlapping availability slots detected for ${a.day_of_week}: (${a.start_time}-${a.end_time}) and (${b.start_time}-${b.end_time})`
            );
          }
        }
      }
    }

    return await studentsRepository.replaceAvailability(userId, slots);
  },

  async getSubjects(userId: string): Promise<StudentSubjectItemDto[]> {
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const student = await studentsRepository.findProfileByUserId(userId);
    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    return await studentsRepository.findSubjectsByStudentId(userId);
  },

  async setSubjects(userId: string, variantIds: string[]): Promise<StudentSubjectItemDto[]> {
    if (!userId) {
      throw new UnauthorizedError('User authentication required');
    }

    const student = await studentsRepository.findProfileByUserId(userId);
    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    if (!variantIds || !Array.isArray(variantIds) || variantIds.length === 0) {
      throw new BadRequestError('At least one subject variant is required');
    }

    // Guard against duplicate subject variants
    const uniqueIds = new Set(variantIds);
    if (uniqueIds.size !== variantIds.length) {
      throw new BadRequestError('Duplicate subject variants are not allowed');
    }

    // Guard against non-existent subject variants
    const existingVariantIds = await studentsRepository.verifyVariantIdsExist(variantIds);
    if (existingVariantIds.length !== variantIds.length) {
      const missing = variantIds.filter((id) => !existingVariantIds.includes(id));
      throw new NotFoundError(`Subject variant(s) not found: ${missing.join(', ')}`);
    }

    return await studentsRepository.replaceSubjects(userId, variantIds);
  },

  /**
   * Helper for cross-module integration with Module 6 (Matching)
   */
  async getProfileWithAvailability(userId: string): Promise<StudentWithAvailabilityDto | null> {
    if (!userId) {
      return null;
    }
    return await studentsRepository.getProfileWithAvailability(userId);
  },
};
