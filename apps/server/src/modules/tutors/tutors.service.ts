import {
  TutorProfileInput,
  UpdateTutorProfileInput,
  SetTutorSubjectsInput,
  SetTutorAvailabilityInput,
} from '@tutorpair/shared';
import { tutorsRepository } from './tutors.repository.js';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../common/errors/http-errors.js';
import { Tutor } from '../../db/schema/index.js';

function formatTutorProfile(tutor: Tutor) {
  return {
    user_id: tutor.user_id,
    first_name: tutor.first_name,
    last_name: tutor.last_name,
    phone_number: tutor.phone_number,
    line_id: tutor.line_id,
    description: tutor.description,
    tutor_type: tutor.tutor_type,
    style_profile: tutor.style_profile,
    personality_profile: tutor.personality_profile,
    verification_status: tutor.verification_status,
    rejection_reason: tutor.rejection_reason,
    average_rating: parseFloat(tutor.average_rating),
    review_count: tutor.review_count,
  };
}

export const tutorsService = {
  async getProfile(userId: string) {
    const tutor = await tutorsRepository.findProfileByUserId(userId);
    if (!tutor) {
      throw new NotFoundError('Tutor profile not found');
    }
    return formatTutorProfile(tutor);
  },

  async createProfile(userId: string, input: TutorProfileInput) {
    const existing = await tutorsRepository.findProfileByUserId(userId);
    if (existing) {
      throw new ConflictError('Tutor profile already exists for this user');
    }

    const created = await tutorsRepository.createProfile(userId, input);
    return formatTutorProfile(created);
  },

  async updateProfile(userId: string, input: UpdateTutorProfileInput) {
    const existing = await tutorsRepository.findProfileByUserId(userId);
    if (!existing) {
      throw new NotFoundError('Tutor profile not found');
    }

    const updated = await tutorsRepository.updateProfile(userId, input);
    if (!updated) {
      throw new NotFoundError('Tutor profile not found after update');
    }

    return formatTutorProfile(updated);
  },

  async getSubjects(tutorId: string) {
    const tutor = await tutorsRepository.findProfileByUserId(tutorId);
    if (!tutor) {
      throw new NotFoundError('Tutor profile not found');
    }

    const subjects = await tutorsRepository.findSubjectsByTutorId(tutorId);
    return {
      subjects: subjects.map((s) => ({
        ...s,
        hourly_rate: parseFloat(s.hourly_rate),
      })),
    };
  },

  async setSubjects(tutorId: string, input: SetTutorSubjectsInput) {
    const tutor = await tutorsRepository.findProfileByUserId(tutorId);
    if (!tutor) {
      throw new NotFoundError('Tutor profile not found');
    }

    if (input.subjects.length > 0) {
      const variantIds = input.subjects.map((s) => s.variant_id);
      const uniqueIds = new Set(variantIds);
      if (uniqueIds.size !== variantIds.length) {
        throw new BadRequestError('Duplicate subject variants are not allowed');
      }

      const existingVariantIds = await tutorsRepository.verifyVariantIdsExist(variantIds);
      if (existingVariantIds.length !== variantIds.length) {
        const missing = variantIds.filter((id) => !existingVariantIds.includes(id));
        throw new NotFoundError(`Subject variant(s) not found: ${missing.join(', ')}`);
      }
    }

    const subjects = await tutorsRepository.replaceSubjects(tutorId, input.subjects);
    return {
      subjects: subjects.map((s) => ({
        ...s,
        hourly_rate: parseFloat(s.hourly_rate),
      })),
    };
  },

  async getAvailability(userId: string) {
    const tutor = await tutorsRepository.findProfileByUserId(userId);
    if (!tutor) {
      throw new NotFoundError('Tutor profile not found');
    }

    const availability = await tutorsRepository.findAvailabilityByUserId(userId);
    return { availability };
  },

  async setAvailability(userId: string, input: SetTutorAvailabilityInput) {
    const tutor = await tutorsRepository.findProfileByUserId(userId);
    if (!tutor) {
      throw new NotFoundError('Tutor profile not found');
    }

    const slotsByDay = new Map<string, Array<{ start_time: string; end_time: string }>>();
    for (const slot of input.availability) {
      if (slot.start_time >= slot.end_time) {
        throw new BadRequestError(
          `Invalid time slot for ${slot.day_of_week}: start_time (${slot.start_time}) must be earlier than end_time (${slot.end_time})`
        );
      }
      const daySlots = slotsByDay.get(slot.day_of_week) || [];
      daySlots.push(slot);
      slotsByDay.set(slot.day_of_week, daySlots);
    }

    for (const [day, daySlots] of slotsByDay.entries()) {
      daySlots.sort((a, b) => a.start_time.localeCompare(b.start_time));
      for (let i = 1; i < daySlots.length; i++) {
        if (daySlots[i].start_time < daySlots[i - 1].end_time) {
          throw new ConflictError(
            `Overlapping availability slots detected for ${day}: (${daySlots[i - 1].start_time}-${daySlots[i - 1].end_time}) and (${daySlots[i].start_time}-${daySlots[i].end_time})`
          );
        }
      }
    }

    const availability = await tutorsRepository.replaceAvailability(userId, input.availability);
    return { availability };
  },

  async getVerification(tutorId: string) {
    const verification = await tutorsRepository.findVerificationStatus(tutorId);
    if (!verification) {
      throw new NotFoundError('Tutor profile not found');
    }

    return verification;
  },
};
