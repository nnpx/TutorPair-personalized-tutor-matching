import { db } from '../../db/client.js';
import { subjects, subjectVariants } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { SubjectCategory, LearningGoal } from '@tutorpair/shared';

export const subjectsRepository = {
  async findAllWithVariants(category?: SubjectCategory) {
    const query = db
      .select({
        subject_id: subjects.id,
        subject_name: subjects.name,
        subject_category: subjects.category,
        variant_id: subjectVariants.id,
        variant_name: subjectVariants.name,
        learning_goal: subjectVariants.learning_goal,
        requires_proof: subjectVariants.requires_proof,
      })
      .from(subjects)
      .leftJoin(subjectVariants, eq(subjectVariants.subject_id, subjects.id));

    const rows = category
      ? await query.where(eq(subjects.category, category))
      : await query;

    // Group rows by subject
    const subjectMap = new Map<
      string,
      {
        id: string;
        name: string;
        category: SubjectCategory;
        variants: Array<{
          id: string;
          subject_id: string;
          name: string;
          learning_goal: LearningGoal;
          requires_proof: boolean;
        }>;
      }
    >();

    for (const row of rows) {
      if (!subjectMap.has(row.subject_id)) {
        subjectMap.set(row.subject_id, {
          id: row.subject_id,
          name: row.subject_name,
          category: row.subject_category as SubjectCategory,
          variants: [],
        });
      }

      if (row.variant_id) {
        subjectMap.get(row.subject_id)!.variants.push({
          id: row.variant_id,
          subject_id: row.subject_id,
          name: row.variant_name!,
          learning_goal: (row.learning_goal as LearningGoal) ?? LearningGoal.GENERAL_SKILLS,
          requires_proof: row.requires_proof ?? false,
        });
      }
    }

    return Array.from(subjectMap.values());
  },
};

