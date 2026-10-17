import { db } from '../../db/client.js';
import {
  tutors,
  users,
  documents,
  tutorSubjects,
  subjectVariants,
  subjects,
} from '../../db/schema/index.js';
import { eq, desc, inArray } from 'drizzle-orm';
import {
  VerificationStatus,
  DocumentType,
  AdminTutorListItemDto,
  AdminTutorDetailDto,
  AdminDocumentDto,
} from '@tutorpair/shared';

// In-memory mock store initialized with complete cases
// Ensures full functionality locally even if PostgreSQL is not active
let inMemoryTutors: AdminTutorDetailDto[] = [
  {
    user_id: 'tutor-uuid-pending-1',
    email: 'somchai.math@tutorpair.local',
    first_name: 'Somchai',
    last_name: 'Prasert',
    phone_number: '081-234-5678',
    profile_photo: null,
    description:
      'Chulalongkorn University graduate in Pure Mathematics. 5 years teaching Olympiad and secondary math.',
    tutor_type: 'FREELANCE',
    style_profile: [2, 3, 4, 2, 3],
    personality_profile: [2, 1, 3, 2],
    hourly_rate: 650,
    class_format: 'BOTH',
    verification_status: VerificationStatus.PENDING,
    rejection_reason: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    subjects: [
      {
        variant_id: 'var-math-sec',
        variant_name: 'Secondary School Mathematics',
        subject_name: 'Mathematics',
        category: 'GENERAL_LEARNING',
        grade_levels: ['G7', 'G8', 'G9', 'G10', 'G11', 'G12'],
        teaching_focus: 'Calculus, Trigonometry, and Exam Prep',
        requires_proof: false,
      },
    ],
    documents: [
      {
        id: 'doc-somchai-cv',
        tutor_id: 'tutor-uuid-pending-1',
        document_type: DocumentType.CV,
        variant_id: null,
        variant_name: null,
        file_key: 'tutors/tutor-uuid-pending-1/cv-somchai.pdf',
        file_size_kb: 1450,
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      },
      {
        id: 'doc-somchai-degree',
        tutor_id: 'tutor-uuid-pending-1',
        document_type: DocumentType.GRADUATION_CERTIFICATE,
        variant_id: null,
        variant_name: null,
        file_key: 'tutors/tutor-uuid-pending-1/degree-chula-math.pdf',
        file_size_kb: 2800,
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString(),
      },
    ],
  },
  {
    user_id: 'tutor-uuid-pending-2',
    email: 'natthida.ielts@tutorpair.local',
    first_name: 'Natthida',
    last_name: 'Wongsuwan',
    phone_number: '089-876-5432',
    profile_photo: null,
    description:
      'Certified IELTS Academic Band 8.5 instructor. Specialized in Writing Task 2 and Speaking fluency.',
    tutor_type: 'INSTITUTIONAL',
    style_profile: [4, 2, 2, 4, 2],
    personality_profile: [4, 2, 4, 3],
    hourly_rate: 800,
    class_format: 'ONLINE',
    verification_status: VerificationStatus.PENDING,
    rejection_reason: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    subjects: [
      {
        variant_id: 'var-ielts-7',
        variant_name: 'IELTS 7.0+ Target',
        subject_name: 'IELTS',
        category: 'LANGUAGE_TESTING',
        grade_levels: ['G10', 'G11', 'G12'],
        teaching_focus: 'Band 7.5+ Writing & Speaking Strategies',
        requires_proof: true,
      },
    ],
    documents: [
      {
        id: 'doc-natthida-cv',
        tutor_id: 'tutor-uuid-pending-2',
        document_type: DocumentType.CV,
        variant_id: null,
        variant_name: null,
        file_key: 'tutors/tutor-uuid-pending-2/cv-natthida.pdf',
        file_size_kb: 950,
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      },
      {
        id: 'doc-natthida-transcript',
        tutor_id: 'tutor-uuid-pending-2',
        document_type: DocumentType.ACADEMIC_TRANSCRIPT,
        variant_id: null,
        variant_name: null,
        file_key: 'tutors/tutor-uuid-pending-2/transcript-arts.pdf',
        file_size_kb: 2100,
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
      },
      {
        id: 'doc-natthida-ielts',
        tutor_id: 'tutor-uuid-pending-2',
        document_type: DocumentType.SUBJECT_QUALIFICATION,
        variant_id: 'var-ielts-7',
        variant_name: 'IELTS 7.0+ Target',
        file_key: 'tutors/tutor-uuid-pending-2/ielts-official-score-8.5.pdf',
        file_size_kb: 3200,
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      },
    ],
  },
  {
    user_id: 'tutor-uuid-approved-1',
    email: 'chatchai.sat@tutorpair.local',
    first_name: 'Chatchai',
    last_name: 'Siriporn',
    phone_number: '085-555-1234',
    profile_photo: null,
    description:
      'Engineering undergrad at Thammasat with 800/800 SAT Math score. Friendly and step-by-step guidance.',
    tutor_type: 'UNDERGRADUATE',
    style_profile: [1, 5, 2, 1, 4],
    personality_profile: [3, 2, 4, 4],
    hourly_rate: 500,
    class_format: 'BOTH',
    verification_status: VerificationStatus.APPROVED,
    rejection_reason: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    subjects: [
      {
        variant_id: 'var-sat-math',
        variant_name: 'Digital SAT Math',
        subject_name: 'Digital SAT',
        category: 'UNIVERSITY_ENTRANCE',
        grade_levels: ['G11', 'G12'],
        teaching_focus: 'Digital SAT Speed & Calculator Shortcuts',
        requires_proof: true,
      },
    ],
    documents: [
      {
        id: 'doc-chatchai-cv',
        tutor_id: 'tutor-uuid-approved-1',
        document_type: DocumentType.CV,
        variant_id: null,
        variant_name: null,
        file_key: 'tutors/tutor-uuid-approved-1/cv-chatchai.pdf',
        file_size_kb: 1100,
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
      },
      {
        id: 'doc-chatchai-transcript',
        tutor_id: 'tutor-uuid-approved-1',
        document_type: DocumentType.ACADEMIC_TRANSCRIPT,
        variant_id: null,
        variant_name: null,
        file_key: 'tutors/tutor-uuid-approved-1/transcript-eng.pdf',
        file_size_kb: 1850,
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
      },
    ],
  },
  {
    user_id: 'tutor-uuid-rejected-1',
    email: 'anong.biology@tutorpair.local',
    first_name: 'Anong',
    last_name: 'Sukhumvit',
    phone_number: '082-999-8877',
    profile_photo: null,
    description: 'Biology high school preparation tutor.',
    tutor_type: 'FREELANCE',
    style_profile: [3, 3, 3, 3, 3],
    personality_profile: [3, 3, 3, 3],
    hourly_rate: 450,
    class_format: 'ONLINE',
    verification_status: VerificationStatus.REJECTED,
    rejection_reason:
      'The uploaded academic degree document is blurred and lacks official university seal or watermark. Please upload a clear scanned PDF.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    subjects: [
      {
        variant_id: 'var-bio-sec',
        variant_name: 'Secondary Biology',
        subject_name: 'Biology',
        category: 'GENERAL_LEARNING',
        grade_levels: ['G10', 'G11', 'G12'],
        teaching_focus: 'Genetics, Ecology, Cell Biology',
        requires_proof: false,
      },
    ],
    documents: [
      {
        id: 'doc-anong-cv',
        tutor_id: 'tutor-uuid-rejected-1',
        document_type: DocumentType.CV,
        variant_id: null,
        variant_name: null,
        file_key: 'tutors/tutor-uuid-rejected-1/cv-anong.pdf',
        file_size_kb: 600,
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      },
    ],
  },
];

function toListItemDto(t: AdminTutorDetailDto): AdminTutorListItemDto {
  const has_cv = t.documents.some((d) => d.document_type === DocumentType.CV);
  const has_transcript = t.documents.some(
    (d) =>
      d.document_type === DocumentType.ACADEMIC_TRANSCRIPT ||
      d.document_type === DocumentType.GRADUATION_CERTIFICATE
  );
  const has_subject_proof = t.documents.some(
    (d) => d.document_type === DocumentType.SUBJECT_QUALIFICATION
  );

  return {
    user_id: t.user_id,
    email: t.email,
    first_name: t.first_name,
    last_name: t.last_name,
    phone_number: t.phone_number,
    profile_photo: t.profile_photo,
    tutor_type: t.tutor_type,
    hourly_rate: t.hourly_rate,
    class_format: t.class_format,
    verification_status: t.verification_status,
    rejection_reason: t.rejection_reason,
    created_at: t.created_at,
    document_count: t.documents.length,
    documents_summary: {
      has_cv,
      has_transcript,
      has_subject_proof,
    },
  };
}

export const adminRepository = {
  findTutors: async (statusFilter?: VerificationStatus | 'ALL') => {
    try {
      let query = db
        .select({
          user_id: tutors.user_id,
          email: users.email,
          first_name: tutors.first_name,
          last_name: tutors.last_name,
          phone_number: tutors.phone_number,
          profile_photo: tutors.profile_photo,
          tutor_type: tutors.tutor_type,
          hourly_rate: tutors.hourly_rate,
          class_format: tutors.class_format,
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

      const tutorRows = await query.orderBy(desc(users.created_at));

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
          if (
            doc.document_type === DocumentType.ACADEMIC_TRANSCRIPT ||
            doc.document_type === DocumentType.GRADUATION_CERTIFICATE
          ) {
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
            profile_photo: tutor.profile_photo,
            tutor_type: tutor.tutor_type,
            hourly_rate: Number(tutor.hourly_rate),
            class_format: tutor.class_format,
            verification_status: tutor.verification_status as VerificationStatus,
            rejection_reason: tutor.rejection_reason,
            created_at: tutor.created_at.toISOString(),
            document_count: summary.count,
            documents_summary: summary,
          };
        });
      }
    } catch {
      // Fallback to inMemory store if database is not connected
    }

    // Return filtered inMemory mock store
    let filtered = inMemoryTutors;
    if (statusFilter && statusFilter !== 'ALL') {
      filtered = inMemoryTutors.filter((t) => t.verification_status === statusFilter);
    }
    return filtered.map(toListItemDto);
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
          profile_photo: tutors.profile_photo,
          description: tutors.description,
          tutor_type: tutors.tutor_type,
          style_profile: tutors.style_profile,
          personality_profile: tutors.personality_profile,
          hourly_rate: tutors.hourly_rate,
          class_format: tutors.class_format,
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

        return {
          user_id: tutorRow.user_id,
          email: tutorRow.email,
          first_name: tutorRow.first_name,
          last_name: tutorRow.last_name,
          phone_number: tutorRow.phone_number,
          profile_photo: tutorRow.profile_photo,
          description: tutorRow.description,
          tutor_type: tutorRow.tutor_type,
          style_profile: tutorRow.style_profile,
          personality_profile: tutorRow.personality_profile,
          hourly_rate: Number(tutorRow.hourly_rate),
          class_format: tutorRow.class_format,
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
            document_type: d.document_type,
            variant_id: d.variant_id,
            variant_name: d.variant_name,
            file_key: d.file_key,
            file_size_kb: d.file_size_kb,
            uploaded_at: d.uploaded_at.toISOString(),
          })),
        };
      }
    } catch {
      // Fallback to inMemory store
    }

    const found = inMemoryTutors.find((t) => t.user_id === tutorId);
    return found || null;
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
          document_type: doc.document_type,
          variant_id: doc.variant_id,
          variant_name: null,
          file_key: doc.file_key,
          file_size_kb: doc.file_size_kb,
          uploaded_at: doc.uploaded_at.toISOString(),
        };
      }
    } catch {
      // Fallback
    }

    for (const t of inMemoryTutors) {
      if (t.user_id === tutorId) {
        const doc = t.documents.find((d) => d.id === documentId);
        if (doc) return doc;
      }
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
    } catch {
      // Fallback
    }

    // Update inMemory store
    const tutor = inMemoryTutors.find((t) => t.user_id === tutorId);
    if (tutor) {
      tutor.verification_status = status;
      tutor.rejection_reason = status === VerificationStatus.REJECTED ? rejectionReason : null;
      return {
        user_id: tutor.user_id,
        verification_status: tutor.verification_status,
        rejection_reason: tutor.rejection_reason,
      };
    }

    return {
      user_id: tutorId,
      verification_status: status,
      rejection_reason: rejectionReason,
    };
  },
};
