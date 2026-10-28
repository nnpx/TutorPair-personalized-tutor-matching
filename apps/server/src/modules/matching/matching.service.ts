import {
  MatchRequestStatus,
  type MatchRequestInput,
  type MatchResultDto,
  type TutorTypePref,
} from '@tutorpair/shared';
import { NotFoundError, UnprocessableEntityError } from '../../common/errors/http-errors.js';
import {
  calculateCompatibilityScore,
  passesHardFilters,
  rankTop3,
} from '../../common/utils/scoring.util.js';
import { studentsRepository } from '../students/students.repository.js';
import { matchingRepository } from './matching.repository.js';

export const matchingService = {
  /**
   * Stage 1 (hard filters) -> Stage 2 (weighted score) -> Top 3, persisted in one transaction.
   * Everything about the student comes from the saved Module 3 profile, not the request body.
   */
  async findTop3(studentId: string, input: MatchRequestInput): Promise<MatchResultDto> {
    const student = await studentsRepository.getProfileWithAvailability(studentId);
    if (!student) throw new NotFoundError('Student profile not found');

    const variant = await matchingRepository.findVariantById(input.variant_id);
    if (!variant) throw new NotFoundError('Subject variant not found');

    if (student.availabilities.length === 0) {
      throw new UnprocessableEntityError('Set your weekly availability before matching');
    }

    const candidates = await matchingRepository.findCandidateTutors(variant.id);
    const survivors = candidates.filter((tutor) => passesHardFilters(tutor, student, variant));

    const top = rankTop3(
      survivors.map((tutor) => ({
        tutor,
        tutor_id: tutor.tutor_id,
        score: calculateCompatibilityScore({
          studentStyle: student.style_profile,
          tutorStyle: tutor.style_profile,
          studentPersonality: student.personality_profile,
          tutorPersonality: tutor.personality_profile,
          studentBudget: student.budget_max,
          tutorRate: tutor.hourly_rate,
          tutorTypePref: student.tutor_type_pref as TutorTypePref,
          tutorType: tutor.tutor_type,
        }),
      }))
    );

    const saved = await matchingRepository.createRequestWithRecommendations(
      studentId,
      variant.id,
      top.map(({ tutor_id, rank, score }) => ({ tutor_id, rank, score }))
    );

    const byTutor = new Map(top.map((item) => [item.tutor_id, item.tutor]));
    return {
      match_request_id: saved.match_request_id,
      variant_id: variant.id,
      status: MatchRequestStatus.PENDING,
      // Explicit field list: only public card data ever leaves the service.
      recommendations: saved.recommendations.map((rec) => {
        const tutor = byTutor.get(rec.tutor_id)!;
        return {
          recommendation_id: rec.recommendation_id,
          rank: rec.rank,
          score: rec.score,
          tutor: {
            tutor_id: tutor.tutor_id,
            first_name: tutor.first_name,
            last_name: tutor.last_name,
            description: tutor.description,
            tutor_type: tutor.tutor_type,
            average_rating: tutor.average_rating,
            review_count: tutor.review_count,
            hourly_rate: tutor.hourly_rate,
            teaching_focus: tutor.teaching_focus,
          },
        };
      }),
    };
  },
};
