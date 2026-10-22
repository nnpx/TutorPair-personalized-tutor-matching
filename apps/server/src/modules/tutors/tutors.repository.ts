import { eq, inArray } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  tutors,
  tutorSubjects,
  subjectVariants,
  subjects,
  availabilities,
  documents,
  Tutor,
} from '../../db/schema/index.js';
import {
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
};
