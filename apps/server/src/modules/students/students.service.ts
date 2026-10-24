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
} from '../../common/errors/http-errors.js';
import { studentsRepository } from './students.repository.js';

export const studentsService = {
  async getProfile(userId: string): Promise<StudentProfileDto> {
    const student = await studentsRepository.findProfileByUserId(userId);
    if (!student) {
      throw new NotFoundError('Student profile not found');
    }
    return student;
  },

  async createProfile(userId: string, input: StudentProfileInput): Promise<StudentProfileDto> {
    const existing = await studentsRepository.findProfileByUserId(userId);
    if (existing) {
      throw new ConflictError('Student profile already exists for this user');
    }

    if (input.style_profile.length !== 5) {
      throw new BadRequestError('Style profile requires exactly 5 ratings');
    }

    if (input.personality_profile.length !== 4) {
      throw new BadRequestError('Personality profile requires exactly 4 ratings');
    }

    if (input.budget_max <= 0) {
      throw new BadRequestError('Budget must be greater than 0');
    }

    return await studentsRepository.createProfile(userId, input);
  },

  async updateProfile(userId: string, input: UpdateStudentProfileInput): Promise<StudentProfileDto> {
    const existing = await studentsRepository.findProfileByUserId(userId);
    if (!existing) {
      throw new NotFoundError('Student profile not found');
    }

    if (input.style_profile !== undefined && input.style_profile.length !== 5) {
      throw new BadRequestError('Style profile requires exactly 5 ratings');
    }

    if (input.personality_profile !== undefined && input.personality_profile.length !== 4) {
      throw new BadRequestError('Personality profile requires exactly 4 ratings');
    }

    if (input.budget_max !== undefined && input.budget_max <= 0) {
      throw new BadRequestError('Budget must be greater than 0');
    }

    const updated = await studentsRepository.updateProfile(userId, input);
    if (!updated) {
      throw new NotFoundError('Student profile not found');
    }

    return updated;
  },

  async getAvailability(userId: string): Promise<StudentAvailabilitySlotDto[]> {
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
    const student = await studentsRepository.findProfileByUserId(userId);
    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    // Validate bounds and time logic
    for (const slot of input.availability) {
      if (slot.start_time >= slot.end_time) {
        throw new BadRequestError(
          `Invalid time slot for ${slot.day_of_week}: start_time (${slot.start_time}) must be earlier than end_time (${slot.end_time})`
        );
      }
    }

    // Validate no overlapping slots on the same day
    for (let i = 0; i < input.availability.length; i++) {
      for (let j = i + 1; j < input.availability.length; j++) {
        const a = input.availability[i];
        const b = input.availability[j];

        if (a.day_of_week === b.day_of_week) {
          if (a.start_time < b.end_time && b.start_time < a.end_time) {
            throw new BadRequestError(
              `Overlapping availability slots detected for ${a.day_of_week}: (${a.start_time}-${a.end_time}) and (${b.start_time}-${b.end_time})`
            );
          }
        }
      }
    }

    return await studentsRepository.replaceAvailability(userId, input.availability);
  },

  async getSubjects(userId: string): Promise<StudentSubjectItemDto[]> {
    const student = await studentsRepository.findProfileByUserId(userId);
    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    return await studentsRepository.findSubjectsByStudentId(userId);
  },

  async setSubjects(userId: string, variantIds: string[]): Promise<StudentSubjectItemDto[]> {
    const student = await studentsRepository.findProfileByUserId(userId);
    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    if (variantIds.length === 0) {
      throw new BadRequestError('At least one subject variant is required');
    }

    return await studentsRepository.replaceSubjects(userId, variantIds);
  },

  /**
   * Helper for cross-module integration with Module 6 (Matching)
   */
  async getProfileWithAvailability(userId: string): Promise<StudentWithAvailabilityDto | null> {
    return await studentsRepository.getProfileWithAvailability(userId);
  },
};
