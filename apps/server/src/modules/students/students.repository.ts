import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  students,
  users,
  availabilities,
  studentSubjectRequirements,
  subjectVariants,
  subjects,
  Student,
} from '../../db/schema/index.js';
import {
  StudentProfileInput,
  UpdateStudentProfileInput,
  StudentAvailabilitySlotInput,
  StudentProfileDto,
  StudentAvailabilitySlotDto,
  StudentWithAvailabilityDto,
  StudentSubjectItemDto,
} from '@tutorpair/shared';

export const studentsRepository = {
  async findProfileByUserId(userId: string): Promise<StudentProfileDto | null> {
    const [result] = await db
      .select({
        user_id: students.user_id,
        email: users.email,
        first_name: students.first_name,
        last_name: students.last_name,
        phone_number: students.phone_number,
        line_id: students.line_id,
        grade_level: students.grade_level,
        tutor_type_pref: students.tutor_type_pref,
        style_profile: students.style_profile,
        personality_profile: students.personality_profile,
        budget_max: students.budget_max,
      })
      .from(students)
      .innerJoin(users, eq(students.user_id, users.id))
      .where(eq(students.user_id, userId))
      .limit(1);

    if (!result) return null;

    return {
      ...result,
      budget_max: Number(result.budget_max),
    };
  },

  async createProfile(userId: string, input: StudentProfileInput): Promise<StudentProfileDto> {
    const [created] = await db
      .insert(students)
      .values({
        user_id: userId,
        first_name: input.first_name,
        last_name: input.last_name,
        phone_number: input.phone_number ?? null,
        line_id: input.line_id ?? null,
        grade_level: input.grade_level,
        tutor_type_pref: input.tutor_type_pref,
        style_profile: input.style_profile,
        personality_profile: input.personality_profile,
        budget_max: input.budget_max.toString(),
      })
      .returning();

    // Fetch associated user email
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return {
      user_id: created.user_id,
      email: user?.email,
      first_name: created.first_name,
      last_name: created.last_name,
      phone_number: created.phone_number,
      line_id: created.line_id,
      grade_level: created.grade_level,
      tutor_type_pref: created.tutor_type_pref,
      style_profile: created.style_profile,
      personality_profile: created.personality_profile,
      budget_max: Number(created.budget_max),
    };
  },

  async updateProfile(userId: string, input: UpdateStudentProfileInput): Promise<StudentProfileDto | null> {
    const updateValues: Record<string, unknown> = {};

    if (input.first_name !== undefined) updateValues.first_name = input.first_name;
    if (input.last_name !== undefined) updateValues.last_name = input.last_name;
    if (input.phone_number !== undefined) updateValues.phone_number = input.phone_number;
    if (input.line_id !== undefined) updateValues.line_id = input.line_id;
    if (input.grade_level !== undefined) updateValues.grade_level = input.grade_level;
    if (input.tutor_type_pref !== undefined) updateValues.tutor_type_pref = input.tutor_type_pref;
    if (input.style_profile !== undefined) updateValues.style_profile = input.style_profile;
    if (input.personality_profile !== undefined) updateValues.personality_profile = input.personality_profile;
    if (input.budget_max !== undefined) updateValues.budget_max = input.budget_max.toString();

    if (Object.keys(updateValues).length > 0) {
      await db
        .update(students)
        .set(updateValues)
        .where(eq(students.user_id, userId));
    }

    return this.findProfileByUserId(userId);
  },

  async findAvailabilityByUserId(userId: string): Promise<StudentAvailabilitySlotDto[]> {
    const slots = await db
      .select({
        id: availabilities.id,
        day_of_week: availabilities.day_of_week,
        start_time: availabilities.start_time,
        end_time: availabilities.end_time,
      })
      .from(availabilities)
      .where(eq(availabilities.user_id, userId));

    return slots as StudentAvailabilitySlotDto[];
  },

  async replaceAvailability(
    userId: string,
    slots: StudentAvailabilitySlotInput[]
  ): Promise<StudentAvailabilitySlotDto[]> {
    return await db.transaction(async (tx) => {
      await tx.delete(availabilities).where(eq(availabilities.user_id, userId));

      if (slots.length > 0) {
        const inserted = await tx
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

        return inserted as StudentAvailabilitySlotDto[];
      }

      return [];
    });
  },

  /**
   * Fetch all subject variants selected by a student with subject names and categories
   */
  async findSubjectsByStudentId(userId: string): Promise<StudentSubjectItemDto[]> {
    const rows = await db
      .select({
        variant_id: studentSubjectRequirements.variant_id,
        subject_name: subjects.name,
        variant_name: subjectVariants.name,
        category: subjects.category,
        learning_goal: subjectVariants.learning_goal,
      })
      .from(studentSubjectRequirements)
      .innerJoin(subjectVariants, eq(studentSubjectRequirements.variant_id, subjectVariants.id))
      .innerJoin(subjects, eq(subjectVariants.subject_id, subjects.id))
      .where(eq(studentSubjectRequirements.student_id, userId));

    return rows as StudentSubjectItemDto[];
  },

  /**
   * Replace student's selected subject requirements
   */
  async replaceSubjects(userId: string, variantIds: string[]): Promise<StudentSubjectItemDto[]> {
    return await db.transaction(async (tx) => {
      await tx
        .delete(studentSubjectRequirements)
        .where(eq(studentSubjectRequirements.student_id, userId));

      if (variantIds.length > 0) {
        await tx.insert(studentSubjectRequirements).values(
          variantIds.map((vId) => ({
            student_id: userId,
            variant_id: vId,
          }))
        );
      }

      return this.findSubjectsByStudentId(userId);
    });
  },

  /**
   * Cross-module query used by Module 6 (Tutor Matching - TP-4).
   * Retrieves student profile, preferences, budget, and availability in one call.
   */
  async getProfileWithAvailability(userId: string): Promise<StudentWithAvailabilityDto | null> {
    const profile = await this.findProfileByUserId(userId);
    if (!profile) return null;

    const availList = await this.findAvailabilityByUserId(userId);

    return {
      ...profile,
      availabilities: availList,
    };
  },
};
