import { subjectsRepository } from './subjects.repository.js';
import { SubjectCategory } from '@tutorpair/shared';

export const subjectsService = {
  async getSubjects(category?: SubjectCategory) {
    return await subjectsRepository.findAllWithVariants(category);
  },
};

