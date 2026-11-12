import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { readFileSync } from 'node:fs';
import dotenv from 'dotenv';
import { createPoolConfig } from './client.config.js';
import { resolveMigrationConfig } from './migration.config.js';
import * as schema from './schema/index.js';
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

dotenv.config({ path: '.env.local' });
dotenv.config();

const config = resolveMigrationConfig(process.env);
const caBundle = config.rdsCaBundle ? readFileSync(config.rdsCaBundle, 'utf8') : undefined;
const pool = new pg.Pool(createPoolConfig(config.databaseUrl, config.nodeEnv, caBundle, config.poolMax));
const db = drizzle(pool, { schema });

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
  console.log('🌱 Seeding reference subjects and variants...');

  try {
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
    // Reference subjects above are safe to seed in every environment. Demo users and profiles
    // are deliberately opt-in so they cannot accidentally enter a production account database.
    if (process.env.SEED_MOCK_USERS === 'true') {
      if (process.env.NODE_ENV === 'production') throw new Error('Mock fixtures are disabled in production');
      await db.insert(users).values([
        { cognito_sub: 'mock-tutor-id', email: 'tutor@tutorpair.local', role: UserRole.TUTOR },
        { cognito_sub: 'mock-student-id', email: 'student@tutorpair.local', role: UserRole.STUDENT },
        { cognito_sub: 'mock-admin-id', email: 'admin@tutorpair.local', role: UserRole.ADMIN },
      ]).onConflictDoNothing();
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
            average_rating: params.averageRating,
            review_count: params.reviewCount,
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

    // =========================================================================
    // 5. EXTRA TUTORS + PRIMARY STUDENT — every demo variant gets >= 3 approved tutors
    //    (hard-filter safe: demo G10 student = Mon 17-19, Sat/Sun 13-17; primary student G4 = Sat 09-12, Wed 16-18)
    // =========================================================================
    const G = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `G${from + i}`);
    const WE = (s: string, e: string) => [
      { day: DayOfWeek.SATURDAY, start: s, end: e },
      { day: DayOfWeek.SUNDAY, start: s, end: e },
    ];
    const subj = (v: { id: string }, rate: string, grades: string[], focus: string) => ({
      variantId: v.id, hourlyRate: rate, gradeLevels: grades, teachingFocus: focus,
    });
    const extraTutors: Array<Parameters<typeof upsertVerifiedTutor>[0]> = [
      {
        cognitoSub: 'seed-tutor-warin', email: 'warin.stem@tutorpair.local', firstName: 'Warin', lastName: 'Thongdee',
        phoneNumber: '0871110001', lineId: 'warin_stem', tutorType: TutorType.FREELANCE,
        description: 'Medicine student and POSN medalist coaching Olympiad math, chemistry, biology and TPAT 1.',
        styleProfile: [5, 3, 4, 2, 4], personalityProfile: [4, 3, 2, 4], averageRating: '4.80', reviewCount: 12,
        subjects: [
          subj(mathComp, '550.00', G(9, 12), 'Olympiad Problem Solving'),
          subj(satMath, '500.00', G(10, 12), 'SAT Math Fundamentals'),
          subj(chemOly, '600.00', G(10, 12), 'POSN Chemistry Drills'),
          subj(bioMed, '600.00', G(10, 12), 'Medical Biology Essentials'),
          subj(tpatDoctor, '650.00', G(11, 12), 'TPAT 1 Reasoning Practice'),
        ],
        slots: [...WE('13:00', '18:00'), { day: DayOfWeek.MONDAY, start: '17:00', end: '20:00' }],
      },
      {
        cognitoSub: 'seed-tutor-krit', email: 'krit.stem@tutorpair.local', firstName: 'Krit', lastName: 'Boonmee',
        phoneNumber: '0871110002', lineId: 'krit_stem', tutorType: TutorType.UNDERGRADUATE,
        description: 'Engineering undergraduate who loves exam strategy for math, sciences and TPAT.',
        styleProfile: [2, 4, 5, 5, 2], personalityProfile: [2, 5, 4, 2], averageRating: '4.60', reviewCount: 8,
        subjects: [
          subj(mathComp, '350.00', G(9, 12), 'Competition Shortcuts'),
          subj(satMath, '400.00', G(10, 12), 'SAT Math Speed Drills'),
          subj(chemOly, '450.00', G(10, 12), 'Chemistry Calculation Practice'),
          subj(bioMed, '450.00', G(10, 12), 'Biology Exam Recall Methods'),
          subj(tpatDoctor, '500.00', G(11, 12), 'TPAT 1 Timed Practice'),
        ],
        slots: [...WE('14:00', '19:00'), { day: DayOfWeek.MONDAY, start: '17:30', end: '21:00' }],
      },
      {
        cognitoSub: 'seed-tutor-emma', email: 'emma.english@tutorpair.local', firstName: 'Emma', lastName: 'Clarke',
        phoneNumber: '0871110003', lineId: 'emma_english', tutorType: TutorType.INSTITUTIONAL,
        description: 'Native-speaker English teacher at an international school; IELTS and SAT verbal coach.',
        styleProfile: [4, 2, 3, 3, 4], personalityProfile: [4, 3, 3, 3], averageRating: '4.75', reviewCount: 20,
        subjects: [
          subj(engSchool, '650.00', G(7, 12), 'Essay Structure and Grammar'),
          subj(satRw, '680.00', G(10, 12), 'SAT Reading Strategies'),
          subj(ieltsAcademic, '700.00', G(9, 12), 'IELTS Academic Writing'),
        ],
        slots: [...WE('13:00', '17:00'), { day: DayOfWeek.MONDAY, start: '17:00', end: '19:00' }],
      },
      {
        cognitoSub: 'seed-tutor-ben', email: 'ben.english@tutorpair.local', firstName: 'Ben', lastName: 'Rattanakul',
        phoneNumber: '0871110004', lineId: 'ben_english', tutorType: TutorType.UNDERGRADUATE,
        description: 'Arts undergraduate (IELTS 8.0) offering relaxed, conversation-led English coaching.',
        styleProfile: [1, 5, 1, 2, 1], personalityProfile: [1, 1, 5, 1], averageRating: '4.55', reviewCount: 6,
        subjects: [
          subj(engSchool, '300.00', G(7, 12), 'Conversation-led Grammar'),
          subj(satRw, '350.00', G(10, 12), 'SAT Grammar Basics'),
          subj(ieltsAcademic, '400.00', G(9, 12), 'IELTS Speaking Practice'),
        ],
        slots: [...WE('13:30', '17:30'), { day: DayOfWeek.MONDAY, start: '17:00', end: '19:00' }],
      },
      {
        cognitoSub: 'seed-tutor-noi', email: 'noi.primary@tutorpair.local', firstName: 'Noi', lastName: 'Jaidee',
        phoneNumber: '0871110005', lineId: 'kru_noi', tutorType: TutorType.FREELANCE,
        description: 'Primary teacher using games and stories to teach core subjects (G1-G6).',
        styleProfile: [2, 4, 2, 2, 3], personalityProfile: [2, 2, 2, 3], averageRating: '4.70', reviewCount: 18,
        subjects: [
          subj(primaryMath, '400.00', G(1, 6), 'Math Games'),
          subj(primaryEnglish, '400.00', G(1, 6), 'Story-based English'),
          subj(primaryScience, '420.00', G(1, 6), 'Kitchen Science'),
          subj(primaryThai, '350.00', G(1, 6), 'Thai Reading Stories'),
        ],
        slots: [{ day: DayOfWeek.SATURDAY, start: '09:00', end: '13:00' }, { day: DayOfWeek.WEDNESDAY, start: '16:00', end: '19:00' }],
      },
      {
        cognitoSub: 'seed-tutor-boon', email: 'boon.primary@tutorpair.local', firstName: 'Boonyarat', lastName: 'Saeng',
        phoneNumber: '0871110006', lineId: 'kru_boon', tutorType: TutorType.UNDERGRADUATE,
        description: 'Education undergraduate; energetic, exam-focused primary tutor (G1-G6).',
        styleProfile: [4, 1, 4, 5, 2], personalityProfile: [5, 4, 2, 1], averageRating: '4.40', reviewCount: 5,
        subjects: [
          subj(primaryMath, '250.00', G(1, 6), 'Worksheet Practice'),
          subj(primaryEnglish, '250.00', G(1, 6), 'Vocabulary Drills'),
          subj(primaryScience, '280.00', G(1, 6), 'Experiment Review'),
          subj(primaryThai, '250.00', G(1, 6), 'Spelling and Grammar Drills'),
        ],
        slots: [{ day: DayOfWeek.SATURDAY, start: '10:00', end: '14:00' }, { day: DayOfWeek.WEDNESDAY, start: '16:30', end: '19:00' }],
      },
      {
        cognitoSub: 'seed-tutor-dev', email: 'dev.coding@tutorpair.local', firstName: 'Devon', lastName: 'Pruet',
        phoneNumber: '0871110007', lineId: 'dev_codes', tutorType: TutorType.FREELANCE,
        description: 'Software engineer teaching Python and Scratch through real mini projects.',
        styleProfile: [5, 2, 3, 4, 3], personalityProfile: [4, 3, 3, 5], averageRating: '4.85', reviewCount: 22,
        subjects: [
          subj(codingScratch, '500.00', G(1, 6), 'Scratch Project Building'),
          subj(codingPython, '650.00', G(7, 12), 'Python for Problem Solving'),
        ],
        slots: [{ day: DayOfWeek.SATURDAY, start: '09:00', end: '17:00' }, { day: DayOfWeek.SUNDAY, start: '13:00', end: '17:00' }, { day: DayOfWeek.MONDAY, start: '17:00', end: '19:30' }, { day: DayOfWeek.WEDNESDAY, start: '16:00', end: '19:00' }],
      },
      {
        cognitoSub: 'seed-tutor-ploy', email: 'ploy.coding@tutorpair.local', firstName: 'Ploy', lastName: 'Anan',
        phoneNumber: '0871110008', lineId: 'ploy_codes', tutorType: TutorType.UNDERGRADUATE,
        description: 'Computer science undergraduate; gentle, step-by-step coding lessons.',
        styleProfile: [1, 5, 2, 1, 5], personalityProfile: [2, 1, 5, 2], averageRating: '4.50', reviewCount: 7,
        subjects: [
          subj(codingScratch, '300.00', G(1, 6), 'Gentle Block Coding'),
          subj(codingPython, '350.00', G(7, 12), 'Python Basics Step by Step'),
        ],
        slots: [{ day: DayOfWeek.SATURDAY, start: '09:00', end: '17:00' }, { day: DayOfWeek.SUNDAY, start: '13:30', end: '17:00' }, { day: DayOfWeek.MONDAY, start: '17:00', end: '19:00' }, { day: DayOfWeek.WEDNESDAY, start: '16:00', end: '18:30' }],
      },
    ];
    for (const t of extraTutors) await upsertVerifiedTutor(t);

    // Seeded grade-specific students (the G10 demo student cannot match G1-G6 / G7-G9 variants).
    async function upsertSeedStudent(
      sub: string,
      email: string,
      profile: Omit<typeof students.$inferInsert, 'user_id'>,
      slots: Array<{ day: DayOfWeek; start: string; end: string }>,
    ) {
      const [existingUser] = await db.select().from(users).where(or(eq(users.cognito_sub, sub), eq(users.email, email))).limit(1);
      const [user] = existingUser
        ? [existingUser]
        : await db.insert(users).values({ cognito_sub: sub, email, role: UserRole.STUDENT }).returning();
      await db.insert(students).values({ ...profile, user_id: user.id }).onConflictDoNothing();
      await db.delete(availabilities).where(eq(availabilities.user_id, user.id));
      await db.insert(availabilities).values(
        slots.map((s) => ({ user_id: user.id, day_of_week: s.day, start_time: s.start, end_time: s.end })),
      );
    }
    await upsertSeedStudent('seed-student-mina', 'mina.primary@tutorpair.local', {
      first_name: 'Mina', last_name: 'Kaewjai', phone_number: '0881110001', line_id: 'mina_parent',
      grade_level: 'G4', tutor_type_pref: 'ANY', budget_max: '500.00',
      style_profile: [2, 4, 2, 2, 3], personality_profile: [2, 2, 3, 3],
    }, [
      { day: DayOfWeek.SATURDAY, start: '09:00', end: '12:00' },
      { day: DayOfWeek.WEDNESDAY, start: '16:00', end: '18:00' },
    ]);
    await upsertSeedStudent('seed-student-nara', 'nara.lower@tutorpair.local', {
      first_name: 'Nara', last_name: 'Lertsiri', phone_number: '0881110002', line_id: 'nara_lower',
      grade_level: 'G8', tutor_type_pref: 'ANY', budget_max: '600.00',
      style_profile: [3, 3, 4, 2, 4], personality_profile: [3, 2, 4, 3],
    }, [
      { day: DayOfWeek.TUESDAY, start: '17:00', end: '19:00' },
      { day: DayOfWeek.SUNDAY, start: '10:00', end: '13:00' },
    ]);

    // =========================================================================
    // 6. GENERALIST TUTORS — every subject variant in the DB gets >= 3 approved tutors.
    //    3 tutors per subject category, each teaching every variant of that category. Grade levels come from
    //    the "(Gx–Gy)" in the variant name (else G1–G12). Rates <= 450 so they fit the demo (700), Mina (500)
    //    and Nara (600) budgets. Slots cover demo (Mon 17-19, Sat/Sun 13-17), Mina (Sat 9-12, Wed 16-18)
    //    and Nara (Tue 17-19, Sun 10-13).
    // =========================================================================
    const allVariants = await db
      .select({ id: subjectVariants.id, name: subjectVariants.name, category: subjects.category })
      .from(subjectVariants)
      .innerJoin(subjects, eq(subjects.id, subjectVariants.subject_id));
    const gradesFor = (name: string) => {
      const m = name.match(/\(G(\d+)–G(\d+)\)/);
      return m ? G(Number(m[1]), Number(m[2])) : G(1, 12);
    };
    const generalistSlots = [
      { day: DayOfWeek.MONDAY, start: '17:00', end: '20:00' },
      { day: DayOfWeek.TUESDAY, start: '17:00', end: '20:00' },
      { day: DayOfWeek.WEDNESDAY, start: '16:00', end: '19:00' },
      { day: DayOfWeek.SATURDAY, start: '09:00', end: '18:00' },
      { day: DayOfWeek.SUNDAY, start: '09:00', end: '18:00' },
    ];
    const generalists: Array<{ slug: string; first: string; last: string; category: SubjectCategory; type: TutorType; rate: string; style: number[]; pers: number[]; rating: string }> = [
      { slug: 'gen-learn-aom', first: 'Aom', last: 'Chaiyo', category: SubjectCategory.GENERAL_LEARNING, type: TutorType.INSTITUTIONAL, rate: '300.00', style: [3, 4, 2, 3, 4], pers: [2, 2, 4, 3], rating: '4.50' },
      { slug: 'gen-learn-bank', first: 'Bank', last: 'Direk', category: SubjectCategory.GENERAL_LEARNING, type: TutorType.UNDERGRADUATE, rate: '380.00', style: [5, 2, 4, 4, 2], pers: [4, 4, 2, 5], rating: '4.60' },
      { slug: 'gen-learn-cherry', first: 'Cherry', last: 'Eksit', category: SubjectCategory.GENERAL_LEARNING, type: TutorType.FREELANCE, rate: '450.00', style: [2, 5, 3, 1, 3], pers: [3, 1, 5, 2], rating: '4.70' },
      { slug: 'gen-lang-dao', first: 'Dao', last: 'Fahsai', category: SubjectCategory.LANGUAGE_TESTING, type: TutorType.FREELANCE, rate: '320.00', style: [4, 3, 3, 3, 3], pers: [3, 3, 3, 4], rating: '4.55' },
      { slug: 'gen-lang-ek', first: 'Ek', last: 'Gunthon', category: SubjectCategory.LANGUAGE_TESTING, type: TutorType.INSTITUTIONAL, rate: '400.00', style: [2, 4, 5, 2, 5], pers: [5, 2, 2, 3], rating: '4.65' },
      { slug: 'gen-lang-fon', first: 'Fon', last: 'Hirun', category: SubjectCategory.LANGUAGE_TESTING, type: TutorType.UNDERGRADUATE, rate: '450.00', style: [1, 3, 2, 5, 1], pers: [2, 5, 3, 1], rating: '4.75' },
      { slug: 'gen-uni-gun', first: 'Gun', last: 'Intarat', category: SubjectCategory.UNIVERSITY_ENTRANCE, type: TutorType.UNDERGRADUATE, rate: '350.00', style: [5, 3, 1, 4, 2], pers: [4, 3, 3, 4], rating: '4.45' },
      { slug: 'gen-uni-hana', first: 'Hana', last: 'Jirawat', category: SubjectCategory.UNIVERSITY_ENTRANCE, type: TutorType.FREELANCE, rate: '420.00', style: [3, 2, 4, 2, 5], pers: [1, 4, 5, 2], rating: '4.80' },
      { slug: 'gen-uni-ice', first: 'Ice', last: 'Kiattisak', category: SubjectCategory.UNIVERSITY_ENTRANCE, type: TutorType.INSTITUTIONAL, rate: '450.00', style: [4, 4, 4, 1, 3], pers: [3, 3, 1, 5], rating: '4.90' },
    ];
    for (const g of generalists) {
      await upsertVerifiedTutor({
        cognitoSub: `seed-tutor-${g.slug}`, email: `${g.slug}@tutorpair.local`, firstName: g.first, lastName: g.last,
        phoneNumber: '0872220000', lineId: g.slug.replace(/-/g, '_'), tutorType: g.type,
        description: `Generalist ${g.category.toLowerCase().replace(/_/g, ' ')} tutor covering every variant in the catalogue (sample data).`,
        styleProfile: g.style, personalityProfile: g.pers, averageRating: g.rating, reviewCount: 10,
        subjects: allVariants
          .filter((v) => v.category === g.category)
          .map((v) => subj(v, g.rate, gradesFor(v.name), 'Exam-focused practice and concept clarity')),
        slots: generalistSlots,
      });
    }
    }
    console.log('✅ Reference subjects seeded; mock fixtures are opt-in.');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
