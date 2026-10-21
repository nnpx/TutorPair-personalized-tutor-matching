import { db, pool } from './client.js';
import { subjects, subjectVariants, users, tutors, documents, tutorSubjects } from './schema/index.js';
import {
  SubjectCategory,
  LearningGoal,
  UserRole,
  TutorType,
  ClassFormat,
  VerificationStatus,
  DocumentType,
} from '@tutorpair/shared';

async function seed() {
  console.log('🌱 Seeding database reference data...');

  try {
    // 1. General Learning
    const [math] = await db
      .insert(subjects)
      .values({
        name: 'Mathematics',
        category: SubjectCategory.GENERAL_LEARNING,
      })
      .onConflictDoNothing()
      .returning();

    const [physics] = await db
      .insert(subjects)
      .values({
        name: 'Physics',
        category: SubjectCategory.GENERAL_LEARNING,
      })
      .onConflictDoNothing()
      .returning();

    const [biology] = await db
      .insert(subjects)
      .values({
        name: 'Biology',
        category: SubjectCategory.GENERAL_LEARNING,
      })
      .onConflictDoNothing()
      .returning();

    // 2. Language Testing
    const [ielts] = await db
      .insert(subjects)
      .values({
        name: 'IELTS',
        category: SubjectCategory.LANGUAGE_TESTING,
      })
      .onConflictDoNothing()
      .returning();

    const [japanese] = await db
      .insert(subjects)
      .values({
        name: 'Japanese',
        category: SubjectCategory.LANGUAGE_TESTING,
      })
      .onConflictDoNothing()
      .returning();

    const [chinese] = await db
      .insert(subjects)
      .values({
        name: 'Chinese',
        category: SubjectCategory.LANGUAGE_TESTING,
      })
      .onConflictDoNothing()
      .returning();

    // 3. University Entrance
    const [sat] = await db
      .insert(subjects)
      .values({
        name: 'SAT',
        category: SubjectCategory.UNIVERSITY_ENTRANCE,
      })
      .onConflictDoNothing()
      .returning();

    const [tgat] = await db
      .insert(subjects)
      .values({
        name: 'TGAT',
        category: SubjectCategory.UNIVERSITY_ENTRANCE,
      })
      .onConflictDoNothing()
      .returning();

    const [tpat] = await db
      .insert(subjects)
      .values({
        name: 'TPAT',
        category: SubjectCategory.UNIVERSITY_ENTRANCE,
      })
      .onConflictDoNothing()
      .returning();

    const [aLevel] = await db
      .insert(subjects)
      .values({
        name: 'A-Level',
        category: SubjectCategory.UNIVERSITY_ENTRANCE,
      })
      .onConflictDoNothing()
      .returning();

    // Seed variants if subjects exist
    if (math) {
      await db.insert(subjectVariants).values([
        {
          subject_id: math.id,
          name: 'Primary School Mathematics',
          learning_goal: LearningGoal.SCHOOL_CURRICULUM,
          requires_proof: false,
        },
        {
          subject_id: math.id,
          name: 'Secondary School Mathematics',
          learning_goal: LearningGoal.SCHOOL_CURRICULUM,
          requires_proof: false,
        },
        {
          subject_id: math.id,
          name: 'Math Olympiad / Competition',
          learning_goal: LearningGoal.COMPETITIONS,
          requires_proof: true,
        },
      ]);
    }

    if (ielts) {
      await db.insert(subjectVariants).values([
        {
          subject_id: ielts.id,
          name: 'IELTS Academic (6.5+)',
          learning_goal: LearningGoal.STANDARDIZED_EXAMS,
          requires_proof: true,
        },
        {
          subject_id: ielts.id,
          name: 'IELTS General Training',
          learning_goal: LearningGoal.STANDARDIZED_EXAMS,
          requires_proof: true,
        },
      ]);
    }

    if (japanese) {
      await db.insert(subjectVariants).values([
        {
          subject_id: japanese.id,
          name: 'JLPT N1',
          learning_goal: LearningGoal.STANDARDIZED_EXAMS,
          requires_proof: true,
        },
        {
          subject_id: japanese.id,
          name: 'JLPT N2',
          learning_goal: LearningGoal.STANDARDIZED_EXAMS,
          requires_proof: true,
        },
        {
          subject_id: japanese.id,
          name: 'Daily Communication',
          learning_goal: LearningGoal.PRACTICAL_APPLICATION,
          requires_proof: false,
        },
        {
          subject_id: japanese.id,
          name: 'Business Japanese',
          learning_goal: LearningGoal.PRACTICAL_APPLICATION,
          requires_proof: false,
        },
      ]);
    }

    if (sat) {
      await db.insert(subjectVariants).values([
        {
          subject_id: sat.id,
          name: 'Digital SAT Math',
          learning_goal: LearningGoal.STANDARDIZED_EXAMS,
          requires_proof: true,
        },
        {
          subject_id: sat.id,
          name: 'Digital SAT Reading & Writing',
          learning_goal: LearningGoal.STANDARDIZED_EXAMS,
          requires_proof: true,
        },
      ]);
    }

    if (tgat) {
      await db.insert(subjectVariants).values([
        {
          subject_id: tgat.id,
          name: 'TGAT 1 English Communication',
          learning_goal: LearningGoal.TGAT,
          requires_proof: false,
        },
        {
          subject_id: tgat.id,
          name: 'TGAT 2 Critical Thinking',
          learning_goal: LearningGoal.TGAT,
          requires_proof: false,
        },
      ]);
    }

    // ----------------------------------------------------
    // 3. Mock Admin User for local development / testing
    // ----------------------------------------------------
    console.log('👤 Seeding mock admin user...');
    const [adminUser] = await db
      .insert(users)
      .values({
        cognito_sub: 'mock-admin-id',
        email: 'admin@tutorpair.local',
        role: UserRole.ADMIN,
      })
      .onConflictDoNothing()
      .returning();

    // ----------------------------------------------------
    // 4. Mock Tutors covering all verification cases
    // ----------------------------------------------------
    console.log('🧑‍🏫 Seeding mock tutors for verification queue testing...');

    // Helper to query variants
    const allVariants = await db.select().from(subjectVariants);
    const ieltsVariant = allVariants.find((v) => v.name.includes('IELTS 7.0+')) || allVariants[0];
    const mathVariant = allVariants.find((v) => v.name.includes('Secondary')) || allVariants[1] || allVariants[0];
    const satVariant = allVariants.find((v) => v.name.includes('SAT Math')) || allVariants[2] || allVariants[0];

    // Case 1: PENDING tutor with complete documents (CV + Transcript + Subject Proof)
    const [tutorUser1] = await db
      .insert(users)
      .values({
        cognito_sub: 'mock-tutor-pending-1',
        email: 'somchai.math@tutorpair.local',
        role: UserRole.TUTOR,
      })
      .onConflictDoNothing()
      .returning();

    if (tutorUser1) {
      await db.insert(tutors).values({
        user_id: tutorUser1.id,
        first_name: 'Somchai',
        last_name: 'Prasert',
        phone_number: '081-234-5678',
        profile_photo: null,
        description: 'Chulalongkorn University graduate in Pure Mathematics. 5 years teaching Olympiad and secondary math.',
        tutor_type: TutorType.FREELANCE,
        style_profile: [2, 3, 4, 2, 3],
        personality_profile: [2, 1, 3, 2],
        hourly_rate: '650.00',
        class_format: ClassFormat.BOTH,
        verification_status: VerificationStatus.PENDING,
        rejection_reason: null,
      });

      if (mathVariant) {
        await db.insert(tutorSubjects).values({
          tutor_id: tutorUser1.id,
          variant_id: mathVariant.id,
          grade_levels: ['G7', 'G8', 'G9', 'G10', 'G11', 'G12'],
          teaching_focus: 'Calculus, Trigonometry, and Exam Prep',
        });
      }

      await db.insert(documents).values([
        {
          tutor_id: tutorUser1.id,
          document_type: DocumentType.CV,
          file_key: `tutors/${tutorUser1.id}/cv-somchai.pdf`,
          file_size_kb: 1450,
        },
        {
          tutor_id: tutorUser1.id,
          document_type: DocumentType.GRADUATION_CERTIFICATE,
          file_key: `tutors/${tutorUser1.id}/degree-chula-math.pdf`,
          file_size_kb: 2800,
        },
      ]);
    }

    // Case 2: PENDING tutor with Subject Qualification (IELTS requirement)
    const [tutorUser2] = await db
      .insert(users)
      .values({
        cognito_sub: 'mock-tutor-pending-2',
        email: 'natthida.ielts@tutorpair.local',
        role: UserRole.TUTOR,
      })
      .onConflictDoNothing()
      .returning();

    if (tutorUser2) {
      await db.insert(tutors).values({
        user_id: tutorUser2.id,
        first_name: 'Natthida',
        last_name: 'Wongsuwan',
        phone_number: '089-876-5432',
        profile_photo: null,
        description: 'Certified IELTS Academic Band 8.5 instructor. Specialized in Writing Task 2 and Speaking fluency.',
        tutor_type: TutorType.INSTITUTIONAL,
        style_profile: [4, 2, 2, 4, 2],
        personality_profile: [4, 2, 4, 3],
        hourly_rate: '800.00',
        class_format: ClassFormat.ONLINE,
        verification_status: VerificationStatus.PENDING,
        rejection_reason: null,
      });

      if (ieltsVariant) {
        await db.insert(tutorSubjects).values({
          tutor_id: tutorUser2.id,
          variant_id: ieltsVariant.id,
          grade_levels: ['G10', 'G11', 'G12'],
          teaching_focus: 'Band 7.5+ Writing & Speaking Strategies',
        });

        await db.insert(documents).values([
          {
            tutor_id: tutorUser2.id,
            document_type: DocumentType.CV,
            file_key: `tutors/${tutorUser2.id}/cv-natthida.pdf`,
            file_size_kb: 950,
          },
          {
            tutor_id: tutorUser2.id,
            document_type: DocumentType.ACADEMIC_TRANSCRIPT,
            file_key: `tutors/${tutorUser2.id}/transcript-arts.pdf`,
            file_size_kb: 2100,
          },
          {
            tutor_id: tutorUser2.id,
            document_type: DocumentType.SUBJECT_QUALIFICATION,
            variant_id: ieltsVariant.id,
            file_key: `tutors/${tutorUser2.id}/ielts-official-score-8.5.pdf`,
            file_size_kb: 3200,
          },
        ]);
      }
    }

    // Case 3: APPROVED tutor (already verified)
    const [tutorUser3] = await db
      .insert(users)
      .values({
        cognito_sub: 'mock-tutor-approved-1',
        email: 'chatchai.sat@tutorpair.local',
        role: UserRole.TUTOR,
      })
      .onConflictDoNothing()
      .returning();

    if (tutorUser3) {
      await db.insert(tutors).values({
        user_id: tutorUser3.id,
        first_name: 'Chatchai',
        last_name: 'Siriporn',
        phone_number: '085-555-1234',
        profile_photo: null,
        description: 'Engineering undergrad at Thammasat with 800/800 SAT Math score. Friendly and step-by-step guidance.',
        tutor_type: TutorType.UNDERGRADUATE,
        style_profile: [1, 5, 2, 1, 4],
        personality_profile: [3, 2, 4, 4],
        hourly_rate: '500.00',
        class_format: ClassFormat.BOTH,
        verification_status: VerificationStatus.APPROVED,
        rejection_reason: null,
        average_rating: '4.90',
        review_count: 14,
      });

      if (satVariant) {
        await db.insert(tutorSubjects).values({
          tutor_id: tutorUser3.id,
          variant_id: satVariant.id,
          grade_levels: ['G11', 'G12'],
          teaching_focus: 'Digital SAT Speed & Calculator Shortcuts',
        });

        await db.insert(documents).values([
          {
            tutor_id: tutorUser3.id,
            document_type: DocumentType.CV,
            file_key: `tutors/${tutorUser3.id}/cv-chatchai.pdf`,
            file_size_kb: 1100,
          },
          {
            tutor_id: tutorUser3.id,
            document_type: DocumentType.ACADEMIC_TRANSCRIPT,
            file_key: `tutors/${tutorUser3.id}/transcript-eng.pdf`,
            file_size_kb: 1850,
          },
          {
            tutor_id: tutorUser3.id,
            document_type: DocumentType.SUBJECT_QUALIFICATION,
            variant_id: satVariant.id,
            file_key: `tutors/${tutorUser3.id}/sat-math-score-800.pdf`,
            file_size_kb: 1400,
          },
        ]);
      }
    }

    // Case 4: REJECTED tutor (with previous rejection reason)
    const [tutorUser4] = await db
      .insert(users)
      .values({
        cognito_sub: 'mock-tutor-rejected-1',
        email: 'anong.biology@tutorpair.local',
        role: UserRole.TUTOR,
      })
      .onConflictDoNothing()
      .returning();

    if (tutorUser4) {
      await db.insert(tutors).values({
        user_id: tutorUser4.id,
        first_name: 'Anong',
        last_name: 'Sukhumvit',
        phone_number: '082-999-8877',
        profile_photo: null,
        description: 'Biology high school preparation tutor.',
        tutor_type: TutorType.FREELANCE,
        style_profile: [3, 3, 3, 3, 3],
        personality_profile: [3, 3, 3, 3],
        hourly_rate: '450.00',
        class_format: ClassFormat.ONLINE,
        verification_status: VerificationStatus.REJECTED,
        rejection_reason: 'The uploaded academic degree document is blurred and lacks official university seal or watermark. Please upload a clear scanned PDF.',
      });

      await db.insert(documents).values([
        {
          tutor_id: tutorUser4.id,
          document_type: DocumentType.CV,
          file_key: `tutors/${tutorUser4.id}/cv-anong.pdf`,
          file_size_kb: 600,
        },
      ]);
    }

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await pool.end();
  }
}

seed();
