import { db, pool } from './client.js';
import { subjects, subjectVariants } from './schema/index.js';
import { SubjectCategory, LearningGoal } from '@tutorpair/shared';

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

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await pool.end();
  }
}

seed();
