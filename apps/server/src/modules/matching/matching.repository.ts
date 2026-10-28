import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  tutors,
  tutorSubjects,
  subjectVariants,
  availabilities,
} from '../../db/schema/index.js';
import { VerificationStatus, type TutorType } from '@tutorpair/shared';
import type { TimeSlot, HardFilterVariant } from '../../common/utils/scoring.util.js';

/**
 * One tutor who teaches the requested variant. Public card fields plus the private inputs the
 * matcher needs (sliders, grades, slots). Contact fields (phone_number, line_id), rejection_reason
 * and documents are deliberately never selected, so they cannot leak into a response.
 */
export interface CandidateTutor {
  tutor_id: string;
  first_name: string;
  last_name: string;
  description: string | null;
  tutor_type: TutorType;
  average_rating: number;
  review_count: number;
  verification_status: string;
  style_profile: number[];
  personality_profile: number[];
  variant_id: string;
  hourly_rate: number;
  grade_levels: string[] | null;
  teaching_focus: string | null;
  availabilities: TimeSlot[];
}

export const matchingRepository = {
  async findVariantById(variantId: string): Promise<HardFilterVariant | null> {
    const [row] = await db
      .select({ id: subjectVariants.id, learning_goal: subjectVariants.learning_goal })
      .from(subjectVariants)
      .where(eq(subjectVariants.id, variantId))
      .limit(1);
    return row ?? null;
  },

  /**
   * Stage-1 candidates in a single query (no N+1): APPROVED tutors teaching `variantId`, one row per
   * availability slot, grouped in JS. SQL only narrows; the pure `passesHardFilters` re-checks every gate.
   */
  async findCandidateTutors(variantId: string): Promise<CandidateTutor[]> {
    const rows = await db
      .select({
        tutor_id: tutors.user_id,
        first_name: tutors.first_name,
        last_name: tutors.last_name,
        description: tutors.description,
        tutor_type: tutors.tutor_type,
        average_rating: tutors.average_rating,
        review_count: tutors.review_count,
        verification_status: tutors.verification_status,
        style_profile: tutors.style_profile,
        personality_profile: tutors.personality_profile,
        variant_id: tutorSubjects.variant_id,
        hourly_rate: tutorSubjects.hourly_rate,
        grade_levels: tutorSubjects.grade_levels,
        teaching_focus: tutorSubjects.teaching_focus,
        slot_day: availabilities.day_of_week,
        slot_start: availabilities.start_time,
        slot_end: availabilities.end_time,
      })
      .from(tutors)
      .innerJoin(tutorSubjects, eq(tutorSubjects.tutor_id, tutors.user_id))
      .leftJoin(availabilities, eq(availabilities.user_id, tutors.user_id))
      .where(
        and(
          eq(tutorSubjects.variant_id, variantId),
          eq(tutors.verification_status, VerificationStatus.APPROVED)
        )
      );

    const byTutor = new Map<string, CandidateTutor>();
    for (const { slot_day, slot_start, slot_end, ...r } of rows) {
      let candidate = byTutor.get(r.tutor_id);
      if (!candidate) {
        candidate = {
          ...r,
          tutor_type: r.tutor_type as TutorType,
          average_rating: Number(r.average_rating),
          hourly_rate: Number(r.hourly_rate),
          availabilities: [],
        };
        byTutor.set(r.tutor_id, candidate);
      }
      if (slot_day && slot_start && slot_end) {
        candidate.availabilities.push({
          day_of_week: slot_day,
          start_time: slot_start,
          end_time: slot_end,
        });
      }
    }
    return [...byTutor.values()];
  },
};
