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
import { eq, and, or } from 'drizzle-orm';

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
    // 1. GENERAL LEARNING (G1–G12 THAI & INTERNATIONAL CURRICULA)
    // =========================================================================
    const math = await getOrCreateSubject('Mathematics', SubjectCategory.GENERAL_LEARNING);
    await ensureVariant(math.id, 'Primary School Mathematics (G1–G6)', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(math.id, 'Lower Secondary Mathematics (G7–G9)', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(math.id, 'Upper Secondary Mathematics (G10–G12)', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(math.id, 'School Curriculum Mathematics', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(math.id, 'Math Olympiad & Competitions', LearningGoal.COMPETITIONS, true);

    const science = await getOrCreateSubject('General Science', SubjectCategory.GENERAL_LEARNING);
    await ensureVariant(science.id, 'Primary School Science (G1–G6)', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(science.id, 'Lower Secondary Science (G7–G9)', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(science.id, 'Primary & Lower Secondary Science', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(science.id, 'Junior Science Olympiad (IJSO)', LearningGoal.COMPETITIONS, true);

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
    await ensureVariant(english.id, 'Primary English Foundations (G1–G6)', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(english.id, 'Secondary English & Grammar (G7–G12)', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(english.id, 'School English (Grammar & Writing)', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(english.id, 'Conversational English', LearningGoal.PRACTICAL_APPLICATION, false);

    const thai = await getOrCreateSubject('Thai Language & Literature', SubjectCategory.GENERAL_LEARNING);
    await ensureVariant(thai.id, 'Primary Thai Reading & Writing (G1–G6)', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(thai.id, 'Secondary Thai Grammar & Essay (G7–G12)', LearningGoal.SCHOOL_CURRICULUM, false);

    const social = await getOrCreateSubject('Social Studies & History', SubjectCategory.GENERAL_LEARNING);
    await ensureVariant(social.id, 'Primary Social Studies (G1–G6)', LearningGoal.SCHOOL_CURRICULUM, false);
    await ensureVariant(social.id, 'Secondary Social Studies & History (G7–G12)', LearningGoal.SCHOOL_CURRICULUM, false);

    const coding = await getOrCreateSubject('Computer Science & Coding', SubjectCategory.GENERAL_LEARNING);
    await ensureVariant(coding.id, 'Scratch & Block Coding (G1–G6)', LearningGoal.GENERAL_SKILLS, false);
    await ensureVariant(coding.id, 'Python Programming & Algorithms (G7–G12)', LearningGoal.GENERAL_SKILLS, false);
    await ensureVariant(coding.id, 'POSN Computer Olympiad (C++)', LearningGoal.COMPETITIONS, true);

    // =========================================================================
    // 2. LANGUAGE TESTING (ENGLISH, ASIAN & EUROPEAN LANGUAGES)
    // =========================================================================
    const ielts = await getOrCreateSubject('IELTS', SubjectCategory.LANGUAGE_TESTING);
    await ensureVariant(ielts.id, 'IELTS Academic (Target 6.5+)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(ielts.id, 'IELTS General Training', LearningGoal.STANDARDIZED_EXAMS, true);

    const toeic = await getOrCreateSubject('TOEIC', SubjectCategory.LANGUAGE_TESTING);
    await ensureVariant(toeic.id, 'TOEIC Listening & Reading (750+)', LearningGoal.STANDARDIZED_EXAMS, true);

    const toefl = await getOrCreateSubject('TOEFL', SubjectCategory.LANGUAGE_TESTING);
    await ensureVariant(toefl.id, 'TOEFL iBT (90+)', LearningGoal.STANDARDIZED_EXAMS, true);

    const cambridge = await getOrCreateSubject('Cambridge English', SubjectCategory.LANGUAGE_TESTING);
    await ensureVariant(cambridge.id, 'Cambridge Young Learners (YLE Starters/Movers/Flyers)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(cambridge.id, 'Cambridge KET & PET (A2/B1)', LearningGoal.STANDARDIZED_EXAMS, true);

    const chinese = await getOrCreateSubject('Chinese (Mandarin)', SubjectCategory.LANGUAGE_TESTING);
    await ensureVariant(chinese.id, 'HSK 4-6 (Advanced Chinese)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(chinese.id, 'HSK 1-3 (Elementary Chinese)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(chinese.id, 'Youth Chinese Test (YCT for G1–G9)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(chinese.id, 'Conversational Mandarin', LearningGoal.PRACTICAL_APPLICATION, false);

    const japanese = await getOrCreateSubject('Japanese', SubjectCategory.LANGUAGE_TESTING);
    await ensureVariant(japanese.id, 'JLPT N1 / N2 (Advanced)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(japanese.id, 'JLPT N3 / N4 / N5 (Foundation)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(japanese.id, 'Daily & Business Japanese', LearningGoal.PRACTICAL_APPLICATION, false);

    const korean = await getOrCreateSubject('Korean', SubjectCategory.LANGUAGE_TESTING);
    await ensureVariant(korean.id, 'TOPIK I (Levels 1–2)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(korean.id, 'TOPIK II (Levels 3–6)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(korean.id, 'Conversational Korean', LearningGoal.PRACTICAL_APPLICATION, false);

    const french = await getOrCreateSubject('French', SubjectCategory.LANGUAGE_TESTING);
    await ensureVariant(french.id, 'DELF Prim & Junior (A1–B2)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(french.id, 'Conversational French', LearningGoal.PRACTICAL_APPLICATION, false);

    const german = await getOrCreateSubject('German', SubjectCategory.LANGUAGE_TESTING);
    await ensureVariant(german.id, 'Goethe-Zertifikat (A1–B2)', LearningGoal.STANDARDIZED_EXAMS, true);

    // =========================================================================
    // 3. UNIVERSITY & HIGH SCHOOL ENTRANCE (TCAS, INTER & ELITE SCHOOLS)
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
    await ensureVariant(tpat.id, 'TPAT 2 Visual Arts & Architecture Aptitude', LearningGoal.TPAT, false);
    await ensureVariant(tpat.id, 'TPAT 3 Science & Engineering Aptitude', LearningGoal.TPAT, false);
    await ensureVariant(tpat.id, 'TPAT 5 Teacher Professional Aptitude', LearningGoal.TPAT, false);

    const aLevel = await getOrCreateSubject('A-Level (Thai National)', SubjectCategory.UNIVERSITY_ENTRANCE);
    await ensureVariant(aLevel.id, 'A-Level Applied Math 1', LearningGoal.A_LEVEL, false);
    await ensureVariant(aLevel.id, 'A-Level Applied Math 2 (Basic Math)', LearningGoal.A_LEVEL, false);
    await ensureVariant(aLevel.id, 'A-Level Physics', LearningGoal.A_LEVEL, false);
    await ensureVariant(aLevel.id, 'A-Level Chemistry', LearningGoal.A_LEVEL, false);
    await ensureVariant(aLevel.id, 'A-Level Biology', LearningGoal.A_LEVEL, false);
    await ensureVariant(aLevel.id, 'A-Level English', LearningGoal.A_LEVEL, false);
    await ensureVariant(aLevel.id, 'A-Level Thai Language', LearningGoal.A_LEVEL, false);
    await ensureVariant(aLevel.id, 'A-Level Social Studies', LearningGoal.A_LEVEL, false);

    const ged = await getOrCreateSubject('GED', SubjectCategory.UNIVERSITY_ENTRANCE);
    await ensureVariant(ged.id, 'GED Mathematical Reasoning', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(ged.id, 'GED Reasoning Through Language Arts (RLA)', LearningGoal.STANDARDIZED_EXAMS, true);
    await ensureVariant(ged.id, 'GED Science & Social Studies', LearningGoal.STANDARDIZED_EXAMS, true);

    const entrancePrep = await getOrCreateSubject('Secondary & High School Entrance', SubjectCategory.UNIVERSITY_ENTRANCE);
    await ensureVariant(entrancePrep.id, 'Triam Udom & MWIT M.4 Entrance Exam Prep', LearningGoal.COMPETITIONS, true);
    await ensureVariant(entrancePrep.id, 'Demonstration Schools M.1 Entrance Exam Prep', LearningGoal.SCHOOL_CURRICULUM, false);

    // =========================================================================
    // 4. VERIFIED SAMPLE TUTORS (FOR MATCHMAKING & REVIEWS TESTING)
    // =========================================================================
    console.log('🧑‍🏫 Seeding sample verified tutors for matchmaking...');

    const mathSchool = await ensureVariant(math.id, 'School Curriculum Mathematics', LearningGoal.SCHOOL_CURRICULUM, false);
    const mathComp = await ensureVariant(math.id, 'Math Olympiad & Competitions', LearningGoal.COMPETITIONS, true);
    const primaryMath = await ensureVariant(math.id, 'Primary School Mathematics (G1–G6)', LearningGoal.SCHOOL_CURRICULUM, false);
    const primaryScience = await ensureVariant(science.id, 'Primary School Science (G1–G6)', LearningGoal.SCHOOL_CURRICULUM, false);
    const primaryEnglish = await ensureVariant(english.id, 'Primary English Foundations (G1–G6)', LearningGoal.SCHOOL_CURRICULUM, false);
    const primaryThai = await ensureVariant(thai.id, 'Primary Thai Reading & Writing (G1–G6)', LearningGoal.SCHOOL_CURRICULUM, false);
    const engSchool = await ensureVariant(english.id, 'School English (Grammar & Writing)', LearningGoal.SCHOOL_CURRICULUM, false);
    const satSubject = await getOrCreateSubject('Digital SAT', SubjectCategory.UNIVERSITY_ENTRANCE);
    const satMath = await ensureVariant(satSubject.id, 'Digital SAT Math (700+)', LearningGoal.STANDARDIZED_EXAMS, true);
    const satRw = await ensureVariant(satSubject.id, 'Digital SAT Reading & Writing', LearningGoal.STANDARDIZED_EXAMS, true);
    const ieltsAcademic = await ensureVariant(ielts.id, 'IELTS Academic (Target 6.5+)', LearningGoal.STANDARDIZED_EXAMS, true);
    const bioMed = await ensureVariant(biology.id, 'Medical Biology & POSN Olympiad', LearningGoal.COMPETITIONS, true);
    const chemOly = await ensureVariant(chemistry.id, 'Chemistry Olympiad (POSN)', LearningGoal.COMPETITIONS, true);
    const tpatDoctor = await ensureVariant(tpat.id, 'TPAT 1 Medical Aptitude (GAT-Doctor)', LearningGoal.TPAT, true);
    const codingScratch = await ensureVariant(coding.id, 'Scratch & Block Coding (G1–G6)', LearningGoal.GENERAL_SKILLS, false);
    const codingPython = await ensureVariant(coding.id, 'Python Programming & Algorithms (G7–G12)', LearningGoal.GENERAL_SKILLS, false);

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
        .where(or(eq(users.cognito_sub, params.cognitoSub), eq(users.email, params.email)))
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
      } else if (user.cognito_sub !== params.cognitoSub || user.role !== UserRole.TUTOR) {
        [user] = await db
          .update(users)
          .set({ cognito_sub: params.cognitoSub, email: params.email, role: UserRole.TUTOR })
          .where(eq(users.id, user.id))
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
        .where(or(eq(users.cognito_sub, params.studentSub), eq(users.email, params.studentEmail)))
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
      } else if (user.cognito_sub !== params.studentSub || user.role !== UserRole.STUDENT) {
        [user] = await db
          .update(users)
          .set({ cognito_sub: params.studentSub, email: params.studentEmail, role: UserRole.STUDENT })
          .where(eq(users.id, user.id))
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
          { day: DayOfWeek.MONDAY, start: '17:00', end: '20:00' },
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
            gradeLevels: ['G7', 'G8', 'G9', 'G10', 'G11', 'G12'],
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
          { day: DayOfWeek.MONDAY, start: '17:00', end: '22:00' },
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

    // Tutor 4: Kru Pim (Pimpisa Ratanaporn) - Primary Specialist (G1–G6 Math, Science, Thai, English)
    if (primaryMath && primaryScience && primaryEnglish && primaryThai) {
      const pimId = await upsertVerifiedTutor({
        cognitoSub: 'seed-tutor-pim',
        email: 'pim.primary@tutorpair.local',
        firstName: 'Pimpisa',
        lastName: 'Ratanaporn',
        phoneNumber: '0834567890',
        lineId: 'kru_pim_primary',
        description: 'Primary education specialist (Chula Education, First-Class Honors). 6+ years helping young learners (G1-G6) build strong math foundations, positive study habits, and joyful confidence.',
        tutorType: TutorType.INSTITUTIONAL,
        styleProfile: [1, 5, 1, 1, 1], // Very step-by-step, concept-first, highly conversational, guided, relaxed
        personalityProfile: [2, 1, 1, 2], // Casual/friendly, strictly on time, calm/gentle, encouraging
        averageRating: '4.95',
        reviewCount: 42,
        subjects: [
          {
            variantId: primaryMath.id,
            hourlyRate: '350.00',
            gradeLevels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'],
            teachingFocus: 'Primary Math Foundations, Problem-Solving & Mental Math',
          },
          {
            variantId: primaryEnglish.id,
            hourlyRate: '350.00',
            gradeLevels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'],
            teachingFocus: 'Phonics, Vocabulary Building & Confident Speaking',
          },
          {
            variantId: primaryScience.id,
            hourlyRate: '350.00',
            gradeLevels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'],
            teachingFocus: 'Curious Science Concepts & Hands-On Problem Solving',
          },
          {
            variantId: primaryThai.id,
            hourlyRate: '300.00',
            gradeLevels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'],
            teachingFocus: 'Thai Reading, Writing & Creative Expression',
          },
        ],
        slots: [
          { day: DayOfWeek.MONDAY, start: '16:00', end: '19:00' },
          { day: DayOfWeek.TUESDAY, start: '16:00', end: '19:00' },
          { day: DayOfWeek.WEDNESDAY, start: '16:00', end: '19:00' },
          { day: DayOfWeek.SATURDAY, start: '09:00', end: '17:00' },
          { day: DayOfWeek.SUNDAY, start: '09:00', end: '17:00' },
        ],
      });

      await seedReviewForTutor({
        studentSub: 'seed-student-nannapas',
        studentEmail: 'nannapas.s@tutorpair.local',
        studentFirstName: 'Nannapas',
        studentLastName: 'Suwannawin',
        tutorUserId: pimId,
        variantId: primaryMath.id,
        ratingKnowledge: 5,
        ratingPreparation: 5,
        ratingClarity: 5,
        ratingPunctuality: 5,
        comment: 'Kru Pim has an extraordinary gift with younger kids. My Grade 3 son used to cry during math homework, but now he actually asks when his next lesson with Kru Pim is!',
        daysAgo: 14,
      });
    }

    // Tutor 5: Dr. Teerapat Chanthara (Dr. Tee) - Medical, Biology, Chemistry & TPAT 1
    if (bioMed && chemOly && tpatDoctor) {
      const teeId = await upsertVerifiedTutor({
        cognitoSub: 'seed-tutor-teerapat',
        email: 'teerapat.med@tutorpair.local',
        firstName: 'Teerapat',
        lastName: 'Chanthara',
        phoneNumber: '0845678901',
        lineId: '@dr_tee_med',
        description: 'Chulalongkorn Faculty of Medicine graduate & former POSN Biology gold medalist. Specializes in intensive Medical College Aptitude (TPAT 1 / กสพท), high-yield Biology, and Organic Chemistry.',
        tutorType: TutorType.FREELANCE,
        styleProfile: [5, 4, 3, 3, 5], // Fast-paced, high yield, structured, focused
        personalityProfile: [4, 1, 3, 4],
        averageRating: '4.92',
        reviewCount: 31,
        subjects: [
          {
            variantId: bioMed.id,
            hourlyRate: '650.00',
            gradeLevels: ['G10', 'G11', 'G12'],
            teachingFocus: 'High-Yield Medical Biology & POSN Camp Selection',
          },
          {
            variantId: chemOly.id,
            hourlyRate: '650.00',
            gradeLevels: ['G10', 'G11', 'G12'],
            teachingFocus: 'Organic Chemistry & Stoichiometry Mastery',
          },
          {
            variantId: tpatDoctor.id,
            hourlyRate: '750.00',
            gradeLevels: ['G11', 'G12'],
            teachingFocus: 'TPAT 1 Medical Ethics, Critical Analysis & Spatial Reasoning',
          },
        ],
        slots: [
          { day: DayOfWeek.TUESDAY, start: '18:00', end: '22:00' },
          { day: DayOfWeek.THURSDAY, start: '18:00', end: '22:00' },
          { day: DayOfWeek.SATURDAY, start: '10:00', end: '19:00' },
          { day: DayOfWeek.SUNDAY, start: '10:00', end: '19:00' },
        ],
      });

      await seedReviewForTutor({
        studentSub: 'seed-student-thanida',
        studentEmail: 'thanida.w@tutorpair.local',
        studentFirstName: 'Thanida',
        studentLastName: 'Wongsuwan',
        tutorUserId: teeId,
        variantId: tpatDoctor.id,
        ratingKnowledge: 5,
        ratingPreparation: 5,
        ratingClarity: 5,
        ratingPunctuality: 5,
        comment: 'Dr. Tee is the ultimate mentor for medical school preparation. His breakdown of medical ethics dilemmas and analytical thinking was identical to the actual exam format.',
        daysAgo: 10,
      });
    }

    // Tutor 6: Jessica Miller (Tutor Jessica) - IELTS, SAT Reading & Writing, Cambridge English
    if (ieltsAcademic && satRw) {
      const jessicaId = await upsertVerifiedTutor({
        cognitoSub: 'seed-tutor-jessica',
        email: 'jessica.ielts@tutorpair.local',
        firstName: 'Jessica',
        lastName: 'Miller',
        phoneNumber: '0856789012',
        lineId: 'jessica_ielts_prep',
        description: 'Certified Cambridge English & IELTS coach with 7+ years mentoring international and bilingual program students in Bangkok. Expert in academic writing frameworks and fluency.',
        tutorType: TutorType.FREELANCE,
        styleProfile: [3, 2, 1, 2, 2], // Highly interactive, discussion-rich, step-by-step feedback
        personalityProfile: [3, 2, 4, 3],
        averageRating: '4.88',
        reviewCount: 25,
        subjects: [
          {
            variantId: ieltsAcademic.id,
            hourlyRate: '600.00',
            gradeLevels: ['G9', 'G10', 'G11', 'G12'],
            teachingFocus: 'IELTS Band 7.0+ Writing Task 2 & Speaking Fluency',
          },
          {
            variantId: satRw.id,
            hourlyRate: '650.00',
            gradeLevels: ['G10', 'G11', 'G12'],
            teachingFocus: 'Digital SAT Rhetoric, Grammar & Inference Reading',
          },
        ],
        slots: [
          { day: DayOfWeek.WEDNESDAY, start: '16:00', end: '20:00' },
          { day: DayOfWeek.FRIDAY, start: '16:00', end: '20:00' },
          { day: DayOfWeek.SATURDAY, start: '09:00', end: '16:00' },
          { day: DayOfWeek.SUNDAY, start: '09:00', end: '16:00' },
        ],
      });

      await seedReviewForTutor({
        studentSub: 'seed-student-kittisak',
        studentEmail: 'kittisak.p@tutorpair.local',
        studentFirstName: 'Kittisak',
        studentLastName: 'Prasert',
        tutorUserId: jessicaId,
        variantId: ieltsAcademic.id,
        ratingKnowledge: 5,
        ratingPreparation: 5,
        ratingClarity: 5,
        ratingPunctuality: 5,
        comment: 'Teacher Jessica helped me go from 6.0 to 7.5 in IELTS writing in just two months! Her paragraph blueprints and lexical feedback are incredibly clear.',
        daysAgo: 16,
      });
    }

    // Tutor 7: Thanaphat Suksom (Tutor Peak) - Coding, Python & Computer Science
    if (codingScratch && codingPython) {
      await upsertVerifiedTutor({
        cognitoSub: 'seed-tutor-peak',
        email: 'peak.coding@tutorpair.local',
        firstName: 'Thanaphat',
        lastName: 'Suksom',
        phoneNumber: '0867890123',
        lineId: 'peak_code_hub',
        description: 'KMITL Computer Engineering student and competitive programming tutor. Teaches Scratch for young learners (G1-G6) and Python/Algorithms for middle & high school students.',
        tutorType: TutorType.UNDERGRADUATE,
        styleProfile: [2, 1, 2, 4, 2], // Heavy practice/hands-on, explorative, fun atmosphere
        personalityProfile: [3, 2, 4, 4],
        averageRating: '4.90',
        reviewCount: 15,
        subjects: [
          {
            variantId: codingScratch.id,
            hourlyRate: '400.00',
            gradeLevels: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'],
            teachingFocus: 'Block Coding, Game Design & Computational Thinking',
          },
          {
            variantId: codingPython.id,
            hourlyRate: '450.00',
            gradeLevels: ['G7', 'G8', 'G9', 'G10', 'G11', 'G12'],
            teachingFocus: 'Python Programming, Data Structures & Logic Drills',
          },
        ],
        slots: [
          { day: DayOfWeek.TUESDAY, start: '17:00', end: '21:00' },
          { day: DayOfWeek.THURSDAY, start: '17:00', end: '21:00' },
          { day: DayOfWeek.SATURDAY, start: '10:00', end: '18:00' },
          { day: DayOfWeek.SUNDAY, start: '10:00', end: '18:00' },
        ],
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
