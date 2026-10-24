import { db, pool } from './client.js';
import { subjects, subjectVariants, users } from './schema/index.js';
import { SubjectCategory, LearningGoal, UserRole } from '@tutorpair/shared';
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

  if (!existing) {
    await db.insert(subjectVariants).values({
      subject_id: subjectId,
      name,
      learning_goal: learningGoal,
      requires_proof: requiresProof,
    });
  }
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

    console.log('✅ Database seeded with expanded real-world subjects catalog successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await pool.end();
  }
}

seed();
