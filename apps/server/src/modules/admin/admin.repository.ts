import type { DbExecutor } from '../../db/client.js';
import { db } from '../../db/client.js';
import {
  tutors,
  users,
  documents,
  tutorSubjects,
  subjectVariants,
  subjects,
} from '../../db/schema/index.js';
import { eq, desc, asc, inArray } from 'drizzle-orm';
import {
  VerificationStatus,
  DocumentType,
  AdminTutorListItemDto,
  AdminTutorDetailDto,
  AdminDocumentDto,
} from '@tutorpair/shared';

export const adminRepository = {
  transaction: <T>(work: (tx: DbExecutor) => Promise<T>) => db.transaction(work),
  lockTutor: async (tx: DbExecutor, tutorId: string) => {
    const [row] = await tx.select().from(tutors).where(eq(tutors.user_id, tutorId)).for('update');
    return row;
  },
  saveVerification: async (tx: DbExecutor, tutorId: string, status: VerificationStatus, reason: string | null) => {
    const [row] = await tx.update(tutors).set({ verification_status: status, rejection_reason: reason })
      .where(eq(tutors.user_id, tutorId)).returning();
    return row;
  },
  findTutors: async (statusFilter?: VerificationStatus | 'ALL') => {
    try {
      let query = db
        .select({
          user_id: tutors.user_id,
          email: users.email,
          first_name: tutors.first_name,
          last_name: tutors.last_name,
          phone_number: tutors.phone_number,
          tutor_type: tutors.tutor_type,
          verification_status: tutors.verification_status,
          rejection_reason: tutors.rejection_reason,
          created_at: users.created_at,
        })
        .from(tutors)
        .innerJoin(users, eq(tutors.user_id, users.id))
        .$dynamic();

      if (statusFilter && statusFilter !== 'ALL') {
        query = query.where(eq(tutors.verification_status, statusFilter));
      }

      // FIFO: Pending reviews must be processed First-In, First-Out (oldest first).
      // Completed reviews (APPROVED, REJECTED, ALL) show most recently processed first.
      const sortOrder =
        statusFilter === VerificationStatus.PENDING
          ? asc(users.created_at)
          : desc(users.created_at);

      const tutorRows = await query.orderBy(sortOrder);

      if (tutorRows && tutorRows.length > 0) {
        const tutorIds = tutorRows.map((t) => t.user_id);
        const docRows = await db
          .select({
            id: documents.id,
            tutor_id: documents.tutor_id,
            document_type: documents.document_type,
          })
          .from(documents)
          .where(inArray(documents.tutor_id, tutorIds));

        // Fetch primary hourly rate from tutor subjects
        const subjectRows = await db
          .select({
            tutor_id: tutorSubjects.tutor_id,
            hourly_rate: tutorSubjects.hourly_rate,
          })
          .from(tutorSubjects)
          .where(inArray(tutorSubjects.tutor_id, tutorIds));

        const ratesByTutor = new Map<string, number>();
        for (const s of subjectRows) {
          if (!ratesByTutor.has(s.tutor_id)) {
            ratesByTutor.set(s.tutor_id, Number(s.hourly_rate) || 500);
          }
        }

        const docsByTutor = new Map<
          string,
          { count: number; has_cv: boolean; has_transcript: boolean; has_subject_proof: boolean }
        >();

        for (const doc of docRows) {
          const current = docsByTutor.get(doc.tutor_id) || {
            count: 0,
            has_cv: false,
            has_transcript: false,
            has_subject_proof: false,
          };
          current.count += 1;
          if (doc.document_type === DocumentType.CV) current.has_cv = true;
          if (doc.document_type === DocumentType.DEGREE_TRANSCRIPT) {
            current.has_transcript = true;
          }
          if (doc.document_type === DocumentType.SUBJECT_QUALIFICATION) {
            current.has_subject_proof = true;
          }
          docsByTutor.set(doc.tutor_id, current);
        }

        return tutorRows.map((tutor) => {
          const summary = docsByTutor.get(tutor.user_id) || {
            count: 0,
            has_cv: false,
            has_transcript: false,
            has_subject_proof: false,
          };

          return {
            user_id: tutor.user_id,
            email: tutor.email,
            first_name: tutor.first_name,
            last_name: tutor.last_name,
            phone_number: tutor.phone_number,
            tutor_type: tutor.tutor_type,
            hourly_rate: ratesByTutor.get(tutor.user_id) || 500,
            verification_status: tutor.verification_status as VerificationStatus,
            rejection_reason: tutor.rejection_reason,
            created_at: tutor.created_at.toISOString(),
            document_count: summary.count,
            documents_summary: summary,
          };
        });
      }
    } catch (error) {
      throw error;
    }
    return [];
  },

  findTutorById: async (tutorId: string): Promise<AdminTutorDetailDto | null> => {
    try {
      const [tutorRow] = await db
        .select({
          user_id: tutors.user_id,
          email: users.email,
          first_name: tutors.first_name,
          last_name: tutors.last_name,
          phone_number: tutors.phone_number,
          description: tutors.description,
          tutor_type: tutors.tutor_type,
          style_profile: tutors.style_profile,
          personality_profile: tutors.personality_profile,
          verification_status: tutors.verification_status,
          rejection_reason: tutors.rejection_reason,
          created_at: users.created_at,
        })
        .from(tutors)
        .innerJoin(users, eq(tutors.user_id, users.id))
        .where(eq(tutors.user_id, tutorId))
        .limit(1);

      if (tutorRow) {
        const subjectRows = await db
          .select({
            variant_id: tutorSubjects.variant_id,
            variant_name: subjectVariants.name,
            subject_name: subjects.name,
            category: subjects.category,
            grade_levels: tutorSubjects.grade_levels,
            teaching_focus: tutorSubjects.teaching_focus,
            hourly_rate: tutorSubjects.hourly_rate,
            requires_proof: subjectVariants.requires_proof,
          })
          .from(tutorSubjects)
          .innerJoin(subjectVariants, eq(tutorSubjects.variant_id, subjectVariants.id))
          .innerJoin(subjects, eq(subjectVariants.subject_id, subjects.id))
          .where(eq(tutorSubjects.tutor_id, tutorId));

        const docRows = await db
          .select({
            id: documents.id,
            tutor_id: documents.tutor_id,
            document_type: documents.document_type,
            variant_id: documents.variant_id,
            variant_name: subjectVariants.name,
            file_key: documents.file_key,
            file_size_kb: documents.file_size_kb,
            uploaded_at: documents.uploaded_at,
          })
          .from(documents)
          .leftJoin(subjectVariants, eq(documents.variant_id, subjectVariants.id))
          .where(eq(documents.tutor_id, tutorId))
          .orderBy(desc(documents.uploaded_at));

        const primaryRate = subjectRows.length > 0 ? Number(subjectRows[0].hourly_rate) : 500;

        return {
          user_id: tutorRow.user_id,
          email: tutorRow.email,
          first_name: tutorRow.first_name,
          last_name: tutorRow.last_name,
          phone_number: tutorRow.phone_number,
          description: tutorRow.description,
          tutor_type: tutorRow.tutor_type,
          style_profile: tutorRow.style_profile,
          personality_profile: tutorRow.personality_profile,
          hourly_rate: primaryRate,
          verification_status: tutorRow.verification_status as VerificationStatus,
          rejection_reason: tutorRow.rejection_reason,
          created_at: tutorRow.created_at.toISOString(),
          subjects: subjectRows.map((s) => ({
            variant_id: s.variant_id,
            variant_name: s.variant_name,
            subject_name: s.subject_name,
            category: s.category,
            grade_levels: s.grade_levels,
            teaching_focus: s.teaching_focus,
            requires_proof: s.requires_proof,
          })),
          documents: docRows.map((d) => ({
            id: d.id,
            tutor_id: d.tutor_id,
            document_type: d.document_type as DocumentType,
            variant_id: d.variant_id,
            variant_name: d.variant_name,
            file_key: d.file_key,
            file_size_kb: d.file_size_kb,
            uploaded_at: d.uploaded_at.toISOString(),
          })),
        };
      }
    } catch (error) {
      throw error;
    }
    return null;
  },

  findDocumentById: async (documentId: string, tutorId: string): Promise<AdminDocumentDto | null> => {
    try {
      const [doc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);

      if (doc && doc.tutor_id === tutorId) {
        return {
          id: doc.id,
          tutor_id: doc.tutor_id,
          document_type: doc.document_type as DocumentType,
          variant_id: doc.variant_id,
          variant_name: null,
          file_key: doc.file_key,
          file_size_kb: doc.file_size_kb,
          uploaded_at: doc.uploaded_at.toISOString(),
        };
      }
    } catch (error) {
      throw error;
    }
    return null;
  },

  updateVerificationStatus: async (
    tutorId: string,
    status: VerificationStatus,
    rejectionReason: string | null
  ) => {
    try {
      const [updated] = await db
        .update(tutors)
        .set({
          verification_status: status,
          rejection_reason: status === VerificationStatus.REJECTED ? rejectionReason : null,
        })
        .where(eq(tutors.user_id, tutorId))
        .returning();

      if (updated) {
        return {
          user_id: updated.user_id,
          verification_status: updated.verification_status as VerificationStatus,
          rejection_reason: updated.rejection_reason,
        };
      }
    } catch (error) {
      throw error;
    }
    return null;
  },
};
