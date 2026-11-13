import { and, eq, inArray, desc } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  users,
  tutors,
  tutorSubjects,
  subjectVariants,
  subjects,
  availabilities,
  documents,
  matchRequests,
  matchRecommendations,
  reviews,
  students,
  Tutor,
} from '../../db/schema/index.js';
import {
  DocumentType,
  MatchRequestStatus,
  SubjectCategory,
  type MatchedStudentDto,
  TutorProfileInput,
  UpdateTutorProfileInput,
  TutorSubjectItemInput,
  TutorAvailabilitySlotInput,
} from '@tutorpair/shared';

export const tutorsRepository = {
  async findProfileByUserId(userId: string): Promise<Tutor | null> {
    const [tutor] = await db
      .select()
      .from(tutors)
      .where(eq(tutors.user_id, userId))
      .limit(1);

    return tutor ?? null;
  },

  async createProfile(userId: string, input: TutorProfileInput): Promise<Tutor> {
    const [created] = await db
      .insert(tutors)
      .values({
        user_id: userId,
        first_name: input.first_name,
        last_name: input.last_name,
        phone_number: input.phone_number,
        line_id: input.line_id ?? null,
        description: input.description ?? null,
        consent_display_cv: input.consent_display_cv ?? false,
        tutor_type: input.tutor_type,
        style_profile: input.style_profile,
        personality_profile: input.personality_profile,
        verification_status: 'PENDING',
      })
      .returning();

    return created;
  },

  async updateProfile(userId: string, input: UpdateTutorProfileInput): Promise<Tutor | null> {
    const updateValues: Record<string, unknown> = {};

    if (input.first_name !== undefined) updateValues.first_name = input.first_name;
    if (input.last_name !== undefined) updateValues.last_name = input.last_name;
    if (input.phone_number !== undefined) updateValues.phone_number = input.phone_number;
    if (input.line_id !== undefined) updateValues.line_id = input.line_id;
    if (input.description !== undefined) updateValues.description = input.description;
    if (input.consent_display_cv !== undefined) updateValues.consent_display_cv = input.consent_display_cv;
    if (input.tutor_type !== undefined) updateValues.tutor_type = input.tutor_type;
    if (input.style_profile !== undefined) updateValues.style_profile = input.style_profile;
    if (input.personality_profile !== undefined)
      updateValues.personality_profile = input.personality_profile;

    if (Object.keys(updateValues).length === 0) {
      return this.findProfileByUserId(userId);
    }

    const [updated] = await db
      .update(tutors)
      .set(updateValues)
      .where(eq(tutors.user_id, userId))
      .returning();

    return updated ?? null;
  },

  async findSubjectsByTutorId(tutorId: string) {
    return await db
      .select({
        variant_id: tutorSubjects.variant_id,
        subject_id: subjectVariants.subject_id,
        subject_name: subjects.name,
        variant_name: subjectVariants.name,
        category: subjects.category,
        learning_goal: subjectVariants.learning_goal,
        requires_proof: subjectVariants.requires_proof,
        hourly_rate: tutorSubjects.hourly_rate,
        grade_levels: tutorSubjects.grade_levels,
        teaching_focus: tutorSubjects.teaching_focus,
      })
      .from(tutorSubjects)
      .innerJoin(subjectVariants, eq(tutorSubjects.variant_id, subjectVariants.id))
      .innerJoin(subjects, eq(subjectVariants.subject_id, subjects.id))
      .where(eq(tutorSubjects.tutor_id, tutorId));
  },

  async verifyVariantIdsExist(variantIds: string[]): Promise<string[]> {
    if (variantIds.length === 0) return [];

    const rows = await db
      .select({ id: subjectVariants.id })
      .from(subjectVariants)
      .where(inArray(subjectVariants.id, variantIds));

    return rows.map((r) => r.id);
  },

  async replaceSubjects(tutorId: string, subjectItems: TutorSubjectItemInput[]) {
    return await db.transaction(async (tx) => {
      await tx.delete(tutorSubjects).where(eq(tutorSubjects.tutor_id, tutorId));

      if (subjectItems.length > 0) {
        await tx.insert(tutorSubjects).values(
          subjectItems.map((item) => ({
            tutor_id: tutorId,
            variant_id: item.variant_id,
            hourly_rate: item.hourly_rate.toFixed(2),
            grade_levels: item.grade_levels ?? [],
            teaching_focus: item.teaching_focus ?? null,
          }))
        );
      }

      return await tx
        .select({
          variant_id: tutorSubjects.variant_id,
          subject_id: subjectVariants.subject_id,
          subject_name: subjects.name,
          variant_name: subjectVariants.name,
          category: subjects.category,
          learning_goal: subjectVariants.learning_goal,
          requires_proof: subjectVariants.requires_proof,
          hourly_rate: tutorSubjects.hourly_rate,
          grade_levels: tutorSubjects.grade_levels,
          teaching_focus: tutorSubjects.teaching_focus,
        })
        .from(tutorSubjects)
        .innerJoin(subjectVariants, eq(tutorSubjects.variant_id, subjectVariants.id))
        .innerJoin(subjects, eq(subjectVariants.subject_id, subjects.id))
        .where(eq(tutorSubjects.tutor_id, tutorId));
    });
  },

  async findAvailabilityByUserId(userId: string) {
    return await db
      .select({
        id: availabilities.id,
        day_of_week: availabilities.day_of_week,
        start_time: availabilities.start_time,
        end_time: availabilities.end_time,
      })
      .from(availabilities)
      .where(eq(availabilities.user_id, userId));
  },

  async replaceAvailability(userId: string, slots: TutorAvailabilitySlotInput[]) {
    return await db.transaction(async (tx) => {
      await tx.delete(availabilities).where(eq(availabilities.user_id, userId));

      if (slots.length > 0) {
        return await tx
          .insert(availabilities)
          .values(
            slots.map((slot) => ({
              user_id: userId,
              day_of_week: slot.day_of_week,
              start_time: slot.start_time,
              end_time: slot.end_time,
            }))
          )
          .returning({
            id: availabilities.id,
            day_of_week: availabilities.day_of_week,
            start_time: availabilities.start_time,
            end_time: availabilities.end_time,
          });
      }

      return [];
    });
  },

  async findVerificationStatus(tutorId: string) {
    const [tutor] = await db
      .select({
        verification_status: tutors.verification_status,
        rejection_reason: tutors.rejection_reason,
      })
      .from(tutors)
      .where(eq(tutors.user_id, tutorId))
      .limit(1);

    if (!tutor) return null;

    const docs = await db
      .select({
        id: documents.id,
        document_type: documents.document_type,
        file_key: documents.file_key,
        file_size_kb: documents.file_size_kb,
        variant_id: documents.variant_id,
        uploaded_at: documents.uploaded_at,
      })
      .from(documents)
      .where(eq(documents.tutor_id, tutorId));

    return {
      verification_status: tutor.verification_status,
      rejection_reason: tutor.rejection_reason,
      documents: docs,
    };
  },

  async findDetailedProfile(tutorId: string) {
    const [tutor] = await db
      .select({
        user_id: tutors.user_id,
        first_name: tutors.first_name,
        last_name: tutors.last_name,
        phone_number: tutors.phone_number,
        line_id: tutors.line_id,
        description: tutors.description,
        consent_display_cv: tutors.consent_display_cv,
        tutor_type: tutors.tutor_type,
        style_profile: tutors.style_profile,
        personality_profile: tutors.personality_profile,
        average_rating: tutors.average_rating,
        review_count: tutors.review_count,
        verification_status: tutors.verification_status,
        email: users.email,
      })
      .from(tutors)
      .innerJoin(users, eq(tutors.user_id, users.id))
      .where(eq(tutors.user_id, tutorId))
      .limit(1);

    if (!tutor) return null;

    const subjectRows = await this.findSubjectsByTutorId(tutorId);

    // Fetch tutor's CV/Resume document if uploaded
    const [cvDoc] = await db
      .select({
        file_key: documents.file_key,
      })
      .from(documents)
      .where(
        and(
          eq(documents.tutor_id, tutorId),
          eq(documents.document_type, DocumentType.CV)
        )
      )
      .limit(1);

    return {
      ...tutor,
      subjects: subjectRows,
      cv_file_key: cvDoc?.file_key ?? null,
    };
  },

  async isTutorConfirmedByStudent(tutorId: string, studentId: string): Promise<boolean> {
    const [row] = await db
      .select({ id: matchRecommendations.id })
      .from(matchRecommendations)
      .innerJoin(matchRequests, eq(matchRecommendations.match_request_id, matchRequests.id))
      .where(
        and(
          eq(matchRecommendations.tutor_id, tutorId),
          eq(matchRequests.student_id, studentId),
          eq(matchRequests.status, 'CONFIRMED'),
          eq(matchRecommendations.is_selected, true)
        )
      )
      .limit(1);

    return Boolean(row);
  },

  async getStudentConfirmedMatchWithTutor(tutorId: string, studentId: string) {
    const [row] = await db
      .select({
        recommendation_id: matchRecommendations.id,
      })
      .from(matchRecommendations)
      .innerJoin(matchRequests, eq(matchRecommendations.match_request_id, matchRequests.id))
      .where(
        and(
          eq(matchRecommendations.tutor_id, tutorId),
          eq(matchRequests.student_id, studentId),
          eq(matchRequests.status, 'CONFIRMED'),
          eq(matchRecommendations.is_selected, true)
        )
      )
      .limit(1);

    if (!row) return null;

    const [rev] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.recommendation_id, row.recommendation_id))
      .limit(1);

    return {
      recommendation_id: row.recommendation_id,
      has_reviewed: Boolean(rev),
    };
  },

  async getTutorMatchedStudents(tutorId: string): Promise<MatchedStudentDto[]> {
    const rows = await db
      .select({
        match_request_id: matchRequests.id,
        student_id: students.user_id,
        first_name: students.first_name,
        last_name: students.last_name,
        grade_level: students.grade_level,
        phone_number: students.phone_number,
        line_id: students.line_id,
        email: users.email,
        subject_name: subjects.name,
        variant_name: subjectVariants.name,
        category: subjects.category,
        hourly_rate: students.budget_max,
        confirmed_at: matchRequests.created_at,
        style_profile: students.style_profile,
        personality_profile: students.personality_profile,
      })
      .from(matchRecommendations)
      .innerJoin(matchRequests, eq(matchRecommendations.match_request_id, matchRequests.id))
      .innerJoin(students, eq(matchRequests.student_id, students.user_id))
      .innerJoin(users, eq(students.user_id, users.id))
      .innerJoin(subjectVariants, eq(matchRequests.variant_id, subjectVariants.id))
      .innerJoin(subjects, eq(subjectVariants.subject_id, subjects.id))
      .leftJoin(
        tutorSubjects,
        and(
          eq(tutorSubjects.tutor_id, tutorId),
          eq(tutorSubjects.variant_id, matchRequests.variant_id)
        )
      )
      .where(
        and(
          eq(matchRecommendations.tutor_id, tutorId),
          eq(matchRecommendations.is_selected, true),
          eq(matchRequests.status, MatchRequestStatus.CONFIRMED)
        )
      )
      .orderBy(desc(matchRequests.created_at));

    return rows.map((r) => ({
      match_request_id: r.match_request_id,
      student_id: r.student_id,
      student_name: `${r.first_name} ${r.last_name}`,
      first_name: r.first_name,
      last_name: r.last_name,
      grade_level: r.grade_level,
      phone_number: r.phone_number,
      line_id: r.line_id,
      email: r.email,
      subject_name: r.subject_name,
      variant_name: r.variant_name,
      category: r.category as SubjectCategory,
      hourly_rate: Number(r.hourly_rate ?? 0),
      confirmed_at: r.confirmed_at.toISOString(),
      style_profile: r.style_profile,
      personality_profile: r.personality_profile,
    }));
  },
};

