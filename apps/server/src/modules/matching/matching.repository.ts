import { and, eq, desc, inArray } from 'drizzle-orm';
import { db, type DbExecutor } from '../../db/client.js';
import {
  users,
  tutors,
  tutorSubjects,
  subjects,
  subjectVariants,
  availabilities,
  matchRequests,
  matchRecommendations,
  reviews,
} from '../../db/schema/index.js';
import {
  MatchRequestStatus,
  VerificationStatus,
  SubjectCategory,
  type TutorType,
  type MatchHistoryItemDto,
  type MatchRecommendationDto,
  type ConfirmedTutorDetailsDto,
} from '@tutorpair/shared';
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

export interface NewRecommendation {
  tutor_id: string;
  rank: number;
  score: number;
}

export interface SavedMatchRequest {
  match_request_id: string;
  recommendations: Array<NewRecommendation & { recommendation_id: string }>;
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

  /**
   * Writes the request and its 0-3 recommendations in one transaction.
   * A student keeps one open (PENDING) request per variant: re-running a match replaces the
   * previous unconfirmed one, so results always reflect the current profile. Confirmed requests
   * are never touched.
   * shortcut: two simultaneous requests can both insert before the delete sees the other;
   * upgrade with a partial unique index on (student_id, variant_id) WHERE status = 'PENDING'.
   */
  async createRequestWithRecommendations(
    studentId: string,
    variantId: string,
    recs: NewRecommendation[]
  ): Promise<SavedMatchRequest> {
    return await db.transaction(async (tx) => {
      await tx
        .delete(matchRequests)
        .where(
          and(
            eq(matchRequests.student_id, studentId),
            eq(matchRequests.variant_id, variantId),
            eq(matchRequests.status, MatchRequestStatus.PENDING)
          )
        );

      const [request] = await tx
        .insert(matchRequests)
        .values({ student_id: studentId, variant_id: variantId, status: MatchRequestStatus.PENDING })
        .returning({ id: matchRequests.id });

      if (recs.length === 0) {
        return { match_request_id: request.id, recommendations: [] };
      }

      const rows = await tx
        .insert(matchRecommendations)
        .values(
          recs.map((r) => ({
            match_request_id: request.id,
            tutor_id: r.tutor_id,
            rank: r.rank,
            score: r.score.toFixed(2),
          }))
        )
        .returning({
          recommendation_id: matchRecommendations.id,
          tutor_id: matchRecommendations.tutor_id,
          rank: matchRecommendations.rank,
          score: matchRecommendations.score,
        });

      return {
        match_request_id: request.id,
        recommendations: rows
          .map((r) => ({ ...r, score: Number(r.score) }))
          .sort((a, b) => a.rank - b.rank),
      };
    });
  },

  /** Runs `fn` in one DB transaction; throwing inside rolls everything back. */
  async transaction<T>(fn: (tx: DbExecutor) => Promise<T>): Promise<T> {
    return await db.transaction(fn);
  },

  /** Locks the request row (FOR UPDATE) so concurrent confirms for it run one after another. */
  async lockRequest(
    tx: DbExecutor,
    matchRequestId: string
  ): Promise<{ id: string; student_id: string; status: string } | null> {
    const [row] = await tx
      .select({
        id: matchRequests.id,
        student_id: matchRequests.student_id,
        status: matchRequests.status,
      })
      .from(matchRequests)
      .where(eq(matchRequests.id, matchRequestId))
      .for('update')
      .limit(1);
    return row ?? null;
  },

  async findRecommendation(
    tx: DbExecutor,
    matchRequestId: string,
    recommendationId: string
  ): Promise<{ id: string; tutor_id: string } | null> {
    const [row] = await tx
      .select({ id: matchRecommendations.id, tutor_id: matchRecommendations.tutor_id })
      .from(matchRecommendations)
      .where(
        and(
          eq(matchRecommendations.id, recommendationId),
          eq(matchRecommendations.match_request_id, matchRequestId)
        )
      )
      .limit(1);
    return row ?? null;
  },

  async findTutorVerificationStatus(tx: DbExecutor, tutorId: string): Promise<string | null> {
    const [row] = await tx
      .select({ status: tutors.verification_status })
      .from(tutors)
      .where(eq(tutors.user_id, tutorId))
      .limit(1);
    return row?.status ?? null;
  },

  /** Marks the request CONFIRMED and flags exactly the chosen recommendation as selected. */
  async markSelected(
    tx: DbExecutor,
    matchRequestId: string,
    recommendationId: string
  ): Promise<void> {
    await tx
      .update(matchRequests)
      .set({ status: MatchRequestStatus.CONFIRMED })
      .where(eq(matchRequests.id, matchRequestId));
    await tx
      .update(matchRecommendations)
      .set({ is_selected: true })
      .where(
        and(
          eq(matchRecommendations.id, recommendationId),
          eq(matchRecommendations.match_request_id, matchRequestId)
        )
      );
  },

  /**
   * Fetches the complete matching history for a student, ordered by created_at descending.
   * If a match request is CONFIRMED, the selected tutor's contact channels (phone, Line ID, email)
   * and review status are revealed.
   */
  async getStudentMatchHistory(studentId: string): Promise<MatchHistoryItemDto[]> {
    const requests = await db
      .select({
        id: matchRequests.id,
        variant_id: matchRequests.variant_id,
        status: matchRequests.status,
        created_at: matchRequests.created_at,
        subject_name: subjects.name,
        variant_name: subjectVariants.name,
        category: subjects.category,
      })
      .from(matchRequests)
      .innerJoin(subjectVariants, eq(matchRequests.variant_id, subjectVariants.id))
      .innerJoin(subjects, eq(subjectVariants.subject_id, subjects.id))
      .where(eq(matchRequests.student_id, studentId))
      .orderBy(desc(matchRequests.created_at));

    if (requests.length === 0) return [];

    const requestIds = requests.map((r) => r.id);

    const recRows = await db
      .select({
        recommendation_id: matchRecommendations.id,
        match_request_id: matchRecommendations.match_request_id,
        rank: matchRecommendations.rank,
        score: matchRecommendations.score,
        is_selected: matchRecommendations.is_selected,
        tutor_id: tutors.user_id,
        first_name: tutors.first_name,
        last_name: tutors.last_name,
        phone_number: tutors.phone_number,
        line_id: tutors.line_id,
        description: tutors.description,
        tutor_type: tutors.tutor_type,
        average_rating: tutors.average_rating,
        review_count: tutors.review_count,
        hourly_rate: tutorSubjects.hourly_rate,
        teaching_focus: tutorSubjects.teaching_focus,
        email: users.email,
        review_id: reviews.id,
      })
      .from(matchRecommendations)
      .innerJoin(tutors, eq(matchRecommendations.tutor_id, tutors.user_id))
      .innerJoin(users, eq(tutors.user_id, users.id))
      .innerJoin(matchRequests, eq(matchRecommendations.match_request_id, matchRequests.id))
      .leftJoin(
        tutorSubjects,
        and(
          eq(tutorSubjects.tutor_id, tutors.user_id),
          eq(tutorSubjects.variant_id, matchRequests.variant_id)
        )
      )
      .leftJoin(reviews, eq(reviews.recommendation_id, matchRecommendations.id))
      .where(inArray(matchRecommendations.match_request_id, requestIds));

    const recsByRequest = new Map<string, typeof recRows>();
    for (const row of recRows) {
      const list = recsByRequest.get(row.match_request_id) ?? [];
      list.push(row);
      recsByRequest.set(row.match_request_id, list);
    }

    return requests.map((req) => {
      const rows = (recsByRequest.get(req.id) ?? []).sort((a, b) => a.rank - b.rank);

      const recommendations: MatchRecommendationDto[] = rows.map((r) => ({
        recommendation_id: r.recommendation_id,
        rank: r.rank,
        score: Number(r.score),
        tutor: {
          tutor_id: r.tutor_id,
          first_name: r.first_name,
          last_name: r.last_name,
          description: r.description,
          tutor_type: r.tutor_type as TutorType,
          average_rating: Number(r.average_rating),
          review_count: r.review_count,
          hourly_rate: Number(r.hourly_rate ?? 0),
          teaching_focus: r.teaching_focus,
        },
      }));

      const selectedRow = rows.find((r) => r.is_selected);
      let selected: ConfirmedTutorDetailsDto | null = null;

      if (req.status === MatchRequestStatus.CONFIRMED && selectedRow) {
        selected = {
          recommendation_id: selectedRow.recommendation_id,
          tutor_id: selectedRow.tutor_id,
          first_name: selectedRow.first_name,
          last_name: selectedRow.last_name,
          phone_number: selectedRow.phone_number,
          line_id: selectedRow.line_id,
          email: selectedRow.email,
          hourly_rate: Number(selectedRow.hourly_rate ?? 0),
          tutor_type: selectedRow.tutor_type as TutorType,
          average_rating: Number(selectedRow.average_rating),
          review_count: selectedRow.review_count,
          has_reviewed: Boolean(selectedRow.review_id),
          review_id: selectedRow.review_id ?? null,
        };
      }

      return {
        match_request_id: req.id,
        variant_id: req.variant_id,
        subject_name: req.subject_name,
        variant_name: req.variant_name,
        category: req.category as SubjectCategory,
        status: req.status as MatchRequestStatus,
        created_at: req.created_at.toISOString(),
        recommendations,
        selected,
      };
    });
  },
};

