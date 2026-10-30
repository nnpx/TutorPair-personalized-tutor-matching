import { z } from 'zod';
import {
  MatchRequestStatus,
  NotificationEventType,
  VerificationStatus,
  type ConfirmSelectionResultDto,
  type ConfirmTutorSelectionInput,
  type MatchRequestInput,
  type MatchResultDto,
  type TutorTypePref,
} from '@tutorpair/shared';
import {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from '../../common/errors/http-errors.js';
import { getPgErrorCode, PG_FOREIGN_KEY_VIOLATION } from '../../common/errors/pg-error.js';
import { notificationService } from '../../common/notifications/notification.service.js';
import {
  calculateCompatibilityScore,
  hasValidSliderProfile,
  passesHardFilters,
  rankTop3,
} from '../../common/utils/scoring.util.js';
import { studentsRepository } from '../students/students.repository.js';
import { matchingRepository } from './matching.repository.js';

// Message text is fixed by docs/NOTIFICATIONS.md ("Flow: Tutor Selected Notification").
const TUTOR_SELECTED_MESSAGE =
  'A student has selected you as their tutor. Please check your contact details.';

const isUuid = (value: string) => z.string().uuid().safeParse(value).success;

// A tutor or variant deleted mid-request surfaces as a Postgres foreign-key violation. That is a
// race on our side, not a bad client request, so callers translate it instead of returning a 400.
function onForeignKeyViolation(err: unknown, build: () => Error): unknown {
  return getPgErrorCode(err) === PG_FOREIGN_KEY_VIOLATION ? build() : err;
}

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
    if (!hasValidSliderProfile(student.style_profile, student.personality_profile)) {
      throw new UnprocessableEntityError(
        'Your learning preferences are incomplete. Please update your profile before matching'
      );
    }

    const candidates = await matchingRepository.findCandidateTutors(variant.id);
    const survivors = candidates
      .filter((tutor) => passesHardFilters(tutor, student, variant))
      // Corrupt tutor data must not fail the student's request: skip that tutor and say which one.
      .filter((tutor) => {
        const valid = hasValidSliderProfile(tutor.style_profile, tutor.personality_profile);
        if (!valid) {
          console.warn(`[matching] skipping tutor ${tutor.tutor_id}: invalid slider profile`);
        }
        return valid;
      });

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
    ).catch((err) => {
      throw onForeignKeyViolation(
        err,
        () => new ConflictError('The tutor list changed while matching. Please try again')
      );
    });

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

  /**
   * Student confirms exactly one of the recommended tutors. One transaction: lock the request,
   * validate, mark it CONFIRMED + the recommendation selected, and queue the TUTOR_SELECTED
   * notification (the email goes out later via the worker, never from here).
   */
  async confirmSelection(
    studentId: string,
    matchRequestId: string,
    input: ConfirmTutorSelectionInput
  ): Promise<ConfirmSelectionResultDto> {
    // A malformed id can never match a row; answer 404 instead of letting Postgres raise a 500.
    if (!isUuid(matchRequestId)) throw new NotFoundError('Match request not found');

    return matchingRepository.transaction(async (tx) => {
      const request = await matchingRepository.lockRequest(tx, matchRequestId);
      // Unknown and "not yours" look identical so we never reveal another student's request.
      if (!request || request.student_id !== studentId) {
        throw new NotFoundError('Match request not found');
      }
      if (request.status === MatchRequestStatus.CONFIRMED) {
        throw new ConflictError('This match request has already been confirmed');
      }

      const recommendation = await matchingRepository.findRecommendation(
        tx,
        matchRequestId,
        input.recommendation_id
      );
      if (!recommendation) throw new NotFoundError('Recommendation not found for this match request');
      if (recommendation.tutor_id !== input.tutor_id) {
        throw new UnprocessableEntityError('tutor_id does not match the selected recommendation');
      }

      // The tutor may have been rejected or removed since the Top 3 was computed.
      const tutorStatus = await matchingRepository.findTutorVerificationStatus(tx, input.tutor_id);
      if (tutorStatus !== VerificationStatus.APPROVED) {
        throw new UnprocessableEntityError('This tutor is no longer available');
      }

      await matchingRepository.markSelected(tx, matchRequestId, recommendation.id);
      await notificationService.createNotification(
        {
          userId: input.tutor_id,
          eventType: NotificationEventType.TUTOR_SELECTED,
          message: TUTOR_SELECTED_MESSAGE,
          requiresEmail: true,
        },
        tx
      );

      return {
        match_request_id: matchRequestId,
        status: MatchRequestStatus.CONFIRMED,
        selected: { recommendation_id: recommendation.id, tutor_id: input.tutor_id },
      };
    }).catch((err) => {
      throw onForeignKeyViolation(
        err,
        () => new UnprocessableEntityError('This tutor is no longer available')
      );
    });
  },
};
