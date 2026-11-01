import { db, pool } from './client.js';
import {
  subjects,
  subjectVariants,
  users,
  students,
  tutors,
  tutorSubjects,
  availabilities,
  documents,
  matchRequests,
  matchRecommendations,
  reviews,
} from './schema/index.js';
import {
  SubjectCategory,
  LearningGoal,
  UserRole,
  TutorType,
  DayOfWeek,
  VerificationStatus,
  DocumentType,
} from '@tutorpair/shared';
import { eq, and } from 'drizzle-orm';

async function getOrCreateSubject(name: string, category: SubjectCategory) {
  const [existing] = await db
    .select()
    .from(subjects)
    .where(eq(subjects.name, name))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(subjects)
    .values({ name, category })
    .returning();

  return created;
}

async function ensureVariant(
  subjectId: string,
  name: string,
  learningGoal: LearningGoal,
  requiresProof: boolean
) {
  const [existing] = await db
    .select()
    .from(subjectVariants)
    .where(
      and(
        eq(subjectVariants.subject_id, subjectId),
        eq(subjectVariants.name, name)
      )
    )
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(subjectVariants)
    .values({
      subject_id: subjectId,
      name,
      learning_goal: learningGoal,
      requires_proof: requiresProof,
    })
    .returning();

  return created;
}

async function seed() {
  console.log('🌱 Seeding database reference data & test fixtures...');

  try {
    // 0. Seed Dev Mock Users
    await db
      .insert(users)
      .values([
        {
          cognito_sub: 'mock-tutor-id',
          email: 'tutor@tutorpair.local',
          role: UserRole.TUTOR,
        },
        {
          cognito_sub: 'mock-student-id',
          email: 'student@tutorpair.local',
          role: UserRole.STUDENT,
        },
        {
          cognito_sub: 'mock-admin-id',
          email: 'admin@tutorpair.local',
          role: UserRole.ADMIN,
        },
      ])
      .onConflictDoNothing();

    // =========================================================================
    // 1. GENERAL LEARNING
    // =========================================================================
    const math = await getOrCreateSubject('Mathematics', SubjectCategory.GENERAL_LEARNING);
    await ensureVariant(math.id, 'School Curriculum Mathematics', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(math.id, 'Math Olympiad & Competitions', LearningGoal.COMPETITIONS, true);

    const physics = await getOrCreateSubject('Physics', SubjectCategory.GENERAL_LEARNING);
    await ensureVariant(physics.id, 'School Curriculum Physics', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(physics.id, 'Physics Olympiad (POSN)', LearningGoal.COMPETITIONS, true);

    const chemistry = await getOrCreateSubject('Chemistry', SubjectCategory.GENERAL_LEARNING);
    await ensureVariant(chemistry.id, 'School Curriculum Chemistry', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(chemistry.id, 'Chemistry Olympiad (POSN)', LearningGoal.COMPETITIONS, true);

    const biology = await getOrCreateSubject('Biology', SubjectCategory.GENERAL_LEARNING);
    await ensureVariant(biology.id, 'School Curriculum Biology', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(biology.id, 'Medical Biology & POSN Olympiad', LearningGoal.COMPETITIONS, true);

    const english = await getOrCreateSubject('English', SubjectCategory.GENERAL_LEARNING);
    await ensureVariant(english.id, 'School English (Grammar & Writing)', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(english.id, 'Conversational English', LearningGoal.PRACTICAL_APPLICATION, false);

    const science = await getOrCreateSubject('General Science', SubjectCategory.GENERAL_LEARNING);
    await ensureVariant(science.id, 'Primary & Lower Secondary Science', LearningGoal.SCHOOL_CURRICULUM, false);

    // =========================================================================
    // 2. LANGUAGE TESTING
    // =========================================================================
    const ielts = await getOrCreateSubject('IELTS', SubjectCategory.LANGUAGE_TESTING);
    await ensureVariant(ielts.id, 'IELTS Academic (Target 6.5+)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(ielts.id, 'IELTS General Training', LearningGoal.STANDARDIZED_EXAMS, true);

    const toeic = await getOrCreateSubject('TOEIC', SubjectCategory.LANGUAGE_TESTING);
    await ensureVariant(toeic.id, 'TOEIC Listening & Reading (750+)', LearningGoal.STANDARDIZED_EXAMS, true);

    const toefl = await getOrCreateSubject('TOEFL', SubjectCategory.LANGUAGE_TESTING);
    await ensureVariant(toefl.id, 'TOEFL iBT (90+)', LearningGoal.STANDARDIZED_EXAMS, true);

    const japanese = await getOrCreateSubject('Japanese', SubjectCategory.LANGUAGE_TESTING);
    await ensureVariant(japanese.id, 'JLPT N1 / N2 (Advanced)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(japanese.id, 'JLPT N3 / N4 / N5 (Foundation)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(japanese.id, 'Daily & Business Japanese', LearningGoal.PRACTICAL_APPLICATION, false);

    const chinese = await getOrCreateSubject('Chinese (Mandarin)', SubjectCategory.LANGUAGE_TESTING);
    await ensureVariant(chinese.id, 'HSK 4-6 (Advanced Chinese)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(chinese.id, 'HSK 1-3 (Elementary Chinese)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(chinese.id, 'Conversational Mandarin', LearningGoal.PRACTICAL_APPLICATION, false);

    // =========================================================================
    // 3. UNIVERSITY ENTRANCE
    // =========================================================================
    const sat = await getOrCreateSubject('Digital SAT', SubjectCategory.UNIVERSITY_ENTRANCE);
    await ensureVariant(sat.id, 'Digital SAT Math (700+)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(sat.id, 'Digital SAT Reading & Writing', LearningGoal.STANDARDIZED_EXAMS, true);

    const tgat = await getOrCreateSubject('TGAT', SubjectCategory.UNIVERSITY_ENTRANCE);
    await ensureVariant(tgat.id, 'TGAT 1 English Communication', LearningGoal.TGAT, false);
    await ensureVariant(tgat.id, 'TGAT 2 Critical Thinking & Logic', LearningGoal.TGAT, false);
    await ensureVariant(tgat.id, 'TGAT 3 Future Workforce Competency', LearningGoal.TGAT, false);

    const tpat = await getOrCreateSubject('TPAT', SubjectCategory.UNIVERSITY_ENTRANCE);
    await ensureVariant(tpat.id, 'TPAT 1 Medical Aptitude (GAT-Doctor)', LearningGoal.TPAT, true);
    await ensureVariant(tpat.id, 'TPAT 3 Science & Engineering Aptitude', LearningGoal.TPAT, false);
    await ensureVariant(tpat.id, 'TPAT 5 Teacher Professional Aptitude', LearningGoal.TPAT, false);

    const aLevel = await getOrCreateSubject('A-Level (Thai National)', SubjectCategory.UNIVERSITY_ENTRANCE);
    await ensureVariant(aLevel.id, 'A-Level Applied Math 1', LearningGoal.A_LEVEL, false);
    await ensureVariant(aLevel.id, 'A-Level Physics', LearningGoal.A_LEVEL, false);
    await ensureVariant(aLevel.id, 'A-Level Chemistry', LearningGoal.A_LEVEL, false);
    await ensureVariant(aLevel.id, 'A-Level English', LearningGoal.A_LEVEL, false);

    const ged = await getOrCreateSubject('GED', SubjectCategory.UNIVERSITY_ENTRANCE);
    await ensureVariant(ged.id, 'GED Mathematical Reasoning', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(ged.id, 'GED Science & Social Studies', LearningGoal.STANDARDIZED_EXAMS, true);

    // =========================================================================
    // 4. VERIFIED SAMPLE TUTORS (FOR MATCHMAKING & REVIEWS TESTING)
    // =========================================================================
    console.log('🧑‍🏫 Seeding sample verified tutors for matchmaking...');

    const mathSchool = await ensureVariant(math.id, 'School Curriculum Mathematics', LearningGoal.SCHOOL_CURRICULUM, false);
    const mathComp = await ensureVariant(math.id, 'Math Olympiad & Competitions', LearningGoal.COMPETITIONS, true);
    const engSchool = await ensureVariant(english.id, 'School English (Grammar & Writing)', LearningGoal.SCHOOL_CURRICULUM, false);
    const satSubject = await getOrCreateSubject('Digital SAT', SubjectCategory.UNIVERSITY_ENTRANCE);
    const satMath = await ensureVariant(satSubject.id, 'Digital SAT Math (700+)', LearningGoal.STANDARDIZED_EXAMS, true);

    async function upsertVerifiedTutor(params: {
      cognitoSub: string;
      email: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
      lineId: string;
      description: string;
      tutorType: TutorType;
      styleProfile: number[];
      personalityProfile: number[];
      averageRating: string;
      reviewCount: number;
      subjects: Array<{
        variantId: string;
        hourlyRate: string;
        gradeLevels: string[];
        teachingFocus: string;
      }>;
      slots: Array<{
        day: DayOfWeek;
        start: string;
        end: string;
      }>;
    }) {
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.cognito_sub, params.cognitoSub))
        .limit(1);

      if (!user) {
        [user] = await db
          .insert(users)
          .values({
            cognito_sub: params.cognitoSub,
            email: params.email,
            role: UserRole.TUTOR,
          })
          .returning();
      }

      await db
        .insert(tutors)
        .values({
          user_id: user.id,
          first_name: params.firstName,
          last_name: params.lastName,
          phone_number: params.phoneNumber,
          line_id: params.lineId,
          description: params.description,
          tutor_type: params.tutorType,
          style_profile: params.styleProfile,
          personality_profile: params.personalityProfile,
          verification_status: VerificationStatus.APPROVED,
          average_rating: params.averageRating,
          review_count: params.reviewCount,
        })
        .onConflictDoUpdate({
          target: tutors.user_id,
          set: {
            first_name: params.firstName,
            last_name: params.lastName,
            phone_number: params.phoneNumber,
            line_id: params.lineId,
            description: params.description,
            verification_status: VerificationStatus.APPROVED,
            style_profile: params.styleProfile,
            personality_profile: params.personalityProfile,
            tutor_type: params.tutorType,
          },
        });

      await db.delete(tutorSubjects).where(eq(tutorSubjects.tutor_id, user.id));
      for (const subj of params.subjects) {
        await db.insert(tutorSubjects).values({
          tutor_id: user.id,
          variant_id: subj.variantId,
          hourly_rate: subj.hourlyRate,
          grade_levels: subj.gradeLevels,
          teaching_focus: subj.teachingFocus,
        });
      }

      await db.delete(availabilities).where(eq(availabilities.user_id, user.id));
      for (const slot of params.slots) {
        await db.insert(availabilities).values({
          user_id: user.id,
          day_of_week: slot.day,
          start_time: slot.start,
          end_time: slot.end,
        });
      }

      // Ensure verified tutor has a CV document for student profile inspection
      const [existingCv] = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.tutor_id, user.id),
            eq(documents.document_type, DocumentType.CV)
          )
        )
        .limit(1);

      if (!existingCv) {
        await db.insert(documents).values({
          tutor_id: user.id,
          document_type: DocumentType.CV,
          file_key: `tutors/${user.id}/cv-verified-profile.pdf`,
          file_size_kb: 420,
        });
      }

      return user.id;
    }

    async function seedReviewForTutor(params: {
      studentSub: string;
      studentEmail: string;
      studentFirstName: string;
      studentLastName: string;
      tutorUserId: string;
      variantId: string;
      ratingKnowledge: number;
      ratingPreparation: number;
      ratingClarity: number;
      ratingPunctuality: number;
      comment: string;
      daysAgo: number;
    }) {
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.cognito_sub, params.studentSub))
        .limit(1);

      if (!user) {
        [user] = await db
          .insert(users)
          .values({
            cognito_sub: params.studentSub,
            email: params.studentEmail,
            role: UserRole.STUDENT,
          })
          .returning();
      }

      let [student] = await db
        .select()
        .from(students)
        .where(eq(students.user_id, user.id))
        .limit(1);

      if (!student) {
        [student] = await db
          .insert(students)
          .values({
            user_id: user.id,
            first_name: params.studentFirstName,
            last_name: params.studentLastName,
            grade_level: 'G10',
            tutor_type_pref: 'ANY',
            budget_max: '600.00',
            style_profile: [3, 3, 3, 3, 3],
            personality_profile: [3, 3, 3, 3],
          })
          .returning();
      }

      const [existingRev] = await db
        .select()
        .from(reviews)
        .where(and(eq(reviews.student_id, user.id), eq(reviews.tutor_id, params.tutorUserId)))
        .limit(1);

      if (existingRev) return;

      const reviewDate = new Date(Date.now() - params.daysAgo * 86400000);

      const [matchReq] = await db
        .insert(matchRequests)
        .values({
          student_id: user.id,
          variant_id: params.variantId,
          status: 'CONFIRMED',
          created_at: reviewDate,
        })
        .returning();

      const [rec] = await db
        .insert(matchRecommendations)
        .values({
          match_request_id: matchReq.id,
          tutor_id: params.tutorUserId,
          rank: 1,
          score: '96.00',
          is_selected: true,
        })
        .returning();

      const overall = (
        params.ratingKnowledge +
        params.ratingPreparation +
        params.ratingClarity +
        params.ratingPunctuality
      ) / 4;

      await db.insert(reviews).values({
        student_id: user.id,
        tutor_id: params.tutorUserId,
        recommendation_id: rec.id,
        rating_knowledge: params.ratingKnowledge,
        rating_preparation: params.ratingPreparation,
        rating_clarity: params.ratingClarity,
        rating_punctuality: params.ratingPunctuality,
        overall_rating: overall.toFixed(2),
        comment: params.comment,
        created_at: reviewDate,
      });
    }

    // Tutor 1: Dr. Somchai Pattana (Freelance, 450 THB, G7–G12)
    if (mathSchool && mathComp) {
      const somchaiId = await upsertVerifiedTutor({
        cognitoSub: 'seed-tutor-somchai',
        email: 'somchai.math@tutorpair.local',
        firstName: 'Somchai',
        lastName: 'Pattana',
        phoneNumber: '0812345678',
        lineId: '@somchai_math',
        description: 'Ph.D. in Applied Mathematics with 8+ years experience guiding G7-G12 students through challenging problem-solving and national Olympiads.',
        tutorType: TutorType.FREELANCE,
        styleProfile: [4, 4, 3, 3, 4], // Balanced, analytical, interactive
        personalityProfile: [4, 3, 4, 4],
        averageRating: '4.90',
        reviewCount: 28,
        subjects: [
          {
            variantId: mathSchool.id,
            hourlyRate: '450.00',
            gradeLevels: ['G7', 'G8', 'G9', 'G10', 'G11', 'G12'],
            teachingFocus: 'Calculus, Algebra, and High School Exam Mastery',
          },
          {
            variantId: mathComp.id,
            hourlyRate: '600.00',
            gradeLevels: ['G9', 'G10', 'G11', 'G12'],
            teachingFocus: 'POSN & Olympiad Competition Prep',
          },
        ],
        slots: [
          { day: DayOfWeek.MONDAY, start: '17:00', end: '21:00' },
          { day: DayOfWeek.WEDNESDAY, start: '17:00', end: '21:00' },
          { day: DayOfWeek.SATURDAY, start: '09:00', end: '18:00' },
          { day: DayOfWeek.SUNDAY, start: '09:00', end: '18:00' },
        ],
      });

      // Seed authentic reviews for Dr. Somchai
      await seedReviewForTutor({
        studentSub: 'seed-student-suda',
        studentEmail: 'suda.c@tutorpair.local',
        studentFirstName: 'Suda',
        studentLastName: 'Chaiprasit',
        tutorUserId: somchaiId,
        variantId: mathSchool.id,
        ratingKnowledge: 5,
        ratingPreparation: 5,
        ratingClarity: 5,
        ratingPunctuality: 5,
        comment: 'Dr. Somchai makes advanced calculus and algebra feel straightforward. His step-by-step proofs and exam frameworks are world-class.',
        daysAgo: 8,
      });

      await seedReviewForTutor({
        studentSub: 'seed-student-thanida',
        studentEmail: 'thanida.w@tutorpair.local',
        studentFirstName: 'Thanida',
        studentLastName: 'Wongsuwan',
        tutorUserId: somchaiId,
        variantId: mathComp.id,
        ratingKnowledge: 5,
        ratingPreparation: 5,
        ratingClarity: 4,
        ratingPunctuality: 5,
        comment: 'Deep Olympiad and POSN competition insight. Highly rigorous and teaches how to think through non-routine problem solving.',
        daysAgo: 22,
      });
    }

    // Tutor 2: Kru Ananya Srisuk (Institution Teacher, 500 THB, G1–G12)
    if (mathSchool && engSchool) {
      const ananyaId = await upsertVerifiedTutor({
        cognitoSub: 'seed-tutor-ananya',
        email: 'ananya.teacher@tutorpair.local',
        firstName: 'Ananya',
        lastName: 'Srisuk',
        phoneNumber: '0898765432',
        lineId: 'kru_ananya',
        description: 'Certified secondary school teacher focusing on gentle, step-by-step conceptual clarity for all learning paces.',
        tutorType: TutorType.INSTITUTIONAL,
        styleProfile: [3, 5, 2, 2, 5], // Step-by-step, gentle, very interactive
        personalityProfile: [3, 2, 5, 3],
        averageRating: '4.85',
        reviewCount: 34,
        subjects: [
          {
            variantId: mathSchool.id,
            hourlyRate: '500.00',
            gradeLevels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12'],
            teachingFocus: 'Step-by-step Foundation & Confidence Building',
          },
          {
            variantId: engSchool.id,
            hourlyRate: '500.00',
            gradeLevels: ['G7', 'G8', 'G9', 'G10', 'G11', 'G12'],
            teachingFocus: 'Grammar and Academic Writing',
          },
        ],
        slots: [
          { day: DayOfWeek.TUESDAY, start: '16:00', end: '20:00' },
          { day: DayOfWeek.THURSDAY, start: '16:00', end: '20:00' },
          { day: DayOfWeek.SATURDAY, start: '10:00', end: '19:00' },
          { day: DayOfWeek.SUNDAY, start: '10:00', end: '16:00' },
        ],
      });

      // Seed authentic reviews for Kru Ananya
      await seedReviewForTutor({
        studentSub: 'seed-student-kittisak',
        studentEmail: 'kittisak.p@tutorpair.local',
        studentFirstName: 'Kittisak',
        studentLastName: 'Prasert',
        tutorUserId: ananyaId,
        variantId: mathSchool.id,
        ratingKnowledge: 5,
        ratingPreparation: 5,
        ratingClarity: 5,
        ratingPunctuality: 5,
        comment: "Kru Ananya is an incredible teacher! She explains complex math step-by-step with so much patience. My daughter's grades jumped from C to A in one term.",
        daysAgo: 12,
      });

      await seedReviewForTutor({
        studentSub: 'seed-student-thanida',
        studentEmail: 'thanida.w@tutorpair.local',
        studentFirstName: 'Thanida',
        studentLastName: 'Wongsuwan',
        tutorUserId: ananyaId,
        variantId: engSchool.id,
        ratingKnowledge: 5,
        ratingPreparation: 5,
        ratingClarity: 4,
        ratingPunctuality: 5,
        comment: 'Very structured syllabus and thorough homework corrections. Her grammar explanations make English writing feel natural and intuitive.',
        daysAgo: 28,
      });

      await seedReviewForTutor({
        studentSub: 'seed-student-pakorn',
        studentEmail: 'pakorn.s@tutorpair.local',
        studentFirstName: 'Pakorn',
        studentLastName: 'Suksamran',
        tutorUserId: ananyaId,
        variantId: mathSchool.id,
        ratingKnowledge: 5,
        ratingPreparation: 4,
        ratingClarity: 5,
        ratingPunctuality: 5,
        comment: 'Gentle and very encouraging approach. My son used to dread mathematics, but now he looks forward to his weekly sessions with Kru Ananya.',
        daysAgo: 45,
      });

      await seedReviewForTutor({
        studentSub: 'seed-student-chayanin',
        studentEmail: 'chayanin.s@tutorpair.local',
        studentFirstName: 'Chayanin',
        studentLastName: 'Siriporn',
        tutorUserId: ananyaId,
        variantId: engSchool.id,
        ratingKnowledge: 5,
        ratingPreparation: 5,
        ratingClarity: 5,
        ratingPunctuality: 4,
        comment: 'Outstanding lesson preparation. Every session has targeted practice sheets customized for school midterm exams.',
        daysAgo: 60,
      });
    }

    // Tutor 3: Natthapong Wongsuwan (Chula Engineering Undergraduate, 350 THB, G9–G12)
    if (mathSchool && satMath) {
      const natthapongId = await upsertVerifiedTutor({
        cognitoSub: 'seed-tutor-natthapong',
        email: 'natthapong.eng@tutorpair.local',
        firstName: 'Natthapong',
        lastName: 'Wongsuwan',
        phoneNumber: '0823456789',
        lineId: 'nat_chula_eng',
        description: 'Chulalongkorn Engineering 4th year student (SAT Math 800). Specializes in speed solving techniques, exam shortcuts, and peer mentoring.',
        tutorType: TutorType.UNDERGRADUATE,
        styleProfile: [2, 3, 4, 4, 4], // Fast-paced, exam techniques, practical
        personalityProfile: [4, 2, 3, 5],
        averageRating: '4.95',
        reviewCount: 19,
        subjects: [
          {
            variantId: mathSchool.id,
            hourlyRate: '350.00',
            gradeLevels: ['G9', 'G10', 'G11', 'G12'],
            teachingFocus: 'Exam Shortcuts and Speed Problem Solving',
          },
          {
            variantId: satMath.id,
            hourlyRate: '450.00',
            gradeLevels: ['G10', 'G11', 'G12'],
            teachingFocus: 'Digital SAT Math 750+ Target Scoring',
          },
        ],
        slots: [
          { day: DayOfWeek.MONDAY, start: '18:00', end: '22:00' },
          { day: DayOfWeek.FRIDAY, start: '17:00', end: '21:00' },
          { day: DayOfWeek.SATURDAY, start: '13:00', end: '20:00' },
          { day: DayOfWeek.SUNDAY, start: '13:00', end: '20:00' },
        ],
      });

      // Seed authentic reviews for Natthapong
      await seedReviewForTutor({
        studentSub: 'seed-student-kittisak',
        studentEmail: 'kittisak.p@tutorpair.local',
        studentFirstName: 'Kittisak',
        studentLastName: 'Prasert',
        tutorUserId: natthapongId,
        variantId: satMath.id,
        ratingKnowledge: 5,
        ratingPreparation: 5,
        ratingClarity: 5,
        ratingPunctuality: 5,
        comment: 'Natthapong is a Digital SAT genius! Taught me Desmos shortcuts, calculator tricks, and pacing strategies that boosted my score to 780.',
        daysAgo: 5,
      });

      await seedReviewForTutor({
        studentSub: 'seed-student-pakorn',
        studentEmail: 'pakorn.s@tutorpair.local',
        studentFirstName: 'Pakorn',
        studentLastName: 'Suksamran',
        tutorUserId: natthapongId,
        variantId: mathSchool.id,
        ratingKnowledge: 5,
        ratingPreparation: 5,
        ratingClarity: 5,
        ratingPunctuality: 4,
        comment: 'Great energy and relatable peer mentor! Explained school math shortcuts and test hacks that saved me so much time in exams.',
        daysAgo: 19,
      });
    }

    console.log('✅ Database seeded with expanded subjects and verified tutors successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await pool.end();
  }
}

seed();
